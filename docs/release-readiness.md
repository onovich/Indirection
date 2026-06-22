# Release Readiness

This document records the Phase 8 release-hardening, Phase 9 browser E2E, Phase 10 release dry-run, Phase 11 publish preflight, and Phase 12 browser matrix posture before any real v0.1 npm release or tag.

## Current Quality Gates

Local and CI validation use the same main entrypoint:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

`validate:full` currently covers:

- `lint`: lightweight structure/source guard.
- `format`: lightweight tracked text and JSON format guard.
- `check:docs`: docs link and validation-command drift guard.
- `typecheck`: TypeScript project references with `skipLibCheck` disabled.
- `test`: Vitest unit and contract suite.
- `test:browser`: browser-facing loader smoke.
- `test:e2e`: Playwright real browser E2E in Chromium, Firefox, and WebKit for loaders-web, Cache Storage, runtime lifecycle, fallback diagnostics, and virtual catalog consumption.
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
- Real browser E2E runs in Chromium, Firefox, and WebKit through Playwright and is part of `validate:full`.
- GitHub Actions mirrors the local validation entrypoint.
- Phase 11 publish preflight policy, local `publish:preflight`, docs drift guards, and the manual `Publish Preflight` workflow are in place without granting permission to publish.

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

## Phase 11 Main Implementation Checkpoint

The publish preflight policy implementation now has local and manual CI gates:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

At this checkpoint, package publish candidacy, license, npm scope/account/permission, Git tag, GitHub Release, rollback, versioning, local preflight, docs drift, and manual workflow policies are in place without publishing npm packages, logging in to npm, writing to the registry, creating tags, or creating GitHub Releases.

## Phase 12 Main Implementation Checkpoint

The browser matrix implementation now has a local and CI-ready gate:

```powershell
corepack pnpm validate:full
corepack pnpm test:e2e
git diff --check
```

At this checkpoint, `test:e2e` runs the same browser fixture in Chromium, Firefox, and WebKit. Single-browser debug entrypoints are available as `test:e2e:chromium`, `test:e2e:firefox`, and `test:e2e:webkit`.

## v0.1 Remaining Risks

- No real npm publishing workflow has been created yet.
- No release tag automation has been created yet.
- Package names remain private workspace packages until a publishing decision is made.
- Browser E2E stress and artifact diagnostics remain future hardening candidates.
- The Three adapter remains a peer-boundary skeleton and does not parse real GLTF through Three.js.
- Sinan integration remains a fixture/adapter POC, not a live Sinan Engine repository integration.

## Phase 10 Dry-Run Policy

Phase 10 records the v0.1 package visibility policy in `docs/release-workflow.md`. All workspace package manifests remain `private: true` during release dry-run work. Public package candidates are treated as dry-run candidates only until a later publish-preflight phase accepts npm permissions, package visibility, and tag policy.

The manual GitHub Actions `Release Dry Run` workflow runs `corepack pnpm release:dry-run` with read-only repository permissions. It is a dry-run gate only and does not publish packages or create tags.

## Phase 11 Publish Preflight Policy

Phase 11 guide: `docs/indirection-phase-11-publish-preflight-goal-guide.md`

Phase 11 keeps the Phase 10 no-publish posture while creating the policy and safety gates required before any real v0.1 package release. It documents package visibility acceptance, npm scope/account preflight, license policy, versioning policy, Git tag and GitHub Release policy, rollback policy, and a local `publish:preflight` gate that does not publish, login to npm, write to the registry, or create tags.

Publish preflight policy: `docs/publish-preflight-policy.md`

Phase 11 PASS report: `docs/phase-11-pass-report.md`

The manual GitHub Actions [Publish Preflight](../.github/workflows/publish-preflight.yml) workflow runs `corepack pnpm publish:preflight`, `corepack pnpm release:dry-run`, and `git diff --check` with read-only repository permissions.

## Phase 12 Browser Matrix Expansion

Phase 12 guide: `docs/indirection-phase-12-browser-matrix-goal-guide.md`

Phase 12 expands the existing Playwright E2E gate from Chromium-only to Chromium, Firefox, and WebKit while keeping real npm publish, live Sinan Engine integration, and real Three.js GLTF parsing out of scope.

Phase 12 PASS report: `docs/phase-12-pass-report.md`

## Recommended Next Steps

1. Keep the Phase 12 browser matrix in `validate:full` and CI.
2. Keep `validate:full` as the local and CI release gate.
3. Add real npm publishing only after package visibility, names, npm account/scope, public license, versioning, and tag policy are accepted.
4. Keep host-specific integrations outside core packages unless a dedicated adapter package is approved.

Phase 9 PASS report: `docs/phase-9-pass-report.md`

Phase 10 guide: `docs/indirection-phase-10-release-workflow-goal-guide.md`

Phase 11 guide: `docs/indirection-phase-11-publish-preflight-goal-guide.md`

Phase 12 guide: `docs/indirection-phase-12-browser-matrix-goal-guide.md`

Phase 10 release workflow policy: `docs/release-workflow.md`

Phase 10 PASS report: `docs/phase-10-pass-report.md`

Phase 11 PASS report: `docs/phase-11-pass-report.md`

Phase 12 PASS report: `docs/phase-12-pass-report.md`
