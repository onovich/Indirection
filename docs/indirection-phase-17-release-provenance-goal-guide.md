# Indirection Phase 17 Release Artifact Provenance And Verification Goal Guide

Date: 2026-06-22
Status: execution guide for Phase 17
Upstream PASS: `docs/phase-16-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 17 in `D:\LabProjects\Engine\Indirection`.

Phase 16 has passed with final commit `2fe07fb docs: add phase 16 pass report`. Phase 17 is **Release Artifact Provenance And Verification**.

The goal is to add a local, no-publish provenance gate for release dry-run artifacts. The project already packs and imports all 9 workspace packages without publishing them. Phase 17 should make those dry-run artifacts auditable through deterministic package manifests, hashes, file lists, command evidence, and policy checks while still keeping every real publish, registry, tag, signature, and GitHub Release action out of scope.

Round budget: 16 rounds.

- Rounds 1-12: main implementation.
- Rounds 13-15: buffer fixes for provenance shape, package tarball hashing, docs drift, release dry-run, publish preflight, or CI parity issues.
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
- `docs/phase-16-pass-report.md`
- `docs/indirection-phase-16-browser-e2e-stress-goal-guide.md`
- `docs/release-readiness.md`
- `docs/release-workflow.md`
- `docs/publish-preflight-policy.md`
- `docs/release-versioning-adr.md`
- `docs/report-json-shapes.md`
- `package.json`
- `scripts/pack-check.mjs`
- `scripts/release-dry-run.mjs`
- `scripts/publish-preflight.mjs`
- `scripts/docs-drift-check.mjs`
- `.github/workflows/release-dry-run.yml`
- `.github/workflows/publish-preflight.yml`

Phase 16 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm validate:full`: PASS, including 33 files and 114 tests plus Chromium, Firefox, and WebKit E2E
- `corepack pnpm test:e2e:chromium`: PASS
- `corepack pnpm test:e2e:firefox`: PASS
- `corepack pnpm test:e2e:webkit`: PASS
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 17 Is This Work

After Phase 16, the remaining candidates include:

- real npm publish release candidate;
- live Sinan Engine repository integration;
- real Draco/KTX2/meshopt decoder integration;
- texture/ImageBitmap lifecycle or renderer E2E;
- release artifact provenance or package provenance hardening.

Real npm publish still requires owner decisions for package visibility, names, npm account/scope, public license, versioning, tag policy, GitHub Release policy, and rollback policy. Live Sinan still depends on a real host integration surface. Real decoder and renderer work should be dedicated adapter/host phases.

Phase 17 therefore chooses release artifact provenance because it is in-repository, strengthens the existing release dry-run and publish preflight posture, and prepares the project for a future real publish decision without granting permission to publish.

## 3. Phase 17 Must Complete

Phase 17 must deliver:

- A local provenance command or release-dry-run extension that audits the packed package artifacts without publishing them.
- Deterministic machine-readable provenance output for all 9 workspace packages.
- Per-package fields such as package name, version, private/license state, tarball filename, tarball sha256, tarball byte size, package directory, exported entrypoints, file count, and relevant validation command evidence.
- A stable report shape documented under `docs/`.
- Tests or smoke checks proving provenance output is deterministic and does not include timestamps, absolute paths, npm tokens, local usernames, or registry credentials.
- Integration with existing no-publish gates, either as part of `release:dry-run` or as a separate script called by release dry-run and docs.
- Guardrails confirming no real publish, npm login, registry write, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, or OIDC publishing action occurs.
- Docs drift guards for the Phase 17 guide, provenance docs, validation commands, and the Phase 17 PASS report.
- A final `docs/phase-17-pass-report.md`.

Preferred implementation shape:

- Reuse the existing package discovery and pack helpers where practical.
- Keep generated tarballs and temporary consumers in temp directories only.
- Prefer JSON provenance output inspected in-memory during tests rather than committing generated reports.
- If a sample report is needed for docs, keep it small and hand-authored as a shape example, not generated local output.
- Keep the root package private and non-publishable.

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
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 4. Phase 17 Must Not Do

Do not:

- Run a real npm publish.
- Run npm login, npm token checks, npm whoami, npm access, npm owner, npm dist-tag, or registry writes.
- Remove `private: true` or change the `UNLICENSED` policy.
- Create Git tags or GitHub Releases.
- Add a real publishing workflow, release upload workflow, package signing workflow, OIDC publish workflow, Sigstore signing, or npm `--provenance` upload.
- Commit generated tarballs, provenance output from a local machine, temporary consumers, release archives, npm caches, `dist/`, `.tsbuildinfo`, Playwright artifacts, traces, screenshots, or videos.
- Include absolute local paths, timestamps, local usernames, environment variables, tokens, or machine-specific cache paths in deterministic provenance output.
- Add real decoder dependencies, renderer/WebGL E2E, live Sinan Engine integration, or `@indirection/sinan`.
- Move release tooling semantics into protocol/schema/compiler/runtime core.

## 5. Architecture Boundaries

Keep these boundaries:

- Provenance is release tooling, not runtime or protocol behavior.
- Package artifacts remain dry-run artifacts until owner decisions permit real publish.
- Generated artifacts stay temporary and untracked.
- Machine-readable provenance must be deterministic and free of local secrets.
- Publish preflight remains a decision gate, not publish permission.
- Release dry-run remains no-side-effect validation.
- Core packages must not know about npm, tarball hashing, GitHub Releases, or CI provenance.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 17.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing scripts or package smoke:

