# Indirection

Indirection is a manifest-first asset addressing protocol, build toolchain, and runtime for Web games and 3D editors.

The project is currently at the design-baseline stage. The core idea is to let application and authoring data reference stable `AssetId` values, while Indirection resolves those identities into deployable URLs, variants, dependencies, cache behavior, loader adapters, and lifecycle-managed runtime handles.

## Positioning

- Independent infrastructure project, not an internal module of a single engine.
- Engine-neutral core: no direct dependency on Sinan, React, Three.js, Vite, or Zod in the runtime core.
- Manifest-first workflow: human/AI-authored manifests compile into deterministic runtime catalogs.
- Web primitives first: URL, Fetch, HTTP cache, Cache Storage, AbortSignal, Web Crypto, glTF, and KTX2 before custom bundle formats.
- Explicit lifecycle: `AssetHandle` and `AssetScope` make CPU/GPU ownership observable and releasable.

## First Host

Sinan Scene Director is planned as the first real integration host, POC, and regression test field. Sinan should validate Indirection in a realistic scene workflow without defining the core architecture boundary.

## Planned Shape

The design baseline proposes a pnpm workspace with packages for protocol, schema, compiler, runtime, Web loaders, Three.js adapter, Vite plugin, CLI, and examples.

Early milestones:

1. Protocol baseline: `AssetId`, manifest, compiled catalog, errors, schema, canonical JSON, and contract tests.
2. Runtime core: catalog store, resolver, resource table, handles, scopes, deduplication, abort, and events.
3. Web and Three adapter: fetch transport, common browser loaders, GLTF parsing, decoder injection, disposer, and cost reporting.
4. Compiler, CLI, and Vite integration.
5. Sinan Gate Demo POC.

## Documents

- [Architecture and technical design v0.1](docs/Indirection_寻址_架构与技术选型设计_v0.1.md)
