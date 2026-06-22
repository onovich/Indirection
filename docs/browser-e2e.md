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

Phase 16 adds bounded stress coverage to the same fixture:

- repeated runtime acquire/release loops, followed by multi-handle `AssetScope.dispose()` cleanup and leak-warning checks.
- Cache Storage isolation across multiple catalog versions and keys, including deleting one version while retaining the others, then final cleanup.
- compressed capability source selection with tiny text fixture data for `draco`, `ktx2`, `meshopt`, and the default source.
- structured `window.__indirectionE2E.diagnostics` plus the `indirection-e2e-result.json` Playwright attachment for easier failure inspection.

Phase 22 adds bounded browser image-source lifecycle coverage to the same fixture:

- a tiny deterministic 1x1 PNG byte fixture is decoded with real browser `createImageBitmap(new Blob(...))`;
- the decoded bitmap is wrapped to count `close()` calls without creating Three textures, WebGL renderer state, screenshots, or visual approval artifacts;
- shared runtime handles and `AssetScope.dispose()` prove that the ImageBitmap closes exactly once after final release through `LoadedAsset.dispose`.

Phase 23 adds bounded renderer/Three texture E2E coverage to the same fixture:

- the Phase 22 ImageBitmap source is reused as the host image for `createThreeTextureFromImageBitmap`;
- the fixture imports real `three`, creates a `Texture`, `MeshBasicMaterial`, `PlaneGeometry`, and `WebGLRenderer` in host/test code, then renders a 2x2 WebGL2 scene;
- `readPixels` verifies the deterministic red pixel `[255, 0, 0, 255]` without screenshot approval artifacts;
- `AssetScope.dispose()` releases the host-owned texture, material, geometry, renderer, and dependent ImageBitmap exactly once through runtime `LoadedAsset.dispose`.

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

The Firefox project sets `MOZ_DISABLE_CONTENT_SANDBOX=1` in Playwright launch options. This is a browser harness setting for Windows/headless Firefox juggler stability; it is not product runtime behavior and must stay out of protocol, schema, compiler, and runtime packages.

`playwright.config.ts` starts `tests/e2e/server.mjs` with `--idle-exit-ms=5000` so Windows webServer child processes exit after the fixture has gone idle. The server remains reusable for manual debugging when run without that flag.

If a stress assertion fails, inspect `window.__indirectionE2E.diagnostics` in the assertion output or open the attached `indirection-e2e-result.json` under `test-results/`. The sections list localizes the failure to loaders, cache, runtime, fallback, ImageBitmap lifecycle, renderer texture lifecycle, stress cache, stress capability selection, stress runtime lifecycle, or virtual catalog consumption.

If a Cache Storage stress assertion fails, rerun the affected browser project after clearing local Playwright artifacts and browser cache state:

```powershell
Remove-Item -Recurse -Force playwright-report, test-results
corepack pnpm test:e2e:chromium
```

Use `test:e2e:firefox` or `test:e2e:webkit` when the failing project is not Chromium.

## Artifact Policy

Playwright diagnostics are for local and CI troubleshooting only. Do not commit Playwright runtime artifacts. The following are intentionally ignored:

- `playwright-report/`
- `test-results/`
- `trace.zip`

`playwright.config.ts` writes the HTML report to `playwright-report/`, stores per-test output under `test-results/`, and retains traces on failure. The browser fixture also attaches `indirection-e2e-result.json` to the Playwright test output before the strict object assertion runs. That JSON attachment mirrors `window.__indirectionE2E` so a failure can be inspected by section instead of only through a large assertion diff.

Useful local inspection paths after a failing run:

- `playwright-report/index.html` for the HTML report.
- `test-results/**/indirection-e2e-result.json` for the structured browser result attachment.
- `test-results/**/*.zip` for retained traces when Playwright records them.

Delete these directories after inspection if they are no longer needed:

```powershell
Remove-Item -Recurse -Force playwright-report, test-results
```

Committed E2E files should stay under `tests/e2e/`, and the fixture must remain derived from compiler/runtime/adapter APIs rather than becoming a new authoring source-of-truth.
