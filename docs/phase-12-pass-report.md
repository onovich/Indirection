# Phase 12 Browser Matrix Expansion PASS Report

## Goal

Phase 12 expanded the real browser E2E gate from Chromium-only to a Chromium, Firefox, and WebKit Playwright matrix while keeping browser APIs, Playwright, and CI concerns outside runtime core.

## Completion Status

Status: PASS

Buffer rounds 13-15 were not consumed. The main implementation rounds converged without requiring browser install, fixture timing, Cache Storage, docs drift, or CI workflow repair buffer rounds.

## Browser Matrix Coverage

- runner: Playwright through `@playwright/test`, with `test:e2e` as the default three-browser gate.
- browsers: Chromium, Firefox, and WebKit projects are defined in `playwright.config.ts`.
- single-browser debug: `test:e2e:chromium`, `test:e2e:firefox`, and `test:e2e:webkit` run the same fixture with one project selected.
- loaders-web: JSON, text, and binary loaders execute in all three browsers through browser ESM imports.
- cache: `BrowserCacheStorageAdapter` covers miss, hit, catalog-version isolation, and cleanup against real `window.caches` in all three browsers.
- runtime lifecycle: `createAssetManager`, `scope.acquire`, `handle.release`, `scope.dispose`, resource snapshots, and leak-warning snapshots execute in all three browsers.
- fallback/diagnostics: fallback success and no-fallback failure assert structured `causeCode` and `fallbackAssetId` snapshot fields.
- compiler/Vite/browser fixture: the E2E server serves a virtual catalog module generated through the Vite plugin and compiler output; each browser imports and consumes that catalog.
- CI/release gate: `.github/workflows/validate.yml` installs Chromium, Firefox, and WebKit with Playwright system dependencies before running `validate:full`.

## Core Architecture Boundary Validation

- host-owned authoring: unchanged; E2E fixtures remain derived test inputs and do not become authoring source-of-truth.
- runtime core zero dependency: runtime core remains free of DOM, implicit fetch, Zod, Three.js, Vite, React, Node-specific imports, and Playwright.
- diagnostics stability: E2E assertions use structured snapshot fields and diagnostic-style codes rather than natural-language error messages.
- adapter/core separation: Cache Storage, browser ESM, Vite virtual module generation, Playwright projects, and CI browser installation stay in adapter, tests, docs, scripts, and CI boundaries.

## Validation Commands And Results

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm lint`: PASS
- `corepack pnpm format`: PASS
- `corepack pnpm check:docs`: PASS
- `corepack pnpm typecheck`: PASS
- `corepack pnpm test`: PASS, 32 test files and 85 tests
- `corepack pnpm test:browser`: PASS
- `corepack pnpm test:e2e`: PASS, 3 browser projects: Chromium, Firefox, and WebKit
- `corepack pnpm check:boundaries`: PASS
- `corepack pnpm smoke:cli`: PASS
- `corepack pnpm smoke:phase7`: PASS
- `corepack pnpm pack:check`: PASS, 9 packages packed and imported
- `corepack pnpm validate:full`: PASS
- `corepack pnpm release:dry-run`: PASS, 9 packages audited, packed, and verified without publish or tag side effects
- `corepack pnpm publish:preflight`: PASS, 9 packages audited without publish, npm login, registry write, or tag side effects
- `git diff --check`: PASS

## Final Commit

The final pushed commit is recorded in the execution response after this report is committed and pushed.

## Push Result

Expected final push target: `origin/main`.

## Unfinished / Follow-Up Items

- No Phase 12 PASS blockers remain.
- Browser E2E stress and artifact diagnostics, such as trace-on-failure policy, fixture sharding, and network/error matrices, remain future hardening candidates.
- Real npm publish remains blocked until package visibility, npm account/scope, public license, versioning, tag, GitHub Release, and rollback decisions are explicitly accepted.
- Live Sinan Engine integration and real Three.js GLTF parser integration remain future phase candidates.

## Next Phase

Planner selection after PASS: Phase 13 Real Three GLTF Adapter Integration.

Selected Phase 13 guide: `docs/indirection-phase-13-three-gltf-goal-guide.md`

Rationale: real npm publish still needs owner acceptance, and live Sinan Engine integration still depends on a real host integration surface. The Three adapter is already present as a peer-boundary skeleton, so real GLTF parser integration is the safest self-contained next phase that increases product value without weakening core boundaries.

## Risks And Recommendations

- Keep `corepack pnpm test:e2e` in `validate:full` so release validation keeps the three-browser matrix by default.
- Keep Playwright traces, reports, screenshots, browser caches, and test results out of git unless a future artifact policy explicitly accepts them.
- Keep browser-only APIs, Playwright configuration, and CI browser installation in tests, docs, scripts, and CI; do not move them into runtime core.
- Keep real npm publish, npm login, registry writes, Git tags, and GitHub Releases out of executor-side implementation work without an explicit future guide.
