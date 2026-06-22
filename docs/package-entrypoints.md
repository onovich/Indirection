# Package Entrypoints

This document summarizes the 9 workspace package entrypoints for local checkout evaluation. All packages are currently `private: true`, version `0.0.0`, and `UNLICENSED`; this page does not grant permission to publish them.

Use packages from the workspace or from `pack:check` temporary tarballs only. Do not run npm install instructions for these packages from the public registry until a real publish phase accepts package visibility, license, versioning, npm account/scope, and release ownership decisions.

## Entrypoint Matrix

| Package | Entrypoint | Owns | Must not own | Evaluation path |
|---|---|---|---|---|
| `@indirection/protocol` | `packages/protocol/src/index.ts` | `AssetId`, diagnostic vocabulary, JSON/catalog types, normalized model contracts. | Schema parsing, compiler validation, transport, loaders, runtime lifecycle, DOM, Three, Vite, Sinan, or npm release policy. | `corepack pnpm test -- --run packages/protocol` |
| `@indirection/schema` | `packages/schema/src/index.ts` | Zod manifest schema and `parseIndirectionManifest`. | Runtime dependencies, compiler report semantics, transport, loaders, DOM, Three, Vite, Sinan, or release policy. | `corepack pnpm test -- --run packages/schema` |
| `@indirection/compiler` | `packages/compiler/src/index.ts` | Manifest import, host importer contract, normalized model validation, deterministic catalog compilation, canonical JSON, catalog hash, and report shape. | Runtime loading, fetch/DOM, renderer behavior, npm publish policy, or host-specific source-of-truth ownership. | `corepack pnpm test -- --run packages/compiler` |
| `@indirection/runtime` | `packages/runtime/src/index.ts` | Catalog store, source resolution, resource table, scope/handle lifecycle, in-flight loading, fallback, transport and loader contracts. | Schema parsing, compiler report generation, browser Cache Storage, Three object traversal, renderer semantics, Vite plugin behavior, Sinan live integration, or release policy. | `corepack pnpm test -- --run packages/runtime` |
| `@indirection/loaders-web` | `packages/loaders-web/src/index.ts` | Web-friendly JSON/text/binary loaders, `BrowserCacheStorageAdapter`, and `MemoryCacheStorageAdapter`. | Runtime core ownership policy, compiler semantics, renderer behavior, or npm publish policy. | `corepack pnpm test -- --run packages/loaders-web` and `corepack pnpm test:e2e` |
| `@indirection/three` | `packages/three/src/index.ts` | Optional-peer `model/gltf` loader boundary, parser injection, basePath handling, explicit owned-resource disposal, instantiate hook, and animation metadata summary. | Three dependency in core packages, Draco/KTX2/meshopt decoder setup, renderer E2E, automatic deep GPU disposal, scene attach, gameplay factories, or live Sinan integration. | `corepack pnpm test -- --run packages/three` and `corepack pnpm pack:check` |
| `@indirection/vite` | `packages/vite/src/index.ts` | Vite virtual catalog module generation from compiler output. | Runtime loading, browser cache policy, renderer behavior, Vite app ownership, or release policy. | `corepack pnpm test -- --run packages/vite` and `corepack pnpm smoke:phase7` |
| `@indirection/cli` | `packages/cli/src/index.ts` and `packages/cli/src/bin.ts` | CLI commands `validate`, `build`, `report`, and `inspect` over local manifests. | Long-running dev server behavior, npm publish operations, Git tags, registry writes, or workflow permissions. | `corepack pnpm smoke:cli` |
| `@indirection/testkit` | `packages/testkit/src/index.ts` | Small package smoke helpers and package-name contract exports. | Product runtime semantics, release publishing decisions, or host integration behavior. | `corepack pnpm test -- --run packages/testkit` and `corepack pnpm pack:check` |

## Local Consumption Pattern

Until real publish decisions are accepted, use workspace imports in this repository:

```ts
import { importIndirectionManifest, compileNormalizedModel } from "@indirection/compiler";
import { createAssetManager, InMemoryTransport, textAssetLoader } from "@indirection/runtime";
```

The pnpm workspace wires these imports through local package references. `pack:check` separately proves the packed tarballs can be imported by a temporary consumer without committing those tarballs.

## Ownership Boundary Rules

- Protocol types are shared vocabulary; they should not absorb parser, runtime, adapter, or release behavior.
- Schema validates authoring input; compiler turns normalized input into deterministic catalogs and reports.
- Runtime loads already-compiled catalogs; it should not parse manifests or know about host authoring schemas.
- Web, Three, and Vite packages are adapters around core contracts, not new sources of truth.
- CLI is a local evaluation and automation surface, not a publish tool.
- Testkit supports local smoke and fixtures; it is not a public support promise until release ownership accepts it.

## Validation

Run focused package tests when changing a package boundary:

```powershell
corepack pnpm test -- --run packages/protocol
corepack pnpm test -- --run packages/schema
corepack pnpm test -- --run packages/compiler
corepack pnpm test -- --run packages/runtime
corepack pnpm test -- --run packages/loaders-web
corepack pnpm test -- --run packages/three
corepack pnpm test -- --run packages/vite
corepack pnpm test -- --run packages/cli
corepack pnpm test -- --run packages/testkit
```

Run the packaged-entrypoint smoke before claiming consumer readiness:

```powershell
corepack pnpm pack:check
```
