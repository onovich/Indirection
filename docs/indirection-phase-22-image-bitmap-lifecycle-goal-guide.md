# Indirection Phase 22 Browser ImageBitmap And Texture Source Lifecycle Goal Guide

Date: 2026-06-23
Status: execution guide for Phase 22
Upstream PASS: `docs/phase-21-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 22 in `D:\LabProjects\Engine\Indirection`.

Phase 21 has passed with final commit `b605988 docs: add phase 21 public demo rehearsal`. Phase 22 is **Browser ImageBitmap And Texture Source Lifecycle**.

The goal is to add a bounded browser-side image/bitmap loading and lifecycle contract so image/texture source assets can be loaded, inspected, and released through the existing runtime handle/scope model. The work should stay in `@indirection/loaders-web`, tests, docs, examples, and package smoke support. Runtime core should continue to know only the generic `LoadedAsset.dispose` lifecycle contract, not browser, ImageBitmap, canvas, WebGL, or Three.js details.

Round budget: 16 rounds.

- Rounds 1-12: main implementation.
- Rounds 13-15: buffer fixes for image fixture compatibility, ImageBitmap close/dispose behavior, browser E2E stability, docs drift, package smoke, or boundary guard issues.
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
- `CHANGELOG.md`
- `docs/README.md`
- `docs/phase-21-pass-report.md`
- `docs/indirection-phase-21-public-demo-docs-site-goal-guide.md`
- `docs/runtime-lifecycle.md`
- `docs/browser-e2e.md`
- `docs/evaluator-quickstart.md`
- `docs/package-entrypoints.md`
- `docs/example-workflows.md`
- `docs/release-readiness.md`
- `docs/three-gltf-adapter.md`
- `docs/compressed-capability-source-selection.md`
- `packages/loaders-web/src/index.ts`
- `packages/loaders-web/test`
- `packages/runtime/src/index.ts`
- `packages/runtime/test`
- `tests/e2e/fixtures/minimal-app.js`
- `tests/e2e/browser-fixture.e2e.ts`
- `scripts/browser-smoke.mjs`
- `scripts/pack-check.mjs`
- `scripts/docs-drift-check.mjs`
- `package.json`

Phase 21 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm site:demo`: PASS
- `corepack pnpm smoke:site-demo`: PASS
- `corepack pnpm validate:full`: PASS, including 36 files and 128 tests plus Chromium, Firefox, and WebKit E2E
- `corepack pnpm release:rc-check`: PASS, 9 package candidates / 13 owner decision blockers / 19 blocked real-publish actions
- `corepack pnpm release:ci-check`: PASS
- `corepack pnpm release:provenance`: PASS
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 22 Is This Work

After Phase 21, the remaining candidates include:

- real npm publish release candidate;
- live Sinan Engine repository integration;
- real Draco/KTX2/meshopt decoder integration;
- texture/ImageBitmap lifecycle or renderer E2E;
- public deployment phase.

Real npm publish and public deployment still require owner approval. Live Sinan still depends on a real host integration surface. Real decoder packages require dependency policy. Full renderer E2E and WebGL scene smoke should wait until image/texture loading has a stable browser-side lifecycle contract.

Phase 22 therefore chooses Browser ImageBitmap And Texture Source Lifecycle because it is an in-repository adapter/loader hardening step. It advances the asset pipeline toward real texture workflows without pulling renderer ownership, Three.js texture creation, GPU memory estimation, external decoders, live Sinan integration, or deployment into the current phase.

## 3. Phase 22 Must Complete

Phase 22 must deliver:

