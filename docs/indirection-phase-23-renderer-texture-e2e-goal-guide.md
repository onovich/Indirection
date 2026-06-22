# Indirection Phase 23 Renderer And Three Texture E2E Goal Guide

Date: 2026-06-23
Status: execution guide for Phase 23
Upstream PASS: `docs/phase-22-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 23 in `D:\LabProjects\Engine\Indirection`.

Phase 22 has passed with final commit `a5e5b37 feat: add phase 22 image bitmap lifecycle`. Phase 23 is **Renderer And Three Texture E2E**.

The goal is to add a bounded, local, browser-backed renderer/Three texture E2E proof that an Indirection-managed image source can become a host-owned Three texture or material input, render through a tiny WebGL scene, and release owned resources through the existing runtime lifecycle. This phase should prove the adapter boundary, not build a general renderer framework.

Round budget: 18 rounds.

- Rounds 1-13: main implementation.
- Rounds 14-17: buffer fixes for WebGL availability, browser matrix stability, texture disposal semantics, package smoke, docs drift, or boundary guard issues.
- Round 18: final validation, commit, push, and PASS report.

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
- `docs/phase-22-pass-report.md`
- `docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md`
- `docs/image-bitmap-lifecycle.md`
- `docs/runtime-lifecycle.md`
- `docs/browser-e2e.md`
- `docs/three-gltf-adapter.md`
- `docs/evaluator-quickstart.md`
- `docs/package-entrypoints.md`
- `docs/example-workflows.md`
- `docs/release-readiness.md`
- `packages/loaders-web/src/index.ts`
- `packages/loaders-web/test`
- `packages/three/src/index.ts`
- `packages/three/test`
- `packages/runtime/src/index.ts`
- `packages/runtime/test`
- `tests/e2e/fixtures/minimal-app.js`
- `tests/e2e/browser-fixture.e2e.ts`
- `playwright.config.ts`
- `scripts/browser-smoke.mjs`
- `scripts/pack-check.mjs`
- `scripts/docs-drift-check.mjs`
- `package.json`

Phase 22 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm test -- --run packages/loaders-web`: PASS
- `corepack pnpm test:browser`: PASS
- `corepack pnpm test:e2e:chromium`: PASS
- `corepack pnpm check:docs`: PASS
- `corepack pnpm test:e2e`: PASS, Chromium/Firefox/WebKit
- `corepack pnpm pack:check`: PASS
- `corepack pnpm typecheck`: PASS
- `corepack pnpm validate:full`: PASS
- `corepack pnpm release:rc-check`: PASS
- `corepack pnpm release:ci-check`: PASS
- `corepack pnpm release:provenance`: PASS
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 23 Is This Work

After Phase 22, the project has a browser ImageBitmap lifecycle boundary, but it still lacks a bounded proof that image-source assets can reach a real renderer path without leaking browser, WebGL, or Three.js details into core packages.

The other candidate phases are now blocked by explicit decisions:

- Real npm publish requires owner decisions for package names, visibility, license, npm account/scope, versioning, tags, GitHub Releases, provenance upload, signing, workflow permissions, and rollback ownership.
- Live Sinan Engine integration requires an available real Sinan host integration surface.
- Real Draco/KTX2/meshopt decoder package integration requires dependency and ownership policy decisions.
- Public deployment requires a hosting target, deployment permissions, retention policy, and owner approval.

Phase 23 therefore chooses Renderer And Three Texture E2E because it is the last meaningful in-repository candidate that can proceed before those external or owner strategy decisions. It builds directly on Phase 22 and remains narrow: local browser E2E, Three adapter/test boundary, tiny deterministic image fixture, and no production renderer abstraction.

## 3. Phase 23 Must Complete

Phase 23 must deliver:

