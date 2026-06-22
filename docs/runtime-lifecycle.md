# Runtime Lifecycle

`@indirection/runtime` owns the generic asset lifecycle contract. Loaders may return a `LoadedAsset.dispose` callback, and the runtime stores that callback with the loaded value until the final live reference is released.

This contract is renderer-neutral. It does not know about Three.js scenes, textures, materials, geometries, DOM objects, fetch, Vite, React, or Sinan-specific entities.

## Handle And Scope Release

`AssetHandle.release()` is idempotent and returns a `Promise<void>`. Callers may ignore the promise for assets without asynchronous disposal, but tests and hosts that need deterministic cleanup should await it.

`AssetScope.dispose()` awaits release of every handle created by that scope. Calling `dispose()` more than once is safe.

When multiple handles reference the same live loaded value, the runtime calls the disposer only after the final handle release. Concurrent in-flight acquires share the same loaded value and the same disposer.

## LoadedAsset.dispose

A loader can return:

```ts
{
  value,
  dispose() {
    // Release resources owned by this loaded asset.
  }
}
```

`dispose` may be synchronous or asynchronous. The runtime calls it at most once for a loaded value. If it resolves, the resource snapshot transitions to `disposed` and clears `hasValue` and `hasDisposer`.

If `dispose` rejects, the resource remains `released`, keeps `hasValue` and `hasDisposer`, and records `causeCode: "IND_DISPOSE_FAILED"`. The rejected release promise is returned again on repeated `handle.release()` calls, so a failed disposer is not called repeatedly.

Browser image resources use this same generic path from adapter code. `@indirection/loaders-web` can attach a disposer that closes an `ImageBitmap`, but runtime still only sees `LoadedAsset.dispose`; it does not import or model browser APIs.

## Resource Snapshot States

- `ready`: a loaded value is currently held by one or more handles.
- `fallback-ready`: the requested asset is represented by a successful fallback value; the actual fallback asset owns its own disposer.
- `released`: refCount is zero. Assets without a disposer may stop retaining their loaded value here. A disposer failure also leaves the asset in this state with `IND_DISPOSE_FAILED`.
- `evictable`: reserved for a future decoded cache eviction policy.
- `disposed`: a loaded asset disposer resolved successfully; the runtime no longer retains that loaded value.

`hasDisposer` means the runtime currently knows about a disposer for the resource snapshot. It is not a Three-specific flag.

## Fallback And Failure

Loader failures before a value is created do not call a disposer. Runtime records the failed primary with `IND_DECODE_FAILED`.

When a primary asset falls back successfully, the primary snapshot keeps the fallback cause and fallback asset id. The fallback asset owns the loaded value and disposer, so releasing the parent handle releases the fallback reference and disposes the fallback value when its refCount reaches zero.

## Non-Scope

This lifecycle contract does not implement:

- A decoded-memory eviction policy beyond final-reference disposal.
- A GPU memory estimator.
- Browser-specific ImageBitmap lifecycle policy inside runtime core.
- Renderer-specific traversal of Three.js objects.
- Scene attach, camera/light management, or gameplay object factory behavior.

Adapter packages and host applications remain responsible for defining explicit ownership policies for renderer-specific objects.

## Validation

```powershell
corepack pnpm test
corepack pnpm check:boundaries
corepack pnpm check:docs
git diff --check
```
