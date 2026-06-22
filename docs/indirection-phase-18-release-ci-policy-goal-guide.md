# Indirection Phase 18 Release CI Policy Parity And Workflow Hardening Goal Guide

Date: 2026-06-23
Status: execution guide for Phase 18
Upstream PASS: `docs/phase-17-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 18 in `D:\LabProjects\Engine\Indirection`.

Phase 17 has passed with final commit `a35aa94 release: add phase 17 provenance gate`. Phase 18 is **Release CI Policy Parity And Workflow Hardening**.

The goal is to make the GitHub Actions release gates and local release commands enforce the same no-publish policy. The project already has deterministic local release provenance, release dry-run, publish preflight, and manual GitHub Actions workflows. Phase 18 should add a small auditable CI policy/parity gate that verifies workflow permissions, required commands, forbidden publish/tag/release actions, and docs alignment without granting any real publish, tag, release, signing, artifact upload, or npm provenance-upload capability.

Round budget: 16 rounds.

- Rounds 1-12: main implementation.
- Rounds 13-15: buffer fixes for workflow parsing, policy false positives, docs drift, release dry-run, publish preflight, or CI parity issues.
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
- `docs/phase-17-pass-report.md`
- `docs/indirection-phase-17-release-provenance-goal-guide.md`
- `docs/release-readiness.md`
- `docs/release-workflow.md`
- `docs/release-provenance.md`
- `docs/publish-preflight-policy.md`
- `docs/release-versioning-adr.md`
- `docs/report-json-shapes.md`
- `package.json`
- `scripts/release-provenance.mjs`
- `scripts/release-dry-run.mjs`
- `scripts/publish-preflight.mjs`
- `scripts/docs-drift-check.mjs`
- `.github/workflows/validate.yml`
- `.github/workflows/release-dry-run.yml`
- `.github/workflows/publish-preflight.yml`

Phase 17 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm validate:full`: PASS, including 34 files and 118 tests plus Chromium, Firefox, and WebKit E2E
- `corepack pnpm release:provenance`: PASS
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 18 Is This Work

After Phase 17, the remaining high-value candidates include:

- real npm publish release candidate;
- live Sinan Engine repository integration;
- real Draco/KTX2/meshopt decoder integration;
- texture/ImageBitmap lifecycle or renderer E2E;
- release automation hardening for GitHub Actions without publish permission.

Real npm publish still requires owner decisions for package visibility, package names, npm account/scope, public license, versioning, tag policy, GitHub Release policy, provenance upload, signing, and rollback policy. Live Sinan still depends on a real host integration surface. Real decoder and renderer work should be dedicated adapter/host phases.

Phase 18 therefore chooses release CI policy parity because it is in-repository, strengthens the existing release workflow without touching external services, and prevents future workflow drift before any owner decides to permit real publishing.

## 3. Phase 18 Must Complete

Phase 18 must deliver:

- A local command or script gate, preferably `release:ci-check`, that statically audits the release-related GitHub Actions workflows.
- Policy checks proving release workflows use read-only repository permissions and do not request write permissions, OIDC publish permissions, registry credentials, package upload, Git tag creation, GitHub Release creation, signing, Sigstore, or npm provenance upload.
- Workflow parity checks proving manual release workflows run the expected install, provenance, dry-run, preflight, and diff-check commands in a documented order.
- A guard that the main `validate` workflow remains the source for regular CI validation and does not acquire release/publish permissions.
- Docs describing local versus CI release gates, what the CI policy checker proves, and what it intentionally does not prove.
- Docs drift guards for the new Phase 18 guide, release CI policy docs, validation commands, workflow policy expectations, and the Phase 18 PASS report.
- A final `docs/phase-18-pass-report.md`.

Preferred implementation shape:

- Keep the policy checker in `scripts/` and wire it through `package.json`.
- Avoid adding a YAML parser dependency unless the project already has one. A focused static workflow guard is acceptable for these fixed workflow files if it is deterministic and well tested.
- Prefer checking exact workflow files and command strings over broad repository scans that create noisy false positives.
- Keep all generated diagnostics in memory or temporary locations only.
- If a docs example is needed, hand-author the shape instead of committing generated CI output.

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
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm validate:full
git diff --check
```

If a dedicated `release:ci-check` command is added, it must be included in the final validation matrix, release docs, and PASS report.

## 4. Phase 18 Must Not Do

Do not:

- Run a real npm publish.
- Run npm login, npm token checks, npm whoami, npm access, npm owner, npm dist-tag, or registry writes.
- Remove `private: true` or change the `UNLICENSED` policy.
- Create Git tags or GitHub Releases.
- Add a real publishing workflow, release upload workflow, package upload workflow, package signing workflow, OIDC publish workflow, Sigstore signing, npm `--provenance`, or npm provenance upload.
- Add GitHub Actions write permissions such as `contents: write`, `packages: write`, `id-token: write`, or any workflow secret requirement for release gates.
- Commit generated tarballs, provenance output, workflow run output, release archives, npm caches, `dist/`, `.tsbuildinfo`, Playwright artifacts, traces, screenshots, or videos.
- Add real decoder dependencies, renderer/WebGL E2E, live Sinan Engine integration, or `@indirection/sinan`.
- Move release CI policy semantics into protocol/schema/compiler/runtime core.

## 5. Architecture Boundaries

Keep these boundaries:

- CI policy hardening is release tooling, not runtime or protocol behavior.
- Manual release workflows remain read-only validation gates until owner decisions permit real publish work.
- Local commands remain the source of truth for validation semantics; workflows orchestrate those commands.
- Generated artifacts stay temporary and untracked.
- Publish preflight remains a decision gate, not publish permission.
- Core packages must not know about GitHub Actions, npm, workflow permissions, tags, releases, signing, or provenance upload.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 18.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing workflow policy scripts or package scripts:

```powershell
corepack pnpm typecheck
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
- Do not stage `dist/`, `.tsbuildinfo`, `playwright-report/`, `test-results/`, traces, screenshots, videos, package tarballs, provenance output, workflow run output, temporary consumers, release archives, npm caches, or runtime caches.
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

