# Indirection Docs

This index points to the current Phase 0-8 release-candidate and release-hardening documentation.

## Core Project

- [Repository README](../README.md)
- [Current technical architecture and development plan v0.2](Indirection_技术架构与开发计划_v0.2.md)
- [Architecture and technical design v0.1](Indirection_寻址_架构与技术选型设计_v0.1.md)
- [Phase 0-7 Big Goal execution guide](indirection-phase-0-7-big-goal-execution-guide.md)
- [Phase 8 Release Hardening Goal guide](indirection-phase-8-release-hardening-goal-guide.md)
- [Phase 0-7 PASS report](phase-0-7-pass-report.md)
- [Phase 7 integration and package smoke](phase-7-integration.md)
- [Report JSON shapes](report-json-shapes.md)
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
git diff --check
```

`validate:full` runs typecheck, tests, browser-facing loader smoke, boundary checks, Phase 7 example smoke, and package tarball/import smoke.