- A documented local renderer/Three texture E2E contract showing how an Indirection-loaded image source can be adapted into a host-owned Three texture or material input.
- Browser E2E coverage that renders a tiny deterministic image through a minimal WebGL/Three scene and verifies a structural, deterministic result.
- Lifecycle coverage proving host-owned Three texture/material/geometry/renderer resources are disposed through the existing runtime `LoadedAsset.dispose` and `AssetScope.dispose` paths where they are Indirection-owned.
- A Three-side helper only if it keeps renderer ownership host-injected and adapter-local. The helper may create or dispose texture-like resources, but it must not move renderer semantics into runtime core.
- Browser diagnostics that record renderer availability, texture dimensions, resource disposal counts, and a small deterministic render result. Prefer numeric/canvas-pixel probes over screenshots.
- Package smoke coverage if new `@indirection/three` or `@indirection/loaders-web` exports are added.
- Docs explaining the boundary between ImageBitmap lifecycle, Three texture creation, renderer E2E, and later production renderer integration.
- Docs drift guards for the Phase 23 guide, renderer/texture docs, package smoke keywords if exports changed, browser fixture keywords, validation commands, and final PASS report.
- A final `docs/phase-23-pass-report.md`.

Preferred implementation shape:

- Keep browser and renderer work in `tests/e2e`, adapter packages, tests, docs, examples, or package smoke.
- Use the existing `createImageBitmapLoader` and runtime lifecycle instead of duplicating image decode or handle/scope semantics.
- Keep `@indirection/three` optional-peer and host-injected. Three may remain a dev/test dependency and optional peer, not a required runtime core dependency.
- If a helper is added, make it small and explicit, such as `createThreeTextureFromImageBitmap` or a host-injected renderer fixture helper. Avoid a general scene manager.
- Use one tiny deterministic image fixture and one tiny deterministic scene.
- Keep assertions structural and deterministic: canvas dimensions, sampled pixel value, resource dispose counters, runtime snapshot states, and browser diagnostics. Do not add screenshot approval as a required gate.
- Ensure generated outputs and E2E artifacts remain ignored and uncommitted.

## 4. Phase 23 Must Not Do

Do not:

- Add real Draco, KTX2, meshopt, transcoder, or texture compression dependencies.
- Add live Sinan Engine integration or `@indirection/sinan`.
- Build a general renderer framework, scene graph bridge, gameplay object factory, material pipeline, postprocessing pipeline, or editor viewport.
- Add GPU memory estimation or claim precise GPU memory accounting.
- Add screenshot comparison, visual approval, golden image review, or hosted preview as a required gate.
- Put browser, DOM, ImageBitmap, Blob, canvas, WebGL, WebGPU, window, document, Three, renderer, material, geometry, or texture semantics into protocol/schema/compiler/runtime core.
- Make Three.js a dependency of protocol, schema, compiler, runtime, loaders-web, Vite, CLI, or testkit core packages.
- Run or add a real npm publish, npm login, npm whoami, npm access, npm token, npm owner, npm dist-tag, registry write, Git tag, tag push, GitHub Release, signing, Sigstore, npm provenance upload, package upload, release upload, OIDC publish, or workflow write permission.
- Deploy to GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, or any public artifact host.
- Remove `private: true` or change the `UNLICENSED` policy.
- Commit generated site output, Playwright artifacts, traces, screenshots, videos, package tarballs, provenance output, RC JSON output, `dist/`, `.tsbuildinfo`, npm caches, runtime caches, or renderer scratch output.

## 5. Architecture Boundaries

Keep these boundaries:

- Protocol/schema/compiler remain renderer-neutral and browser-neutral.
- Runtime owns only generic handle/scope/dispose sequencing and must not import or name Three, WebGL, canvas, Texture, Material, Geometry, Renderer, ImageBitmap, Blob, window, or document APIs.
- `@indirection/loaders-web` owns browser image/bitmap loading and ImageBitmap disposal boundaries.
- `@indirection/three` may own tiny adapter helpers for Three texture/resource lifecycle, but renderer creation and scene setup should remain host/test-fixture-owned.
- Browser E2E may use DOM, WebGL, canvas, and Three as test/host boundaries only.
- Release and deployment gates remain no-publish and no-deploy.
- Decoder and Sinan integration remain deferred until decisions are made.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 23.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing docs or docs drift guards:

