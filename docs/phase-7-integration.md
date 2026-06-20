# Phase 7 Integration

Phase 7 adds advanced package surfaces around the stable core:

- `@indirection/loaders-web` provides browser-friendly JSON, text, binary, and cache adapter helpers.
- `@indirection/three` provides a peer-boundary GLTF loader skeleton without importing Three.js in core.
- `@indirection/vite` provides a virtual catalog plugin backed by the compiler.
- `@indirection/cli` provides `validate`, `build`, `report`, and `inspect` commands.

The core remains `protocol`, `schema`, `compiler`, and `runtime`. Host authoring data still compiles into a derived catalog; runtime handles, scopes, adapters, and cache state do not enter authoring JSON.

## Example

Run the Phase 7 integration example after dependencies are installed:

```powershell
corepack pnpm smoke:phase7
```

The example compiles an in-memory manifest, resolves variant-aware text and GLTF assets through the runtime, exercises the memory cache adapter, and verifies the Vite virtual catalog plugin can emit a module from the same normalized model.

## Package Smoke

Run the package smoke after a build:

```powershell
corepack pnpm build
corepack pnpm pack:check
```

`pack:check` verifies package exports point at built files, creates tarballs for every workspace package, installs those tarballs into a temporary consumer project, and imports the public ESM entrypoints.

## Boundary Guard

Run the boundary check when touching core or adapter imports:

```powershell
corepack pnpm check:boundaries
```

The guard fails if core packages import advanced adapters or expose host-specific entities. It also keeps runtime core free of DOM, implicit fetch, Zod, Three.js, Vite, React, and Node-specific imports.
