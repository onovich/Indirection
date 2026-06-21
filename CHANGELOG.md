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
