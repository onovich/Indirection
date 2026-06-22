# Release Readiness

This document records the Phase 8 release-hardening, Phase 9 browser E2E, Phase 10 release dry-run, Phase 11 publish preflight, Phase 12 browser matrix, Phase 13 Three GLTF adapter, Phase 14 Three lifecycle posture, Phase 15 compressed capability source-selection posture, Phase 16 browser E2E stress posture, Phase 17 release provenance posture, Phase 18 release CI policy posture, Phase 19 no-publish release-candidate rehearsal posture, Phase 20 public docs/onboarding posture, Phase 21 local public website/demo docs-site rehearsal posture, and selected Phase 22 browser ImageBitmap lifecycle plan before any real v0.1 npm release, tag, deployment, or renderer E2E.

## Current Quality Gates

Local and CI validation use the same main entrypoint:

```powershell
corepack pnpm validate:full
corepack pnpm smoke:site-demo
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
git diff --check
```

`validate:full` currently covers:

- `lint`: lightweight structure/source guard.
- `format`: lightweight tracked text and JSON format guard.
- `check:docs`: docs link and validation-command drift guard.
- `smoke:site-demo`: local public demo site assembly and no-deploy/no-publish policy smoke.
- `typecheck`: TypeScript project references with `skipLibCheck` disabled.
- `test`: Vitest unit and contract suite.
- `test:browser`: browser-facing loader smoke.
- `test:e2e`: Playwright real browser E2E in Chromium, Firefox, and WebKit for loaders-web, Cache Storage, runtime lifecycle, fallback diagnostics, and virtual catalog consumption.
- `check:boundaries`: core package dependency and host-specific boundary scan.
- `smoke:cli`: real CLI bin smoke for `validate`, `build`, `report`, and `inspect`.
- `smoke:phase7`: advanced loader/cache/Vite integration example.
- `pack:check`: tarball file whitelist plus temporary consumer import smoke, including the packaged Three GLTF parser API with a parser stub.
- `release:ci-check`: static GitHub Actions release policy parity check for read-only permissions, forbidden publish/tag/release/upload actions, and release workflow command order.
- `release:provenance`: deterministic local tarball provenance for all 9 packed workspace packages, including sha256, byte size, file list, exports, bin, validation command evidence, and no-publish policy evidence.
- `release:rc-check`: deterministic no-publish release-candidate rehearsal for package candidacy, validation evidence, owner decision blockers, blocked real-publish actions, rollback policy, and release ownership handoff.

## Current Release Candidate Status

- The workspace is buildable and testable with pnpm and TypeScript project references.
- `lint` and `format` are no longer placeholders.
- `skipLibCheck` is disabled and `corepack pnpm typecheck` passes.
- Report JSON shapes are documented and covered by contract tests.
- CLI and package smoke are part of the full matrix.
- Real browser E2E runs in Chromium, Firefox, and WebKit through Playwright and is part of `validate:full`.
- Runtime `LoadedAsset.dispose` execution is documented as a generic lifecycle contract in `docs/runtime-lifecycle.md`.
- `@indirection/three` parses `model/gltf` transport bodies through injected `GLTFLoader.parseAsync` or a host-provided parser wrapper while keeping Three.js out of runtime core.
- `@indirection/three` exposes `createThreeOwnedResourceDisposer`, `instantiateThreeGltf`, and `extractThreeAnimationMetadata` as adapter-side lifecycle helpers.
- Compressed Draco/KTX2/meshopt readiness is represented through declarative `ResolutionContext.capability` strings, capability-gated catalog sources, compiler reports, runtime tests, and package smoke data without real decoder dependencies.
- GitHub Actions mirrors the local validation entrypoint.
- Phase 11 publish preflight policy, local `publish:preflight`, docs drift guards, and the manual `Publish Preflight` workflow are in place without granting permission to publish.
- Phase 17 release provenance, local `release:provenance`, deterministic report guards, docs drift guards, and release dry-run integration are in place without publishing, uploading provenance, signing, creating tags, or creating GitHub Releases.
- Phase 18 release CI policy, local `release:ci-check`, workflow read-only permission guards, command parity guards, docs drift guards, and release dry-run/publish-preflight integration are in place without workflow write permissions, package uploads, signing, OIDC publish permissions, npm provenance upload, tags, or GitHub Releases.
- Phase 19 release-candidate rehearsal, local `release:rc-check`, handoff docs, report shape docs, docs drift guards, and PASS report are in place without publishing, npm login, registry writes, Git tags, GitHub Releases, signing, Sigstore, npm provenance upload, package uploads, artifact uploads, OIDC publish permissions, or workflow write permissions.
- Phase 20 public onboarding docs, evaluator quickstart, package entrypoint documentation, example workflow documentation, docs drift guards, and PASS report are in place without changing package visibility, license policy, publish permissions, release ownership blockers, or protocol/schema/compiler/runtime semantics.
- Phase 21 local public demo site rehearsal, `site:demo`, `smoke:site-demo`, generated artifact policy, docs drift guards, and PASS report are in place without deploying, publishing, granting workflow write permissions, or changing protocol/schema/compiler/runtime semantics.
- Phase 22 is selected to add browser ImageBitmap and texture-source lifecycle coverage while keeping renderer E2E, WebGL scene smoke, GPU memory estimation, live Sinan integration, real decoder dependencies, publishing, and deployment out of scope.

