import { expect, test } from "@playwright/test";

test("serves the browser E2E fixture", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Indirection E2E Fixture");
  await expect(page.getByTestId("status")).toHaveText("ready");

  const repeatedRuntimeStress = [1, 2, 3, 4].map((iteration) => ({
    afterRelease: {
      causeCode: undefined,
      fallbackAssetId: undefined,
      refCount: 0,
      state: "released"
    },
    handleReleased: true,
    iteration,
    value: "stress-repeated-value",
    whileHeld: {
      causeCode: undefined,
      fallbackAssetId: undefined,
      refCount: 1,
      state: "ready"
    }
  }));

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
          value: "fallback-from-browser"
        }
      },
      fixture: "loaders-web-browser",
      loaderCount: 3,
      loaders: {
        binary: [5, 8, 13, 21],
        json: {
          count: 3,
          label: "json-from-browser"
        },
        text: "text-from-browser"
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
        value: "runtime-from-browser"
      },
      status: "ready",
      stress: {
        cacheStorage: {
          deletedVersionMiss: true,
          finalCleanupMisses: {
            alphaA: true,
            gammaC: true
          },
          hitsBeforeCleanup: {
            alphaA: "alpha-a",
            alphaB: "alpha-b",
            gammaC: "gamma-c"
          },
          keysAfterVersionCleanup: {
            "phase-16-cache-a": ["alpha.txt", "beta.txt"],
            "phase-16-cache-b": [],
            "phase-16-cache-c": ["gamma.txt"]
          },
          keysBeforeCleanup: {
            "phase-16-cache-a": ["alpha.txt", "beta.txt"],
            "phase-16-cache-b": ["alpha.txt"],
            "phase-16-cache-c": ["gamma.txt"]
          },
          retainedHitsAfterVersionCleanup: {
            betaA: "beta-a",
            gammaC: "gamma-c"
          },
          versions: [
            "phase-16-cache-a",
            "phase-16-cache-b",
            "phase-16-cache-c"
          ]
        },
        runtimeLifecycle: {
          catalogVersion: "phase-16-runtime-stress",
          leakWarningsAfterDispose: [],
          leakWarningsWhileHeld: [
            {
              assetId: "browser:stress.scope-a",
              refCount: 1,
              state: "ready"
            },
            {
              assetId: "browser:stress.scope-b",
              refCount: 1,
              state: "ready"
            },
            {
              assetId: "browser:stress.scope-c",
              refCount: 1,
              state: "ready"
            }
          ],
          repeated: repeatedRuntimeStress,
          scopeBeforeDispose: {
            assetIds: [
              "browser:stress.scope-a",
              "browser:stress.scope-b",
              "browser:stress.scope-c"
            ],
            disposed: false,
            handleCount: 3,
            id: "browser-stress-scope"
          },
          scopeDisposed: true,
          scopeHandlesReleased: [true, true, true],
          scopeResourcesAfterDispose: [
            {
              causeCode: undefined,
              fallbackAssetId: undefined,
              refCount: 0,
              state: "released"
            },
            {
              causeCode: undefined,
              fallbackAssetId: undefined,
              refCount: 0,
              state: "released"
            },
            {
              causeCode: undefined,
              fallbackAssetId: undefined,
              refCount: 0,
              state: "released"
            }
          ]
        }
      },
      virtualCatalog: {
        assetIds: ["browser:virtual.text"],
        catalogVersionIsHash: true,
        protocolVersion: 1,
        textSourceUrl: "virtual-catalog.txt"
      }
    });
});
