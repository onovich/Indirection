# Indirection Docs

This index points to the current Phase 0-21 release-candidate, release-hardening, browser E2E matrix, release workflow, publish preflight, browser matrix, runtime lifecycle, Three GLTF adapter, Three lifecycle documentation, compressed capability source-selection documentation, browser E2E stress documentation, release provenance documentation, release CI policy documentation, no-publish release-candidate rehearsal handoff, public evaluator onboarding docs, local public website/demo docs-site rehearsal, and selected Phase 22 browser ImageBitmap lifecycle plan.

## Core Project

- [Repository README](../README.md)
- [Current technical architecture and development plan v0.2](Indirection_技术架构与开发计划_v0.2.md)
- [Architecture and technical design v0.1](Indirection_寻址_架构与技术选型设计_v0.1.md)
- [Phase 0-7 Big Goal execution guide](indirection-phase-0-7-big-goal-execution-guide.md)
- [Phase 8 Release Hardening Goal guide](indirection-phase-8-release-hardening-goal-guide.md)
- [Phase 9 Real Browser E2E Goal guide](indirection-phase-9-browser-e2e-goal-guide.md)
- [Phase 10 Release Workflow Goal guide](indirection-phase-10-release-workflow-goal-guide.md)
- [Phase 11 Publish Preflight Goal guide](indirection-phase-11-publish-preflight-goal-guide.md)
- [Phase 12 Browser Matrix Goal guide](indirection-phase-12-browser-matrix-goal-guide.md)
- [Phase 13 Three GLTF Goal guide](indirection-phase-13-three-gltf-goal-guide.md)
- [Phase 14 Three Lifecycle Goal guide](indirection-phase-14-three-lifecycle-goal-guide.md)
- [Phase 15 Compressed Capability Goal guide](indirection-phase-15-compressed-capability-goal-guide.md)
- [Phase 16 Browser E2E Stress Goal guide](indirection-phase-16-browser-e2e-stress-goal-guide.md)
- [Phase 17 Release Provenance Goal guide](indirection-phase-17-release-provenance-goal-guide.md)
- [Phase 18 Release CI Policy Goal guide](indirection-phase-18-release-ci-policy-goal-guide.md)
- [Phase 19 Release Candidate Rehearsal Goal guide](indirection-phase-19-release-candidate-rehearsal-goal-guide.md)
- [Phase 20 Public Docs Onboarding Goal guide](indirection-phase-20-public-docs-onboarding-goal-guide.md)
- [Phase 21 Public Demo Docs Site Goal guide](indirection-phase-21-public-demo-docs-site-goal-guide.md)
- [Phase 22 ImageBitmap Lifecycle Goal guide](indirection-phase-22-image-bitmap-lifecycle-goal-guide.md)
- [Evaluator quickstart](evaluator-quickstart.md)
- [Package entrypoints](package-entrypoints.md)
- [Example workflows](example-workflows.md)
- [Public demo site rehearsal](public-demo-site.md)
- [Release CI policy](release-ci-policy.md)
- [Release provenance](release-provenance.md)
- [Release candidate handoff](release-candidate-handoff.md)
- [Compressed capability source selection](compressed-capability-source-selection.md)
- [Runtime lifecycle](runtime-lifecycle.md)
- [Three GLTF adapter](three-gltf-adapter.md)
- [Phase 21 PASS report](phase-21-pass-report.md)
- [Phase 20 PASS report](phase-20-pass-report.md)
- [Phase 19 PASS report](phase-19-pass-report.md)
- [Phase 18 PASS report](phase-18-pass-report.md)
- [Phase 17 PASS report](phase-17-pass-report.md)
- [Phase 16 PASS report](phase-16-pass-report.md)
- [Phase 15 PASS report](phase-15-pass-report.md)
- [Phase 14 PASS report](phase-14-pass-report.md)
- [Phase 13 PASS report](phase-13-pass-report.md)
- [Phase 12 PASS report](phase-12-pass-report.md)
- [Phase 11 PASS report](phase-11-pass-report.md)
- [Phase 10 PASS report](phase-10-pass-report.md)
- [Publish preflight policy](publish-preflight-policy.md)
- [Release workflow dry-run policy](release-workflow.md)
- [Release versioning ADR](release-versioning-adr.md)
- [Browser E2E validation](browser-e2e.md)
- [Phase 9 PASS report](phase-9-pass-report.md)
- [Phase 8 PASS report](phase-8-pass-report.md)
- [Phase 0-7 PASS report](phase-0-7-pass-report.md)
- [Phase 7 integration and package smoke](phase-7-integration.md)
- [Report JSON shapes](report-json-shapes.md)
- [Release readiness](release-readiness.md)
- [R&D plan after Sinan alignment](rd-plan-sinan-alignment-2026-06-20.md)

## Sinan Cooperation

- [RFC-001 Sinan asset boundary](sinan-cooperation/rfc-001-sinan-asset-boundary.md)
- [Sinan POC-1 compatibility note](sinan-cooperation/indirection-poc-1-compatibility-note.md)
- [Sinan POC-1 usage](sinan-cooperation/indirection-poc-1-usage.md)
- [Sinan POC-2 adapter boundary](sinan-cooperation/indirection-poc-2-adapter-boundary.md)
- [Sinan technical advisory](sinan-cooperation/sinan-technical-advisory-2026-06-20.md)
- [Sinan business letter](sinan-cooperation/sinan-business-letter-2026-06-20.md)

## Validation Entrypoints

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

`validate:full` runs lint, format, docs drift checks, local public demo site smoke, typecheck, tests, browser-facing loader smoke, real browser E2E in Chromium, Firefox, and WebKit, boundary checks, CLI smoke, Phase 7 example smoke, and package tarball/import smoke.

`release:ci-check`, `release:provenance`, `release:dry-run`, `publish:preflight`, and `release:rc-check` remain explicit release-readiness gates because they audit workflow permissions, package artifacts, publish, registry, tag side effects, and owner decision handoff separately from the main validation matrix.

The public evaluator path starts at [Evaluator quickstart](evaluator-quickstart.md) and can be previewed locally with [Public demo site rehearsal](public-demo-site.md). It keeps the no-publish and no-deploy boundaries visible: all packages remain `private: true`, `UNLICENSED`, local-checkout-only, and not deployed until a dedicated owner-approved phase changes that policy.
