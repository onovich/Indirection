# Indirection Docs

This index points to the current Phase 0-17 release-candidate, release-hardening, browser E2E matrix, release workflow, publish preflight, browser matrix, runtime lifecycle, Three GLTF adapter, Three lifecycle documentation, compressed capability source-selection documentation, browser E2E stress documentation, release provenance documentation, and selected Phase 18 release CI policy plan.

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
- [Release provenance](release-provenance.md)
- [Compressed capability source selection](compressed-capability-source-selection.md)
- [Runtime lifecycle](runtime-lifecycle.md)
- [Three GLTF adapter](three-gltf-adapter.md)
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
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

`validate:full` runs lint, format, docs drift checks, typecheck, tests, browser-facing loader smoke, real browser E2E in Chromium, Firefox, and WebKit, boundary checks, CLI smoke, Phase 7 example smoke, and package tarball/import smoke.

`release:provenance`, `release:dry-run`, and `publish:preflight` remain explicit release-readiness gates because they audit package artifacts, publish, registry, and tag side effects separately from the main validation matrix.
