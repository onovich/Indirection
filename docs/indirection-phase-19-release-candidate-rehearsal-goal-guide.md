# Indirection Phase 19 No-Publish Release Candidate Rehearsal And Decision Handoff Goal Guide

Date: 2026-06-23
Status: execution guide for Phase 19
Upstream PASS: `docs/phase-18-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 19 in `D:\LabProjects\Engine\Indirection`.

Phase 18 has passed with final commit `51042f3 release: add phase 18 ci policy gate`. Phase 19 is **No-Publish Release Candidate Rehearsal And Decision Handoff**.

The goal is to add a local, deterministic no-publish release-candidate rehearsal gate and handoff document. The project now has full validation, browser E2E, package smoke, release provenance, release dry-run, publish preflight, and release CI policy parity. Phase 19 should rehearse a v0.1 release-candidate handoff without publishing: collect package candidacy, validation gate evidence, release policy blockers, unresolved owner decisions, docs/changelog readiness, and rollback/incident decision points into a stable local report shape and human handoff.

Round budget: 16 rounds.

- Rounds 1-12: main implementation.
- Rounds 13-15: buffer fixes for RC report shape, docs drift, release policy blockers, command parity, dry-run, publish preflight, or CI parity issues.
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
- `docs/phase-18-pass-report.md`
- `docs/indirection-phase-18-release-ci-policy-goal-guide.md`
- `docs/release-readiness.md`
- `docs/release-workflow.md`
- `docs/release-ci-policy.md`
- `docs/release-provenance.md`
- `docs/publish-preflight-policy.md`
- `docs/release-versioning-adr.md`
- `docs/report-json-shapes.md`
- `package.json`
- `scripts/release-ci-check.mjs`
- `scripts/release-provenance.mjs`
- `scripts/release-dry-run.mjs`
- `scripts/publish-preflight.mjs`
- `scripts/docs-drift-check.mjs`
- `.github/workflows/validate.yml`
- `.github/workflows/release-dry-run.yml`
- `.github/workflows/publish-preflight.yml`

Phase 18 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm validate:full`: PASS, including 35 files and 122 tests plus Chromium, Firefox, and WebKit E2E
- `corepack pnpm release:ci-check`: PASS
- `corepack pnpm release:provenance`: PASS
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 19 Is This Work

After Phase 18, the remaining candidates include:

- real npm publish release candidate;
- live Sinan Engine repository integration;
- real Draco/KTX2/meshopt decoder integration;
- texture/ImageBitmap lifecycle or renderer E2E;
- no-publish release-candidate rehearsal and decision handoff.

Real npm publish still requires owner decisions for package visibility, package names, npm account/scope, public license, versioning, tag policy, GitHub Release policy, provenance upload, signing, workflow permissions, package upload, release ownership, and rollback. Live Sinan still depends on a real host integration surface. Real decoder and renderer work should be dedicated adapter/host phases.

Phase 19 therefore chooses no-publish release-candidate rehearsal because it is in-repository, uses the gates already built through Phase 18, and gives the project owner a concrete decision handoff before any real publishing capability is added.

## 3. Phase 19 Must Complete

Phase 19 must deliver:

- A local command or script gate, preferably `release:rc-check`, that produces or validates a deterministic release-candidate rehearsal report without publishing.
- A documented release-candidate handoff, preferably `docs/release-candidate-handoff.md`, covering package candidacy, validation gates, open owner decisions, blocked real-publish actions, rollback policy, and recommended next decision.
- A stable machine-readable report shape documented under `docs/report-json-shapes.md`.
- Integration with existing release safety gates, either by invoking `release:ci-check`, `release:provenance`, `release:dry-run`, and `publish:preflight` report helpers where practical, or by requiring their command evidence in the RC report.
- Guardrails proving the RC rehearsal does not require npm login, npm account access, GitHub secrets, network publish actions, write permissions, tags, GitHub Releases, artifact upload, signing, Sigstore, OIDC, or npm provenance upload.
- Docs drift guards for the Phase 19 guide, release-candidate handoff docs, command names, report shape docs, changelog/README pointers, validation commands, and the Phase 19 PASS report.
- A final `docs/phase-19-pass-report.md`.

