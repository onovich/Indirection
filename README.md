# Indirection

Indirection is a manifest-first asset addressing protocol, build toolchain, and runtime for Web games and 3D editors.

The project is currently at the design-baseline stage. The core idea is to let application and authoring data reference stable `AssetId` values, while Indirection resolves those identities into deployable URLs, variants, dependencies, cache behavior, loader adapters, and lifecycle-managed runtime handles.

## Positioning

- Independent infrastructure project, not an internal module of a single engine.
- Engine-neutral core: no direct dependency on Sinan, React, Three.js, Vite, or Zod in the runtime core.
- Manifest-first workflow: host-owned or Indirection-authored manifests compile into deterministic runtime catalogs.
- Web primitives first: URL, Fetch, HTTP cache, Cache Storage, AbortSignal, Web Crypto, glTF, and KTX2 before custom bundle formats.
- Explicit lifecycle: `AssetHandle` and `AssetScope` make CPU/GPU ownership observable and releasable.

## First Design Partner

Sinan Engine is planned as the initial first-party design partner, POC host, and regression test field. Sinan should validate Indirection in a realistic engine workflow without defining the core architecture boundary.

## Planned Shape

The design baseline proposes a pnpm workspace with packages for protocol, schema, compiler, runtime, Web loaders, Three.js adapter, Vite plugin, CLI, and examples. After Sinan alignment, the first implementation slice should stay narrower: protocol, schema, compiler, runtime, and testkit before Web/Three/Vite integration.

Early milestones:

1. Protocol baseline: `AssetId`, importer contract, manifest/schema, compiled catalog, diagnostics, canonical JSON, and contract tests.
2. Runtime lifecycle core: catalog store, resolver, resource table state machine, handles, scopes, deduplication, abort, fallback, and diagnostic snapshot.
3. Sinan report POC: read Sinan-owned authoring manifest and produce diffable catalog/report output without changing Sinan runtime.
4. Runtime adapter behind Sinan's existing `WebRuntime.loadModel(assetId, url)` boundary.
5. Scene scope/group preload, followed later by Web/Three loaders, variant, compression, cache strategy, Vite integration, and CLI polish.

## Documents

- [Architecture and technical design v0.1](docs/Indirection_寻址_架构与技术选型设计_v0.1.md)
- [Current technical architecture and development plan v0.2](docs/Indirection_技术架构与开发计划_v0.2.md)
- [Phase 0-7 Big Goal execution guide](docs/indirection-phase-0-7-big-goal-execution-guide.md)
- [R&D plan after Sinan alignment](docs/rd-plan-sinan-alignment-2026-06-20.md)
- [Sinan POC-1 compatibility note](docs/sinan-cooperation/indirection-poc-1-compatibility-note.md)
- [Sinan POC-1 usage](docs/sinan-cooperation/indirection-poc-1-usage.md)
- [Sinan POC-2 adapter boundary](docs/sinan-cooperation/indirection-poc-2-adapter-boundary.md)
