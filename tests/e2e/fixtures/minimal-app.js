import {
  BrowserCacheStorageAdapter,
  createWebDataLoaders,
  loadersWebPackageName
} from "@indirection/loaders-web";
import { InMemoryTransport } from "@indirection/runtime";

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

  const result = {
    cache,
    fixture: "loaders-web-browser",
    loaderCount: loaders.length,
    loaders: {
      binary: Array.from(binary),
      json,
      text
    },
    packageName: loadersWebPackageName,
    status: "ready"
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
