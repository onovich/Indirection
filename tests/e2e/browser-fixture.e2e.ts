import { expect, test } from "@playwright/test";

test("serves the browser E2E fixture", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Indirection E2E Fixture");
  await expect(page.getByTestId("status")).toHaveText("ready");

  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { __indirectionE2E?: unknown }).__indirectionE2E)
    )
    .toEqual({
      cache: {
        hit: "current-cache-value",
        keysBeforeCleanup: ["cache-entry.txt"],
        missAfterCleanup: true,
        missBeforePut: true,
        staleHit: "stale-cache-value",
        staleStillIsolated: true
      },
      fallback: {
        broken: {
          errorName: "Error",
          resource: {
            causeCode: "IND_DECODE_FAILED",
            fallbackAssetId: undefined,
            refCount: 0,
            state: "failed"
          }
        },
        fallback: {
          fallbackResource: {
            causeCode: undefined,
            fallbackAssetId: undefined,
            refCount: 1,
            state: "ready"
          },
          handleReleased: true,
          primaryResource: {
            causeCode: "IND_DECODE_FAILED",
            fallbackAssetId: "browser:fallback.text",
            refCount: 1,
            state: "fallback-ready"
          },
          value: "fallback-from-chromium"
        }
      },
      fixture: "loaders-web-browser",
      loaderCount: 3,
      loaders: {
        binary: [5, 8, 13, 21],
        json: {
          count: 3,
          label: "json-from-chromium"
        },
        text: "text-from-chromium"
      },
      packageName: "@indirection/loaders-web",
      runtime: {
        catalogVersion: "phase-9-runtime",
        firstHandleReleased: true,
        leakWarnings: [],
        scopeBeforeDispose: {
          assetIds: ["browser:runtime.text"],
          disposed: false,
          handleCount: 1,
          id: "browser-runtime-scope"
        },
        scopeDisposed: true,
        secondHandleReleased: true,
        snapshotAfterDispose: {
          refCount: 0,
          state: "released"
        },
        snapshotAfterRelease: {
          refCount: 0,
          state: "released"
        },
        snapshotWhileHeld: {
          refCount: 1,
          state: "ready"
        },
        value: "runtime-from-chromium"
      },
      status: "ready"
    });
});
