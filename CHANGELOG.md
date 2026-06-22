# Changelog

## 0.0.0-phase-0-7-rc - 2026-06-20

- Added a pnpm workspace with protocol, schema, compiler, runtime, testkit, loaders-web, three, vite, and cli packages.
- Added deterministic manifest import, canonical catalog hashing, validation diagnostics, compile reports, and vanilla fixtures.
- Added runtime catalog store, resolver chain, resource table lifecycle, scope/handle ownership, fake loaders, in-flight deduplication, abort, fallback, dependency retain/release, and debug snapshots.
- Added Sinan POC-1 importer/report fixtures plus POC-2 adapter facade smoke without moving Sinan-specific API into core packages.
- Added Phase 7 loaders-web, cache adapter, Three peer-boundary loader skeleton, Vite virtual catalog plugin, CLI commands, browser-facing smoke, and package tarball/import smoke.
- Added `validate:full` as the local release-candidate validation matrix.

Validation:

```powershell
corepack pnpm validate:full
git diff --check
```

## 0.0.0-phase-8-hardening - 2026-06-21

- Replaced placeholder `lint` and `format` scripts with lightweight zero-dependency quality gates.
- Disabled `skipLibCheck` and kept the TypeScript matrix passing.
- Added report JSON shape documentation and contract tests.
- Added CLI, docs drift, package file whitelist, and GitHub Actions validation gates.
- Documented release readiness and v0.1 remaining risks.
- Added the Phase 8 PASS report.

Validation:

```powershell
corepack pnpm validate:full
git diff --check
```

## 0.0.0-phase-9-browser-e2e - 2026-06-22

- Added Playwright Chromium E2E coverage for browser-facing loader, cache, runtime lifecycle, fallback diagnostics, and virtual catalog behavior.
- Added `BrowserCacheStorageAdapter` coverage against real `window.caches`.
- Added `test:e2e` to the local `validate:full` release gate.
- Updated GitHub Actions to install and cache Playwright Chromium.
- Added browser E2E docs and the Phase 9 PASS report.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm test:e2e
git diff --check
```

## 0.0.0-phase-10-release-dry-run - 2026-06-22

- Added release workflow dry-run policy, package visibility policy, and release versioning ADR.
- Added package metadata across workspace package manifests while keeping all packages `private: true`.
- Extended `pack:check` to validate package metadata, tarball contents, temporary consumer imports, and the installed CLI bin.
- Added `release:dry-run` to audit private package policy, version policy, workspace dependency ranges, release docs, package smoke, and no publish/tag side effects.
- Added a manual GitHub Actions `Release Dry Run` workflow with read-only repository permissions.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
git diff --check
```

## 0.0.0-phase-11-publish-preflight - 2026-06-22

- Added publish preflight policy for package visibility, npm scope/account/permission, license, tag, GitHub Release, rollback, and versioning decisions.
- Added `publish:preflight` to audit package manifests, docs, workflow permissions, tracked npm credentials, generated artifacts, and no publish/tag side effects.
- Added a manual GitHub Actions `Publish Preflight` workflow with read-only repository permissions.
- Extended docs drift checks to guard Phase 11 publish preflight docs, workflow commands, and release-readiness pointers.
- Added the Phase 11 PASS report while keeping all packages `private: true` and `UNLICENSED`.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 0.0.0-phase-17-release-provenance - 2026-06-22

- Added `release:provenance` for deterministic local dry-run artifact provenance across all 9 workspace packages.
- Recorded package tarball sha256, byte size, file list, exports, CLI bin entries, package metadata, validation command evidence, and no-publish policy evidence without committing generated reports.
- Integrated provenance verification into `release:dry-run`.
- Added release provenance docs, report shape documentation, docs drift guards, and the Phase 17 PASS report while keeping real npm publish, login, registry writes, Git tags, GitHub Releases, signing, Sigstore, npm provenance upload, and OIDC publish workflows out of scope.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 0.0.0-phase-18-release-ci-policy - 2026-06-23

- Added `release:ci-check` for static GitHub Actions release policy parity across validate, release dry-run, and publish preflight workflows.
- Hardened workflows with explicit read-only repository permissions and documented command parity for install, CI policy, provenance, dry-run, preflight, and diff checks.
- Integrated the CI policy checker into `release:dry-run` and `publish:preflight`.
- Added release CI policy docs, report shape documentation, docs drift guards, and the Phase 18 PASS report while keeping real npm publish, login, registry writes, Git tags, GitHub Releases, package uploads, signing, Sigstore, npm provenance upload, OIDC publish, and workflow write permissions out of scope.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 0.0.0-phase-19-release-candidate-rehearsal - 2026-06-23

- Added `release:rc-check` for deterministic no-publish release-candidate rehearsal and owner decision handoff.
- Summarized package candidacy, validation gate evidence, owner decision blockers, blocked real-publish actions, rollback policy, and release ownership handoff without committing generated RC JSON.
- Reused release CI policy and release provenance helper reports while keeping `release:dry-run` and `publish:preflight` as source-of-truth gates.
- Added release candidate handoff docs, report shape documentation, docs drift guards, and the Phase 19 PASS report while keeping real npm publish, npm login, registry writes, Git tags, GitHub Releases, package uploads, artifact uploads, signing, Sigstore, npm provenance upload, OIDC publish, and workflow write permissions out of scope.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
git diff --check
```

## 0.0.0-phase-20-public-docs-onboarding - 2026-06-23

- Added the evaluator quickstart for fresh local checkout evaluation, CLI tours, browser E2E, fast smoke commands, generated artifact policy, and no-publish release-readiness gates.
- Added package entrypoint documentation for all 9 workspace packages, including ownership boundaries, local consumption guidance, focused package tests, and `pack:check` consumer-readiness smoke.
- Added example workflow documentation connecting manifest validation, catalog compilation, runtime loading and lifecycle, browser loaders/cache, Vite virtual catalogs, Three GLTF parser injection, compressed capability selection, and release-candidate gates.
- Updated README, docs index, release readiness, release candidate handoff, docs drift guards, and the Phase 20 PASS report while keeping real npm publish, npm login, registry writes, Git tags, GitHub Releases, package uploads, signing, Sigstore, npm provenance upload, OIDC publish, workflow write permissions, `private: true`, and `UNLICENSED` unchanged.

Validation:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm validate:full
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
git diff --check
```

