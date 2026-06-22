# Browser ImageBitmap Lifecycle

Phase 22 adds a bounded browser image-source loader in `@indirection/loaders-web`. The contract proves that browser-created `ImageBitmap` resources can be decoded, shared through runtime handles, and closed through the existing `LoadedAsset.dispose` final-release path without moving browser APIs into core packages.

Phase 23 builds on this source lifecycle in a separate renderer/Three texture E2E boundary. The ImageBitmap loader still owns only image decode and final `close()` behavior; Three texture creation, WebGL rendering, and renderer-resource disposal stay in `@indirection/three` adapter tests and browser fixture host code.

## Loader Contract

`createImageBitmapLoader()` registers the `image/bitmap` type by default:

```ts
import { createImageBitmapLoader } from "@indirection/loaders-web";

const loader = createImageBitmapLoader();
```

The default decode path reads the selected transport body, turns it into a `Blob`, and calls browser `createImageBitmap`. Tests and hosts can inject the decode boundary:

```ts
const loader = createImageBitmapLoader({
  async decode(input) {
    const bitmap = await createImageBitmap(
      new Blob([input.arrayBuffer], { type: input.contentType })
    );

    return bitmap;
  }
});
```

The decoded value is an `ImageBitmapResource`:

- `bitmap`: the host/browser bitmap-like object.
- `width` and `height`: copied from the decoded bitmap.
- `byteLength`: transport payload size.
- `contentType`: transport content type, source image type, or `image/png` for `image/bitmap`.
- `sourceUrl`: selected catalog source URL.

## Disposal

`createImageBitmapLoader` attaches a `LoadedAsset.dispose` callback. By default it calls `bitmap.close()` exactly once when the runtime releases the final live handle. Hosts can inject a custom `dispose(input)` callback when they wrap a browser bitmap or need extra bookkeeping.

Runtime semantics remain generic:

- shared handles see the same loaded value;
- releasing one handle does not close the bitmap while another handle is live;
- repeated `AssetHandle.release()` and repeated `AssetScope.dispose()` do not double-close the bitmap;
- `AssetScope.dispose()` closes held image resources through the same final-release path as any other loaded asset.

## Failure, Fallback, And Abort

Image decode failures are loader failures. Runtime records them with `IND_DECODE_FAILED` and uses an explicit asset fallback only when the catalog declares one. This stays distinct from default source selection for capability-gated assets.

Acquire aborts use runtime `AssetAbortError` before the loader is started when possible. The loader also checks an already-aborted signal before and after decode and closes a decoded bitmap if the signal is observed as aborted after decode.

## Browser Validation

The browser fixture uses a tiny deterministic 1x1 PNG byte fixture and a real browser `createImageBitmap(new Blob(...))` call in Chromium, Firefox, and WebKit. The decoded bitmap is wrapped only to count `close()` calls; no renderer, WebGL context, screenshot comparison, or visual approval gate is involved.

Fast local smoke:

```powershell
corepack pnpm test:browser
```

Real browser matrix:

```powershell
corepack pnpm test:e2e
```

Package tarball smoke imports the packed `@indirection/loaders-web` entrypoint and exercises `createImageBitmapLoader` with an injected decoder:

```powershell
corepack pnpm pack:check
```

## Boundaries

This package owns the browser image-source adapter boundary. It does not create Three textures, attach images to scenes, estimate GPU memory, run WebGL renderer E2E, wire Draco/KTX2/meshopt decoders, or integrate with Sinan Engine.

`@indirection/protocol`, `@indirection/schema`, `@indirection/compiler`, and `@indirection/runtime` must not import or expose browser, DOM, `ImageBitmap`, `Blob`, canvas, WebGL, Three, renderer, fetch adapter, `window`, or `document` semantics for this feature.

## Validation

```powershell
corepack pnpm test -- --run packages/loaders-web
corepack pnpm test:browser
corepack pnpm test:e2e
corepack pnpm pack:check
corepack pnpm check:boundaries
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```