- A documented browser image/bitmap loader contract for `image/bitmap` or equivalent image source assets.
- Loader-web API support for browser ImageBitmap loading with host-injectable decoding boundaries where needed.
- Final-reference disposal behavior that closes or disposes owned image bitmap resources through the existing runtime `LoadedAsset.dispose` path.
- Tests proving successful image/bitmap loading, failure diagnostics, abort behavior where applicable, repeated acquire/release, shared handle behavior, scope disposal, and no double-close on already released resources.
- Browser-facing smoke or Playwright coverage that uses a tiny deterministic image fixture and verifies lifecycle behavior without creating a WebGL renderer or Three.js texture.
- Package smoke coverage so the packed `@indirection/loaders-web` entrypoint exposes the image/bitmap loader contract.
- Docs covering source-of-truth boundaries, generated fixture policy, browser support assumptions, and how this phase differs from renderer E2E or Three texture work.
- Docs drift guards for the Phase 22 guide, ImageBitmap docs, package smoke keywords, validation commands, and final PASS report.
- A final `docs/phase-22-pass-report.md`.

Preferred implementation shape:

- Keep browser-specific logic in `@indirection/loaders-web`, browser tests, E2E fixtures, docs, or examples.
- Keep runtime core generic: it may execute `LoadedAsset.dispose`, but it must not import or name ImageBitmap, Blob, canvas, WebGL, document, window, Three, or renderer APIs.
- Prefer dependency injection for `createImageBitmap` and response/blob conversion so Node tests can use stubs.
- Use a tiny deterministic image fixture. Avoid screenshots, visual approval, or GPU assertions.
- If adding metadata, keep it read-only and adapter-owned, such as width/height/contentType/sourceUrl when safely available.
- Ensure generated outputs and E2E artifacts remain ignored and uncommitted.

## 4. Phase 22 Must Not Do

Do not:

- Add WebGL renderer E2E, Three renderer E2E, screenshot comparison, visual approval gates, or real WebGL scene smoke.
- Create Three.js `Texture` objects, attach textures to materials, attach scene objects, or add renderer/gameplay factories.
- Add a GPU memory estimator or claim precise GPU memory accounting.
- Add real Draco, KTX2, meshopt, transcoder, or texture compression dependencies.
- Add live Sinan Engine integration or `@indirection/sinan`.
- Put browser, DOM, ImageBitmap, Blob, canvas, WebGL, window, document, Three, renderer, or fetch adapter semantics into protocol/schema/compiler/runtime core.
- Run a real npm publish, npm login, npm whoami, npm access, npm token, npm owner, npm dist-tag, registry write, Git tag, tag push, GitHub Release, signing, Sigstore, npm provenance upload, package upload, release upload, OIDC publish, or workflow write permission.
- Deploy to GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, or any public artifact host.
- Remove `private: true` or change the `UNLICENSED` policy.
- Commit generated site output, image conversion scratch output, Playwright artifacts, traces, screenshots, videos, package tarballs, provenance output, RC JSON output, `dist/`, `.tsbuildinfo`, npm caches, or runtime caches.

## 5. Architecture Boundaries

Keep these boundaries:

- Protocol/schema/compiler remain renderer-neutral and browser-neutral.
- Runtime remains the owner of generic handle/scope/dispose sequencing, not image decode policy.
- `@indirection/loaders-web` owns browser image/bitmap loading and adapter-specific disposal helpers.
- Browser E2E may validate real browser lifecycle behavior, but it must not become renderer E2E.
- Three adapter docs may reference future texture work, but Phase 22 should not create Three texture APIs unless a minimal type/export is necessary for package smoke wording. Prefer not to change `@indirection/three`.
- Release and deployment gates remain no-publish and no-deploy.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 22.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing docs or docs drift guards:

```powershell
corepack pnpm check:docs
```

When changing loaders-web, runtime lifecycle tests, package smoke, or browser fixtures:

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:browser
corepack pnpm test:e2e
corepack pnpm check:boundaries
corepack pnpm pack:check
```

When changing examples or evaluator paths:

```powershell
corepack pnpm smoke:cli
corepack pnpm smoke:phase7
corepack pnpm smoke:site-demo
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
- Do not stage generated browser artifacts or generated site output.
- Do not stage `dist/`, `.tsbuildinfo`, `playwright-report/`, `test-results/`, traces, screenshots, videos, package tarballs, provenance output, RC JSON output, temporary consumers, release archives, image conversion scratch output, npm caches, or runtime caches.
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

