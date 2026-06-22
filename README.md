# Indirection

Indirection is a manifest-first asset addressing protocol, build toolchain, and runtime for Web games and 3D editors.

The project now has an executable Phase 0-7 baseline: protocol, schema, compiler, runtime, testkit, Web loaders, Three adapter skeleton, Vite plugin skeleton, CLI, browser smoke, and package smoke. The core idea is to let application and authoring data reference stable `AssetId` values, while Indirection resolves those identities into deployable URLs, variants, dependencies, cache behavior, loader adapters, and lifecycle-managed runtime handles.

## Positioning

- Independent infrastructure project, not an internal module of a single engine.
- Engine-neutral core: no direct dependency on Sinan, React, Three.js, Vite, or Zod in the runtime core.
- Manifest-first workflow: host-owned or Indirection-authored manifests compile into deterministic runtime catalogs.
- Web primitives first: URL, Fetch, HTTP cache, Cache Storage, AbortSignal, Web Crypto, glTF, and KTX2 before custom bundle formats.
- Explicit lifecycle: `AssetHandle` and `AssetScope` make CPU/GPU ownership observable and releasable.

## First Design Partner

Sinan Engine is planned as the initial first-party design partner, POC host, and regression test field. Sinan should validate Indirection in a realistic engine workflow without defining the core architecture boundary.

## Workspace Shape

The pnpm workspace contains packages for protocol, schema, compiler, runtime, testkit, Web loaders, Three.js adapter boundary, Vite plugin, CLI, and examples. Advanced packages remain adapters around the core; they do not redefine host authoring schemas or runtime lifecycle ownership.

Early milestones:

1. Protocol baseline: `AssetId`, importer contract, manifest/schema, compiled catalog, diagnostics, canonical JSON, and contract tests.
2. Runtime lifecycle core: catalog store, resolver, resource table state machine, handles, scopes, deduplication, abort, fallback, and diagnostic snapshot.
3. Sinan report POC: read Sinan-owned authoring manifest and produce diffable catalog/report output without changing Sinan runtime.
4. Runtime adapter behind Sinan's existing `WebRuntime.loadModel(assetId, url)` boundary.
5. Scene scope/group preload, followed later by Web/Three loaders, variant, compression, cache strategy, Vite integration, and CLI polish.

## Validation

```powershell
corepack pnpm lint
corepack pnpm format
corepack pnpm check:docs
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:browser
corepack pnpm test:e2e
corepack pnpm check:boundaries
corepack pnpm smoke:cli
corepack pnpm smoke:phase7
corepack pnpm pack:check
```

`test:e2e` runs the Playwright browser matrix in Chromium, Firefox, and WebKit. For single-browser debugging, use `test:e2e:chromium`, `test:e2e:firefox`, or `test:e2e:webkit`.

Or run the full local matrix:

```powershell
corepack pnpm validate:full
```

Release dry-run and publish preflight gates are separate from `validate:full`:

```powershell
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## Documents

- [Docs index](docs/README.md)
- [Changelog](CHANGELOG.md)
- [Architecture and technical design v0.1](docs/Indirection_寻址_架构与技术选型设计_v0.1.md)
- [Current technical architecture and development plan v0.2](docs/Indirection_技术架构与开发计划_v0.2.md)
- [Phase 0-7 Big Goal execution guide](docs/indirection-phase-0-7-big-goal-execution-guide.md)
- [Phase 8 Release Hardening Goal guide](docs/indirection-phase-8-release-hardening-goal-guide.md)
- [Phase 9 Real Browser E2E Goal guide](docs/indirection-phase-9-browser-e2e-goal-guide.md)
- [Phase 10 Release Workflow Goal guide](docs/indirection-phase-10-release-workflow-goal-guide.md)
- [Phase 11 Publish Preflight Goal guide](docs/indirection-phase-11-publish-preflight-goal-guide.md)
- [Phase 12 Browser Matrix Goal guide](docs/indirection-phase-12-browser-matrix-goal-guide.md)
- [Phase 12 PASS report](docs/phase-12-pass-report.md)
- [Phase 11 PASS report](docs/phase-11-pass-report.md)
- [Phase 10 PASS report](docs/phase-10-pass-report.md)
- [Publish preflight policy](docs/publish-preflight-policy.md)
- [Release workflow dry-run policy](docs/release-workflow.md)
- [Release versioning ADR](docs/release-versioning-adr.md)
- [Browser E2E validation](docs/browser-e2e.md)
- [Phase 9 PASS report](docs/phase-9-pass-report.md)
- [Phase 8 PASS report](docs/phase-8-pass-report.md)
- [Phase 7 integration and package smoke](docs/phase-7-integration.md)
- [R&D plan after Sinan alignment](docs/rd-plan-sinan-alignment-2026-06-20.md)
- [Sinan POC-1 compatibility note](docs/sinan-cooperation/indirection-poc-1-compatibility-note.md)
- [Sinan POC-1 usage](docs/sinan-cooperation/indirection-poc-1-usage.md)
- [Sinan POC-2 adapter boundary](docs/sinan-cooperation/indirection-poc-2-adapter-boundary.md)
