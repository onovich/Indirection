import {
  BrowserCacheStorageAdapter,
  createWebDataLoaders,
  loadersWebPackageName
} from "@indirection/loaders-web";
import { protocolVersion } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager } from "@indirection/runtime";
import virtualCatalog from "/virtual/indirection/catalog.js";

const loaders = createWebDataLoaders();
const transport = new InMemoryTransport({
  "payload.bin": new Uint8Array([5, 8, 13, 21]),
  "payload.json": JSON.stringify({ count: 3, label: "json-from-chromium" }),
  "payload.txt": "text-from-chromium"
});

try {
  const json = await load("data/json", "payload.json");
  const text = await load("text/plain", "payload.txt");
  const binary = await load("binary/array-buffer", "payload.bin");
  const cache = await runCacheStorageProbe();
  const fallback = await runFallbackDiagnosticsProbe();
  const runtime = await runRuntimeLifecycleProbe();
  const virtualCatalogResult = consumeVirtualCatalog();

  const result = {
    cache,
    fallback,
    fixture: "loaders-web-browser",
    loaderCount: loaders.length,
    loaders: {
      binary: Array.from(binary),
      json,
      text
    },
    packageName: loadersWebPackageName,
    runtime,
    status: "ready",
    virtualCatalog: virtualCatalogResult
  };

  window.__indirectionE2E = result;
  document.querySelector("[data-testid='status']").textContent = result.status;
} catch (error) {
  window.__indirectionE2E = {
    message: error instanceof Error ? error.message : String(error),
    status: "failed"
  };
  document.querySelector("[data-testid='status']").textContent = "failed";
}

async function load(type, url) {
  const loader = loaders.find((candidate) => candidate.types.includes(type));
  if (loader === undefined) {
    throw new Error(`Missing loader for ${type}`);
  }

  const loaded = await loader.load({
    assetId: `browser:${url.replace(/\W+/g, ".")}`,
    source: {
      assetId: `browser:${url.replace(/\W+/g, ".")}`,
      catalogVersion: "phase-9-e2e",
      source: {
        url
      },
      sourceIndex: 0,
      type
    },
    transport
  });

  return loaded.value;
}

async function runCacheStorageProbe() {
  const cache = new BrowserCacheStorageAdapter({
    cacheName: "indirection-phase-9-e2e"
  });
  const currentVersion = "phase-9-cache-current";
  const staleVersion = "phase-9-cache-stale";
  const sourceUrl = "cache-entry.txt";

  await cache.deleteCatalogVersion(currentVersion);
  await cache.deleteCatalogVersion(staleVersion);

  const missBeforePut =
    (await cache.match({ catalogVersion: currentVersion, sourceUrl })) === undefined;

  await cache.put(
    { catalogVersion: currentVersion, sourceUrl },
    "current-cache-value"
  );
  await cache.put(
    { catalogVersion: staleVersion, sourceUrl },
    "stale-cache-value"
  );

  const hit = await cache.match({ catalogVersion: currentVersion, sourceUrl });
  const staleHit = await cache.match({ catalogVersion: staleVersion, sourceUrl });
  const keysBeforeCleanup = await cache.keys(currentVersion);

  await cache.deleteCatalogVersion(currentVersion);

  const missAfterCleanup =
    (await cache.match({ catalogVersion: currentVersion, sourceUrl })) === undefined;
  const staleStillIsolated =
    (await cache.match({ catalogVersion: staleVersion, sourceUrl })) ===
    "stale-cache-value";

  await cache.deleteCatalogVersion(staleVersion);

  return {
    hit,
    keysBeforeCleanup,
    missAfterCleanup,
    missBeforePut,
    staleHit,
    staleStillIsolated
  };
}