- Can this image/bitmap behavior be explained by one tiny deterministic image fixture and one runtime acquire/release workflow?
- Can failures be localized to transport body handling, image decode injection, browser API availability, loader-web adapter code, runtime dispose sequencing, E2E fixture setup, or docs drift?
- Are success, decode failure, abort where applicable, repeated release, shared handles, scope disposal, and no double-close covered?
- Does browser coverage validate lifecycle behavior without relying on screenshots, renderer state, GPU memory, or WebGL scene output?
- Are generated outputs, traces, screenshots, package tarballs, temporary fixtures, and local artifacts kept out of git?

## 10. Architecture Self-Check

Every round must answer:

- Did protocol/schema/compiler/runtime core remain browser-neutral and renderer-neutral?
- Did `@indirection/loaders-web` own browser ImageBitmap concerns without duplicating runtime lifecycle semantics?
- Did the existing `LoadedAsset.dispose` contract remain the single generic disposal path?
- Did package smoke and docs describe adapter boundaries without implying public npm availability?
- Did the phase avoid real npm publish, deployment, live Sinan, real decoder dependencies, Three texture creation, renderer E2E, GPU memory estimation, and WebGL scene smoke?
- Were unrelated files and generated artifacts left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 22 guide and update README/docs index/release readiness/Phase 21 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit loaders-web, runtime lifecycle, browser E2E fixtures, package smoke, and current image/bitmap assumptions | `corepack pnpm test -- --run packages/loaders-web`, `git diff --check` |
| 3 | Design ImageBitmap loader contract, injected decode boundary, disposal shape, diagnostics, and tiny image fixture policy | `corepack pnpm check:docs` |
| 4 | Implement loaders-web image/bitmap loader API and Node/stub unit tests | `corepack pnpm typecheck`, `corepack pnpm test -- --run packages/loaders-web` |
| 5 | Integrate owned-resource disposal through runtime acquire/release tests without adding browser names to runtime core | `corepack pnpm test -- --run packages/runtime`, `corepack pnpm check:boundaries` |
| 6 | Add failure, abort where applicable, no double-close, shared handle, and scope disposal coverage | `corepack pnpm test` |
| 7 | Add browser smoke or Playwright fixture coverage using a tiny deterministic image | `corepack pnpm test:browser`, `corepack pnpm test:e2e` |
| 8 | Update package smoke so packed `@indirection/loaders-web` exposes the image/bitmap API | `corepack pnpm pack:check` |
| 9 | Document ImageBitmap lifecycle, browser support assumptions, fixture policy, and no-renderer boundary | `corepack pnpm check:docs` |
| 10 | Update evaluator/example docs only where they help explain local image/bitmap evaluation | `corepack pnpm smoke:phase7`, `corepack pnpm smoke:site-demo`, `corepack pnpm check:docs` |
| 11 | Add docs drift guards for Phase 22 docs, loader API keywords, package smoke, browser fixture, validation commands, and PASS report | `corepack pnpm check:docs`, `git diff --check` |
| 12 | Run full local quality gate and repair typing, docs, browser, pack, or boundary issues | `corepack pnpm validate:full` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 13 | Fix image fixture compatibility, browser API availability, or E2E flake | `corepack pnpm test:browser`, `corepack pnpm test:e2e` |
| 14 | Fix lifecycle semantics, double-dispose, shared handle, scope disposal, or package smoke issues | `corepack pnpm test`, `corepack pnpm pack:check`, `corepack pnpm check:boundaries` |
| 15 | Fix docs drift, generated artifact policy, no-renderer boundary, or release/no-publish gate alignment | `corepack pnpm check:docs`, `corepack pnpm release:rc-check`, `corepack pnpm publish:preflight`, `corepack pnpm validate:full` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 16 | Write `docs/phase-22-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 22 final PASS requires:

```powershell
corepack pnpm install --frozen-lockfile
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
corepack pnpm release:rc-check
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

