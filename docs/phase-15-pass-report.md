# Phase 15 Compressed Capability Source Selection PASS Report

## Goal

Phase 15 made Draco, KTX2, and meshopt readiness visible as declarative capability/source-selection contracts without adding real decoder dependencies, renderer work, live Sinan Engine integration, or real npm publishing.

## Completion Status

Status: PASS

Buffer rounds 13-15 were not consumed. The implementation converged without needing capability matching, report drift, docs, package smoke, boundary, or release preflight repair buffer rounds.

## Capability Source Selection Coverage

- Schema accepts `when.capability` values such as `draco`, `ktx2`, and `meshopt` as string-set data.
- Schema rejects object-shaped capability values, keeping decoder objects, scripts, functions, and expressions out of the manifest boundary.
- Compiler importer preserves compressed capability conditions as catalog data.
- Compiler validation accepts capability-gated sources only when exactly one default source exists and the default source is last.
- Compiler variant diagnostics now include stable `causeCode: "variant"` for invalid source/default conditions.
- Runtime selects compressed sources when the matching capability is present in `ResolutionContext.capability`.
- Runtime uses declaration-order first match, independent of the order of capability strings supplied by the host.
- Runtime selects the uncompressed default source when decoder capabilities are absent.
- Runtime keeps default source selection distinct from explicit runtime fallback: a selected compressed source failure records `IND_DECODE_FAILED` and uses the declared fallback asset instead of silently retrying the default source.

## Report And Smoke Coverage

- `compileNormalizedModel(...).report.assets[].sources` now exposes source `index`, `url`, `default`, and optional `when` conditions in a machine-readable shape.
- Report shape contract tests guard the new source-selection fields.
- Package smoke compiles a packed-consumer manifest with `draco`, `ktx2`, `meshopt`, and default sources, then verifies packed compiler/runtime behavior for compressed selection and default selection.
- Package smoke continues to import all 9 workspace packages from tarballs.

## Documentation Coverage

- Compressed capability docs: `docs/compressed-capability-source-selection.md`
- Three adapter docs: `docs/three-gltf-adapter.md`
- Report shape docs: `docs/report-json-shapes.md`
- Release readiness: `docs/release-readiness.md`
- Docs drift guard covers the Phase 15 guide, compressed capability docs, package smoke keywords, validation commands, and this PASS report.

## Core Architecture Boundary Validation

- Protocol, schema, compiler, and runtime core remain free of Three.js, GLTFLoader, decoder objects, DOM, fetch, window, document, and renderer-specific APIs.
- `@indirection/three` documents host-owned decoder setup but does not create Draco, KTX2, or meshopt decoder instances.
- Real decoder packages, transcoders, texture pipeline work, ImageBitmap lifecycle, GPU memory estimation, renderer E2E, real WebGL scene smoke, live Sinan Engine integration, and `@indirection/sinan` remain out of scope.
- Real npm publish, npm login, registry writes, Git tags, and GitHub Releases were not performed.

## Validation Commands And Results

- `corepack pnpm check:docs`: PASS
- `corepack pnpm test -- --run packages/schema packages/compiler`: PASS
- `corepack pnpm test -- --run packages/runtime`: PASS
- `corepack pnpm test -- --run packages/compiler`: PASS
- `corepack pnpm pack:check`: PASS, 9 packages packed and imported
- `corepack pnpm validate:full`: PASS, including lint, format, docs, typecheck, 33 Vitest files and 114 tests, browser smoke, Chromium/Firefox/WebKit E2E, boundaries, CLI smoke, Phase 7 smoke, and package smoke
- `corepack pnpm release:dry-run`: PASS, 9 packages audited, packed, and verified without publish or tag side effects
- `corepack pnpm publish:preflight`: PASS, 9 packages audited without publish, npm login, registry write, or tag side effects
- `git diff --check`: PASS

## Final Commit

The final pushed commit is recorded in the execution response after this report is committed and pushed.

## Push Result

Expected final push target: `origin/main`.

## Unfinished / Follow-Up Items

- No Phase 15 PASS blockers remain.
- Real npm publish remains blocked until package visibility, npm account/scope, public license, versioning, tag, GitHub Release, and rollback decisions are explicitly accepted.
- Live Sinan Engine integration remains a future phase candidate.
- Real Draco/KTX2/meshopt decoder integration, transcoders, texture pipeline, ImageBitmap lifecycle, GPU memory estimator, renderer E2E, `@indirection/sinan`, and real WebGL scene smoke remain future hardening candidates.

## Next Phase

Planner selection after PASS: pending architect/strategist next guide.

The executor should not invent Phase 16 locally. The architect/strategist flow must select and dispatch the next approved goal guide before implementation continues.

## Risks And Recommendations

- Keep capability values declarative and host-owned; do not make core packages detect decoder support.
- Keep default source selection and runtime error fallback separate in docs, tests, and diagnostics.
- Keep package smoke exercising compressed capability source selection from packed tarballs.
- Keep real decoder dependencies and renderer E2E behind a future approved adapter-focused phase.
