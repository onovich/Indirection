# Indirection Phase 16 Browser E2E Stress And Artifact Diagnostics Goal Guide

Date: 2026-06-22
Status: execution guide for Phase 16
Upstream PASS: `docs/phase-15-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 16 in `D:\LabProjects\Engine\Indirection`.

Phase 15 has passed with final commit `9ac0d9f docs: add phase 15 pass report`. Phase 16 is **Browser E2E Stress And Artifact Diagnostics**.

The goal is to strengthen the existing Chromium, Firefox, and WebKit browser E2E gate so failures are easier to diagnose and the fixture covers bounded stress paths across loaders, Cache Storage, runtime lifecycle, fallback diagnostics, virtual catalog consumption, and compressed capability source selection. This phase should not introduce renderer/WebGL scenes, real decoder dependencies, live Sinan integration, or real npm publishing.

Round budget: 16 rounds.

- Rounds 1-12: main implementation.
- Rounds 13-15: buffer fixes for browser flake, artifact path, docs drift, boundary, package smoke, or CI parity issues.
- Round 16: final validation, commit, push, and PASS report.

Every round must include:

- Debug self-check.
- Architecture self-check.
- Validation commands and results.
- Commit hash and push result after validation passes.
- Next-round target.
- Whether a buffer round was consumed.

Progression rules:

- If validation fails, do not commit, do not push, and do not move to the next round.
- If commit fails, do not move to the next round.
- If push fails, do not move to the next round.
- Only after push succeeds may the executor continue to the next round.

## 1. Required Reading

Read these before editing:

- `README.md`
- `docs/README.md`
- `docs/phase-15-pass-report.md`
- `docs/indirection-phase-15-compressed-capability-goal-guide.md`
- `docs/browser-e2e.md`
- `docs/compressed-capability-source-selection.md`
- `docs/runtime-lifecycle.md`
- `docs/three-gltf-adapter.md`
- `docs/release-readiness.md`
- `playwright.config.ts`
- `tests/e2e/browser-fixture.e2e.ts`
- `tests/e2e/fixtures/minimal-app.js`
- `tests/e2e/server.mjs`
- `scripts/docs-drift-check.mjs`
- `scripts/core-boundary-check.mjs`
- `scripts/pack-check.mjs`

Phase 15 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm validate:full`: PASS, including 33 files and 114 tests plus Chromium, Firefox, and WebKit E2E
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 16 Is This Work

After Phase 15, the remaining candidates include:

- real npm publish release candidate;
- live Sinan Engine repository integration;
- real Draco/KTX2/meshopt decoder integration;
- texture/ImageBitmap lifecycle or renderer E2E;
- browser E2E stress and artifact diagnostics.

Real npm publish still requires owner decisions. Live Sinan still depends on a real host integration surface. Real decoder integration should wait for an explicit dependency policy. Texture/ImageBitmap lifecycle and renderer E2E are valuable but should be dedicated adapter/host phases.

Phase 16 therefore chooses browser E2E stress and artifacts because it is fully in-repository, builds on the existing Phase 9 and Phase 12 browser matrix, and makes the release gate more useful before any real publish or live host integration.

## 3. Phase 16 Must Complete

Phase 16 must deliver:

- Bounded browser stress coverage that remains deterministic and fast enough for `validate:full`.
- Browser E2E coverage for repeated acquire/release or scope disposal paths without leaking resource state.
- Browser E2E coverage for Cache Storage isolation and cleanup that is robust across Chromium, Firefox, and WebKit.
- Browser E2E coverage for compressed capability source selection using text or tiny fixture data, not real decoder packages.
- Clear failure diagnostics exposed through `window.__indirectionE2E` or an equivalent structured browser result object.
- Playwright artifact policy and docs that explain trace, HTML report, test-results, screenshots, or JSON diagnostics if added.
- Local debugging commands for the full matrix and single-browser projects.
- Docs drift guards for the Phase 16 guide, browser stress docs, validation commands, and the Phase 16 PASS report.
- A final `docs/phase-16-pass-report.md`.

Preferred implementation shape:

- Keep the existing minimal fixture and add structured sections rather than creating a new application.
- Use bounded loops with small counts; avoid timing-sensitive performance assertions.
- Prefer stable object assertions over screenshots for correctness.
- Use Playwright traces and reports for diagnostics, not as required committed artifacts.
- Keep all runtime artifacts ignored.

