# Release Readiness

This document records the Phase 8 release-hardening and Phase 9 browser E2E posture before any real v0.1 npm release or tag.

## Current Quality Gates

Local and CI validation use the same main entrypoint:

```powershell
corepack pnpm validate:full
git diff --check
```

`validate:full` currently covers:

- `lint`: lightweight structure/source guard.
- `format`: lightweight tracked text and JSON format guard.
- `check:docs`: docs link and validation-command drift guard.
- `typecheck`: TypeScript project references with `skipLibCheck` disabled.
- `test`: Vitest unit and contract suite.
- `test:browser`: browser-facing loader smoke.
- `test:e2e`: Playwright real browser E2E in Chromium for loaders-web, Cache Storage, runtime lifecycle, fallback diagnostics, and virtual catalog consumption.
- `check:boundaries`: core package dependency and host-specific boundary scan.
- `smoke:cli`: real CLI bin smoke for `validate`, `build`, `report`, and `inspect`.
- `smoke:phase7`: advanced loader/cache/Vite integration example.
- `pack:check`: tarball file whitelist plus temporary consumer import smoke.

## Current Release Candidate Status

- The workspace is buildable and testable with pnpm and TypeScript project references.
- `lint` and `format` are no longer placeholders.
- `skipLibCheck` is disabled and `corepack pnpm typecheck` passes.
- Report JSON shapes are documented and covered by contract tests.
- CLI and package smoke are part of the full matrix.
- Real browser E2E runs in Chromium through Playwright and is part of `validate:full`.
- GitHub Actions mirrors the local validation entrypoint.

## Phase 8 Main Implementation Checkpoint

The main implementation rounds have converged on one local and CI-ready release gate:

```powershell
corepack pnpm validate:full
git diff --check
```

At this checkpoint, the full matrix passes without requiring buffer-round fixes.

## Phase 9 Main Implementation Checkpoint

The real browser E2E main implementation is now part of the same release gate:

```powershell
corepack pnpm validate:full
git diff --check
```

At this checkpoint, Chromium E2E passes locally through `validate:full` and covers loaders-web, Cache Storage, runtime lifecycle, fallback diagnostics, and virtual catalog consumption.

## Phase 10 Main Implementation Checkpoint

The release workflow dry-run implementation now has a local and manual CI gate:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
git diff --check
```

At this checkpoint, package visibility policy, package metadata, release versioning policy, package tarball/import smoke, installed CLI bin smoke, release dry-run safety checks, and the manual `Release Dry Run` workflow are in place without publishing npm packages or creating tags.

## v0.1 Remaining Risks

- No real npm publishing workflow has been created yet.
- No release tag automation has been created yet.
- Package names remain private workspace packages until a publishing decision is made.
- Firefox and WebKit are not yet part of the real browser E2E matrix.
- The Three adapter remains a peer-boundary skeleton and does not parse real GLTF through Three.js.
- Sinan integration remains a fixture/adapter POC, not a live Sinan Engine repository integration.

## Phase 10 Dry-Run Policy

Phase 10 records the v0.1 package visibility policy in `docs/release-workflow.md`. All workspace package manifests remain `private: true` during release dry-run work. Public package candidates are treated as dry-run candidates only until a later publish-preflight phase accepts npm permissions, package visibility, and tag policy.

The manual GitHub Actions `Release Dry Run` workflow runs `corepack pnpm release:dry-run` with read-only repository permissions. It is a dry-run gate only and does not publish packages or create tags.

## Recommended Next Steps

1. Execute Phase 10 as release workflow dry-run and package readiness, because it is the safest remaining v0.1 release-readiness risk that can be solved inside this repository without npm publish permissions.
2. Keep `validate:full` as the local and CI release gate.
3. Add real npm publishing only after package visibility, names, and versioning policy are accepted.
4. Keep host-specific integrations outside core packages unless a dedicated adapter package is approved.

Phase 9 PASS report: `docs/phase-9-pass-report.md`

Phase 10 guide: `docs/indirection-phase-10-release-workflow-goal-guide.md`

Phase 10 release workflow policy: `docs/release-workflow.md`
