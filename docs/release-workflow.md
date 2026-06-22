# Release Workflow

This document records the Phase 10 release dry-run policy for v0.1 package readiness. It is a release-preparation contract, not permission to publish packages or create release tags.

## Phase 10 Safety Policy

- Do not run a real `npm publish`.
- Do not create a real Git tag or GitHub Release.
- Do not change package names or npm scope without an accepted release decision.
- Keep package manifests private until a later publish-preflight phase explicitly accepts public visibility.
- Keep generated tarballs, temporary consumers, release archives, npm caches, Playwright artifacts, `dist/`, and `*.tsbuildinfo` out of git.

Run the local dry-run gate with:

```powershell
corepack pnpm release:dry-run
```

The dry-run audits Phase 10 private package policy, version policy, workspace dependency ranges, documentation policy, real publish script absence, forbidden tracked release artifacts, package build, package tarball contents, temporary consumer imports, and no Git status or tag side effects.

The same core gate is available in GitHub Actions through the manual `Release Dry Run` workflow. It uses read-only repository permissions and does not publish packages or create tags.

## Package Visibility Policy

All workspace packages remain `private: true` during Phase 10. The visibility target below describes release intent for dry-run validation only.

| Package | v0.1 visibility target | Current manifest state | Release stance |
|---|---|---|---|
| `@indirection/protocol` | Public candidate | `private: true` | Core protocol surface for `AssetId`, diagnostics, and shared contracts. |
| `@indirection/schema` | Public candidate | `private: true` | Tooling/schema validation package; Zod stays outside runtime core. |
| `@indirection/compiler` | Public candidate | `private: true` | Manifest/importer to deterministic catalog and report generation. |
| `@indirection/runtime` | Public candidate | `private: true` | Runtime lifecycle core; must stay free of DOM, implicit fetch, Zod, Three, Vite, React, and Node-specific imports. |
| `@indirection/loaders-web` | Public adapter candidate | `private: true` | Browser/Web loader helpers and cache adapters outside runtime core. |
| `@indirection/three` | Public optional-peer adapter candidate | `private: true` | Three boundary package; `three` remains an optional peer. |
| `@indirection/vite` | Public optional-peer tooling candidate | `private: true` | Vite virtual catalog integration; `vite` remains an optional peer. |
| `@indirection/cli` | Public tooling candidate | `private: true` | CLI for validate/build/report/inspect workflows. |
| `@indirection/testkit` | Public developer-support candidate | `private: true` | Test fixtures and package smoke helpers for consumers; may be deferred if its public support contract is not accepted before v0.1. |

## Non-Publishable Surfaces

- The root `indirection` workspace package is private and must not be published.
- `examples/`, `fixtures/`, `tests/`, `docs/`, and `scripts/` are repository assets, not standalone published packages.
- No `@indirection/sinan` package is approved in Phase 10. Sinan-specific work remains in docs, fixtures, tests, or adapter POC boundaries until a dedicated adapter package is accepted.
- Generated package tarballs and temporary consumer projects are dry-run artifacts only.

## Naming And Scope Policy

- Keep the package namespace as `@indirection/*` for all dry-run checks.
- Do not switch to another npm organization scope until ownership, permissions, and package visibility are explicitly accepted.
- Package versioning and protocol versioning remain separate decisions.
- A later real-publish phase must decide whether to remove `private: true`, keep selected packages private, or defer individual packages.

Versioning decision: Phase 10 uses the lightweight policy in `docs/release-versioning-adr.md` instead of adding Changesets. Revisit Changesets only after npm visibility, permissions, and public license decisions are accepted.

## Package Metadata Rules

Every workspace package must define:

- `name`, `version`, `private`, `license`, `type`, `sideEffects`, `main`, `types`, `exports`, `files`, `repository`, `homepage`, `keywords`, and `engines.node`.
- `repository.directory` matching the package directory under `packages/`.
- `files` limited to built `dist/**/*.d.ts`, `dist/**/*.d.ts.map`, `dist/**/*.js`, and `dist/**/*.js.map` outputs.
- `bin` paths for CLI packages, with each path pointing at a built file.
- optional peer metadata for every declared peer dependency.

Phase 10 uses `UNLICENSED` while packages remain private. A real publish-preflight phase must replace that with an accepted SPDX license and matching repository license file before public release.

Phase 11 keeps this state unchanged: `UNLICENSED` means private dry-run/preflight only, not public publish readiness.

`pack:check` must pack every workspace package, install those tarballs into a temporary consumer, import every public ESM entrypoint, and execute the installed `indirection` CLI bin from that consumer.

## Promotion Rules

A package can move from dry-run candidate to real publish candidate only when:

- Required package metadata is complete and validated.
- `pack:check` verifies exports, files, tarball contents, CLI bin paths, and temporary consumer imports.
- `release:dry-run` confirms no real publish, no tag creation, no registry write, and no dirty workspace artifacts.
- `validate:full` and browser E2E still pass.
- Package visibility, npm permissions, and release tag policy have been accepted outside the implementation executor lane.

## Local Release Dry-Run Checklist

Run this checklist before any release-readiness handoff:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm validate:full
corepack pnpm release:dry-run
git diff --check
git status --short --branch
```

Expected result:

- `validate:full` passes, including browser E2E and package smoke.
- `release:dry-run` reports 9 packages audited, packed, and verified without publish or tag side effects.
- `git diff --check` is clean.
- `git status --short --branch` has no tracked or untracked release artifacts.

## Npm Permission Preflight For A Later Real Release

Do not run these checks as part of Phase 10 unless a later publish-preflight owner explicitly requests them. They are documented so the next phase has a concrete gate before removing `private: true`.

Before a real publish phase, confirm:

- The npm account is known and accepted for this project.
- The `@indirection` organization or package scope ownership is accepted.
- The intended package visibility for each workspace package is accepted.
- The public SPDX license and repository license file are accepted.
- npm 2FA and token policy are accepted.
- The release tag and GitHub Release policy are accepted.
- `npm publish --dry-run` or `pnpm publish --dry-run` is allowed only after those decisions and must still avoid uploading to the registry.

## No-Publish And Rollback Policy

Phase 10 creates no npm artifact and no Git tag, so rollback is repository-only:

- If local dry-run validation fails, fix the failing metadata, package smoke, docs, or script gate before committing.
- If a bad dry-run-only commit is pushed, use a normal follow-up fix commit or an explicitly requested git revert.
- Do not run `npm unpublish` during Phase 10 because Phase 10 must not publish anything.
- If a future phase accidentally publishes a package, stop release work, record the package name, version, npm account, timestamp, and command output, then follow npm's current unpublish/deprecate policy under a dedicated incident decision.