Preferred final validation:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm format
corepack pnpm check:docs
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:browser
corepack pnpm test:e2e
corepack pnpm test:e2e:chromium
corepack pnpm test:e2e:firefox
corepack pnpm test:e2e:webkit
corepack pnpm check:boundaries
corepack pnpm smoke:cli
corepack pnpm smoke:phase7
corepack pnpm pack:check
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 4. Phase 16 Must Not Do

Do not:

- Run a real npm publish.
- Run npm login, npm token checks, or registry writes.
- Remove `private: true` or change the `UNLICENSED` policy.
- Create Git tags or GitHub Releases.
- Add renderer/WebGL scene E2E, Three renderer E2E, real GPU assertions, or screenshot-based visual approval gates.
- Add real decoder dependencies, transcoders, texture pipeline, ImageBitmap lifecycle, or GPU memory estimator work.
- Add live Sinan Engine integration or create `@indirection/sinan`.
- Move browser, DOM, Playwright, Vite, Three.js, GLTFLoader, decoder, or host-specific APIs into protocol/schema/compiler/runtime core.
- Make the browser fixture a new authoring source-of-truth.
- Commit Playwright runtime artifacts such as `playwright-report/`, `test-results/`, traces, screenshots, videos, or generated package tarballs.
- Add timing thresholds that make CI flaky.

## 5. Architecture Boundaries

Keep these boundaries:

- Browser E2E remains a validation harness, not core product runtime code.
- Core packages stay free of browser, DOM, fetch, Playwright, Vite, Three, decoder, and Sinan coupling.
- The fixture consumes public package APIs and generated/compiled artifacts; it must not duplicate compiler or runtime semantics.
- Cache Storage behavior remains in `@indirection/loaders-web` or tests, not runtime core.
- Compressed capability source selection remains declarative string-set data.
- Default source selection and runtime fallback remain distinct in browser diagnostics.
- Artifacts are diagnostics for humans, not committed source artifacts.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 16.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing Playwright config or browser fixture code:

```powershell
corepack pnpm typecheck
corepack pnpm test:e2e
```

When changing docs or validation scripts:

```powershell
corepack pnpm check:docs
```

When changing package smoke or release posture:

```powershell
corepack pnpm pack:check
corepack pnpm release:dry-run
corepack pnpm publish:preflight
```

## 7. Commit And Push Workflow

Prefer the project git wrapper if available:

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths "path1,path2"
```

Otherwise use:

```powershell
git status --short --branch
git diff --stat
git add -- <phase-relevant files>
git commit -m "<phase>: <round summary>"
git push
git status --short --branch
```

Rules:

- Do not stage unrelated files.
- Do not stage `dist/`, `.tsbuildinfo`, `playwright-report/`, `test-results/`, traces, screenshots, videos, package tarballs, or runtime caches.
- Do not force-push.
- Do not commit when validation fails.

## 8. Required Round Reply Template

Every round reply must include:

```text
Round target:
Completed work:
Debug self-check:
Architecture self-check:
Validation commands and results:
Commit hash and push result:
Next-round target:
Buffer round consumed:
```

## 9. Debug Self-Check

Every round must answer:

- Can this browser failure be localized to server, package import, fixture setup, loader, cache, runtime, fallback, capability selection, Playwright config, or artifact collection?
- Does the stress path avoid timing-sensitive assertions?
- Are success, failure, fallback, repeated release, cleanup, and artifact states visible in structured output?
- If artifacts are added, are paths documented and ignored?
- Does the test remain browser-neutral across Chromium, Firefox, and WebKit?

## 10. Architecture Self-Check

Every round must answer:

- Did browser/Playwright code stay in tests/docs/CI boundaries?
- Did core packages remain free of browser, DOM, Playwright, Vite, Three, decoder, and Sinan coupling?
- Did the fixture consume public APIs rather than duplicating shared semantics?
- Did Cache Storage logic stay outside runtime core?
- Did the phase avoid real npm publish, live Sinan, real decoder integration, texture pipeline, and renderer E2E?
- Were unrelated files and generated artifacts left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 16 guide and update README/docs index/release readiness/Phase 15 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit current Playwright config, fixture output, browser docs, artifact ignore policy, and CI validation workflow | `corepack pnpm test:e2e`, `git diff --check` |
| 3 | Add structured browser stress result shape for bounded repeated acquire/release and scope disposal | `corepack pnpm test:e2e` |
| 4 | Add browser stress coverage for Cache Storage isolation/cleanup with stable diagnostics | `corepack pnpm test:e2e` |
| 5 | Add browser coverage for compressed capability source selection using tiny text fixture data | `corepack pnpm test:e2e` |
| 6 | Improve failure diagnostics exposed through `window.__indirectionE2E` and Playwright assertion output | `corepack pnpm test:e2e` |
| 7 | Add or document artifact diagnostics for trace/report/test-results without committing runtime artifacts | `corepack pnpm check:docs`, `git diff --check` |
| 8 | Run and repair single-browser debug commands for Chromium, Firefox, and WebKit | `corepack pnpm test:e2e:chromium`, `corepack pnpm test:e2e:firefox`, `corepack pnpm test:e2e:webkit` |
| 9 | Update `docs/browser-e2e.md` with stress coverage, artifact policy, and troubleshooting | `corepack pnpm check:docs` |
| 10 | Add docs drift guards for Phase 16 guide, browser stress terms, artifact docs, and planned PASS report | `corepack pnpm check:docs` |
| 11 | Run full local quality gate and repair typing, docs, E2E, pack, or boundary issues | `corepack pnpm validate:full` |
| 12 | Run release posture gates and confirm no publish/tag side effects | `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 13 | Fix browser flake, fixture timing, or cross-browser differences | `corepack pnpm test:e2e`, single-browser commands as needed |
| 14 | Fix docs drift, artifact ignore policy, or troubleshooting gaps | `corepack pnpm check:docs`, `git diff --check` |
| 15 | Fix boundary, release posture, package smoke, or accidental generated-artifact issues | `corepack pnpm check:boundaries`, `corepack pnpm pack:check`, `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 16 | Write `docs/phase-16-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 16 final PASS requires:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm format
corepack pnpm check:docs
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:browser
corepack pnpm test:e2e
corepack pnpm test:e2e:chromium
corepack pnpm test:e2e:firefox
corepack pnpm test:e2e:webkit
corepack pnpm check:boundaries
corepack pnpm smoke:cli
corepack pnpm smoke:phase7
corepack pnpm pack:check
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 13. PASS Criteria

