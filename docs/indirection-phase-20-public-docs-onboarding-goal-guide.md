# Indirection Phase 20 Public Docs, Examples, And Consumer Onboarding Polish Goal Guide

Date: 2026-06-23
Status: execution guide for Phase 20
Upstream PASS: `docs/phase-19-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 20 in `D:\LabProjects\Engine\Indirection`.

Phase 19 has passed with final commit `84d3704 release: add phase 19 rc rehearsal gate`. Phase 20 is **Public Docs, Examples, And Consumer Onboarding Polish**.

The goal is to make the repository understandable and usable by a new technical evaluator without publishing packages. The project now has full validation, browser E2E, package smoke, release provenance, release dry-run, publish preflight, release CI policy parity, and a no-publish release-candidate rehearsal. Phase 20 should polish public-facing docs, quickstart paths, package entrypoint explanations, example workflows, and validation guidance so a consumer can evaluate Indirection from a local checkout.

Round budget: 16 rounds.

- Rounds 1-12: main implementation.
- Rounds 13-15: buffer fixes for docs drift, example smoke, command accuracy, package entrypoint explanation, release gate alignment, or onboarding gaps.
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
- `docs/phase-19-pass-report.md`
- `docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md`
- `docs/release-readiness.md`
- `docs/release-workflow.md`
- `docs/release-candidate-handoff.md`
- `docs/release-ci-policy.md`
- `docs/release-provenance.md`
- `docs/publish-preflight-policy.md`
- `docs/browser-e2e.md`
- `docs/runtime-lifecycle.md`
- `docs/three-gltf-adapter.md`
- `docs/compressed-capability-source-selection.md`
- `docs/report-json-shapes.md`
- `examples/phase7-advanced-loaders.mjs`
- `scripts/cli-smoke.mjs`
- `scripts/pack-check.mjs`
- `scripts/docs-drift-check.mjs`
- `package.json`

Phase 19 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm validate:full`: PASS, including 36 files and 128 tests plus Chromium, Firefox, and WebKit E2E
- `corepack pnpm release:rc-check`: PASS
- `corepack pnpm release:ci-check`: PASS
- `corepack pnpm release:provenance`: PASS
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 20 Is This Work

After Phase 19, the remaining candidates include:

- real npm publish release candidate;
- live Sinan Engine repository integration;
- real Draco/KTX2/meshopt decoder integration;
- texture/ImageBitmap lifecycle or renderer E2E;
- public docs, examples, and onboarding polish while real publish decisions remain blocked.

Real npm publish still requires owner decisions for package visibility, package names, npm account/scope, public license, versioning, tag policy, GitHub Release policy, provenance upload, signing, workflow permissions, package upload, release ownership, and rollback. Live Sinan still depends on a real host integration surface. Real decoder and renderer work should be dedicated adapter/host phases.

Phase 20 therefore chooses public docs and onboarding because it is in-repository, improves evaluator usability, and can proceed without granting any publish capability or external integration dependency.

## 3. Phase 20 Must Complete

Phase 20 must deliver:

- A clearer public-facing README path for what Indirection is, what is stable, what is still private/no-publish, and how to evaluate it locally.
- A quickstart or evaluator guide that walks through install, validation, CLI usage, package smoke, browser E2E, release gates, and example workflows from a fresh checkout.
- Package entrypoint documentation for the 9 workspace packages, including what each package owns, what it must not own, and how consumers should approach it before npm publish.
- Example workflow documentation that ties together manifest validation, catalog build/report/inspect, runtime loading, browser loaders, Vite virtual catalog usage, Three adapter parsing, compressed capability selection, lifecycle disposal, and release-candidate gates.
- Docs that explicitly explain the current no-publish posture and link to release candidate handoff blockers without confusing evaluator onboarding with permission to publish.
- If examples or smoke scripts are adjusted, ensure they remain deterministic, fast, and covered by existing validation or a new documented smoke command.
- Docs drift guards for the Phase 20 guide, quickstart/evaluator docs, package entrypoint docs, example docs, validation commands, no-publish warnings, changelog, and Phase 20 PASS report.
- A final `docs/phase-20-pass-report.md`.

Preferred implementation shape:

