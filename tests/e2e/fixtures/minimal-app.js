import {
  BrowserCacheStorageAdapter,
  createImageBitmapLoader,
  createWebDataLoaders,
  loadersWebPackageName
} from "@indirection/loaders-web";
import { protocolVersion } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager } from "@indirection/runtime";
import { createThreeTextureFromImageBitmap } from "@indirection/three";
import * as THREE from "three";
import virtualCatalog from "/virtual/indirection/catalog.js";

let imageBitmapCloseCount = 0;
const imageBitmapLoader = createImageBitmapLoader({
  async decode(input) {
    if (typeof createImageBitmap !== "function") {
      throw new Error("createImageBitmap is not available");
    }

    return createImageBitmap(
      new Blob([input.arrayBuffer], {
        type: input.contentType
      })
    );
  },
  dispose({ resource }) {
    imageBitmapCloseCount += 1;
    resource.bitmap.close?.();
  }
});
const loaders = [...createWebDataLoaders(), imageBitmapLoader];
const transport = new InMemoryTransport({
  "payload.bin": new Uint8Array([5, 8, 13, 21]),
  "payload.json": JSON.stringify({ count: 3, label: "json-from-browser" }),
  "pixel.png": tinyPngBytes(),
  "payload.txt": "text-from-browser"
});