Phase 16 PASS requires:

- Browser E2E remains green in Chromium, Firefox, and WebKit.
- Bounded stress coverage exists for repeated runtime lifecycle behavior without leaks.
- Cache Storage isolation/cleanup remains covered and deterministic.
- Compressed capability source selection is covered in browser E2E with tiny fixture data.
- Failure diagnostics are structured and easier to inspect from Playwright output or artifacts.
- Artifact policy is documented and ignored runtime artifacts are not committed.
- Single-browser debug commands work and are documented.
- Browser/Playwright concerns remain outside core packages.
- `validate:full`, single-browser E2E commands, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No real npm publish, npm login, registry write, Git tag, GitHub Release, live Sinan integration, real decoder dependency, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, or WebGL scene smoke was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 16 Browser E2E Stress And Artifact Diagnostics PASS Report

## Goal

## Completion Status

## Browser Stress Coverage

- repeated runtime lifecycle:
- Cache Storage isolation/cleanup:
- compressed capability source selection:
- fallback diagnostics:
- structured browser result:
- artifact diagnostics:

## Core Architecture Boundary Validation

- browser/test boundary:
- runtime core boundary:
- package/API consumption:
- artifact policy:
- deferred renderer/decoder/Sinan/release scope:

## Validation Commands And Results

- corepack pnpm install --frozen-lockfile:
- corepack pnpm lint:
- corepack pnpm format:
- corepack pnpm check:docs:
- corepack pnpm typecheck:
- corepack pnpm test:
- corepack pnpm test:browser:
- corepack pnpm test:e2e:
- corepack pnpm test:e2e:chromium:
- corepack pnpm test:e2e:firefox:
- corepack pnpm test:e2e:webkit:
- corepack pnpm check:boundaries:
- corepack pnpm smoke:cli:
- corepack pnpm smoke:phase7:
- corepack pnpm pack:check:
- corepack pnpm validate:full:
- corepack pnpm release:dry-run:
- corepack pnpm publish:preflight:
- git diff --check:

## Final Commit

## Push Result

## Unfinished / Follow-Up Items

## Risks And Recommendations
```

## 15. Candidate Phases After Phase 16

After Phase 16 passes, the planner may choose among:

- Real npm publish release candidate, only after owner decisions are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Texture/ImageBitmap lifecycle or renderer E2E, only as a dedicated adapter/host phase.
- Real decoder package integration for Draco/KTX2/meshopt, only after dependency policy is accepted.
- Release artifact provenance or package provenance hardening, if real publish remains blocked.
