# Changelog

## 0.0.0-phase-0-7-rc - 2026-06-20

- Added a pnpm workspace with protocol, schema, compiler, runtime, testkit, loaders-web, three, vite, and cli packages.
- Added deterministic manifest import, canonical catalog hashing, validation diagnostics, compile reports, and vanilla fixtures.
- Added runtime catalog store, resolver chain, resource table lifecycle, scope/handle ownership, fake loaders, in-flight deduplication, abort, fallback, dependency retain/release, and debug snapshots.
- Added Sinan POC-1 importer/report fixtures plus POC-2 adapter facade smoke without moving Sinan-specific API into core packages.
- Added Phase 7 loaders-web, cache adapter, Three peer-boundary loader skeleton, Vite virtual catalog plugin, CLI commands, browser-facing smoke, and package tarball/import smoke.
- Added `validate:full` as the local release-candidate validation matrix.

Validation:

```powershell
corepack pnpm validate:full
git diff --check
```

## 0.0.0-phase-8-hardening - 2026-06-21

- Replaced placeholder `lint` and `format` scripts with lightweight zero-dependency quality gates.
- Disabled `skipLibCheck` and kept the TypeScript matrix passing.
- Added report JSON shape documentation and contract tests.
- Added CLI, docs drift, package file whitelist, and GitHub Actions validation gates.
- Documented release readiness and v0.1 remaining risks.
- Added the Phase 8 PASS report.

Validation:

```powershell
corepack pnpm validate:full
git diff --check
```

## 0.0.0-phase-9-browser-e2e - 2026-06-22

- Added Playwright Chromium E2E coverage for browser-facing loader, cache, runtime lifecycle, fallback diagnostics, and virtual catalog behavior.
- Added `BrowserCacheStorageAdapter` coverage against real `window.caches`.
- Added `test:e2e` to the local `validate:full` release gate.
- Updated GitHub Actions to install and cache Playwright Chromium.
- Added browser E2E docs and the Phase 9 PASS report.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm test:e2e
git diff --check
```

## 0.0.0-phase-10-release-dry-run - 2026-06-22

- Added release workflow dry-run policy, package visibility policy, and release versioning ADR.
- Added package metadata across workspace package manifests while keeping all packages `private: true`.
- Extended `pack:check` to validate package metadata, tarball contents, temporary consumer imports, and the installed CLI bin.
- Added `release:dry-run` to audit private package policy, version policy, workspace dependency ranges, release docs, package smoke, and no publish/tag side effects.
- Added a manual GitHub Actions `Release Dry Run` workflow with read-only repository permissions.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
git diff --check
```
