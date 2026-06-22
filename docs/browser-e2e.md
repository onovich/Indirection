# Browser E2E Validation

Phase 9 adds a Playwright Chromium E2E gate for browser-facing package behavior that cannot be proven by Node-only smoke tests.

## Commands

Install dependencies:

```powershell
corepack pnpm install --frozen-lockfile
```

Install the local Chromium browser once per machine:

```powershell
corepack pnpm exec playwright install chromium
```

Run the E2E gate:

```powershell
corepack pnpm test:e2e
```

Run the complete local release gate:

```powershell
corepack pnpm validate:full
git diff --check
```

On GitHub Actions, Ubuntu installs browser system dependencies with:

```powershell
corepack pnpm exec playwright install --with-deps chromium
```

The workflow caches `~/.cache/ms-playwright` by `pnpm-lock.yaml`.

## Coverage

The Chromium fixture currently verifies:

- `@indirection/loaders-web` JSON, text, and binary loaders through browser ESM imports.
- `BrowserCacheStorageAdapter` miss, hit, catalog-version isolation, and cleanup against real `window.caches`.
- runtime `acquire`, `release`, `scope.dispose`, resource snapshots, and leak-warning snapshots.
- fallback success and no-fallback failure using structured `causeCode` and `fallbackAssetId` snapshot fields.
- virtual catalog consumption by importing a JS module generated through the Vite plugin and compiler output.

The older Node `test:browser` smoke remains as a fast browser-facing loader smoke. It does not replace `test:e2e`.

## Troubleshooting

If Playwright reports a missing executable, run:

```powershell
corepack pnpm exec playwright install chromium
```

If a browser page fails to import package modules, run:

```powershell
corepack pnpm build
corepack pnpm test:e2e
```

If the local server port is already occupied, stop the process using port `4173` and rerun `corepack pnpm test:e2e`.

If CI fails before tests start on Linux browser dependencies, inspect the `Install Playwright Chromium` step before debugging the fixture.

## Artifact Policy

Do not commit Playwright runtime artifacts. The following are intentionally ignored:

- `playwright-report/`
- `test-results/`
- `trace.zip`

Committed E2E files should stay under `tests/e2e/`, and the fixture must remain derived from compiler/runtime/adapter APIs rather than becoming a new authoring source-of-truth.
