# Renderer And Three Texture E2E

Phase 23 adds a bounded local browser/Three/WebGL E2E proof on top of the Phase 22 ImageBitmap lifecycle. It proves that an Indirection-managed image source can become a host-owned Three texture/material input, render through a tiny deterministic WebGL2 scene, and release owned resources through the existing runtime lifecycle.

This is an adapter and test harness contract. It is not a production renderer framework, visual approval gate, GPU memory estimator, decoder integration, or live Sinan Engine integration.

## Contract

The browser fixture uses these boundaries:

- `@indirection/loaders-web` decodes a tiny deterministic PNG through `createImageBitmapLoader`.
- `@indirection/runtime` owns generic handle/scope lifecycle and calls `LoadedAsset.dispose` when the final reference is released.
- `@indirection/three` exposes `createThreeTextureFromImageBitmap`, a host-injected helper that wraps an image-like source into a texture resource without importing Three.js constructors in package source.
- The E2E fixture, as host code, imports real `three`, creates `Texture`, `MeshBasicMaterial`, `PlaneGeometry`, and `WebGLRenderer`, renders a 2x2 scene, and samples one pixel with `readPixels`.

The fixture asset graph keeps image and texture ownership explicit:

- `browser:image.pixel`: `image/bitmap`, decoded by `createImageBitmapLoader`.
- `browser:renderer.texture`: `renderer/three-texture`, depends on `browser:image.pixel`, creates the host-owned Three texture/material/geometry/renderer resources.

The image handle is released before the texture scope is disposed. The image remains retained by the texture dependency, then closes exactly once when `AssetScope.dispose()` releases the texture and its dependency.

## Diagnostics

`window.__indirectionE2E.rendererTexture` records deterministic diagnostics:

- WebGL/Three availability: `available: true`, `renderer: "three-webgl"`.
- source evidence: `sourceByteLength: 88`, image and texture dimensions `[1, 1]`.
- render evidence: `canvasSize: [2, 2]`, `samplePixel: [255, 0, 0, 255]`, `pixelMatchesRed: true`.
- ownership evidence: release counts for `texture`, `material`, `geometry`, and `renderer` are all `0` before scope disposal and `1` after scope disposal.
- lifecycle evidence: image and texture resource snapshots move from `ready` while held to `disposed` after final release.

The Playwright attachment `indirection-e2e-result.json` includes the same structure for Chromium, Firefox, and WebKit debugging. The test does not create screenshots, visual approval artifacts, videos, traces on success, or generated renderer assets.

## Package Helper

`createThreeTextureFromImageBitmap(options)` accepts structural input only:

- `image`: the host image-like value, such as a browser `ImageBitmap`.
- `width` and `height`: positive finite dimensions.
- `assetId` and `sourceUrl`: optional diagnostics context.
- `createTexture(input)`: host-owned factory that creates the real texture-like disposable resource.
- `ownedResources(texture, input)`: optional host-owned additional disposables, such as material, geometry, or renderer resources.

The helper deduplicates resources through `createThreeOwnedResourceDisposer` and returns an idempotent `dispose()` function. It does not import `three`, create renderer state, attach objects to scenes, estimate GPU memory, or decide ownership for shared host resources.

## Validation

```powershell
corepack pnpm test -- --run packages/three/test/three-boundary.test.ts
corepack pnpm test:e2e:chromium
corepack pnpm test:e2e
corepack pnpm pack:check
corepack pnpm validate:full
git diff --check
```

The full release-readiness matrix also keeps no-publish and no-deploy gates active:

```powershell
corepack pnpm release:rc-check
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
```

## Non-Scope

Phase 23 does not add real Draco, KTX2, or meshopt decoder dependencies; texture compression/transcoding; a production renderer abstraction; screenshot comparison; GPU memory estimation; public deployment; real npm publish; Git tags; GitHub Releases; signing; OIDC publish workflow; live Sinan Engine integration; or `@indirection/sinan`.

Browser, DOM, ImageBitmap, canvas, WebGL, Three texture/material/geometry/renderer, `window`, and `document` semantics stay out of protocol, schema, compiler, and runtime core.
