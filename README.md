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

## Evaluate Locally

Indirection is ready for technical evaluation from a local checkout, but the workspace packages are still private and unpublished. Do not install them from npm, run real publish commands, create release tags, create GitHub Releases, or remove `private: true` / `UNLICENSED` until a later owner-approved publish phase changes that policy.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm smoke:site-demo
corepack pnpm validate:full
```

For the guided path through CLI commands, package entrypoints, browser checks, example workflows, local site rehearsal, and no-publish release-readiness gates, start with [Evaluator quickstart](docs/evaluator-quickstart.md), [Package entrypoints](docs/package-entrypoints.md), [Example workflows](docs/example-workflows.md), and [Public demo site rehearsal](docs/public-demo-site.md).

Browser image-source lifecycle coverage is documented in [Browser ImageBitmap lifecycle](docs/image-bitmap-lifecycle.md). It stays in `@indirection/loaders-web` and uses runtime `LoadedAsset.dispose` without adding browser APIs to core packages.

Renderer texture E2E coverage is documented in [Renderer And Three Texture E2E](docs/renderer-texture-e2e.md). It proves a local browser/Three/WebGL texture path on top of the Phase 22 ImageBitmap lifecycle while keeping production renderer framework work, real decoder dependencies, live Sinan integration, publishing, and deployment out of scope.

## Validation

```powershell
corepack pnpm lint
corepack pnpm format
corepack pnpm check:docs
corepack pnpm smoke:site-demo
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
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
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
- [Phase 13 Three GLTF Goal guide](docs/indirection-phase-13-three-gltf-goal-guide.md)
- [Phase 14 Three Lifecycle Goal guide](docs/indirection-phase-14-three-lifecycle-goal-guide.md)
- [Phase 15 Compressed Capability Goal guide](docs/indirection-phase-15-compressed-capability-goal-guide.md)
- [Phase 16 Browser E2E Stress Goal guide](docs/indirection-phase-16-browser-e2e-stress-goal-guide.md)
- [Phase 17 Release Provenance Goal guide](docs/indirection-phase-17-release-provenance-goal-guide.md)
- [Phase 18 Release CI Policy Goal guide](docs/indirection-phase-18-release-ci-policy-goal-guide.md)
- [Phase 19 Release Candidate Rehearsal Goal guide](docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md)
- [Phase 20 Public Docs Onboarding Goal guide](docs/indirection-phase-20-public-docs-onboarding-goal-guide.md)
- [Phase 21 Public Demo Docs Site Goal guide](docs/indirection-phase-21-public-demo-docs-site-goal-guide.md)
- [Phase 22 ImageBitmap Lifecycle Goal guide](docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md)
- [Phase 23 Renderer And Three Texture E2E Goal guide](docs/indirection-phase-23-renderer-texture-e2e-goal-guide.md)
- [Browser ImageBitmap lifecycle](docs/image-bitmap-lifecycle.md)
- [Renderer And Three Texture E2E](docs/renderer-texture-e2e.md)
- [Evaluator quickstart](docs/evaluator-quickstart.md)
- [Package entrypoints](docs/package-entrypoints.md)
- [Example workflows](docs/example-workflows.md)
- [Public demo site rehearsal](docs/public-demo-site.md)
- [Release CI policy](docs/release-ci-policy.md)
- [Release provenance](docs/release-provenance.md)
- [Release candidate handoff](docs/release-candidate-handoff.md)
- [Compressed capability source selection](docs/compressed-capability-source-selection.md)
- [Runtime lifecycle](docs/runtime-lifecycle.md)
- [Three GLTF adapter](docs/three-gltf-adapter.md)
- [Phase 23 PASS report](docs/phase-23-pass-report.md)
- [Phase 22 PASS report](docs/phase-22-pass-report.md)
- [Phase 21 PASS report](docs/phase-21-pass-report.md)
- [Phase 20 PASS report](docs/phase-20-pass-report.md)
- [Phase 19 PASS report](docs/phase-19-pass-report.md)
- [Phase 18 PASS report](docs/phase-18-pass-report.md)
- [Phase 17 PASS report](docs/phase-17-pass-report.md)
- [Phase 16 PASS report](docs/phase-16-pass-report.md)
- [Phase 15 PASS report](docs/phase-15-pass-report.md)
- [Phase 14 PASS report](docs/phase-14-pass-report.md)
- [Phase 13 PASS report](docs/phase-13-pass-report.md)
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