```powershell
corepack pnpm typecheck
corepack pnpm pack:check
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
- Do not stage `dist/`, `.tsbuildinfo`, `playwright-report/`, `test-results/`, traces, screenshots, videos, package tarballs, provenance output, temporary consumers, release archives, npm caches, or runtime caches.
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

- Can this provenance behavior be explained by one packed package fixture or one package manifest?
- Can failures be localized to package discovery, packing, tarball hashing, file-list extraction, report shape, docs drift, release dry-run, or publish preflight?
- Does the output avoid timestamps, absolute paths, usernames, environment variables, tokens, and machine cache paths?
- Are missing package metadata, unexpected generated artifacts, and no-publish boundaries covered?
- Does the gate prove no registry, tag, release, signing, or upload action happened?

## 10. Architecture Self-Check

Every round must answer:

- Did provenance stay in scripts/docs/workflow boundaries?
- Did protocol/schema/compiler/runtime remain free of release tooling semantics?
- Did package artifacts remain dry-run-only and untracked?
- Did publish preflight remain a decision gate rather than permission to publish?
- Did the phase avoid real npm publish, live Sinan, real decoder integration, texture pipeline, renderer E2E, and GitHub Release work?
- Were unrelated files and generated artifacts left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 17 guide and update README/docs index/release readiness/Phase 16 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit current pack-check/release-dry-run/publish-preflight package discovery and temp artifact handling | `corepack pnpm pack:check`, `git diff --check` |
| 3 | Design deterministic provenance report shape and document it | `corepack pnpm check:docs` |
| 4 | Implement local provenance generation for packed package artifacts without committing generated output | `corepack pnpm typecheck`, `corepack pnpm pack:check` |
| 5 | Add tarball sha256, byte size, package metadata, files, exports, and CLI bin evidence | `corepack pnpm pack:check` |
| 6 | Add determinism and secret/path/timestamp exclusion checks | `corepack pnpm test`, `corepack pnpm release:dry-run` |
| 7 | Integrate the provenance gate with release dry-run or add a documented script invoked by release dry-run | `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |
| 8 | Update release workflow and publish preflight docs with provenance boundaries | `corepack pnpm check:docs` |
| 9 | Add docs drift guards for provenance docs, command names, report shape, and planned PASS report | `corepack pnpm check:docs` |
| 10 | Run package and release gates and fix tarball/provenance edge cases | `corepack pnpm pack:check`, `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |
| 11 | Run full local quality gate and repair typing, docs, pack, or boundary issues | `corepack pnpm validate:full` |
| 12 | Confirm no generated artifact, tag, registry, or publish side effects remain | `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight`, `git diff --check`, `git status --short --branch` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 13 | Fix provenance determinism, hashing, or file-list edge cases | `corepack pnpm pack:check`, `corepack pnpm release:dry-run` |
| 14 | Fix docs drift, report shape docs, or command references | `corepack pnpm check:docs`, `git diff --check` |
| 15 | Fix boundary, publish-preflight, generated-artifact, or CI parity issues | `corepack pnpm check:boundaries`, `corepack pnpm publish:preflight`, `corepack pnpm validate:full` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 16 | Write `docs/phase-17-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 17 final PASS requires:

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
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

If a dedicated provenance command is added, it must also be listed here and in the PASS report.

## 13. PASS Criteria

Phase 17 PASS requires:

- A local provenance gate exists for all 9 packed workspace packages.
- Provenance output is deterministic and machine-readable.
- Tarball sha256 and byte size are recorded or verified for each package.
- Package metadata, exports, files, and CLI bin evidence are included or verified.
- Determinism/secret/path checks prove no timestamps, absolute paths, local usernames, environment variables, tokens, or machine cache paths enter the report.
- Release dry-run and publish preflight remain no-publish/no-tag/no-registry-write gates.
- Generated tarballs, provenance output, temporary consumers, release archives, npm caches, and Playwright artifacts are not committed.
- Docs index, release readiness, release workflow, drift guards, and PASS report are aligned.
- `validate:full`, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No real npm publish, npm login, registry write, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, live Sinan integration, real decoder dependency, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, or WebGL scene smoke was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 17 Release Artifact Provenance And Verification PASS Report

## Goal

## Completion Status

## Provenance Coverage

- package discovery:
- tarball hashing:
- metadata/files/exports evidence:
- deterministic report shape:
- secret/path/timestamp exclusion:
- release dry-run integration:
- publish preflight boundary:

## Core Architecture Boundary Validation

- release tooling boundary:
- runtime/core boundary:
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
- corepack pnpm validate:full:
- corepack pnpm release:dry-run:
- corepack pnpm publish:preflight:
- git diff --check:

## Final Commit

## Push Result

## Unfinished / Follow-Up Items

## Risks And Recommendations
```

## 15. Candidate Phases After Phase 17

After Phase 17 passes, the planner may choose among:

- Real npm publish release candidate, only after owner decisions are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Real decoder package integration for Draco/KTX2/meshopt, only after dependency policy is accepted.
- Texture/ImageBitmap lifecycle or renderer E2E, only as a dedicated adapter/host phase.
- Release automation hardening for GitHub Actions, still without publish permission, if real publish remains blocked.