- Prefer documentation and small example/smoke improvements over new runtime features.
- Keep docs truthful to real commands; do not invent npm install instructions for unpublished packages.
- Use workspace/local checkout commands such as `corepack pnpm install --frozen-lockfile`, `corepack pnpm validate:full`, `corepack pnpm smoke:cli`, `corepack pnpm smoke:phase7`, `corepack pnpm pack:check`, and release gates.
- Keep sample code short and tied to existing package APIs or existing examples.
- If adding a new docs page, prefer `docs/evaluator-quickstart.md` or `docs/public-onboarding.md`.
- Keep generated outputs out of git; hand-author examples and report shapes.

## 4. Phase 20 Must Not Do

Do not:

- Run a real npm publish.
- Run npm login, npm token checks, npm whoami, npm access, npm owner, npm dist-tag, or registry writes.
- Remove `private: true` or change the `UNLICENSED` policy.
- Create Git tags, push tags, or create GitHub Releases.
- Add a real publishing workflow, release upload workflow, package upload workflow, package signing workflow, OIDC publish workflow, Sigstore signing, npm `--provenance`, or npm provenance upload.
- Add GitHub Actions write permissions such as `contents: write`, `packages: write`, `id-token: write`, or any workflow secret requirement for release gates.
- Add live Sinan Engine integration, `@indirection/sinan`, real decoder dependencies, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, or WebGL scene smoke.
- Turn docs polish into new runtime semantics or move docs/onboarding concerns into protocol/schema/compiler/runtime core.
- Commit generated RC JSON, provenance output, package tarballs, release archives, npm caches, `dist/`, `.tsbuildinfo`, Playwright artifacts, traces, screenshots, videos, or workflow run output.

## 5. Architecture Boundaries

Keep these boundaries:

- Public onboarding is documentation and example/smoke support, not runtime behavior.
- The repository remains no-publish until owner decisions are accepted.
- Local commands remain the semantic source of truth for evaluation and release readiness.
- Core packages must not absorb docs-only release or onboarding state.
- Host-specific integration remains in docs, fixtures, examples, tests, or adapters; Sinan-specific live integration remains out of scope.
- Advanced adapter topics must explain boundaries instead of duplicating protocol/schema/compiler/runtime semantics.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 20.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing docs or docs drift guards:

```powershell
corepack pnpm check:docs
```

When changing examples, smoke scripts, or package-facing sample code:

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm smoke:cli
corepack pnpm smoke:phase7
corepack pnpm pack:check
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
- Do not stage `dist/`, `.tsbuildinfo`, `playwright-report/`, `test-results/`, traces, screenshots, videos, package tarballs, provenance output, RC JSON output, workflow run output, temporary consumers, release archives, npm caches, or runtime caches.
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

- Can this onboarding behavior be explained by one evaluator workflow, one package entrypoint, or one example?
- Can failures be localized to docs drift, command accuracy, sample code, package entrypoint docs, release gate docs, example smoke, or no-publish messaging?
- Do docs avoid claiming unpublished packages are available from npm?
- Do quickstart commands work from a fresh checkout without secrets or external publish permissions?
- Are generated outputs, local paths, timestamps, tokens, and machine-specific artifacts kept out of docs and git?

## 10. Architecture Self-Check

Every round must answer:

