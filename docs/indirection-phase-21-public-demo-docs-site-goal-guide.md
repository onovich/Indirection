# Indirection Phase 21 Public Website, Demo Packaging, And Docs Site Rehearsal Goal Guide

Date: 2026-06-23
Status: execution guide for Phase 21
Upstream PASS: `docs/phase-20-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 21 in `D:\LabProjects\Engine\Indirection`.

Phase 20 has passed with final commit `9e3ed71 docs: add phase 20 evaluator onboarding`. Phase 21 is **Public Website, Demo Packaging, And Docs Site Rehearsal**.

The goal is to create a local, deterministic public-facing docs/demo rehearsal that makes Indirection easier to evaluate without deploying anything. Use the Phase 20 evaluator quickstart, package entrypoints, and example workflows as source material, then add a packageable or previewable local site/demo path that can be validated from the repository. This phase must improve external evaluation readiness while preserving the current no-publish and no-deploy posture.

Round budget: 16 rounds.

- Rounds 1-12: main implementation.
- Rounds 13-15: buffer fixes for docs drift, build/preview smoke, command accuracy, generated artifact policy, static asset packaging, or no-deploy boundary issues.
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
- `docs/phase-20-pass-report.md`
- `docs/indirection-phase-20-public-docs-onboarding-goal-guide.md`
- `docs/evaluator-quickstart.md`
- `docs/package-entrypoints.md`
- `docs/example-workflows.md`
- `docs/release-readiness.md`
- `docs/release-candidate-handoff.md`
- `docs/release-workflow.md`
- `docs/release-ci-policy.md`
- `docs/release-provenance.md`
- `docs/publish-preflight-policy.md`
- `docs/browser-e2e.md`
- `docs/runtime-lifecycle.md`
- `docs/three-gltf-adapter.md`
- `docs/compressed-capability-source-selection.md`
- `examples/phase7-advanced-loaders.mjs`
- `scripts/cli-smoke.mjs`
- `scripts/pack-check.mjs`
- `scripts/docs-drift-check.mjs`
- `package.json`

Phase 20 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm validate:full`: PASS, including 36 files and 128 tests plus Chromium, Firefox, and WebKit E2E
- `corepack pnpm release:rc-check`: PASS, 9 package candidates / 13 owner decision blockers / 19 blocked real-publish actions
- `corepack pnpm release:ci-check`: PASS
- `corepack pnpm release:provenance`: PASS
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 21 Is This Work

After Phase 20, the remaining candidates include:

- real npm publish release candidate;
- live Sinan Engine repository integration;
- real Draco/KTX2/meshopt decoder integration;
- texture/ImageBitmap lifecycle or renderer E2E;
- public website/demo packaging or docs site work while publication decisions remain blocked.

Real npm publish still requires owner approval for package visibility, names, npm account/scope, public license, versioning, tag policy, GitHub Release policy, provenance upload, signing, workflow permissions, package upload, release ownership, and rollback. Live Sinan still depends on a real host integration surface. Real decoder and renderer work need dedicated adapter/host phases.

Phase 21 therefore chooses local public website/demo packaging and docs site rehearsal because it can improve evaluator experience inside the repository without granting deploy, publish, registry, tag, or release authority.

## 3. Phase 21 Must Complete

Phase 21 must deliver:

- A local public website/docs-site/demo packaging plan or implementation that can be built, previewed, or smoke-tested from a clean checkout without external secrets.
- A clear entrypoint for evaluators that ties together the README, evaluator quickstart, package entrypoints, example workflows, and release-readiness gates.
- A local static output or preview workflow that is deterministic, documented, and keeps generated artifacts out of git.
- If a site/demo build command is added, package scripts and docs must explain exactly what it does, what it does not do, and how to clean up generated outputs.
- If no new build tooling is justified, add a documented rehearsal path and smoke script that verifies the public docs/demo package can be assembled locally.
- A no-deploy policy that explicitly states Phase 21 does not deploy to GitHub Pages, Vercel, Netlify, custom hosting, or any public artifact host.
- Docs drift guards for the Phase 21 guide, public docs/demo rehearsal entrypoint, no-deploy policy, generated artifact policy, validation commands, and final PASS report.
- A final `docs/phase-21-pass-report.md`.