## Phase 8 Main Implementation Checkpoint

The main implementation rounds have converged on one local and CI-ready release gate:

```powershell
corepack pnpm validate:full
git diff --check
```

At this checkpoint, the full matrix passes without requiring buffer-round fixes.

## Phase 9 Main Implementation Checkpoint

The real browser E2E main implementation is now part of the same release gate:

```powershell
corepack pnpm validate:full
git diff --check
```

At this checkpoint, Chromium E2E passes locally through `validate:full` and covers loaders-web, Cache Storage, runtime lifecycle, fallback diagnostics, and virtual catalog consumption.

## Phase 10 Main Implementation Checkpoint

The release workflow dry-run implementation now has a local and manual CI gate:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
git diff --check
```

At this checkpoint, package visibility policy, package metadata, release versioning policy, package tarball/import smoke, installed CLI bin smoke, release dry-run safety checks, and the manual `Release Dry Run` workflow are in place without publishing npm packages or creating tags.

## Phase 11 Main Implementation Checkpoint

The publish preflight policy implementation now has local and manual CI gates:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

At this checkpoint, package publish candidacy, license, npm scope/account/permission, Git tag, GitHub Release, rollback, versioning, local preflight, docs drift, and manual workflow policies are in place without publishing npm packages, logging in to npm, writing to the registry, creating tags, or creating GitHub Releases.

## Phase 12 Main Implementation Checkpoint

The browser matrix implementation now has a local and CI-ready gate:

```powershell
corepack pnpm validate:full
corepack pnpm test:e2e
git diff --check
```

At this checkpoint, `test:e2e` runs the same browser fixture in Chromium, Firefox, and WebKit. Single-browser debug entrypoints are available as `test:e2e:chromium`, `test:e2e:firefox`, and `test:e2e:webkit`.

## v0.1 Remaining Risks

- No real npm publishing workflow has been created yet.
- No release tag automation has been created yet.
- Package names remain private workspace packages until a publishing decision is made.
- Browser E2E stress and artifact diagnostics are now covered in the Chromium, Firefox, and WebKit fixture gate.
- The Three adapter intentionally does not cover real Draco/KTX2/meshopt decoder wiring, texture pipeline, renderer E2E, automatic deep GPU disposal, scene attach, renderer attach, or gameplay object factories.
- Sinan integration remains a fixture/adapter POC, not a live Sinan Engine repository integration.

## Phase 10 Dry-Run Policy

Phase 10 records the v0.1 package visibility policy in `docs/release-workflow.md`. All workspace package manifests remain `private: true` during release dry-run work. Public package candidates are treated as dry-run candidates only until a later publish-preflight phase accepts npm permissions, package visibility, and tag policy.

The manual GitHub Actions `Release Dry Run` workflow runs `corepack pnpm release:dry-run` with read-only repository permissions. It is a dry-run gate only and does not publish packages or create tags.

## Phase 11 Publish Preflight Policy

Phase 11 guide: `docs/indirection-phase-11-publish-preflight-goal-guide.md`

Phase 11 keeps the Phase 10 no-publish posture while creating the policy and safety gates required before any real v0.1 package release. It documents package visibility acceptance, npm scope/account preflight, license policy, versioning policy, Git tag and GitHub Release policy, rollback policy, and a local `publish:preflight` gate that does not publish, login to npm, write to the registry, or create tags.

Publish preflight policy: `docs/publish-preflight-policy.md`

Phase 11 PASS report: `docs/phase-11-pass-report.md`

The manual GitHub Actions [Publish Preflight](../.github/workflows/publish-preflight.yml) workflow runs `corepack pnpm publish:preflight`, `corepack pnpm release:dry-run`, and `git diff --check` with read-only repository permissions.

## Phase 12 Browser Matrix Expansion

Phase 12 guide: `docs/indirection-phase-12-browser-matrix-goal-guide.md`

Phase 12 expands the existing Playwright E2E gate from Chromium-only to Chromium, Firefox, and WebKit while keeping real npm publish, live Sinan Engine integration, and real Three.js GLTF parsing out of scope.

Phase 12 PASS report: `docs/phase-12-pass-report.md`

## Phase 13 Real Three GLTF Adapter

Phase 13 guide: `docs/indirection-phase-13-three-gltf-goal-guide.md`

Phase 13 turns `@indirection/three` from a peer-boundary skeleton into a real GLTF parser adapter through parser injection while keeping Three.js out of runtime core and keeping real npm publish, live Sinan Engine integration, Draco/KTX2/meshopt, texture pipeline, renderer E2E, and GPU disposal out of scope.

Three GLTF adapter docs: `docs/three-gltf-adapter.md`

Phase 13 PASS report: `docs/phase-13-pass-report.md`

## Phase 14 Three Adapter Lifecycle

Phase 14 guide: `docs/indirection-phase-14-three-lifecycle-goal-guide.md`

Phase 14 makes runtime `LoadedAsset.dispose` executable and testable, then adds bounded `@indirection/three` owned-resource disposer, instantiate hook, and animation metadata contracts while keeping Three-specific lifecycle outside runtime core.

Runtime lifecycle docs: `docs/runtime-lifecycle.md`

Three adapter lifecycle docs: `docs/three-gltf-adapter.md`

Phase 14 PASS report: `docs/phase-14-pass-report.md`

## Phase 15 Compressed Capability Source Selection

Phase 15 guide: `docs/indirection-phase-15-compressed-capability-goal-guide.md`

Phase 15 makes Draco, KTX2, and meshopt readiness visible through declarative capability/source-selection contracts without adding real decoder dependencies, texture pipeline work, renderer E2E, live Sinan Engine integration, or real npm publishing.

Compressed capability docs: `docs/compressed-capability-source-selection.md`

Phase 15 PASS report: `docs/phase-15-pass-report.md`

## Phase 16 Browser E2E Stress And Artifact Diagnostics

Phase 16 guide: `docs/indirection-phase-16-browser-e2e-stress-goal-guide.md`

Phase 16 strengthens the Chromium, Firefox, and WebKit browser E2E gate with bounded runtime lifecycle stress, Cache Storage isolation/cleanup stress, compressed capability source selection, structured browser diagnostics, and documented Playwright artifact policy while keeping renderer E2E, real decoder integration, live Sinan Engine integration, and real npm publishing out of scope.

Phase 16 PASS report: `docs/phase-16-pass-report.md`

## Phase 17 Release Artifact Provenance And Verification

Phase 17 guide: `docs/indirection-phase-17-release-provenance-goal-guide.md`

Phase 17 adds deterministic local provenance and verification for packed dry-run artifacts while keeping real npm publish, npm login, registry writes, Git tags, GitHub Releases, signing, Sigstore, npm provenance upload, and generated release artifacts out of the committed repository.

Release provenance docs: `docs/release-provenance.md`

Phase 17 PASS report: `docs/phase-17-pass-report.md`

## Phase 18 Release CI Policy Parity And Workflow Hardening

Phase 18 guide: `docs/indirection-phase-18-release-ci-policy-goal-guide.md`

Phase 18 hardens the read-only GitHub Actions release gates and local release command parity after Phase 17 PASS. `release:ci-check` statically audits `validate.yml`, `release-dry-run.yml`, and `publish-preflight.yml` for read-only permissions, forbidden publish/tag/release/upload actions, and expected command order while keeping local release commands as the semantic source of truth.

Release CI policy docs: `docs/release-ci-policy.md`

Phase 18 PASS report: `docs/phase-18-pass-report.md`

## Phase 19 No-Publish Release Candidate Rehearsal And Decision Handoff

Phase 19 guide: `docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md`

Phase 19 rehearses a v0.1 release-candidate handoff without publishing. `release:rc-check` summarizes package candidacy, validation gate evidence, unresolved owner decision blockers, blocked real-publish actions, rollback policy, and release ownership handoff while keeping all publish, tag, release, upload, signing, OIDC, npm provenance upload, and workflow write-permission actions out of scope.

Release candidate handoff docs: `docs/release-candidate-handoff.md`

Phase 19 PASS report: `docs/phase-19-pass-report.md`

## Phase 20 Public Docs, Examples, And Consumer Onboarding Polish

Phase 20 guide: `docs/indirection-phase-20-public-docs-onboarding-goal-guide.md`

Phase 20 makes the repository easier for technical evaluators to understand and run from a local checkout while real npm publishing remains blocked. It polishes the README, quickstart/evaluator path, package entrypoint docs, example workflow docs, validation guidance, and no-publish messaging without changing package visibility, license, publish permissions, or core runtime semantics.

Evaluator quickstart: `docs/evaluator-quickstart.md`

Package entrypoint docs: `docs/package-entrypoints.md`

Example workflow docs: `docs/example-workflows.md`

Phase 20 PASS report: `docs/phase-20-pass-report.md`

## Phase 21 Public Website, Demo Packaging, And Docs Site Rehearsal

Phase 21 guide: `docs/indirection-phase-21-public-demo-docs-site-goal-guide.md`

Phase 21 makes the Phase 20 evaluator path easier to review as a local public website/docs-site/demo rehearsal while publication and deployment decisions remain blocked. It adds a deterministic local build and smoke path without deploying to GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, or any public artifact host.

Public demo site docs: `docs/public-demo-site.md`

Phase 21 PASS report: `docs/phase-21-pass-report.md`

## Phase 22 Browser ImageBitmap And Texture Source Lifecycle

Phase 22 guide: `docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md`

Phase 22 is selected to add a bounded `@indirection/loaders-web` ImageBitmap/image-source lifecycle contract. It should validate browser-side image loading and final-release disposal through the existing runtime `LoadedAsset.dispose` path without putting browser APIs into core packages and without adding Three texture creation, renderer E2E, WebGL scene smoke, GPU memory estimation, real decoder dependencies, live Sinan integration, real publishing, or deployment.

## Recommended Next Steps

1. Keep `validate:full`, `release:ci-check`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `release:rc-check` as the local release-readiness gates.
2. Execute the selected Phase 22 ImageBitmap lifecycle phase before renderer E2E or Three texture work.
3. Add real npm publishing only after package visibility, names, npm account/scope, public license, versioning, tag policy, GitHub Release policy, provenance upload, signing, workflow permissions, package upload, release ownership, and rollback decisions are accepted.
4. Keep the Phase 19 owner decision blockers visible until a dedicated owner-approved publish phase changes them.
5. Keep read-only release workflow policy checks in place until a dedicated approved publish phase changes them.
6. Keep host-specific integrations outside core packages unless a dedicated adapter package is approved.

Phase 9 PASS report: `docs/phase-9-pass-report.md`

Phase 10 guide: `docs/indirection-phase-10-release-workflow-goal-guide.md`

Phase 11 guide: `docs/indirection-phase-11-publish-preflight-goal-guide.md`

Phase 12 guide: `docs/indirection-phase-12-browser-matrix-goal-guide.md`

Phase 13 guide: `docs/indirection-phase-13-three-gltf-goal-guide.md`

Phase 14 guide: `docs/indirection-phase-14-three-lifecycle-goal-guide.md`

Phase 15 guide: `docs/indirection-phase-15-compressed-capability-goal-guide.md`

Phase 16 guide: `docs/indirection-phase-16-browser-e2e-stress-goal-guide.md`

Phase 17 guide: `docs/indirection-phase-17-release-provenance-goal-guide.md`

Phase 18 guide: `docs/indirection-phase-18-release-ci-policy-goal-guide.md`

Phase 19 guide: `docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md`

Phase 20 guide: `docs/indirection-phase-20-public-docs-onboarding-goal-guide.md`

Phase 21 guide: `docs/indirection-phase-21-public-demo-docs-site-goal-guide.md`

Phase 22 guide: `docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md`

Public demo site docs: `docs/public-demo-site.md`

Phase 21 PASS report: `docs/phase-21-pass-report.md`

Evaluator quickstart: `docs/evaluator-quickstart.md`

Package entrypoint docs: `docs/package-entrypoints.md`

Example workflow docs: `docs/example-workflows.md`

Phase 20 PASS report: `docs/phase-20-pass-report.md`

Release candidate handoff docs: `docs/release-candidate-handoff.md`

Phase 19 PASS report: `docs/phase-19-pass-report.md`

Release CI policy docs: `docs/release-ci-policy.md`

Phase 18 PASS report: `docs/phase-18-pass-report.md`

Release provenance docs: `docs/release-provenance.md`

Phase 17 PASS report: `docs/phase-17-pass-report.md`

Phase 16 PASS report: `docs/phase-16-pass-report.md`

Compressed capability docs: `docs/compressed-capability-source-selection.md`

Phase 15 PASS report: `docs/phase-15-pass-report.md`

Runtime lifecycle docs: `docs/runtime-lifecycle.md`

Three adapter docs: `docs/three-gltf-adapter.md`

Phase 14 PASS report: `docs/phase-14-pass-report.md`

Phase 13 PASS report: `docs/phase-13-pass-report.md`

Phase 10 release workflow policy: `docs/release-workflow.md`

Phase 10 PASS report: `docs/phase-10-pass-report.md`

Phase 11 PASS report: `docs/phase-11-pass-report.md`

Phase 12 PASS report: `docs/phase-12-pass-report.md`
