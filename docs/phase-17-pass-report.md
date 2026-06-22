# Phase 17 Release Artifact Provenance And Verification PASS Report

## Goal

Phase 17 added a deterministic local provenance gate for packed release dry-run artifacts while preserving the existing no-publish, no-registry-write, no-tag, no-release, no-signing, and no-provenance-upload boundaries.

## Completion Status

Status: PASS

Buffer rounds 13-15 were not consumed. The implementation converged without needing provenance shape, tarball hashing, docs drift, release dry-run, publish preflight, or CI parity repair buffer rounds.

## Provenance Coverage

- package discovery: `release:provenance` discovers and sorts all 9 workspace packages from `packages/`.
- tarball hashing: every package is packed into a temporary directory and recorded with tarball filename, canonical packed payload `sha256`, hash subject, and byte size from the actual `.tgz` bytes.
- metadata/files/exports evidence: each package record includes package name, version, `private`, license, repository-relative package directory, exported entrypoints, CLI bin entries, packed file count, and packed file paths.
- deterministic report shape: `scripts/release-provenance.mjs` creates two independent temporary pack roots and compares canonical JSON through `repeat-pack-canonical-json-match`.
- secret/path/timestamp exclusion: report guards reject timestamps, absolute paths, home directories, local usernames, selected npm token/auth environment values, and registry credential assignments.
- release dry-run integration: `release:dry-run` invokes `createReleaseProvenance()` after build and `pack:check`, then verifies git status and tags remain unchanged.
- publish preflight boundary: `publish:preflight` remains a policy gate and continues to run without publish, npm login, registry write, or tag side effects.

## Core Architecture Boundary Validation

- release tooling boundary: provenance lives in `scripts/`, `docs/`, package scripts, and release policy docs.
- runtime/core boundary: protocol, schema, compiler, and runtime core remain free of npm, tarball hashing, GitHub Release, signing, and provenance-upload semantics.
- no-publish/no-tag/no-registry boundary: no real npm publish, npm login, npm whoami, npm access, npm token, npm owner, npm dist-tag, registry write, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, or OIDC publish workflow was added.
- generated artifact policy: generated tarballs, provenance JSON output, temporary consumers, release archives, npm caches, Playwright artifacts, `dist/`, and `.tsbuildinfo` were not committed.
- deferred real publish/Sinan/decoder/renderer scope: real npm publish, live Sinan Engine integration, real decoder dependencies, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, and WebGL scene smoke remain future phase candidates.

## Validation Commands And Results

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm lint`: PASS
- `corepack pnpm format`: PASS
- `corepack pnpm check:docs`: PASS
- `corepack pnpm typecheck`: PASS
- `corepack pnpm test`: PASS, 34 Vitest files and 118 tests
- `corepack pnpm test:browser`: PASS
- `corepack pnpm test:e2e`: PASS, Chromium, Firefox, and WebKit
- `corepack pnpm check:boundaries`: PASS
- `corepack pnpm smoke:cli`: PASS
- `corepack pnpm smoke:phase7`: PASS
- `corepack pnpm pack:check`: PASS, 9 packages packed and imported
- `corepack pnpm release:provenance`: PASS, 9 packages audited with deterministic sha256 provenance
- `corepack pnpm validate:full`: PASS
- `corepack pnpm release:dry-run`: PASS, 9 packages audited, packed, and verified with 9 deterministic provenance records and without publish or tag side effects
- `corepack pnpm publish:preflight`: PASS, 9 packages audited without publish, npm login, registry write, or tag side effects
- `git diff --check`: PASS

## Final Commit

The final pushed commit is recorded in the execution response after this report is committed and pushed.

## Push Result

Expected final push target: `origin/main`.

## Next Phase

Planner selection after PASS: Phase 18 Release CI Policy Parity And Workflow Hardening.

Guide: `docs/indirection-phase-18-release-ci-policy-goal-guide.md`

## Unfinished / Follow-Up Items

- No Phase 17 PASS blockers remain.
- Real npm publish remains blocked until package visibility, npm account/scope, public license, versioning, tag, GitHub Release, provenance upload, signing, and rollback decisions are explicitly accepted.
- Live Sinan Engine integration remains a future phase candidate.
- Real Draco/KTX2/meshopt decoder integration, transcoders, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, `@indirection/sinan`, and real WebGL scene smoke remain future hardening candidates.

## Risks And Recommendations

- Keep generated provenance JSON out of git; use `node scripts/release-provenance.mjs --json` only for local inspection or tests.
- Keep release provenance as local dry-run evidence until a later approved phase decides npm provenance upload, signing, or OIDC publishing policy.
- Keep `release:dry-run` as the no-side-effect gate that proves package artifacts, provenance, git status, and tag state remain clean before any release handoff.