Preferred implementation shape:

- Prefer a small deterministic local site/demo package over broad product work.
- Reuse current docs and examples as source material; do not duplicate large documentation bodies into generated code.
- Prefer static HTML/Markdown assembly, scriptable checks, or existing Node tooling already present in the repository.
- Keep new dependencies minimal and justified. If a dependency is needed, explain why existing tooling is insufficient.
- Keep local output directories ignored or transient. Do not commit generated site output unless it is intentionally hand-authored source.
- Keep Phase 21 focused on local evaluator presentation, not marketing copy, real deployment, or runtime feature work.

## 4. Phase 21 Must Not Do

Do not:

- Deploy to GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, or any public artifact host.
- Add deployment secrets, deployment tokens, or hosted preview configuration.
- Add GitHub Actions write permissions such as `contents: write`, `pages: write`, `id-token: write`, `packages: write`, or deployment environments.
- Run a real npm publish.
- Run npm login, npm token checks, npm whoami, npm access, npm owner, npm dist-tag, or registry writes.
- Remove `private: true` or change the `UNLICENSED` policy.
- Create Git tags, push tags, or create GitHub Releases.
- Add a real publishing workflow, release upload workflow, package upload workflow, package signing workflow, OIDC publish workflow, Sigstore signing, npm `--provenance`, or npm provenance upload.
- Add live Sinan Engine integration, `@indirection/sinan`, real decoder dependencies, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, or WebGL scene smoke.
- Turn docs/demo packaging into new protocol/schema/compiler/runtime semantics.
- Commit generated site output, release archives, package tarballs, temporary consumers, npm caches, `dist/`, `.tsbuildinfo`, Playwright artifacts, traces, screenshots, videos, provenance output, RC JSON output, or workflow run output.

## 5. Architecture Boundaries

Keep these boundaries:

- Public website/demo rehearsal is presentation and local evaluation support, not runtime behavior.
- Source docs remain the source of truth; generated or packaged site/demo material must not become a parallel source of truth.
- The repository remains no-publish and no-deploy until owner decisions explicitly change that policy.
- Core packages must not absorb website, deployment, release, or marketing state.
- Host-specific integrations remain docs, fixtures, examples, tests, or adapters; live Sinan integration remains out of scope.
- Local commands remain the semantic source of truth for validation and release readiness.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 21.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing docs or docs drift guards:

```powershell
corepack pnpm check:docs
```

When changing scripts, package scripts, local site/demo assembly, or smoke logic:

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm check:docs
```

When touching package-facing examples or evaluation flows:

```powershell
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
- Do not stage generated site output unless the file is intentionally hand-authored source.
- Do not stage `dist/`, `.tsbuildinfo`, `playwright-report/`, `test-results/`, traces, screenshots, videos, package tarballs, provenance output, RC JSON output, temporary consumers, release archives, npm caches, deployment output, or runtime caches.
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

- Can this website/docs/demo rehearsal behavior be explained by one evaluator workflow?
- Can failures be localized to docs drift, command accuracy, static assembly, smoke script, generated artifact policy, package script wiring, or no-deploy messaging?
- Does the local preview/build path work from a clean checkout without secrets, deployment tokens, npm credentials, registry access, or hosted infrastructure?
- Are generated outputs, local paths, timestamps, tokens, and machine-specific artifacts kept out of docs and git?
- If new tooling is introduced, is the failure mode obvious and covered by a local command?

## 10. Architecture Self-Check

Every round must answer:

