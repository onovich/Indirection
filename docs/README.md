# Indirection Docs

This index points to the current Phase 0-11 release-candidate, release-hardening, browser E2E, release workflow, and publish preflight planning documentation.

## Core Project

- [Repository README](../README.md)
- [Current technical architecture and development plan v0.2](Indirection_技术架构与开发计划_v0.2.md)
- [Architecture and technical design v0.1](Indirection_寻址_架构与技术选型设计_v0.1.md)
- [Phase 0-7 Big Goal execution guide](indirection-phase-0-7-big-goal-execution-guide.md)
- [Phase 8 Release Hardening Goal guide](indirection-phase-8-release-hardening-goal-guide.md)
- [Phase 9 Real Browser E2E Goal guide](indirection-phase-9-browser-e2e-goal-guide.md)
- [Phase 10 Release Workflow Goal guide](indirection-phase-10-release-workflow-goal-guide.md)
- [Phase 11 Publish Preflight Goal guide](indirection-phase-11-publish-preflight-goal-guide.md)
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
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

`validate:full` runs lint, format, docs drift checks, typecheck, tests, browser-facing loader smoke, real browser E2E, boundary checks, CLI smoke, Phase 7 example smoke, and package tarball/import smoke.

`release:dry-run` and `publish:preflight` remain explicit release-readiness gates because they audit publish and tag side effects separately from the main validation matrix.
