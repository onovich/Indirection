# Example Workflows

This page ties the existing examples, tests, and smoke commands into one local evaluation path. The workflows are documentation and smoke support only; they do not change runtime semantics and do not grant package publish permission.

## Manifest To Catalog

The minimal source-of-truth path is:

1. Author or load an Indirection manifest.
2. Parse it with `@indirection/schema`.
3. Import it into a normalized model with `@indirection/compiler`.
4. Compile a deterministic catalog and report.
5. Let runtime/adapters consume the compiled catalog.

The CLI exercises this path against `fixtures/vanilla/indirection.manifest.json`:

```powershell
corepack pnpm smoke:cli
```

Manual CLI commands after `corepack pnpm build`:

```powershell
node packages/cli/dist/bin.js validate --manifest fixtures/vanilla/indirection.manifest.json
node packages/cli/dist/bin.js build --manifest fixtures/vanilla/indirection.manifest.json
node packages/cli/dist/bin.js report --manifest fixtures/vanilla/indirection.manifest.json
node packages/cli/dist/bin.js inspect --manifest fixtures/vanilla/indirection.manifest.json --asset vanilla:text.intro
```

## Runtime Loading And Lifecycle

Runtime consumes a compiled catalog and host-provided transport/loader policy:

```ts
const manager = createAssetManager({
  catalog,
  transport: new InMemoryTransport({ "copy/intro.txt": "hello" }),
  loaders: [textAssetLoader]
});

const scope = manager.createScope("example");
const handle = await scope.acquire("game:copy.intro");
await handle.release();
await scope.dispose();
```

The runtime owns generic `AssetHandle`, `AssetScope`, resource snapshots, fallback state, and final-reference `LoadedAsset.dispose` execution. Renderer-specific ownership stays in adapter or host code. See [Runtime lifecycle](runtime-lifecycle.md).

## Browser Loaders And Cache

`@indirection/loaders-web` provides browser-friendly JSON/text/binary loaders plus Cache Storage adapters. The fast Node smoke is:

```powershell
corepack pnpm test:browser
```

The real browser matrix covers Chromium, Firefox, and WebKit:

```powershell
corepack pnpm test:e2e
```

The E2E fixture validates browser loader imports, Cache Storage isolation/cleanup, runtime lifecycle stress, fallback diagnostics, compressed capability selection, and Vite virtual catalog consumption.

Phase 22 also covers browser image-source lifecycle through `createImageBitmapLoader`. The browser fixture decodes a tiny deterministic PNG with real `createImageBitmap`, then proves shared handles and `AssetScope.dispose()` close the wrapped bitmap exactly once through runtime `LoadedAsset.dispose`. See [Browser ImageBitmap lifecycle](image-bitmap-lifecycle.md).

Phase 23 builds on that image source with a bounded renderer/Three texture E2E. The fixture creates a host-owned Three texture, material, geometry, and WebGL renderer in browser test code, renders a 2x2 deterministic scene, samples the red pixel, and releases all owned resources through `AssetScope.dispose()`. See [Renderer And Three Texture E2E](renderer-texture-e2e.md).

## Phase 7 Integrated Example

`examples/phase7-advanced-loaders.mjs` is the compact end-to-end local example. It covers:

- manifest import and deterministic catalog compilation;
- locale/quality/platform source selection;
- runtime loading through `InMemoryTransport`;
- web data loaders and `MemoryCacheStorageAdapter`;
- Vite virtual catalog module generation;
- Three GLTF loader parser injection through a host-owned parser stub;
- scope disposal and resource snapshot visibility.

Run it with:

```powershell
corepack pnpm smoke:phase7
```

## Vite Virtual Catalog

`@indirection/vite` exposes `virtual:indirection/catalog` through compiler output:

```ts
const plugin = createIndirectionVitePlugin({ model });
const id = plugin.resolveId("virtual:indirection/catalog");
const source = plugin.load(id);
```

The plugin does not own runtime loading, source selection, browser caching, or release policy. It only exposes a compiled catalog module for a host app to import.

## Three GLTF Adapter

`@indirection/three` keeps Three out of core packages while letting a host inject a real parser:

```ts
const loader = createThreeGltfLoader({
  parser: new GLTFLoader()
});
```

Tests and package smoke also use parser and texture-resource stubs to validate raw bytes, basePath, source context, explicit owned-resource disposal, host-injected texture resource creation, instantiate hooks, and animation metadata without requiring decoder packages or a production renderer framework.

See [Three GLTF adapter](three-gltf-adapter.md).

## Compressed Capability Selection

Compressed readiness is catalog data:

```json
{
  "when": {
    "capability": ["draco"]
  },
  "url": "models/hero.draco.glb"
}
```

Runtime selects sources by declaration order and `ResolutionContext.capability`. It selects the uncompressed default source when no capability matches, while explicit runtime fallback remains reserved for load/decode failure.

See [Compressed capability source selection](compressed-capability-source-selection.md).

## Release-Candidate Gates

Use these local gates to verify package and release readiness without publishing:

```powershell
corepack pnpm pack:check
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
```

The release-candidate gates keep `private: true`, `UNLICENSED`, no-publish, no-tag, no-GitHub-Release, no-signing, no-upload, no-OIDC, and read-only workflow boundaries visible. The owner decision blockers are documented in [Release candidate handoff](release-candidate-handoff.md).

## Local Public Demo Site

The Phase 21 local public demo site rehearsal assembles this evaluator workflow into a generated static page without deploying it:

```powershell
corepack pnpm site:demo
```

The smoke gate validates the generated page and manifest, then cleans the smoke output:

```powershell
corepack pnpm smoke:site-demo
```

The generated page is presentation only. `README.md`, [Evaluator quickstart](evaluator-quickstart.md), [Package entrypoints](package-entrypoints.md), this page, and release docs remain the source of truth. See [Public demo site rehearsal](public-demo-site.md).

## Full Evaluation

The complete local evaluator command is:

```powershell
corepack pnpm validate:full
```

Pair it with release gates before any release-readiness handoff:

```powershell
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
git diff --check
```