- Can this CI policy behavior be explained by one workflow file and one command list?
- Can failures be localized to workflow permissions, command parity, forbidden actions, docs drift, release dry-run, or publish preflight?
- Does the policy checker avoid depending on local secrets, GitHub tokens, network access, timestamps, or runner-specific paths?
- Are missing commands, unexpected write permissions, artifact upload, and no-publish boundaries covered?
- Does the gate prove no registry, tag, release, signing, package upload, or provenance upload action was added?

## 10. Architecture Self-Check

Every round must answer:

- Did CI policy hardening stay in scripts, docs, package scripts, and workflow files?
- Did protocol/schema/compiler/runtime remain free of release tooling and workflow semantics?
- Did local release commands remain the semantic source of truth?
- Did manual workflows remain read-only validation gates rather than publish permission?
- Did the phase avoid real npm publish, live Sinan, real decoder integration, texture pipeline, renderer E2E, and GitHub Release work?
- Were unrelated files and generated artifacts left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 18 guide and update README/docs index/release readiness/Phase 17 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit current validate/release-dry-run/publish-preflight workflows and local release scripts | `corepack pnpm release:provenance`, `git diff --check` |
| 3 | Design static CI policy/parity check scope and document expected workflow invariants | `corepack pnpm check:docs` |
| 4 | Implement the local workflow policy checker and package script wiring | `corepack pnpm typecheck`, `git diff --check` |
| 5 | Add checks for read-only permissions and forbidden publish/tag/release/signing/provenance-upload actions | `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |
| 6 | Add command parity checks for install, provenance, release dry-run, publish preflight, and diff check | `corepack pnpm release:provenance`, `corepack pnpm release:dry-run` |
| 7 | Wire the CI policy gate into release docs and, if appropriate, into manual workflows without adding write permissions | `corepack pnpm check:docs`, `git diff --check` |
| 8 | Add or extend tests/docs drift guards for workflow policy expectations | `corepack pnpm check:docs`, `corepack pnpm test` |
| 9 | Update release workflow, release readiness, and publish preflight docs with CI parity boundaries | `corepack pnpm check:docs` |
| 10 | Run release gates and fix command ordering or policy edge cases | `corepack pnpm release:provenance`, `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |
| 11 | Run full local quality gate and repair typing, docs, pack, or boundary issues | `corepack pnpm validate:full` |
| 12 | Confirm no generated artifact, write permission, tag, registry, upload, or publish side effect remains | `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight`, `git diff --check`, `git status --short --branch` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 13 | Fix workflow policy false positives, parser brittleness, or command parity issues | `corepack pnpm check:docs`, `corepack pnpm release:dry-run` |
| 14 | Fix docs drift, release docs, or PASS report shape issues | `corepack pnpm check:docs`, `git diff --check` |
| 15 | Fix boundary, publish-preflight, generated-artifact, or CI parity issues | `corepack pnpm check:boundaries`, `corepack pnpm publish:preflight`, `corepack pnpm validate:full` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 16 | Write `docs/phase-18-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 18 final PASS requires:

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
corepack pnpm release:provenance
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

If `release:ci-check` is added, it is also required here and in the PASS report.

## 13. PASS Criteria

Phase 18 PASS requires:

- A local CI/workflow policy gate exists for release-related GitHub Actions workflows.
- The gate proves workflow permissions remain read-only and no publish/tag/release/signing/upload/provenance-upload permissions are introduced.
- The gate proves local release commands and manual release workflows stay aligned.
- `validate.yml` remains a validation workflow and does not gain publish/release capabilities.
- Release workflow, release readiness, publish preflight, and CI policy docs are aligned.
- Docs drift guards cover the Phase 18 guide, expected policy docs, command names, workflow expectations, and Phase 18 PASS report.
- `validate:full`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No generated workflow outputs, tarballs, provenance output, release archives, npm caches, Playwright artifacts, `dist/`, or `.tsbuildinfo` are committed.
- No real npm publish, npm login, registry write, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, live Sinan integration, real decoder dependency, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, or WebGL scene smoke was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 18 Release CI Policy Parity And Workflow Hardening PASS Report

## Goal

## Completion Status

## CI Policy Coverage

- workflow discovery:
- read-only permission guard:
- forbidden action guard:
- command parity guard:
- validate workflow boundary:
- docs drift integration:

## Release Boundary Validation

- local release command boundary:
- workflow permission boundary:
- no-publish/no-tag/no-registry boundary:
- generated artifact policy:
- deferred real publish/Sinan/decoder/renderer scope:

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

## 15. Candidate Phases After Phase 18

After Phase 18 passes, the planner may choose among:

- Real npm publish release candidate, only after owner decisions are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Real decoder package integration for Draco/KTX2/meshopt, only after dependency policy is accepted.
- Texture/ImageBitmap lifecycle or renderer E2E, only as a dedicated adapter/host phase.
- A no-publish release-candidate rehearsal phase if real publish decisions remain blocked but release handoff still needs more local evidence.
