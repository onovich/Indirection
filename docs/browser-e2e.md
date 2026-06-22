# Browser E2E Validation

Phase 9 added a Playwright Chromium E2E gate for browser-facing package behavior that cannot be proven by Node-only smoke tests. Phase 12 expands that gate into a Chromium, Firefox, and WebKit matrix.

## Commands

Install dependencies:

```powershell
corepack pnpm install --frozen-lockfile
```

Install the local Playwright browsers once per machine:

```powershell
corepack pnpm exec playwright install chromium firefox webkit
```

Run the full E2E browser matrix:

```powershell
corepack pnpm test:e2e
```

Use project filters for single-browser debugging:

```powershell
corepack pnpm test:e2e:chromium
corepack pnpm test:e2e:firefox
corepack pnpm test:e2e:webkit
```

Run the complete local release gate:

```powershell
corepack pnpm validate:full
git diff --check
```

On GitHub Actions, Ubuntu installs browser system dependencies with:

```powershell
corepack pnpm exec playwright install --with-deps chromium firefox webkit
```

The workflow caches `~/.cache/ms-playwright` by `pnpm-lock.yaml`.

## Coverage

The browser matrix verifies the same fixture in Chromium, Firefox, and WebKit:

- `@indirection/loaders-web` JSON, text, and binary loaders through browser ESM imports.
- `BrowserCacheStorageAdapter` miss, hit, catalog-version isolation, and cleanup against real `window.caches`.
- runtime `acquire`, `release`, `scope.dispose`, resource snapshots, and leak-warning snapshots.
- fallback success and no-fallback failure using structured `causeCode` and `fallbackAssetId` snapshot fields.
- virtual catalog consumption by importing a JS module generated through the Vite plugin and compiler output.

The fixture data and assertions must stay browser-neutral. Names such as `chromium` belong to Playwright project labels and should not appear in loader payload values, runtime fixture values, or diagnostic expectations.

The older Node `test:browser` smoke remains as a fast browser-facing loader smoke. It does not replace `test:e2e`.

## Troubleshooting

If Playwright reports a missing executable, run:

```powershell
corepack pnpm exec playwright install chromium firefox webkit
```

If a browser page fails to import package modules, run:

```powershell
corepack pnpm build
corepack pnpm test:e2e
```

If the local server port is already occupied, stop the process using port `4173` and rerun `corepack pnpm test:e2e`.

If CI fails before tests start on Linux browser dependencies, inspect the `Install Playwright Browsers` step before debugging the fixture.

## Artifact Policy

Do not commit Playwright runtime artifacts. The following are intentionally ignored:

- `playwright-report/`
- `test-results/`
- `trace.zip`

Committed E2E files should stay under `tests/e2e/`, and the fixture must remain derived from compiler/runtime/adapter APIs rather than becoming a new authoring source-of-truth.