```powershell
corepack pnpm check:docs
```

When changing runtime, loaders-web, Three adapter, package smoke, or browser fixtures:

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
- Do not stage generated browser artifacts, generated site output, renderer scratch output, or generated fixture output.
- Do not stage `dist/`, `.tsbuildinfo`, `playwright-report/`, `test-results/`, traces, screenshots, videos, package tarballs, provenance output, RC JSON output, temporary consumers, release archives, npm caches, or runtime caches.
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

- Can this renderer/texture behavior be explained by one tiny deterministic image fixture, one runtime acquire/release workflow, and one tiny scene?
- Can failures be localized to image decode, runtime lifecycle, Three texture creation, renderer setup, WebGL availability, browser matrix, E2E fixture setup, package smoke, or docs drift?
- Are success, missing WebGL support diagnostics, texture/resource disposal, repeated release, scope disposal, and no double-dispose covered?
- Does browser coverage validate a deterministic structural render result without relying on screenshot approval or GPU memory claims?
- Are generated outputs, traces, screenshots, package tarballs, temporary fixtures, and local artifacts kept out of git?

## 10. Architecture Self-Check

Every round must answer:

- Did protocol/schema/compiler/runtime core remain browser-neutral and renderer-neutral?
- Did `@indirection/loaders-web` continue to own ImageBitmap loading rather than renderer or Three semantics?
- Did `@indirection/three` avoid owning a production renderer framework?
- Did host/test-fixture code avoid duplicating runtime lifecycle, source selection, or loader semantics?
- Did the phase avoid real decoder dependencies, live Sinan integration, public deployment, real npm publish, and release workflow permission changes?
- Were unrelated files and generated artifacts left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 23 guide and update README/docs index/release readiness/Phase 22 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit Phase 22 ImageBitmap loader, Three adapter lifecycle helpers, browser E2E fixture, and package smoke | `corepack pnpm test -- --run packages/three`, `corepack pnpm test:e2e:chromium`, `git diff --check` |
| 3 | Design the renderer/texture E2E fixture contract, diagnostics shape, lifecycle ownership, and WebGL availability fallback | `corepack pnpm check:docs` |
| 4 | Add minimal Three texture/resource helper or test fixture helper with host-injected ownership | `corepack pnpm typecheck`, `corepack pnpm test -- --run packages/three` |
| 5 | Connect ImageBitmap-loaded resource to Three texture/material setup in browser fixture | `corepack pnpm test:e2e:chromium` |
| 6 | Add deterministic render probe with canvas dimensions and sampled pixel or equivalent structural assertion | `corepack pnpm test:e2e:chromium` |
| 7 | Add lifecycle/disposal coverage for texture/material/geometry/renderer resources and runtime scope disposal | `corepack pnpm test`, `corepack pnpm test:e2e:chromium` |
| 8 | Expand browser matrix coverage and stabilize Firefox/WebKit behavior or explicit WebGL diagnostics | `corepack pnpm test:e2e` |
| 9 | Update package smoke if new adapter exports are added | `corepack pnpm pack:check` |
| 10 | Document renderer/texture E2E boundary and how it differs from Phase 22 ImageBitmap lifecycle and future production renderer work | `corepack pnpm check:docs` |
| 11 | Update evaluator/example/release readiness docs only where they help explain the local renderer E2E path | `corepack pnpm smoke:site-demo`, `corepack pnpm check:docs` |
| 12 | Add docs drift guards for Phase 23 guide/docs/browser fixture/package smoke/validation commands/PASS report | `corepack pnpm check:docs`, `git diff --check` |
| 13 | Run full local quality gate and repair typing, docs, browser, pack, or boundary issues | `corepack pnpm validate:full` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 14 | Fix WebGL availability, browser matrix, or E2E fixture flake | `corepack pnpm test:e2e:chromium`, `corepack pnpm test:e2e` |
| 15 | Fix texture/resource lifecycle, disposal counters, repeated release, or scope disposal issues | `corepack pnpm test`, `corepack pnpm test:e2e` |
| 16 | Fix package smoke, adapter export shape, or boundary guard issues | `corepack pnpm pack:check`, `corepack pnpm check:boundaries`, `corepack pnpm typecheck` |
| 17 | Fix docs drift, generated artifact policy, no-publish/no-deploy wording, or release gate alignment | `corepack pnpm check:docs`, `corepack pnpm release:rc-check`, `corepack pnpm publish:preflight`, `corepack pnpm validate:full` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 18 | Write `docs/phase-23-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 23 final PASS requires:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm format
corepack pnpm check:docs
corepack pnpm smoke:site-demo
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:browser
corepack pnpm test:e2e:chromium
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

If a new focused renderer smoke command is added, it is also required here and in the PASS report.

## 13. PASS Criteria

Phase 23 PASS requires:

- Browser E2E proves an Indirection-managed image source can become a host-owned Three texture or material input and render in a tiny deterministic WebGL scene.
- Runtime final release or `AssetScope.dispose` disposes owned texture/material/geometry/renderer resources exactly once when those resources are attached to an Indirection-loaded asset.
- Browser diagnostics record renderer availability, deterministic render evidence, texture/image dimensions, disposal counters, and runtime snapshot states.
- Chromium, Firefox, and WebKit E2E pass, or any browser-specific WebGL limitation is explicitly represented as a deterministic diagnostic and approved by the phase docs and tests.
- Protocol/schema/compiler/runtime core remain free of browser, DOM, ImageBitmap, Blob, canvas, WebGL, WebGPU, Three, Texture, Material, Geometry, Renderer, window, or document coupling.
- `@indirection/three` remains optional-peer and adapter-local; no core package gains a Three dependency.
- Package smoke covers any newly exported renderer/texture helper.
- Docs cover the renderer/texture E2E boundary, generated artifact policy, no-publish/no-deploy boundary, and final PASS evidence.
- Docs drift guards cover Phase 23 guide, renderer/texture docs, browser fixture keywords, package smoke if changed, validation commands, changelog if changed, and PASS report.
- `validate:full`, `release:rc-check`, `release:ci-check`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No generated browser artifacts, screenshots, videos, package tarballs, provenance output, release archives, npm caches, Playwright artifacts, `dist/`, `.tsbuildinfo`, or renderer scratch outputs are committed.
- No real npm publish, npm login, registry write, deploy, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, workflow write permission, package upload, live Sinan integration, real decoder dependency, production renderer framework, GPU memory estimator, or public hosting was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 23 Renderer And Three Texture E2E PASS Report

## Goal

## Completion Status

## Renderer / Texture E2E Coverage

- browser fixture:
- image source:
- Three texture/material path:
- deterministic render evidence:
- lifecycle disposal:
- package smoke:
- docs drift integration:

## Architecture Boundary Validation

- core neutrality:
- loaders-web ownership:
- Three adapter ownership:
- renderer fixture ownership:
- generated artifact policy:
- no-publish/no-deploy boundary:
- deferred Sinan/decoder/publish/deploy scope:

## Validation Commands And Results

- corepack pnpm install --frozen-lockfile:
- corepack pnpm lint:
- corepack pnpm format:
- corepack pnpm check:docs:
- corepack pnpm smoke:site-demo:
- corepack pnpm typecheck:
- corepack pnpm test:
- corepack pnpm test:browser:
- corepack pnpm test:e2e:chromium:
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

## 15. Candidate Phases After Phase 23

After Phase 23 passes, the planner should stop automatic internal execution unless one of these owner or external decisions is accepted:

- Real decoder package integration for Draco/KTX2/meshopt, only after dependency ownership, optional peer/dev dependency policy, fixture policy, and validation-gate policy are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Real npm publish release candidate, only after owner decisions are accepted.
- Public deployment phase, only if the owner explicitly approves a hosting target, deployment policy, artifact retention policy, and workflow permissions.

Recommended default after Phase 23: freeze the internal candidate pool, keep `validate:full` and release-readiness gates green, and ask the owner to decide the Phase 24 strategy before dispatching more executor work.