If a new focused image/bitmap smoke command is added, it is also required here and in the PASS report.

## 13. PASS Criteria

Phase 22 PASS requires:

- `@indirection/loaders-web` exposes a documented image/bitmap loading contract.
- ImageBitmap or ImageBitmap-like owned resources are closed/disposed exactly once through runtime final release or scope disposal.
- Tests cover success, decode failure, fallback or diagnostic behavior where applicable, repeated release, shared handles, scope disposal, and no double-close behavior.
- Browser-facing validation uses a tiny deterministic image and does not create WebGL renderer state, Three textures, screenshot assertions, or visual approval gates.
- Runtime core remains free of ImageBitmap, Blob, canvas, WebGL, window, document, Three, renderer, or fetch adapter coupling.
- Package smoke covers the packed image/bitmap loader API.
- Docs cover ImageBitmap lifecycle, browser support assumptions, fixture policy, no-renderer boundary, no-publish/no-deploy boundary, and final PASS evidence.
- Docs drift guards cover Phase 22 guide, ImageBitmap docs, loader API keywords, package smoke, browser fixture, validation commands, changelog if changed, and PASS report.
- `validate:full`, `release:rc-check`, `release:ci-check`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No generated browser artifacts, screenshots, videos, package tarballs, provenance output, release archives, npm caches, Playwright artifacts, `dist/`, `.tsbuildinfo`, or image conversion scratch outputs are committed.
- No real npm publish, npm login, registry write, deploy, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, workflow write permission, package upload, live Sinan integration, real decoder dependency, Three texture creation, renderer E2E, GPU memory estimator, or WebGL scene smoke was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 22 Browser ImageBitmap And Texture Source Lifecycle PASS Report

## Goal

## Completion Status

## ImageBitmap Lifecycle Coverage

- loader-web API:
- decode boundary:
- owned-resource disposal:
- runtime lifecycle integration:
- browser fixture:
- package smoke:
- docs drift integration:

## Architecture Boundary Validation

- core neutrality:
- loaders-web ownership:
- renderer/WebGL boundary:
- generated artifact policy:
- no-publish/no-deploy boundary:
- deferred Sinan/decoder/renderer scope:

## Validation Commands And Results

- corepack pnpm install --frozen-lockfile:
- corepack pnpm lint:
- corepack pnpm format:
- corepack pnpm check:docs:
- corepack pnpm smoke:site-demo:
- corepack pnpm typecheck:
- corepack pnpm test:
- corepack pnpm test:browser:
- corepack pnpm test:e2e:
- corepack pnpm check:boundaries:
- corepack pnpm smoke:cli:
- corepack pnpm smoke:phase7:
- corepack pnpm pack:check:
- corepack pnpm release:rc-check:
- corepack pnpm release:ci-check:
- corepack pnpm release:provenance:
- corepack pnpm validate:full:
- corepack pnpm release:dry-run:
- corepack pnpm publish:preflight:
- git diff --check:

## Final Commit

## Push Result

## Unfinished / Follow-Up Items

## Risks And Recommendations
```

## 15. Candidate Phases After Phase 22

After Phase 22 passes, the planner may choose among:

- Real npm publish release candidate, only after owner decisions are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Real decoder package integration for Draco/KTX2/meshopt, only after dependency policy is accepted.
- Renderer or Three texture E2E, only after ImageBitmap lifecycle has passed and a dedicated renderer scope is approved.
- Public deployment phase, only if the owner explicitly approves a hosting target, deployment policy, artifact retention policy, and workflow permissions.
