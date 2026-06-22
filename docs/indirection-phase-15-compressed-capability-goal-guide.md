# Indirection Phase 15 Compressed Capability Source Selection Goal Guide

Date: 2026-06-22
Status: execution guide for Phase 15
Upstream PASS: `docs/phase-14-pass-report.md`

---

## 0. Direct Goal Prompt For The Executor

Run Goal mode for Phase 15 in `D:\LabProjects\Engine\Indirection`.

Phase 14 has passed with final commit `d3e823e docs: add phase 14 pass report`. Phase 15 is **Compressed Capability Source Selection**.

The goal is to make Draco, KTX2, and meshopt readiness visible as declarative capability/source-selection contracts without adding real decoder dependencies or renderer work. The phase should prove that hosts can expose decoder availability through `ResolutionContext.capability`, that catalogs can choose compressed or fallback sources deterministically, and that reports/docs/tests explain why a compressed source was or was not selected.

Round budget: 16 rounds.

- Rounds 1-12: main implementation.
- Rounds 13-15: buffer fixes for capability matching, diagnostics/report drift, docs, package smoke, or boundary issues.
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
- `docs/phase-14-pass-report.md`
- `docs/indirection-phase-14-three-lifecycle-goal-guide.md`
- `docs/runtime-lifecycle.md`
- `docs/three-gltf-adapter.md`
- `docs/release-readiness.md`
- `docs/Indirection_技术架构与开发计划_v0.2.md`
- `docs/Indirection_寻址_架构与技术选型设计_v0.1.md`
- `docs/rd-plan-sinan-alignment-2026-06-20.md`
- `docs/sinan-cooperation/rfc-001-sinan-asset-boundary.md`
- `docs/sinan-cooperation/sinan-technical-advisory-2026-06-20.md`
- `packages/protocol/src/index.ts`
- `packages/schema/src/index.ts`
- `packages/compiler/src/index.ts`
- `packages/runtime/src/index.ts`
- `packages/runtime/test/`
- `packages/three/src/index.ts`
- `packages/three/test/three-boundary.test.ts`
- `scripts/core-boundary-check.mjs`
- `scripts/docs-drift-check.mjs`
- `scripts/pack-check.mjs`

