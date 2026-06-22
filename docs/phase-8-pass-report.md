# Phase 8 Release Hardening PASS Report

## Goal

Phase 8 hardened the Phase 0-7 release-candidate baseline into a stronger v0.1-prep quality gate without adding new resource-system features or moving host-specific behavior into core packages.

## Completion Status

Status: PASS

Buffer rounds 13-15 were not consumed. The main implementation rounds converged without requiring compatibility or validation repair rounds.

## Quality Gates

- lint: `corepack pnpm lint` now runs `scripts/lint-check.mjs`, a lightweight structure/source guard.
- format: `corepack pnpm format` now runs `scripts/format-check.mjs`, a tracked text and stable JSON format guard.
- docs drift: `corepack pnpm check:docs` verifies documentation links and validation-command drift.
- skipLibCheck: disabled in `tsconfig.base.json`; `corepack pnpm typecheck` passes with library checks enabled.
- report schema/contract: report JSON shapes are documented in `docs/report-json-shapes.md` and covered by compiler/Sinan contract tests.
- CLI smoke: `corepack pnpm smoke:cli` runs the built CLI bin through `validate`, `build`, `report`, `inspect`, and a missing asset failure path.
- package smoke: `corepack pnpm pack:check` verifies exports, tarball file whitelist, CLI bin inclusion, and temporary consumer ESM imports.
- CI: `.github/workflows/validate.yml` mirrors the local `validate:full` gate.

## Core Architecture Boundary Validation

- host-owned authoring: unchanged; authoring remains source-of-truth.
- runtime core zero dependency: boundary check continues to reject DOM, implicit fetch, Zod, Three.js, Vite, React, Node-specific imports, and host-specific names in core package source.
- diagnostics stability: tests key on diagnostic codes, phases, paths, and structured fields rather than natural-language messages.
- adapter/core separation: Sinan-specific code remains in docs, fixtures, tests, and adapter POC boundaries.

## Validation Commands And Results

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm lint`: PASS
- `corepack pnpm format`: PASS
- `corepack pnpm typecheck`: PASS
- `corepack pnpm test`: PASS, 32 test files and 85 tests
- `corepack pnpm test:browser`: PASS
- `corepack pnpm check:boundaries`: PASS
- `corepack pnpm smoke:phase7`: PASS
- `corepack pnpm pack:check`: PASS, 9 packages packed and imported
- `corepack pnpm validate:full`: PASS
- `git diff --check`: PASS

## Final Commit

The final pushed commit is recorded in the execution response after this report is committed and pushed.

## Push Result

Expected final push target: `origin/main`.

## Unfinished / Follow-Up Items

- No Phase 8 PASS blockers remain.
- Real npm publishing, release tag automation, real browser E2E, live Sinan Engine integration, and real Three.js GLTF parsing remain future Phase 9 candidates.

## Risks And Recommendations

- Keep `validate:full` as the local and CI release gate.
- Do not publish npm packages until package visibility, scope, versioning, and release workflow are explicitly accepted.
- Keep host adapters out of core packages unless a dedicated adapter package is approved.

## Next Phase

Phase 9 should focus on the safest remaining release-readiness risk that can be solved inside this repository: real browser E2E coverage.

- Add a true browser runner and repeatable fixture.
- Verify loaders-web, persistent cache, runtime lifecycle, fallback, diagnostics, and compiler/Vite browser consumption in at least Chromium.
- Keep npm publishing, live Sinan integration, and real Three.js GLTF parsing out of this phase.

Guide: `docs/indirection-phase-9-browser-e2e-goal-guide.md`