## 0.0.0-phase-21-public-demo-docs-site - 2026-06-23

- Added a zero-dependency local public demo site rehearsal through `site:demo`, generating `build/public-demo-site/index.html` and `demo-manifest.json` from repository source docs.
- Added `smoke:site-demo` and wired it into `validate:full` so the local docs-site rehearsal, source-doc anchors, package-entrypoint evidence, and no-deploy/no-publish messaging are checked automatically.
- Added public demo site docs and connected the rehearsal path from README, docs index, evaluator quickstart, package entrypoints, example workflows, release readiness, and release candidate handoff.
- Extended docs drift guards and the Phase 21 PASS report while keeping generated site output ignored and preserving no GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, npm publish, registry write, Git tag, GitHub Release, signing, OIDC, workflow write permission, `private: true`, and `UNLICENSED` boundaries.

Validation:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm smoke:site-demo
corepack pnpm validate:full
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
git diff --check
```

## 0.0.0-phase-12-browser-matrix - 2026-06-22

- Expanded Playwright E2E from Chromium-only to Chromium, Firefox, and WebKit projects.
- Added single-browser debug scripts for Chromium, Firefox, and WebKit.
- Neutralized browser fixture data so assertions no longer encode Chromium-specific payload names.
- Updated GitHub Actions to install all three Playwright browser dependencies before `validate:full`.
- Extended docs drift checks to guard the browser matrix, CI install command, debug scripts, and fixture data neutrality.
- Added the Phase 12 PASS report while keeping real npm publish, npm login, registry writes, Git tags, and GitHub Releases out of scope.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm test:e2e
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 0.0.0-phase-13-three-gltf - 2026-06-22

- Upgraded `@indirection/three` from a peer-boundary skeleton to a parser-injection GLTF adapter.
- Added parser input coverage for raw transport bytes, plain `ArrayBuffer`, `assetId`, `sourceUrl`, source metadata, `basePath`, and optional `contentType`.
- Added real `GLTFLoader.parseAsync` tests for a minimal glTF fixture plus invalid glTF fallback coverage preserving `IND_DECODE_FAILED`.
- Extended package smoke to exercise the packed `@indirection/three` parser API with a parser stub.
- Added Three GLTF adapter docs and the Phase 13 PASS report while keeping Three.js out of runtime core.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 0.0.0-phase-14-three-lifecycle - 2026-06-22

- Made runtime `LoadedAsset.dispose` executable through final handle release and `AssetScope.dispose()`.
- Added disposer coverage for double release, shared handles, in-flight dedup, fallback, loader failure, and disposer failure states.
- Documented runtime snapshot lifecycle semantics for `hasDisposer`, `released`, `evictable`, and `disposed`.
- Added `@indirection/three` lifecycle helpers for explicit owned-resource disposal, host-injected instantiation, and read-only animation metadata extraction.
- Extended Three adapter docs, docs drift checks, and package smoke to cover the lifecycle API surface from packed tarballs.
- Added the Phase 14 PASS report while keeping Three.js out of runtime core and avoiding real npm publish, login, registry writes, Git tags, and GitHub Releases.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 0.0.0-phase-15-compressed-capability - 2026-06-22

- Added declarative compressed capability source-selection coverage for `draco`, `ktx2`, and `meshopt` without real decoder dependencies.
- Hardened schema/compiler tests so capability conditions remain string-set data and invalid variants carry stable `causeCode: "variant"` diagnostics.
- Added runtime tests for compressed source selection, default uncompressed source selection, declaration-order matching, and selected-source failure through explicit runtime fallback.
- Extended compiler reports with machine-readable source selection fields.
- Added compressed capability docs, Three adapter host decoder guidance, docs drift guards, and packed package smoke coverage for capability source selection.
- Added the Phase 15 PASS report while keeping real npm publish, login, registry writes, Git tags, GitHub Releases, live Sinan Engine integration, and real decoder packages out of scope.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

## 0.0.0-phase-16-browser-e2e-stress - 2026-06-22

- Added bounded Chromium, Firefox, and WebKit E2E stress coverage for repeated runtime acquire/release and multi-handle `AssetScope.dispose()`.
- Added browser Cache Storage stress coverage for catalog-version isolation, selective cleanup, retained entries, and final cleanup.
- Added browser E2E coverage for compressed capability source selection with tiny text fixture data.
- Added structured `window.__indirectionE2E.diagnostics` and the `indirection-e2e-result.json` Playwright attachment for failure inspection.
- Documented Playwright artifact diagnostics and extended docs drift guards for browser stress coverage.
- Added the Phase 16 PASS report while keeping renderer E2E, real decoder packages, live Sinan Engine integration, real npm publish, login, registry writes, Git tags, and GitHub Releases out of scope.

Validation:

```powershell
corepack pnpm validate:full
corepack pnpm test:e2e:chromium
corepack pnpm test:e2e:firefox
corepack pnpm test:e2e:webkit
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```
