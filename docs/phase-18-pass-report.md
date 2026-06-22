# Phase 18 Release CI Policy Parity And Workflow Hardening PASS Report

## Goal

Phase 18 added a local, static release CI policy gate that keeps GitHub Actions release workflows aligned with local no-publish release commands while preserving the existing no-registry-write, no-tag, no-GitHub-Release, no-signing, no-package-upload, and no-provenance-upload boundaries.

## Completion Status

Status: PASS

Buffer rounds 13-15 were not consumed. The implementation converged without needing workflow parser, docs drift, release dry-run, publish preflight, or CI parity repair buffer rounds.

## CI Policy Coverage

- workflow discovery: `release:ci-check` audits `.github/workflows/validate.yml`, `.github/workflows/release-dry-run.yml`, and `.github/workflows/publish-preflight.yml`.
- read-only permission guard: every audited workflow must declare exactly `permissions: contents: read`.
- workflow write permissions: every audited workflow must keep write permission requests absent.
- forbidden action guard: workflows are checked for real publish commands, Changesets publish, Git tag creation, tag pushes, GitHub Release creation, artifact upload, package upload, signing, Sigstore, npm provenance upload, registry credentials, secrets, and write permissions.
- command parity guard: manual release workflows must run install, `release:ci-check`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `git diff --check` in a stable order.
- validate workflow boundary: `validate.yml` remains the regular CI source for `validate:full` and must not run release gate commands.
- docs drift integration: docs drift checks cover the Phase 18 guide, release CI policy docs, package script, workflow expectations, report shape docs, changelog, and this PASS report.

## Release Boundary Validation

- local release command boundary: `release:dry-run` and `publish:preflight` both invoke the same `createReleaseCiPolicyReport()` gate before completing.
- workflow permission boundary: no audited workflow requests `contents: write`, `packages: write`, `id-token: write`, release, attestation, deployment, or package write permissions.
- no-publish/no-tag/no-registry boundary: no real npm publish, npm login, npm whoami, npm access, npm token, npm owner, npm dist-tag, registry write, Git tag, tag push, GitHub Release, signing, Sigstore, npm provenance upload, or OIDC publish workflow was added.
- generated artifact policy: generated CI policy JSON, workflow run output, tarballs, provenance output, release archives, npm caches, Playwright artifacts, `dist/`, and `.tsbuildinfo` were not committed.
- deferred real publish/Sinan/decoder/renderer scope: real npm publish, live Sinan Engine integration, real decoder dependencies, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, and WebGL scene smoke remain future phase candidates.

## Validation Commands And Results

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm lint`: PASS
- `corepack pnpm format`: PASS
- `corepack pnpm check:docs`: PASS
- `corepack pnpm typecheck`: PASS
- `corepack pnpm test`: PASS, 35 Vitest files and 122 tests
- `corepack pnpm test:browser`: PASS
- `corepack pnpm test:e2e`: PASS, Chromium, Firefox, and WebKit
- `corepack pnpm check:boundaries`: PASS
- `corepack pnpm smoke:cli`: PASS
- `corepack pnpm smoke:phase7`: PASS
- `corepack pnpm pack:check`: PASS, 9 packages packed and imported
- `corepack pnpm release:ci-check`: PASS, 3 workflows audited with read-only permissions and release command parity
- `corepack pnpm release:provenance`: PASS, 9 packages audited with deterministic sha256 provenance
- `corepack pnpm validate:full`: PASS
- `corepack pnpm release:dry-run`: PASS, 9 packages audited with deterministic provenance plus 3 CI policy workflow records and without publish or tag side effects
- `corepack pnpm publish:preflight`: PASS, 9 packages audited with 3 read-only CI policy workflow records and without publish, npm login, registry write, or tag side effects
- `git diff --check`: PASS

## Final Commit

The final pushed commit is recorded in the execution response after this report is committed and pushed.

## Push Result

Expected final push target: `origin/main`.

## Unfinished / Follow-Up Items

- No Phase 18 PASS blockers remain.
- Real npm publish remains blocked until package visibility, package names, npm account/scope, public license, versioning, tag, GitHub Release, provenance upload, signing, rollback, and release ownership decisions are explicitly accepted.
- Live Sinan Engine integration remains a future phase candidate.
- Real Draco/KTX2/meshopt decoder integration, transcoders, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, `@indirection/sinan`, and real WebGL scene smoke remain future hardening candidates.

## Risks And Recommendations

- Keep generated CI policy JSON output out of git; use `node scripts/release-ci-check.mjs --json` only for local inspection or tests.
- Keep workflow release gates read-only until a later approved phase explicitly decides package upload, npm provenance upload, signing, OIDC, tag, and GitHub Release policy.
- Keep local release commands as the semantic source of truth; workflows should continue to orchestrate them instead of redefining release behavior.