- Did public presentation stay in docs, examples, tests, scripts, or local static/demo source?
- Did protocol/schema/compiler/runtime remain free of website, deployment, or publish-decision state?
- Did package ownership boundaries remain clear and avoid duplicating core semantics in generated site/demo material?
- Did the phase keep no-publish and no-deploy blockers visible?
- Did the phase avoid real npm publish, live Sinan, real decoder integration, texture pipeline, renderer E2E, and GitHub Release work?
- Were unrelated files and generated artifacts left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 21 guide and update README/docs index/release readiness/Phase 20 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit current evaluator docs, examples, package scripts, ignored artifact policy, and public presentation gaps | `corepack pnpm check:docs`, `git diff --check` |
| 3 | Decide the smallest local site/demo rehearsal shape and document source-of-truth boundaries | `corepack pnpm check:docs` |
| 4 | Add or update local public docs/demo source entrypoint without generating committed output | `corepack pnpm check:docs`, `git diff --check` |
| 5 | Add deterministic local build/assembly or smoke command if justified | `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm check:docs` |
| 6 | Document preview/build/smoke usage and generated artifact cleanup policy | `corepack pnpm check:docs` |
| 7 | Tie the public rehearsal path into evaluator quickstart, package entrypoints, and example workflows | `corepack pnpm check:docs`, `corepack pnpm smoke:phase7` |
| 8 | Add or refine no-deploy/no-publish docs and release-readiness handoff language | `corepack pnpm check:docs` |
| 9 | Add docs drift guards for Phase 21 guide, public demo/site entrypoints, commands, no-deploy policy, and PASS report | `corepack pnpm check:docs`, `git diff --check` |
| 10 | Run local evaluation and repair command/documentation mismatches | `corepack pnpm smoke:cli`, `corepack pnpm smoke:phase7`, `corepack pnpm pack:check` |
| 11 | Run release/no-publish gates and repair any policy drift | `corepack pnpm release:rc-check`, `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |
| 12 | Run full local quality gate and repair typing, docs, pack, browser, or boundary issues | `corepack pnpm validate:full` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 13 | Fix docs drift, public entrypoint links, command accuracy, or generated artifact wording | `corepack pnpm check:docs`, `git diff --check` |
| 14 | Fix local site/demo assembly, smoke command, or package script issues | `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm smoke:cli`, `corepack pnpm smoke:phase7` |
| 15 | Fix no-deploy/no-publish policy, release gate alignment, or boundary guard issues | `corepack pnpm release:rc-check`, `corepack pnpm release:ci-check`, `corepack pnpm publish:preflight`, `corepack pnpm validate:full` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 16 | Write `docs/phase-21-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 21 final PASS requires:

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

If a new local site/demo smoke command is added, it is also required here and in the PASS report.

## 13. PASS Criteria

Phase 21 PASS requires:

- A local public website/docs-site/demo rehearsal path exists and is discoverable from README and docs index.
- The path can be built, previewed, assembled, or smoke-tested from a clean checkout without secrets or hosted infrastructure.
- Docs clearly state that Phase 21 does not deploy to GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, or any public artifact host.
- Docs clearly state that Phase 21 does not grant npm publish, tag, GitHub Release, signing, OIDC, or workflow write permission.
- Generated output policy is documented and enforced by existing ignore/drift/smoke checks as appropriate.
- Source-of-truth docs remain canonical; generated or packaged site/demo material does not fork project semantics.
- Docs drift guards cover Phase 21 guide, public demo/site rehearsal entrypoint, validation commands, no-deploy policy, generated artifact policy, changelog if changed, and PASS report.
- `validate:full`, `release:rc-check`, `release:ci-check`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No generated site output, package tarballs, provenance output, release archives, npm caches, Playwright artifacts, `dist/`, or `.tsbuildinfo` are committed.
- No real npm publish, npm login, registry write, deploy, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, workflow write permission, package upload, live Sinan integration, real decoder dependency, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, or WebGL scene smoke was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 21 Public Website, Demo Packaging, And Docs Site Rehearsal PASS Report

## Goal

## Completion Status

## Public Rehearsal Coverage

- local site/demo entrypoint:
- build/preview/smoke command:
- evaluator docs integration:
- generated artifact policy:
- no-deploy/no-publish messaging:
- docs drift integration:

## Architecture Boundary Validation

- presentation boundary:
- source-of-truth docs boundary:
- core package boundary:
- no-deploy boundary:
- no-publish boundary:
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

## 15. Candidate Phases After Phase 21

After Phase 21 passes, the planner may choose among:

- Real npm publish release candidate, only after owner decisions are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Real decoder package integration for Draco/KTX2/meshopt, only after dependency policy is accepted.
- Texture/ImageBitmap lifecycle or renderer E2E, only as a dedicated adapter/host phase.
- Public deployment phase, only if the owner explicitly approves a hosting target, deployment policy, artifact retention policy, and workflow permissions.