Phase 14 acceptance evidence:

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm validate:full`: PASS, including 32 files and 101 tests plus Chromium, Firefox, and WebKit E2E
- `corepack pnpm release:dry-run`: PASS
- `corepack pnpm publish:preflight`: PASS
- `git diff --check`: PASS

## 2. Why Phase 15 Is This Work

Phase 14 left several candidates:

- Draco/KTX2/meshopt capability injection and compressed source fallback.
- Real npm publish release candidate.
- Live Sinan Engine repository integration.
- Browser E2E stress and artifact diagnostics.

Real npm publish still requires explicit owner decisions for package visibility, names, npm account/scope, public license, versioning, tag policy, GitHub Release policy, and rollback policy. Live Sinan integration still depends on a real host integration surface. Browser E2E stress is useful hardening, but it does not advance the asset-addressing contract.

Phase 15 therefore chooses the narrow in-repository path: capability-driven compressed source selection. This follows the Sinan alignment docs: variant/compression should come after the core identity, catalog, lifecycle, fallback, and adapter contracts are stable, and compressed assets must never become ordinary-test hard dependencies.

## 3. Phase 15 Must Complete

Phase 15 must deliver:

- A deterministic capability/source-selection contract for compressed variants.
- Tests proving declaration-order first match and default-source fallback for capability-gated sources.
- Coverage for `capability` values such as `draco`, `ktx2`, and `meshopt` without adding real decoder packages.
- Compiler/schema validation or existing validation hardening so capability matching remains declarative string-set matching, not scripts, functions, or expressions.
- Runtime/source-resolution tests showing:
  - compressed source is selected when the required capability is present;
  - default uncompressed source is selected when capability is absent;
  - missing decoder capability does not become a hard failure when a default source exists;
  - structured fallback/diagnostic state remains stable when a selected compressed source fails to decode.
- A host-facing adapter story in `docs/three-gltf-adapter.md`: hosts configure real Three decoder plugins themselves, then pass matching capability strings into Indirection resolution context.
- Package smoke coverage that imports packed packages and exercises capability source selection with fixture data.
- Docs drift guards for the new guide, compressed capability docs, validation commands, and the Phase 15 PASS report.
- A final `docs/phase-15-pass-report.md`.

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

## 4. Phase 15 Must Not Do

Do not:

- Run a real npm publish.
- Run npm login, npm token checks, or registry writes.
- Remove `private: true` or change the `UNLICENSED` policy.
- Create Git tags or GitHub Releases.
- Add real decoder dependencies such as Draco, KTX2, Basis, meshopt decoder packages, or transcoders.
- Implement a texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E scene, or real WebGL smoke.
- Add binary-heavy compressed fixture assets unless they are tiny text/test doubles and explicitly justified.
- Integrate live Sinan Engine or create `@indirection/sinan`.
- Move Three.js, GLTFLoader, decoder objects, DOM, fetch, window, document, or renderer-specific APIs into protocol/schema/compiler/runtime core.
- Turn variant matching into arbitrary expressions, functions, scripts, or host callbacks.
- Make compressed assets a hard dependency for normal validation.
- Change package visibility, release versioning, or publish policy.

## 5. Architecture Boundaries

Keep these boundaries:

- Host-owned authoring remains source of truth.
- Compiled catalog remains the deterministic derived artifact.
- Source selection remains declarative and explainable.
- `quality`, `locale`, `platform`, and `capability` remain string-set dimensions.
- Capability strings are public contract data, not decoder objects.
- Runtime core may use generic `ResolutionContext.capability`, but it must not know Draco, KTX2, meshopt, Three.js, or renderer-specific classes.
- `@indirection/three` may document how hosts wire decoder plugins, but it should not require those plugins in tests or package smoke.
- Fallback remains explicit and structured; default source selection is not the same thing as error fallback.
- Diagnostics/report output must remain stable and machine-readable.

## 6. Fixed Per-Round Workflow

Start every round with:

```powershell
git status --short --branch
```

Then:

- Read this guide and the files touched by the round.
- Confirm whether user or other-session changes exist.
- Keep edits scoped to Phase 15.
- Avoid staging unrelated files.

At minimum, every round must run:

```powershell
git diff --check
```

When changing protocol/schema/compiler/runtime/tests:

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm check:boundaries
```

When changing docs, package smoke, package exports, or validation scripts:

