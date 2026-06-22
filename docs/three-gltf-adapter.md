# Three GLTF Adapter

`@indirection/three` is the optional Three.js adapter boundary for `model/gltf` assets. It keeps `three` out of `@indirection/protocol`, `@indirection/schema`, `@indirection/compiler`, and `@indirection/runtime` while allowing consumers and tests to inject a real `GLTFLoader.parseAsync` parser.

## Loader API

```ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createThreeGltfLoader } from "@indirection/three";

const loader = createThreeGltfLoader({
  parser: new GLTFLoader()
});
```

`createThreeGltfLoader` accepts either:

- `parser.parseAsync(arrayBuffer, basePath)`: suitable for a `GLTFLoader` instance or wrapper.
- `parse(input)`: suitable when the host needs to inspect or enrich the Indirection context before calling Three.
- `ownedResources(value, input)`: optional lifecycle metadata for resources the parsed value exclusively owns.

The `parse(input)` path receives:

- `assetId`: the resolved Indirection asset id.
- `sourceUrl`: the selected catalog source URL.
- `source`: the resolved source metadata, including `sourceIndex`.
- `basePath`: inferred from the source URL directory or overridden through `basePath`.
- `bytes`: the raw transport body as `Uint8Array`.
- `arrayBuffer`: a copy of the raw bytes as a plain `ArrayBuffer`.
- `contentType`: the transport content type when provided.

Without `parser` or `parse`, the loader returns the same payload shape as its fake/no-parser path. This keeps boundary smoke tests and consumers that only need transport verification independent from Three.js.

## Lifecycle Ownership

Runtime `LoadedAsset.dispose` is a generic loader contract. `@indirection/three` uses it through explicit host ownership policy, not through automatic traversal of every Three object reachable from a scene.

Hosts can provide `ownedResources(value, input)` when creating the GLTF loader. The returned resources must be resources the loaded value exclusively owns. Shared geometries, textures, materials, renderer state, or host caches should be omitted.

```ts
createThreeGltfLoader({
  parser: new GLTFLoader(),
  ownedResources(gltf) {
    return [
      gltf.scene.userData.ownedGeometry,
      gltf.scene.userData.ownedMaterial
    ];
  }
});
```

The helper `createThreeOwnedResourceDisposer(resources)` deduplicates resources by object identity and returns an idempotent disposer. The loader attaches that disposer to the returned loaded asset, so `AssetHandle.release()` or `AssetScope.dispose()` can release it through the runtime when the final live handle goes away.

This contract is intentionally conservative. It proves the release path without guessing whether a resource belongs to the loaded asset, a renderer, another asset, or the host application.

## Texture Resource Helper

Phase 23 adds `createThreeTextureFromImageBitmap(options)` as a small adapter-side helper for host-owned texture resources. The helper accepts structural input only: an image-like value, positive `width` and `height`, optional `assetId` and `sourceUrl`, a host-injected `createTexture(input)` factory, and optional `ownedResources(texture, input)`.

The helper does not import `three` or create renderer state. Host code decides how to construct the real `Texture`, `Material`, `Geometry`, or `WebGLRenderer`, then declares which of those resources are exclusively owned by the loaded asset. The helper deduplicates those disposables through `createThreeOwnedResourceDisposer` and returns an idempotent `dispose()` function suitable for runtime `LoadedAsset.dispose`.

The browser E2E fixture uses this helper with real Three.js in test/host code only. See [Renderer And Three Texture E2E](renderer-texture-e2e.md).

## Instantiate Hook

`instantiateThreeGltf(value, instantiate, context)` is a host-injected clone or instantiate hook. It passes the loaded value plus optional `assetId`, `sourceUrl`, and `basePath` to the host callback and returns the callback result.

The helper does not attach objects to a scene, create cameras or lights, manage renderers, or allocate gameplay objects. Hosts that need `SkeletonUtils.clone`, custom prefab logic, or engine-specific entity creation can inject that policy without moving it into runtime core.

## Animation Metadata

`extractThreeAnimationMetadata(input)` reads `animations` from a GLTF-like value or accepts an animation clip array directly. It returns a read-only summary with `index`, optional `name`, `durationSeconds`, and `trackCount`.

The extraction is read-only. It does not mutate animation clips, scene graphs, mixer state, or host runtime state.

## Base Path And Source URL

By default, `basePath` is inferred from the selected source URL:

- `models/hero.gltf` becomes `models/`.
- `hero.glb` becomes an empty string.

Hosts can override this with a fixed string or a function:

```ts
createThreeGltfLoader({
  basePath: (input) => new URL(".", input.sourceUrl).toString(),
  parser: new GLTFLoader()
});
```

The adapter passes `arrayBuffer` and `basePath` to `GLTFLoader.parseAsync`. Asset ownership, URL selection, fallback, and decode failure reporting remain runtime responsibilities.

## Compressed Decoder Capabilities

Compressed source selection is a runtime catalog contract, not a Three adapter decoder contract. Catalogs can declare source conditions such as `when.capability: ["draco"]`, `["ktx2"]`, or `["meshopt"]`; the runtime selects the first matching source from `ResolutionContext.capability`.

Hosts that use real Three decoder plugins must configure those plugins on their own `GLTFLoader` instance or parser wrapper before passing it to `createThreeGltfLoader`:

```ts
const parser = new GLTFLoader();
// Host-owned setup, for example DRACOLoader, KTX2Loader, or meshopt support.

const manager = createAssetManager({
  catalog,
  context: {
    capability: ["draco", "ktx2", "meshopt"]
  },
  loaders: [
    createThreeGltfLoader({
      parser
    })
  ]
});
```

`@indirection/three` does not create decoder instances, import decoder packages, detect GPU support, or decide which compressed capability strings are safe for a host. It only parses the already selected `model/gltf` source through the host-provided parser.

Default source selection and runtime fallback remain distinct. If a decoder capability is absent, runtime selects the uncompressed default source. If a selected compressed source fails to load or decode, runtime records the structured failure and uses the asset's explicit fallback when one is declared.

## Failure And Fallback

Parser failures are allowed to throw. `@indirection/runtime` records those failures as `IND_DECODE_FAILED`; if the catalog asset has a fallback, the parent asset transitions to `fallback-ready` and preserves the fallback asset id.

The adapter tests cover both a minimal valid glTF parse through `GLTFLoader.parseAsync` and an invalid glTF fallback path that preserves `IND_DECODE_FAILED`.

## Dependency Boundary

`three` remains an optional peer of `@indirection/three`. The workspace uses it as a package dev dependency for adapter tests, but core packages and runtime code must not import Three.js.

The package smoke test imports the packed `@indirection/three` package without requiring a real Three parser or renderer. It uses parser and texture-resource stubs to verify the packaged parser API, raw bytes, basePath behavior, owned-resource disposal, texture helper export, instantiate hook, and animation metadata extraction.

## Non-Scope

The current adapter intentionally does not implement:

- Draco, KTX2, or meshopt decoder wiring.
- A production texture pipeline or renderer framework beyond the bounded local E2E fixture.
- Automatic deep GPU disposal for every reachable Three geometry, texture, material, or renderer-owned resource.
- Scene attach, renderer attach, camera/light management, or gameplay object factory behavior.
- Live Sinan Engine repository integration.

Runtime `AssetHandle.release()` and `AssetScope.dispose()` manage Indirection resource references. Hosts that create real Three objects remain responsible for declaring which resources are exclusively owned by a loaded asset before passing them to the adapter disposer.

## Validation

```powershell
corepack pnpm test
corepack pnpm check:boundaries
corepack pnpm pack:check
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```