- Did onboarding stay in docs, examples, tests, or smoke support?
- Did protocol/schema/compiler/runtime remain free of docs-only or publish-decision state?
- Did package ownership boundaries remain clear and not duplicate core semantics in adapter docs?
- Did the phase keep no-publish blockers visible instead of hiding them behind marketing language?
- Did the phase avoid real npm publish, live Sinan, real decoder integration, texture pipeline, renderer E2E, and GitHub Release work?
- Were unrelated files and generated artifacts left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 20 guide and update README/docs index/release readiness/Phase 19 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit current public docs, examples, package scripts, CLI smoke, package smoke, and release handoff docs | `corepack pnpm check:docs`, `git diff --check` |
| 3 | Design evaluator quickstart and package entrypoint documentation structure | `corepack pnpm check:docs` |
| 4 | Update README with concise positioning, no-publish warning, local evaluation path, and document map | `corepack pnpm check:docs`, `git diff --check` |
| 5 | Add or refine evaluator quickstart docs for install, validate, CLI, package smoke, browser E2E, and release gates | `corepack pnpm check:docs` |
| 6 | Add package entrypoint docs for all 9 workspace packages and their ownership boundaries | `corepack pnpm check:docs` |
| 7 | Add or refine example workflow docs for manifest/catalog/CLI/runtime/browser/Vite/Three/capability/lifecycle flows | `corepack pnpm check:docs`, `corepack pnpm smoke:phase7` |
| 8 | Verify sample commands and, if needed, adjust existing examples or smoke scripts without broad feature work | `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm smoke:cli`, `corepack pnpm smoke:phase7` |
| 9 | Align release candidate handoff, release readiness, release workflow, and publish preflight docs with onboarding docs | `corepack pnpm check:docs` |
| 10 | Add docs drift guards for Phase 20 docs, quickstart, package entrypoints, examples, commands, changelog, and planned PASS report | `corepack pnpm check:docs`, `git diff --check` |
| 11 | Run package and release gates and repair command/documentation mismatches | `corepack pnpm pack:check`, `corepack pnpm release:rc-check`, `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |
| 12 | Run full local quality gate and repair typing, docs, pack, browser, or boundary issues | `corepack pnpm validate:full` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 13 | Fix docs drift, quickstart command accuracy, or package entrypoint docs | `corepack pnpm check:docs`, `git diff --check` |
| 14 | Fix example smoke, package smoke, or sample-code issues | `corepack pnpm test`, `corepack pnpm smoke:cli`, `corepack pnpm smoke:phase7`, `corepack pnpm pack:check` |
| 15 | Fix release gate alignment, no-publish messaging, generated-artifact, or CI parity issues | `corepack pnpm release:rc-check`, `corepack pnpm release:ci-check`, `corepack pnpm publish:preflight`, `corepack pnpm validate:full` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 16 | Write `docs/phase-20-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 20 final PASS requires:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm format
corepack pnpm check:docs
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

If a new onboarding smoke command is added, it is also required here and in the PASS report.

## 13. PASS Criteria

Phase 20 PASS requires:

- README and docs index give a clear evaluator path without implying npm publication.
- A quickstart or evaluator guide exists and uses truthful local checkout commands.
- Package entrypoint docs cover all 9 workspace packages and their ownership boundaries.
- Example workflow docs cover manifest/catalog/CLI/runtime/browser/Vite/Three/capability/lifecycle/release-candidate evaluation paths.
- No-publish posture and owner decision blockers remain visible and linked.
- Any changed examples or smoke scripts are deterministic and covered by validation.
- Docs drift guards cover Phase 20 guide, quickstart/evaluator docs, package docs, example docs, validation commands, no-publish posture, changelog, and PASS report.
- `validate:full`, `release:rc-check`, `release:ci-check`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No generated RC output, tarballs, provenance output, release archives, npm caches, Playwright artifacts, `dist/`, or `.tsbuildinfo` are committed.
- No real npm publish, npm login, registry write, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, workflow write permission, package upload, live Sinan integration, real decoder dependency, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, or WebGL scene smoke was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 20 Public Docs, Examples, And Consumer Onboarding Polish PASS Report

## Goal

## Completion Status

## Onboarding Coverage

- README evaluator path:
- quickstart / evaluator guide:
- package entrypoint docs:
- example workflow docs:
- no-publish and owner-decision messaging:
- docs drift integration:

## Architecture Boundary Validation

- docs/examples boundary:
- core package boundary:
- no-publish boundary:
- generated artifact policy:
- deferred publish/Sinan/decoder/renderer scope:

## Validation Commands And Results

- corepack pnpm install --frozen-lockfile:
- corepack pnpm lint:
- corepack pnpm format:
- corepack pnpm check:docs:
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

## 15. Candidate Phases After Phase 20

After Phase 20 passes, the planner may choose among:

- Real npm publish release candidate, only after owner decisions are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Real decoder package integration for Draco/KTX2/meshopt, only after dependency policy is accepted.
- Texture/ImageBitmap lifecycle or renderer E2E, only as a dedicated adapter/host phase.
- Public website/demo packaging or docs site work if publication decisions remain blocked.