try {
  const json = await load("data/json", "payload.json");
  const text = await load("text/plain", "payload.txt");
  const binary = await load("binary/array-buffer", "payload.bin");
  const cache = await runCacheStorageProbe();
  const fallback = await runFallbackDiagnosticsProbe();
  const imageBitmap = await runImageBitmapLifecycleProbe();
  const rendererTexture = await runRendererTextureProbe();
  const runtime = await runRuntimeLifecycleProbe();
  const stress = {
    cacheStorage: await runCacheStorageStressProbe(),
    capabilitySelection: await runCapabilitySelectionProbe(),
    runtimeLifecycle: await runRuntimeLifecycleStressProbe()
  };
  const virtualCatalogResult = consumeVirtualCatalog();

  const result = {
    cache,
    diagnostics: createSuccessDiagnostics(stress, imageBitmap, rendererTexture),
    fallback,
    fixture: "loaders-web-browser",
    imageBitmap,
    loaderCount: loaders.length,
    loaders: {
      binary: Array.from(binary),
      json,
      text
    },
    packageName: loadersWebPackageName,
    rendererTexture,
    runtime,
    status: "ready",
    stress,
    virtualCatalog: virtualCatalogResult
  };

  window.__indirectionE2E = result;
  document.querySelector("[data-testid='status']").textContent = result.status;
} catch (error) {
  window.__indirectionE2E = {
    diagnostics: {
      errorName: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : String(error),
      schemaVersion: 1,
      stage: "browser-fixture"
    },
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

function createSuccessDiagnostics(stress, imageBitmap, rendererTexture) {
  return {
    artifactName: "indirection-e2e-result.json",
    schemaVersion: 1,
    sections: [
      "loaders",
      "cache",
      "runtime",
      "fallback",
      "imageBitmap",
      "rendererTexture",
      "stress.cacheStorage",
      "stress.capabilitySelection",
      "stress.runtimeLifecycle",
      "virtualCatalog"
    ],
    stressSummary: {
      cacheVersionCount: stress.cacheStorage.versions.length,
      capabilityCases: Object.keys(stress.capabilitySelection).sort(),
      imageBitmapCloseCount: imageBitmap.closeCount,
      rendererTextureAvailable: rendererTexture.available,
      rendererTexturePixelMatches: rendererTexture.pixelMatchesRed,
      runtimeRepeatedCount: stress.runtimeLifecycle.repeated.length
    }
  };
}

async function runImageBitmapLifecycleProbe() {
  const assetId = "browser:image.pixel";
  imageBitmapCloseCount = 0;
  const manager = createAssetManager({
    catalog: {
      assets: {
        [assetId]: {
          sources: [{ url: "pixel.png" }],
          type: "image/bitmap"
        }
      },
      catalogVersion: "phase-22-image-bitmap",
      protocolVersion
    },
    loaders,
    transport
  });
  const scope = manager.createScope("browser-image-bitmap-scope");

  const firstHandle = await scope.acquire(assetId);
  const secondHandle = await scope.acquire(assetId);
  const snapshotWhileHeld = manager.snapshot();
  const sharedValue = firstHandle.value === secondHandle.value;

  await firstHandle.release();
  await firstHandle.release();
  const snapshotAfterFirstRelease = manager.snapshot();

  const scopeBeforeDispose = scope.snapshot();
  await scope.dispose();
  await scope.dispose();
  const snapshotAfterDispose = manager.snapshot();

  return {
    byteLength: firstHandle.value.byteLength,
    catalogVersion: snapshotAfterDispose.catalogVersion,
    closeCount: imageBitmapCloseCount,
    contentType: firstHandle.value.contentType,
    dimensions: [firstHandle.value.width, firstHandle.value.height],
    firstHandleReleased: firstHandle.released,
    secondHandleReleased: secondHandle.released,
    sharedValue,
    sourceUrl: firstHandle.value.sourceUrl,
    scopeBeforeDispose,
    scopeDisposed: scope.disposed,
    snapshotAfterDispose: resourceSummary(snapshotAfterDispose, assetId),
    snapshotAfterFirstRelease: resourceSummary(snapshotAfterFirstRelease, assetId),
    snapshotWhileHeld: resourceSummary(snapshotWhileHeld, assetId)
  };
}

async function runRendererTextureProbe() {
  const imageAssetId = "browser:image.pixel";
  const textureAssetId = "browser:renderer.texture";
  imageBitmapCloseCount = 0;

  let imageResource;
  const rendererTextureLoader = {
    id: "browser-three-renderer-texture",
    types: ["renderer/three-texture"],
    async load(context) {
      if (imageResource === undefined) {
        throw new Error("ImageBitmap resource must be acquired before renderer texture load");
      }

      const response = await context.transport.read(context);
      const rendererContext = createWebGlRendererContext();
      if (!rendererContext.available) {
        return {
          value: {
            available: false,
            disposeCounts: createDisposeCounts(),
            imageDimensions: [imageResource.width, imageResource.height],
            renderer: "three-webgl",
            unavailableReason: rendererContext.unavailableReason
          }
        };
      }

      const disposeCounts = createDisposeCounts();
      let material;
      let geometry;
      let renderer;
      const textureResource = createThreeTextureFromImageBitmap({
        image: imageResource.bitmap,
        width: imageResource.width,
        height: imageResource.height,
        assetId: context.assetId,
        sourceUrl: context.source.source.url,
        createTexture(input) {
          const texture = new THREE.Texture(input.image);
          texture.needsUpdate = true;
          if ("colorSpace" in texture && "SRGBColorSpace" in THREE) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          return trackDisposableResource(texture, "texture", disposeCounts);
        },
        ownedResources(texture) {
          material = trackDisposableResource(
            new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
            "material",
            disposeCounts
          );
          geometry = trackDisposableResource(
            new THREE.PlaneGeometry(2, 2),
            "geometry",
            disposeCounts
          );
          renderer = trackDisposableResource(
            new THREE.WebGLRenderer({
              alpha: true,
              antialias: false,
              canvas: rendererContext.canvas,
              context: rendererContext.gl,
              depth: false,
              preserveDrawingBuffer: true,
              stencil: false
            }),
            "renderer",
            disposeCounts
          );
          return [material, geometry, renderer];
        }
      });

      if (material === undefined || geometry === undefined || renderer === undefined) {
        throw new Error("Three renderer texture resources were not initialized");
      }

      renderer.setPixelRatio(1);
      renderer.setSize(2, 2, false);
      renderer.setClearColor(0x000000, 1);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      renderer.render(scene, camera);

      const samplePixel = new Uint8Array(4);
      rendererContext.gl.readPixels(
        0,
        0,
        1,
        1,
        rendererContext.gl.RGBA,
        rendererContext.gl.UNSIGNED_BYTE,
        samplePixel
      );

      return {
        value: {
          available: true,
          canvasSize: [renderer.domElement.width, renderer.domElement.height],
          disposeCounts,
          imageDimensions: [imageResource.width, imageResource.height],
          materialHasMap: material.map === textureResource.texture,
          pixelMatchesRed: pixelMatchesRed(samplePixel),
          renderer: "three-webgl",
          samplePixel: Array.from(samplePixel),
          sourceByteLength: bodyByteLength(response.body),
          textureDimensions: [textureResource.width, textureResource.height],
          textureIsTexture: textureResource.texture.isTexture === true
        },
        dispose: textureResource.dispose
      };
    }
  };

  const manager = createAssetManager({
    catalog: {
      assets: {
        [imageAssetId]: {
          sources: [{ url: "pixel.png" }],
          type: "image/bitmap"
        },
        [textureAssetId]: {
          dependencies: [imageAssetId],
          sources: [{ url: "pixel.png" }],
          type: "renderer/three-texture"
        }
      },
      catalogVersion: "phase-23-renderer-texture",
      protocolVersion
    },
    loaders: [...loaders, rendererTextureLoader],
    transport
  });
  const scope = manager.createScope("browser-renderer-texture-scope");

  const imageHandle = await scope.acquire(imageAssetId);
  imageResource = imageHandle.value;
  const textureHandle = await scope.acquire(textureAssetId);
  const snapshotWhileHeld = manager.snapshot();

  await imageHandle.release();
  const snapshotAfterImageRelease = manager.snapshot();
  const scopeBeforeDispose = scope.snapshot();
  const disposeCountsBefore = { ...textureHandle.value.disposeCounts };

  await scope.dispose();
  await scope.dispose();
  const snapshotAfterDispose = manager.snapshot();

  return {
    assetId: textureAssetId,
    available: textureHandle.value.available,
    catalogVersion: snapshotAfterDispose.catalogVersion,
    canvasSize: textureHandle.value.canvasSize,
    disposeCountsAfter: { ...textureHandle.value.disposeCounts },
    disposeCountsBefore,
    imageAssetId,
    imageCloseCount: imageBitmapCloseCount,
    imageDimensions: textureHandle.value.imageDimensions,
    imageHandleReleased: imageHandle.released,
    materialHasMap: textureHandle.value.materialHasMap,
    pixelMatchesRed: textureHandle.value.pixelMatchesRed,
    renderer: textureHandle.value.renderer,
    samplePixel: textureHandle.value.samplePixel,
    scopeBeforeDispose,
    scopeDisposed: scope.disposed,
    snapshotAfterDispose: {
      image: resourceSummary(snapshotAfterDispose, imageAssetId),
      texture: resourceSummary(snapshotAfterDispose, textureAssetId)
    },
    snapshotAfterImageRelease: {
      image: resourceSummary(snapshotAfterImageRelease, imageAssetId),
      texture: resourceSummary(snapshotAfterImageRelease, textureAssetId)
    },
    snapshotWhileHeld: {
      image: resourceSummary(snapshotWhileHeld, imageAssetId),
      texture: resourceSummary(snapshotWhileHeld, textureAssetId)
    },
    sourceByteLength: textureHandle.value.sourceByteLength,
    textureDimensions: textureHandle.value.textureDimensions,
    textureHandleReleased: textureHandle.released,
    textureIsTexture: textureHandle.value.textureIsTexture
  };
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

async function runCacheStorageStressProbe() {
  const cache = new BrowserCacheStorageAdapter({
    cacheName: "indirection-phase-16-e2e"
  });
  const versions = [
    "phase-16-cache-a",
    "phase-16-cache-b",
    "phase-16-cache-c"
  ];

  for (const version of versions) {
    await cache.deleteCatalogVersion(version);
  }

  await cache.put(
    { catalogVersion: versions[0], sourceUrl: "alpha.txt" },
    "alpha-a"
  );
  await cache.put(
    { catalogVersion: versions[0], sourceUrl: "beta.txt" },
    "beta-a"
  );
  await cache.put(
    { catalogVersion: versions[1], sourceUrl: "alpha.txt" },
    "alpha-b"
  );
  await cache.put(
    { catalogVersion: versions[2], sourceUrl: "gamma.txt" },
    "gamma-c"
  );

  const keysBeforeCleanup = await cacheKeysByVersion(cache, versions);
  const hitsBeforeCleanup = {
    alphaA: await cache.match({
      catalogVersion: versions[0],
      sourceUrl: "alpha.txt"
    }),
    alphaB: await cache.match({
      catalogVersion: versions[1],
      sourceUrl: "alpha.txt"
    }),
    gammaC: await cache.match({
      catalogVersion: versions[2],
      sourceUrl: "gamma.txt"
    })
  };

  await cache.deleteCatalogVersion(versions[1]);

  const keysAfterVersionCleanup = await cacheKeysByVersion(cache, versions);
  const deletedVersionMiss =
    (await cache.match({
      catalogVersion: versions[1],
      sourceUrl: "alpha.txt"
    })) === undefined;
  const retainedHitsAfterVersionCleanup = {
    betaA: await cache.match({
      catalogVersion: versions[0],
      sourceUrl: "beta.txt"
    }),
    gammaC: await cache.match({
      catalogVersion: versions[2],
      sourceUrl: "gamma.txt"
    })
  };

  await cache.deleteCatalogVersion(versions[0]);
  await cache.deleteCatalogVersion(versions[2]);

  return {
    deletedVersionMiss,
    finalCleanupMisses: {
      alphaA:
        (await cache.match({
          catalogVersion: versions[0],
          sourceUrl: "alpha.txt"
        })) === undefined,
      gammaC:
        (await cache.match({
          catalogVersion: versions[2],
          sourceUrl: "gamma.txt"
        })) === undefined
    },
    hitsBeforeCleanup,
    keysAfterVersionCleanup,
    keysBeforeCleanup,
    retainedHitsAfterVersionCleanup,
    versions
  };
}

async function cacheKeysByVersion(cache, versions) {
  return Object.fromEntries(
    await Promise.all(
      versions.map(async (version) => [version, await cache.keys(version)])
    )
  );
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
      "runtime.txt": "runtime-from-browser"
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

async function runRuntimeLifecycleStressProbe() {
  const repeatedAssetId = "browser:stress.repeated";
  const scopeAssetIds = [
    "browser:stress.scope-a",
    "browser:stress.scope-b",
    "browser:stress.scope-c"
  ];
  const assets = {
    [repeatedAssetId]: {
      sources: [{ url: "stress-repeated.txt" }],
      type: "text/plain"
    }
  };
  const records = {
    "stress-repeated.txt": "stress-repeated-value"
  };

  for (const assetId of scopeAssetIds) {
    const slug = assetId.split(".").at(-1);
    assets[assetId] = {
      sources: [{ url: `${slug}.txt` }],
      type: "text/plain"
    };
    records[`${slug}.txt`] = `${slug}-value`;
  }

  const manager = createAssetManager({
    catalog: {
      assets,
      catalogVersion: "phase-16-runtime-stress",
      protocolVersion
    },
    loaders,
    transport: new InMemoryTransport(records)
  });

  const repeated = [];
  for (let iteration = 1; iteration <= 4; iteration += 1) {
    const scope = manager.createScope(`browser-stress-repeat-${iteration}`);
    const handle = await scope.acquire(repeatedAssetId);
    const whileHeld = resourceSummary(manager.snapshot(), repeatedAssetId);
    await handle.release();
    const afterRelease = resourceSummary(manager.snapshot(), repeatedAssetId);
    await scope.dispose();

    repeated.push({
      afterRelease,
      handleReleased: handle.released,
      iteration,
      value: handle.value,
      whileHeld
    });
  }

  const scope = manager.createScope("browser-stress-scope");
  const scopeHandles = [];
  for (const assetId of scopeAssetIds) {
    scopeHandles.push(await scope.acquire(assetId));
  }
  const beforeScopeDispose = scope.snapshot();
  const leakWarningsWhileHeld = manager.snapshot().leakWarnings.map(leakSummary);
  await scope.dispose();
  const afterScopeDisposeSnapshot = manager.snapshot();

  return {
    catalogVersion: afterScopeDisposeSnapshot.catalogVersion,
    leakWarningsAfterDispose: afterScopeDisposeSnapshot.leakWarnings,
    leakWarningsWhileHeld,
    repeated,
    scopeBeforeDispose: beforeScopeDispose,
    scopeDisposed: scope.disposed,
    scopeHandlesReleased: scopeHandles.map((handle) => handle.released),
    scopeResourcesAfterDispose: scopeAssetIds.map((assetId) =>
      resourceSummary(afterScopeDisposeSnapshot, assetId)
    )
  };
}

async function runCapabilitySelectionProbe() {
  const assetId = "browser:compressed.text";
  const catalog = {
    assets: {
      [assetId]: {
        sources: [
          { when: { capability: ["draco"] }, url: "compressed.draco.txt" },
          { when: { capability: ["ktx2"] }, url: "compressed.ktx2.txt" },
          { when: { capability: ["meshopt"] }, url: "compressed.meshopt.txt" },
          { url: "compressed.default.txt" }
        ],
        type: "text/plain"
      }
    },
    catalogVersion: "phase-16-capability",
    protocolVersion
  };
  const records = {
    "compressed.default.txt": "default-browser-source",
    "compressed.draco.txt": "draco-browser-source",
    "compressed.ktx2.txt": "ktx2-browser-source",
    "compressed.meshopt.txt": "meshopt-browser-source"
  };

  return {
    declarationOrder: await acquireCapabilitySelection({
      assetId,
      catalog,
      capability: ["meshopt", "draco", "ktx2"],
      records,
      scopeId: "browser-capability-declaration-order"
    }),
    defaultSource: await acquireCapabilitySelection({
      assetId,
      catalog,
      capability: [],
      records,
      scopeId: "browser-capability-default"
    }),
    ktx2: await acquireCapabilitySelection({
      assetId,
      catalog,
      capability: ["ktx2"],
      records,
      scopeId: "browser-capability-ktx2"
    })
  };
}

async function acquireCapabilitySelection({
  assetId,
  catalog,
  capability,
  records,
  scopeId
}) {
  const manager = createAssetManager({
    catalog,
    context: capability.length === 0 ? {} : { capability },
    loaders,
    transport: new InMemoryTransport(records)
  });
  const resolved = manager.resolveSource(assetId);
  const scope = manager.createScope(scopeId);
  const handle = await scope.acquire(assetId);
  await handle.release();
  await scope.dispose();

  return {
    capability,
    handleReleased: handle.released,
    sourceIndex: resolved.sourceIndex,
    sourceUrl: resolved.source.url,
    value: handle.value
  };
}

function bodyByteLength(body) {
  if (body instanceof Uint8Array) {
    return body.byteLength;
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }

  return new TextEncoder().encode(
    typeof body === "string" ? body : JSON.stringify(body)
  ).byteLength;
}

function createDisposeCounts() {
  return {
    geometry: 0,
    material: 0,
    renderer: 0,
    texture: 0
  };
}

function createWebGlRendererContext() {
  if (typeof document === "undefined") {
    return {
      available: false,
      unavailableReason: "document-unavailable"
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    stencil: false
  });

  if (gl === null) {
    return {
      available: false,
      unavailableReason: "webgl2-unavailable"
    };
  }

  return {
    available: true,
    canvas,
    gl
  };
}

function pixelMatchesRed(pixel) {
  return pixel[0] >= 200 && pixel[1] <= 40 && pixel[2] <= 40 && pixel[3] >= 200;
}

function trackDisposableResource(resource, name, counts) {
  const dispose = resource.dispose.bind(resource);
  let disposed = false;
  resource.dispose = () => {
    if (!disposed) {
      disposed = true;
      counts[name] += 1;
    }

    return dispose();
  };

  return resource;
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

function leakSummary(resource) {
  return {
    assetId: resource.assetId,
    refCount: resource.refCount,
    state: resource.state
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

function tinyPngBytes() {
  const binary = atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4AWL6z8DwHwAAAP//A3ONEwAAAAZJREFUAwAFCgIByRpMngAAAABJRU5ErkJggg=="
  );
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
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
      "fallback.txt": "fallback-from-browser"
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