```powershell
corepack pnpm check:docs
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
- Do not stage `dist/`, `.tsbuildinfo`, Playwright reports, test results, package tarballs, or runtime caches.
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

- Can this change be explained with the smallest source-selection fixture?
- Can failures be localized to schema, compiler, resolver, runtime, Three adapter docs, package smoke, or docs drift?
- Are present-capability, absent-capability, default-source, selected-source-failure, and explicit-error-fallback states covered where relevant?
- Does the test prove declaration-order first match rather than incidental object order?
- Does the report or snapshot preserve stable codes/fields instead of relying on natural-language messages?
- Did compressed capability support avoid real decoder packages and binary-heavy fixtures?

## 10. Architecture Self-Check

Every round must answer:

- Does host-owned authoring remain source of truth?
- Does the compiled catalog remain a derived artifact?
- Does runtime core avoid Three, DOM, fetch, decoder, and Sinan coupling?
- Are capability strings data, not executable host logic?
- Are source selection and error fallback kept distinct?
- Does `@indirection/three` stay an adapter package, not a source of core semantics?
- Did the phase avoid real npm publish, live Sinan integration, renderer E2E, texture pipeline, and GPU memory policy?
- Were unrelated files and generated outputs left alone?

## 11. Round Plan

### Main Rounds

| Round | Target | Validation |
|---:|---|---|
| 1 | Lock Phase 15 guide and update README/docs index/release readiness/Phase 14 PASS next-phase pointers | `corepack pnpm check:docs`, `git diff --check` |
| 2 | Audit current source matching, schema validation, compiler diagnostics, runtime resolver, and report surfaces for capability coverage | `corepack pnpm typecheck`, `git diff --check` |
| 3 | Add or harden schema/compiler tests for declarative `capability` source conditions and default-source fallback rules | `corepack pnpm test -- --run packages/schema packages/compiler` |
| 4 | Add or harden runtime resolver tests for compressed source selected when capability is present | `corepack pnpm test -- --run packages/runtime` |
| 5 | Add runtime resolver tests for uncompressed default selected when capability is absent | `corepack pnpm test -- --run packages/runtime` |
| 6 | Cover selected compressed source decode failure with structured fallback/cause behavior | `corepack pnpm test` |
| 7 | Add report/diagnostic coverage that explains capability-selected or default-selected source paths without unstable messages | `corepack pnpm test`, `corepack pnpm check:docs` |
| 8 | Update `docs/three-gltf-adapter.md` with host decoder capability injection guidance and non-scope boundaries | `corepack pnpm check:docs`, `git diff --check` |
| 9 | Add package smoke coverage for packed capability source selection and adapter documentation surface | `corepack pnpm pack:check` |
| 10 | Add docs drift guards for Phase 15 guide, compressed capability terms, validation commands, and planned PASS report | `corepack pnpm check:docs` |
| 11 | Run full local quality gate and repair typing, docs, pack, or boundary issues | `corepack pnpm validate:full` |
| 12 | Run release posture gates and confirm no publish/tag side effects | `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight` |

### Buffer Rounds

| Round | Use | Validation |
|---:|---|---|
| 13 | Fix capability matching edge cases, especially empty arrays, missing default source, or condition ordering | `corepack pnpm test`, `corepack pnpm typecheck` |
| 14 | Fix package smoke, docs drift, or docs/index mismatch issues | `corepack pnpm pack:check`, `corepack pnpm check:docs` |
| 15 | Fix boundary, release posture, or accidental scope creep issues | `corepack pnpm check:boundaries`, `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight`, `git diff --check` |

### Final Validation

| Round | Target | Validation |
|---:|---|---|
| 16 | Write `docs/phase-15-pass-report.md`, run final validation, commit, push, and report back | full validation matrix |

## 12. Validation Matrix

Phase 15 final PASS requires:

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

## 13. PASS Criteria

Phase 15 PASS requires:

- Capability-gated source selection is deterministic and covered by tests.
- Compressed source selection works when matching capability strings are present.
- Default uncompressed source selection works when compressed capability strings are absent.
- Default source selection is clearly separated from explicit runtime fallback after a load/decode failure.
- `draco`, `ktx2`, and `meshopt` are represented as capability strings or fixtures without real decoder dependencies.
- Schema/compiler/runtime/report docs keep capability matching declarative and machine-readable.
- Three adapter docs explain host-owned decoder plugin setup without moving decoder objects into core.
- Package smoke imports packed artifacts and exercises the Phase 15 public surface.
- Docs index, release readiness, drift guards, and PASS report are aligned.
- `validate:full`, `release:dry-run`, `publish:preflight`, and `git diff --check` pass.
- No real npm publish, npm login, registry write, Git tag, GitHub Release, live Sinan integration, or decoder package dependency was introduced.
- Worktree is clean and pushed to `origin/main`.

## 14. Final Report Template

The final report must include:

```markdown
# Phase 15 Compressed Capability Source Selection PASS Report

## Goal

## Completion Status

## Capability Source Selection Coverage

- schema/compiler validation:
- runtime source resolution:
- compressed source selected:
- default source fallback:
- selected-source decode failure:
- report/diagnostic visibility:
- Three adapter host guidance:
- package smoke:

## Core Architecture Boundary Validation

- host-owned authoring:
- declarative capability matching:
- runtime core boundary:
- Three adapter boundary:
- deferred decoder/texture/renderer scope:
- release/publish boundary:

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

## 15. Candidate Phases After Phase 15

After Phase 15 passes, the planner may choose among:

- Real npm publish release candidate, only after owner decisions are accepted.
- Live Sinan Engine repository integration, only after a real host integration surface is available.
- Browser E2E stress and artifact diagnostics.
- Texture/ImageBitmap lifecycle or renderer E2E, only as a dedicated adapter/host phase.
- Decoder package integration for Draco/KTX2/meshopt, only after the capability contract has passed and dependency policy is accepted.