Preferred implementation shape:

- Keep the RC checker in `scripts/` and wire it through `package.json`.
- Reuse existing release helper reports instead of duplicating package provenance, workflow policy, or publish preflight semantics.
- Treat unresolved real-publish decisions as explicit blockers, not failures of the no-publish rehearsal.
- Keep generated RC JSON out of git; use `--json` only for local inspection or tests.
- Hand-author docs examples rather than committing local generated output.
- Keep the root package private and all workspace packages `private: true`.

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
corepack pnpm check:boundaries
corepack pnpm smoke:cli
corepack pnpm smoke:phase7
corepack pnpm pack:check
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm validate:full
git diff --check
```

If a dedicated `release:rc-check` command is added, it must be included in the final validation matrix, release docs, and PASS report.

## 4. Phase 19 Must Not Do

Do not:

- Run a real npm publish.
- Run npm login, npm token checks, npm whoami, npm access, npm owner, npm dist-tag, or registry writes.
- Remove `private: true` or change the `UNLICENSED` policy.
- Create Git tags, push tags, or create GitHub Releases.
- Add a real publishing workflow, release upload workflow, package upload workflow, package signing workflow, OIDC publish workflow, Sigstore signing, npm `--provenance`, or npm provenance upload.
- Add GitHub Actions write permissions such as `contents: write`, `packages: write`, `id-token: write`, or any workflow secret requirement for release gates.
- Commit generated RC JSON output, tarballs, provenance output, workflow run output, release archives, npm caches, `dist/`, `.tsbuildinfo`, Playwright artifacts, traces, screenshots, or videos.
- Add real decoder dependencies, renderer/WebGL E2E, live Sinan Engine integration, or `@indirection/sinan`.
- Move release-candidate rehearsal semantics into protocol/schema/compiler/runtime core.

## 5. Architecture Boundaries

Keep these boundaries:

- RC rehearsal is release tooling and owner-decision handoff, not runtime or protocol behavior.
- Local release commands remain the semantic source of truth; the RC report summarizes their evidence and blockers.
- Real-publish blockers are expected output until project ownership decisions are accepted.
- Generated reports stay local and untracked.
- Publish preflight remains a decision gate, not publish permission.
- Core packages must not know about npm accounts, GitHub Actions, tags, releases, signing, provenance upload, or RC handoff documents.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 19.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing release candidate scripts or package scripts:

```powershell
corepack pnpm typecheck
corepack pnpm release:ci-check
corepack pnpm release:dry-run
corepack pnpm publish:preflight
```

When changing docs or validation script guards:

```powershell
corepack pnpm check:docs
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

- Can this RC rehearsal behavior be explained by one package candidate, one gate result, or one owner decision blocker?
- Can failures be localized to package discovery, command evidence, report shape, docs drift, release dry-run, publish preflight, CI policy, or blocker classification?
- Does the RC report avoid timestamps, absolute paths, local usernames, environment variables, secrets, tokens, and runner-specific paths?
- Are unresolved owner decisions represented as blockers rather than accidental publish permissions?
- Does the gate prove no registry, tag, release, signing, package upload, artifact upload, OIDC, or provenance upload action was added?

## 10. Architecture Self-Check

Every round must answer:

