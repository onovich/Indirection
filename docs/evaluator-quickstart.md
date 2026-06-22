# Evaluator Quickstart

This guide is for a technical evaluator running Indirection from a local checkout. The workspace packages are still private and unpublished: do not install them from npm, do not run `npm publish`, and do not remove `private: true`.

## What You Can Evaluate Locally

- Manifest parsing and schema validation.
- Deterministic catalog compilation and report output.
- Runtime source selection, fallback, in-flight loading, scope/handle lifecycle, and disposal.
- Browser-facing loaders, Cache Storage adapters, and Chromium/Firefox/WebKit E2E behavior.
- Vite virtual catalog generation.
- Three GLTF adapter parsing through injected parser boundaries.
- Compressed capability source selection for `draco`, `ktx2`, and `meshopt` as declarative catalog data.
- Package tarball/import smoke and no-publish release readiness gates.

## Fresh Local Checkout

Prerequisites:

- Node.js 22 or newer.
- Corepack enabled.
- A local checkout of this repository.

Install workspace dependencies:

```powershell
corepack pnpm install --frozen-lockfile
```

Run the main local validation matrix:

```powershell
corepack pnpm validate:full
```

`validate:full` runs lint, format, docs drift checks, typecheck, Vitest, browser smoke, Chromium/Firefox/WebKit E2E, boundary checks, CLI smoke, Phase 7 example smoke, and package smoke.

If Playwright browsers are missing on a new machine, install them once:

```powershell
corepack pnpm exec playwright install chromium firefox webkit
```

## Fast Evaluation Path

Use this path when you want a quick but meaningful tour before the full matrix:

```powershell
corepack pnpm check:docs
corepack pnpm typecheck
corepack pnpm smoke:cli
corepack pnpm smoke:phase7
corepack pnpm pack:check
```

- `smoke:cli` builds the CLI and exercises `validate`, `build`, `report`, and `inspect` against `fixtures/vanilla/indirection.manifest.json`.
- `smoke:phase7` runs `examples/phase7-advanced-loaders.mjs`, covering manifest import, catalog compilation, runtime loading, browser-style loaders, cache adapter behavior, Vite virtual catalog output, and the Three GLTF adapter boundary.
- `pack:check` packs all 9 workspace packages into temporary tarballs, installs them into a temporary consumer, imports every package entrypoint, runs a packaged CLI smoke, and removes generated artifacts on success.

## CLI Tour

Build first:

```powershell
corepack pnpm build
```

Validate a manifest:

```powershell
node packages/cli/dist/bin.js validate --manifest fixtures/vanilla/indirection.manifest.json
```

Build a catalog:

```powershell
node packages/cli/dist/bin.js build --manifest fixtures/vanilla/indirection.manifest.json
```

Print a machine-readable report:

```powershell
node packages/cli/dist/bin.js report --manifest fixtures/vanilla/indirection.manifest.json
```

Inspect one asset:

```powershell
node packages/cli/dist/bin.js inspect --manifest fixtures/vanilla/indirection.manifest.json --asset vanilla:text.intro
```

The CLI output is JSON for successful commands. Error text is intended for humans; automation should rely on stable report fields and diagnostic codes documented in [Report JSON shapes](report-json-shapes.md).

## Browser E2E

Run the full browser matrix:

```powershell
corepack pnpm test:e2e
```

Single-browser debug entrypoints:

```powershell
corepack pnpm test:e2e:chromium
corepack pnpm test:e2e:firefox
corepack pnpm test:e2e:webkit
```

See [Browser E2E validation](browser-e2e.md) for coverage, troubleshooting, and artifact cleanup.

## Release Readiness Without Publishing

These gates are local safety checks, not publishing permission:

```powershell
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
git diff --check
```

- `release:ci-check` audits read-only GitHub Actions release workflow policy.
- `release:provenance` records deterministic local packed artifact evidence.
- `release:dry-run` checks private package metadata, package smoke, provenance, and no publish/tag side effects.
- `publish:preflight` checks the repository remains blocked from real publishing.
- `release:rc-check` rehearses package candidacy and owner decision handoff while keeping real-publish actions blocked.

Real npm publish remains blocked until owner decisions in [Release candidate handoff](release-candidate-handoff.md) are accepted.

## Generated Artifact Policy

Do not commit generated local artifacts:

- package tarballs and temporary consumers;
- generated RC or provenance JSON output;
- `dist/` and `.tsbuildinfo`;
- `playwright-report/`, `test-results/`, traces, screenshots, and videos;
- release archives, npm caches, workflow run output, or local runner artifacts.

The validation and release gates are designed to remove temporary outputs on success.
