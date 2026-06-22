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

The `parse(input)` path receives:

- `assetId`: the resolved Indirection asset id.
- `sourceUrl`: the selected catalog source URL.
- `source`: the resolved source metadata, including `sourceIndex`.
- `basePath`: inferred from the source URL directory or overridden through `basePath`.
- `bytes`: the raw transport body as `Uint8Array`.
- `arrayBuffer`: a copy of the raw bytes as a plain `ArrayBuffer`.
- `contentType`: the transport content type when provided.

Without `parser` or `parse`, the loader returns the same payload shape as its fake/no-parser path. This keeps boundary smoke tests and consumers that only need transport verification independent from Three.js.

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

## Failure And Fallback

Parser failures are allowed to throw. `@indirection/runtime` records those failures as `IND_DECODE_FAILED`; if the catalog asset has a fallback, the parent asset transitions to `fallback-ready` and preserves the fallback asset id.

The adapter tests cover both a minimal valid glTF parse through `GLTFLoader.parseAsync` and an invalid glTF fallback path that preserves `IND_DECODE_FAILED`.

## Dependency Boundary

`three` remains an optional peer of `@indirection/three`. The workspace uses it as a package dev dependency for adapter tests, but core packages and runtime code must not import Three.js.

The package smoke test imports the packed `@indirection/three` package without requiring a real Three parser. It uses a parser stub to verify the packaged parser API, raw bytes, and basePath behavior.

## Non-Scope

Phase 13 intentionally does not implement:

- Draco, KTX2, or meshopt decoder wiring.
- A texture pipeline or renderer E2E scene.
- Full GPU disposal for Three geometries, textures, materials, or renderer-owned resources.
- Model instantiate helpers or animation metadata.
- Live Sinan Engine repository integration.

Runtime `AssetHandle.release()` and `AssetScope.dispose()` still manage Indirection resource references. Hosts that create real Three objects are responsible for disposing Three GPU resources until a later adapter lifecycle phase defines that contract.

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