- Did RC rehearsal stay in scripts, docs, package scripts, and optional read-only workflow orchestration?
- Did protocol/schema/compiler/runtime remain free of release tooling and RC handoff semantics?
- Did local release commands remain the semantic source of truth?
- Did the phase keep real-publish blockers visible instead of bypassing them?
- Did the phase avoid real npm publish, live Sinan, real decoder integration, texture pipeline, renderer E2E, and GitHub Release work?
- Were unrelated files and generated artifacts left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 19 guide and update README/docs index/release readiness/Phase 18 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit release readiness, release workflow, publish preflight, provenance, CI policy, changelog, and package candidate metadata | `corepack pnpm release:ci-check`, `git diff --check` |
| 3 | Design deterministic RC rehearsal report shape and owner-decision blocker model | `corepack pnpm check:docs` |
| 4 | Implement local `release:rc-check` or equivalent RC rehearsal gate | `corepack pnpm typecheck`, `git diff --check` |
| 5 | Add package candidacy, validation gate evidence, blocker, rollback, and release ownership fields | `corepack pnpm test`, `corepack pnpm release:rc-check` if present |
| 6 | Integrate existing release helper reports or command evidence without duplicating their semantics | `corepack pnpm release:ci-check`, `corepack pnpm release:provenance` |
| 7 | Add determinism and secret/path/timestamp exclusion checks for RC output | `corepack pnpm test`, `corepack pnpm release:rc-check` if present |
| 8 | Document release-candidate handoff and no-publish decision boundaries | `corepack pnpm check:docs` |
| 9 | Update release workflow/readiness/publish preflight docs with RC rehearsal guidance | `corepack pnpm check:docs` |
| 10 | Add docs drift guards for RC guide, handoff docs, report shape, command names, changelog, and planned PASS report | `corepack pnpm check:docs`, `git diff --check` |
| 11 | Run release gates and fix command ordering, blocker classification, or policy edge cases | `corepack pnpm release:ci-check`, `corepack pnpm release:provenance`, `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |
| 12 | Run full local quality gate and repair typing, docs, pack, or boundary issues | `corepack pnpm validate:full` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 13 | Fix RC report determinism, blocker classification, or package candidacy edge cases | `corepack pnpm test`, `corepack pnpm release:rc-check` if present |
| 14 | Fix docs drift, handoff docs, report shape docs, or PASS report shape issues | `corepack pnpm check:docs`, `git diff --check` |
| 15 | Fix boundary, publish-preflight, generated-artifact, or CI parity issues | `corepack pnpm check:boundaries`, `corepack pnpm publish:preflight`, `corepack pnpm validate:full` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 16 | Write `docs/phase-19-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 19 final PASS requires:

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
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

If `release:rc-check` is added, it is also required here and in the PASS report.

## 13. PASS Criteria

Phase 19 PASS requires:

- A local no-publish RC rehearsal gate exists or a documented equivalent is implemented.
- The RC report shape is deterministic and documented.
- Package candidacy, validation gate evidence, unresolved owner decisions, blocked real-publish actions, rollback policy, and release ownership handoff are represented.
- Existing release CI policy, provenance, dry-run, and publish preflight gates remain the source of truth and continue to pass.
- Real-publish blockers remain explicit and are not treated as permission to publish.
- Release workflow, release readiness, publish preflight, release CI policy, release provenance, report shape docs, docs index, changelog, and PASS report are aligned.
- `validate:full`, `release:ci-check`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No generated RC output, tarballs, provenance output, release archives, npm caches, Playwright artifacts, `dist/`, or `.tsbuildinfo` are committed.
- No real npm publish, npm login, registry write, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, workflow write permission, package upload, live Sinan integration, real decoder dependency, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, or WebGL scene smoke was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 19 No-Publish Release Candidate Rehearsal And Decision Handoff PASS Report

## Goal

## Completion Status

## RC Rehearsal Coverage

- package candidacy:
- validation gate evidence:
- owner decision blockers:
- no-publish boundary:
- rollback and incident handoff:
- docs drift integration:

## Release Boundary Validation

- local release command boundary:
- workflow permission boundary:
- generated artifact policy:
- real-publish blocker policy:
- deferred Sinan/decoder/renderer scope:

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

## 15. Candidate Phases After Phase 19

After Phase 19 passes, the planner may choose among:

- Real npm publish release candidate, only after owner decisions are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Real decoder package integration for Draco/KTX2/meshopt, only after dependency policy is accepted.
- Texture/ImageBitmap lifecycle or renderer E2E, only as a dedicated adapter/host phase.
- Public docs / examples / onboarding polish if real publish decisions remain blocked.
