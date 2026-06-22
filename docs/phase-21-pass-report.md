# Phase 21 Public Website, Demo Packaging, And Docs Site Rehearsal PASS Report

## Goal

Phase 21 adds a deterministic local public website/docs-site/demo rehearsal for repository evaluation without deployment, publishing, registry access, hosted infrastructure, or generated release artifacts.

## Completion Status

Status: PASS

The local public demo site rehearsal is implemented through `corepack pnpm site:demo` and validated through `corepack pnpm smoke:site-demo`, which is included in `validate:full`.

## Public Rehearsal Coverage

- local site/demo entrypoint: `docs/public-demo-site.md`
- build/preview/smoke command: `corepack pnpm site:demo` builds `build/public-demo-site/index.html`; `corepack pnpm smoke:site-demo` validates the rehearsal and removes smoke output
- evaluator docs integration: README, docs index, evaluator quickstart, package entrypoints, example workflows, release readiness, and release candidate handoff link the local rehearsal path
- generated artifact policy: `build/` is ignored; generated site output, temporary smoke output, deployment output, tarballs, provenance output, RC JSON, Playwright artifacts, `dist/`, and `.tsbuildinfo` must not be committed
- no-deploy/no-publish messaging: docs and generated HTML explicitly block GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, real npm publish, registry writes, tags, GitHub Releases, signing, OIDC, workflow write permissions, and package uploads
- docs drift integration: `scripts/docs-drift-check.mjs` guards Phase 21 guide pointers, site/demo docs, package scripts, smoke command, source docs, generated artifact policy, no-deploy/no-publish messaging, changelog, and this PASS report

## Architecture Boundary Validation

- presentation boundary: Phase 21 work stays in docs, package scripts, and local smoke tooling
- source-of-truth docs boundary: generated `index.html` and `demo-manifest.json` present source docs but do not replace them
- core package boundary: protocol, schema, compiler, runtime, and adapters do not absorb website, deployment, or publish-decision state
- no-deploy boundary: no GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, hosted preview configuration, deployment secret, deployment environment, artifact upload, or workflow write permission was added
- no-publish boundary: all packages remain `private: true`, version `0.0.0`, and `UNLICENSED`; Real npm publish, npm login, registry write, Git tag, GitHub Release, signing, Sigstore, npm provenance upload, OIDC publish, and package upload remain blocked
- deferred publish/Sinan/decoder/renderer scope: live Sinan integration, `@indirection/sinan`, real decoder dependencies, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, and WebGL scene smoke remain out of scope

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

## Final Commit

The final pushed commit is recorded in the execution response after this report is committed and pushed.

## Push Result

Expected final push target: `origin/main`.

## Unfinished / Follow-Up Items

- Real deployment remains blocked until an owner-approved deployment phase selects hosting, permissions, retention, and artifact policy.
- Real npm publishing remains blocked until owner decisions in `docs/release-candidate-handoff.md` are accepted.

## Risks And Recommendations

- Keep `smoke:site-demo` in `validate:full` so public presentation drift is caught with the normal local gate.
- Keep generated demo output under ignored `build/` paths and never treat it as release evidence or hosted preview output.

## Next Phase

Planner selection after PASS: Phase 22 Browser ImageBitmap And Texture Source Lifecycle.

Guide: `docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md`
