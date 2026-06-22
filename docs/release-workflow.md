# Release Workflow

This document records the Phase 10 release dry-run policy for v0.1 package readiness. It is a release-preparation contract, not permission to publish packages or create release tags.

## Phase 10 Safety Policy

- Do not run a real `npm publish`.
- Do not create a real Git tag or GitHub Release.
- Do not change package names or npm scope without an accepted release decision.
- Keep package manifests private until a later publish-preflight phase explicitly accepts public visibility.
- Keep generated tarballs, temporary consumers, release archives, npm caches, Playwright artifacts, `dist/`, and `*.tsbuildinfo` out of git.

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

## Promotion Rules

A package can move from dry-run candidate to real publish candidate only when:

- Required package metadata is complete and validated.
- `pack:check` verifies exports, files, tarball contents, CLI bin paths, and temporary consumer imports.
- `release:dry-run` confirms no real publish, no tag creation, no registry write, and no dirty workspace artifacts.
- `validate:full` and browser E2E still pass.
- Package visibility, npm permissions, and release tag policy have been accepted outside the implementation executor lane.
