# Phase 22 Browser ImageBitmap And Texture Source Lifecycle PASS Report

## Goal

Phase 22 adds bounded browser ImageBitmap/image-source lifecycle support in `@indirection/loaders-web` while keeping browser APIs, renderer state, texture creation, and publish/deploy behavior out of core packages and release workflows.

## Completion Status

Status: PASS

`@indirection/loaders-web` now exposes `createImageBitmapLoader` for `image/bitmap` sources. It reads transport bytes, supports injected or browser-native `createImageBitmap` decode, returns an `ImageBitmapResource`, and closes the owned bitmap through the existing runtime `LoadedAsset.dispose` final-release path.

## ImageBitmap Lifecycle Coverage

- loader API: `createImageBitmapLoader`, `ImageBitmapResource`, injected `decode`, optional custom `dispose`, default `Blob` plus `createImageBitmap` decode path, and `image/bitmap` content-type fallback
- runtime lifecycle integration: shared handles reuse one loaded image value; release before the final handle does not close; final release closes once; repeated handle release and repeated `AssetScope.dispose()` do not double-close
- failure and fallback: image decode failures remain `IND_DECODE_FAILED` and use explicit runtime fallback only when declared
- abort: already-aborted loader signals reject before decode
- browser validation: Chromium/Firefox/WebKit E2E decodes a tiny deterministic 1x1 PNG with real browser `createImageBitmap(new Blob(...))`, wraps the bitmap only to count `close()`, and verifies final-release disposal
- smoke validation: `test:browser` and `pack:check` import and execute the new loaders-web API with injected deterministic image decoder boundaries
- documentation: `docs/image-bitmap-lifecycle.md`, README, docs index, runtime lifecycle docs, browser E2E docs, evaluator quickstart, package entrypoints, example workflows, release readiness, changelog, and docs drift guards describe and enforce the boundary

## Architecture Boundary Validation

- core boundary: protocol, schema, compiler, and runtime do not import or expose browser, DOM, `ImageBitmap`, `Blob`, canvas, WebGL, Three, renderer, fetch adapter, `window`, or `document` semantics
- adapter boundary: browser image-source behavior stays in `@indirection/loaders-web`
- lifecycle boundary: runtime owns only generic `LoadedAsset.dispose` final-release execution
- renderer boundary: no Three Texture creation, scene attach, renderer attach, WebGL scene smoke, screenshot comparison, visual approval gate, or GPU memory estimator was added
- decoder/Sinan boundary: no real Draco/KTX2/meshopt/transcoder dependencies, texture compression dependencies, live Sinan Engine integration, or `@indirection/sinan` was added
- release/deploy boundary: no real npm publish, npm login, registry write, Git tag, tag push, GitHub Release, deployment, hosted preview config, signing, Sigstore, npm provenance upload, OIDC publish workflow, package upload workflow, release upload workflow, workflow write permission, or generated release artifact was added
- package policy: all packages remain `private: true`, version `0.0.0`, and `UNLICENSED`

## Validation Commands And Results

- corepack pnpm install --frozen-lockfile: PASS
- corepack pnpm lint: PASS
- corepack pnpm format: PASS
- corepack pnpm check:docs: PASS
- corepack pnpm smoke:site-demo: PASS
- corepack pnpm typecheck: PASS
- corepack pnpm test: PASS
- corepack pnpm test:browser: PASS
- corepack pnpm test:e2e: PASS
- corepack pnpm check:boundaries: PASS
- corepack pnpm smoke:cli: PASS
- corepack pnpm smoke:phase7: PASS
- corepack pnpm pack:check: PASS
- corepack pnpm release:rc-check: PASS
- corepack pnpm release:ci-check: PASS
- corepack pnpm release:provenance: PASS
- corepack pnpm validate:full: PASS
- corepack pnpm release:dry-run: PASS
- corepack pnpm publish:preflight: PASS
- git diff --check: PASS

Focused implementation checks also passed:

- corepack pnpm test -- --run packages/loaders-web: PASS
- corepack pnpm test:e2e:chromium: PASS

## Final Commit

The final pushed commit is recorded in the execution response after this report is committed and pushed.

## Push Result

Expected final push target: `origin/main`.

## Unfinished / Follow-Up Items

- Three Texture creation, renderer E2E, WebGL scene smoke, screenshot comparison, visual approval gates, and GPU memory estimation remain blocked for later owner-approved phases.
- Real decoder/transcoder dependencies and live Sinan Engine integration remain blocked for later owner-approved phases.
- Real npm publishing and deployment remain blocked until owner decisions in `docs/release-candidate-handoff.md` are accepted.

## Risks And Recommendations

- Keep ImageBitmap lifecycle validation in both package smoke and real browser E2E so browser API drift is caught without requiring renderer tests.
- Keep browser-specific ownership policies in loaders-web or future renderer adapters, not runtime core.
- Continue using tiny deterministic image fixtures and avoid committing Playwright artifacts, screenshots, videos, package tarballs, or generated release outputs.