async function runRuntimeLifecycleProbe() {
  const runtimeAssetId = "browser:runtime.text";
  const manager = createAssetManager({
    catalog: {
      assets: {
        [runtimeAssetId]: {
          sources: [{ url: "runtime.txt" }],
          type: "text/plain"
        }
      },
      catalogVersion: "phase-9-runtime",
      protocolVersion
    },
    loaders,
    transport: new InMemoryTransport({
      "runtime.txt": "runtime-from-chromium"
    })
  });
  const scope = manager.createScope("browser-runtime-scope");

  const firstHandle = await scope.acquire(runtimeAssetId);
  const snapshotWhileHeld = manager.snapshot();
  firstHandle.release();
  const snapshotAfterRelease = manager.snapshot();

  const secondHandle = await scope.acquire(runtimeAssetId);
  const scopeBeforeDispose = scope.snapshot();
  await scope.dispose();
  const snapshotAfterDispose = manager.snapshot();

  return {
    catalogVersion: snapshotAfterDispose.catalogVersion,
    firstHandleReleased: firstHandle.released,
    leakWarnings: snapshotAfterDispose.leakWarnings,
    scopeBeforeDispose,
    scopeDisposed: scope.disposed,
    secondHandleReleased: secondHandle.released,
    snapshotAfterDispose: resourceSummary(snapshotAfterDispose, runtimeAssetId),
    snapshotAfterRelease: resourceSummary(snapshotAfterRelease, runtimeAssetId),
    snapshotWhileHeld: resourceSummary(snapshotWhileHeld, runtimeAssetId),
    value: firstHandle.value
  };
}

function resourceSummary(snapshot, assetId) {
  const resource = snapshot.resources.find((candidate) => candidate.assetId === assetId);
  return {
    causeCode: resource?.causeCode,
    fallbackAssetId: resource?.fallbackAssetId,
    refCount: resource?.refCount,
    state: resource?.state
  };
}

function consumeVirtualCatalog() {
  const assetIds = Object.keys(virtualCatalog.assets).sort();
  const virtualText = virtualCatalog.assets["browser:virtual.text"];
  return {
    assetIds,
    catalogVersionIsHash: virtualCatalog.catalogVersion.startsWith("sha256-"),
    protocolVersion: virtualCatalog.protocolVersion,
    textSourceUrl: virtualText.sources[0].url
  };
}

async function runFallbackDiagnosticsProbe() {
  const primaryAssetId = "browser:primary.missing";
  const fallbackAssetId = "browser:fallback.text";
  const brokenAssetId = "browser:broken.missing";
  const manager = createAssetManager({
    catalog: {
      assets: {
        [brokenAssetId]: {
          sources: [{ url: "broken-missing.txt" }],
          type: "text/plain"
        },
        [fallbackAssetId]: {
          sources: [{ url: "fallback.txt" }],
          type: "text/plain"
        },
        [primaryAssetId]: {
          fallback: fallbackAssetId,
          sources: [{ url: "primary-missing.txt" }],
          type: "text/plain"
        }
      },
      catalogVersion: "phase-9-fallback",
      protocolVersion
    },
    loaders,
    transport: new InMemoryTransport({
      "fallback.txt": "fallback-from-chromium"
    })
  });
  const scope = manager.createScope("browser-fallback-scope");

  const fallbackHandle = await scope.acquire(primaryAssetId);
  const fallbackSnapshot = manager.snapshot();
  fallbackHandle.release();

  let brokenErrorName = "none";
  try {
    await scope.acquire(brokenAssetId);
  } catch (error) {
    brokenErrorName = error instanceof Error ? error.name : "unknown";
  }

  const failedSnapshot = manager.snapshot();
  await scope.dispose();

  return {
    broken: {
      errorName: brokenErrorName,
      resource: resourceSummary(failedSnapshot, brokenAssetId)
    },
    fallback: {
      handleReleased: fallbackHandle.released,
      primaryResource: resourceSummary(fallbackSnapshot, primaryAssetId),
      fallbackResource: resourceSummary(fallbackSnapshot, fallbackAssetId),
      value: fallbackHandle.value
    }
  };
}
