import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  InMemoryTransport,
  createAssetManager,
  type ResourceSnapshot
} from "@indirection/runtime";
import {
  createImageBitmapLoader,
  createWebBinaryLoader,
  createWebDataLoaders,
  createWebJsonLoader,
  createWebTextLoader,
  type ImageBitmapResource,
  loadersWebPackageName
} from "@indirection/loaders-web";

const config = normalizeAssetId("web:config");
const label = normalizeAssetId("web:label");
const bytes = normalizeAssetId("web:bytes");
const pixel = normalizeAssetId("web:pixel");
const brokenPixel = normalizeAssetId("web:broken-pixel");
const fallbackLabel = normalizeAssetId("web:fallback-label");

const catalog: CompiledCatalog = {
  protocolVersion,
  catalogVersion: "sha256-loaders-web",
  assets: {
    [config]: {
      type: "data/json",
      sources: [{ url: "config.json" }]
    },
    [label]: {
      type: "text/plain",
      sources: [{ url: "label.txt" }]
    },
    [bytes]: {
      type: "binary/array-buffer",
      sources: [{ url: "bytes.bin" }]
    },
    [brokenPixel]: {
      fallback: fallbackLabel,
      type: "image/bitmap",
      sources: [{ url: "broken.png" }]
    },
    [fallbackLabel]: {
      type: "text/plain",
      sources: [{ url: "fallback.txt" }]
    },
    [pixel]: {
      type: "image/bitmap",
      sources: [{ url: "pixel.png" }]
    }
  }
};

describe("loaders-web", () => {
  it("exports browser-friendly data loaders", () => {
    expect(loadersWebPackageName).toBe("@indirection/loaders-web");
    expect(createWebJsonLoader().id).toBe("web-json");
    expect(createWebTextLoader().id).toBe("web-text");
    expect(createWebBinaryLoader().id).toBe("web-binary");
    expect(createImageBitmapLoader().id).toBe("web-image-bitmap");
    expect(createImageBitmapLoader().types).toEqual(["image/bitmap"]);
  });

  it("loads JSON, text, and binary through injected transport", async () => {
    const manager = createAssetManager({
      catalog,
      loaders: createWebDataLoaders(),
      transport: new InMemoryTransport({
        "config.json": "{\"quality\":\"high\"}",
        "label.txt": "Gate",
        "bytes.bin": new Uint8Array([7, 8, 9])
      })
    });
    const scope = manager.createScope("web");

    await expect(scope.acquire(config).then((handle) => handle.value)).resolves.toEqual({
      quality: "high"
    });
    await expect(scope.acquire(label).then((handle) => handle.value)).resolves.toBe(
      "Gate"
    );
    await expect(scope.acquire(bytes).then((handle) => handle.value)).resolves.toEqual(
      new Uint8Array([7, 8, 9])
    );
  });

  it("disposes ImageBitmap resources after the final shared handle release", async () => {
    const closed: string[] = [];
    const imageLoader = createImageBitmapLoader({
      decode(input) {
        expect(input.assetId).toBe(pixel);
        expect(input.contentType).toBe("image/png");
        expect(input.byteLength).toBe(4);
        expect(input.sourceUrl).toBe("pixel.png");

        return {
          width: 1,
          height: 1,
          close() {
            closed.push(input.sourceUrl);
          }
        };
      }
    });
    const manager = createAssetManager({
      catalog,
      loaders: [imageLoader],
      transport: new InMemoryTransport({
        "pixel.png": new Uint8Array([137, 80, 78, 71])
      })
    });
    const scope = manager.createScope("web-image-bitmap");

    const first = await scope.acquire<ImageBitmapResource>(pixel);
    const second = await scope.acquire<ImageBitmapResource>(pixel);

    expect(first.value).toBe(second.value);
    expect(first.value).toMatchObject({
      byteLength: 4,
      contentType: "image/png",
      height: 1,
      sourceUrl: "pixel.png",
      width: 1
    });
    expect(resourceSummary(manager, pixel)).toMatchObject({
      hasDisposer: true,
      hasValue: true,
      refCount: 2,
      state: "ready"
    });

    await first.release();
    await first.release();

    expect(closed).toEqual([]);
    expect(resourceSummary(manager, pixel)).toMatchObject({
      hasDisposer: true,
      hasValue: true,
      refCount: 1,
      state: "ready"
    });

    await second.release();
    await second.release();

    expect(closed).toEqual(["pixel.png"]);
    expect(resourceSummary(manager, pixel)).toMatchObject({
      hasDisposer: false,
      hasValue: false,
      refCount: 0,
      state: "disposed"
    });
  });

  it("closes ImageBitmap resources once when a scope is disposed repeatedly", async () => {
    let closeCount = 0;
    const manager = createAssetManager({
      catalog,
      loaders: [
        createImageBitmapLoader({
          decode() {
            return {
              width: 2,
              height: 3,
              close() {
                closeCount += 1;
              }
            };
          }
        })
      ],
      transport: new InMemoryTransport({
        "pixel.png": new Uint8Array([1, 2, 3])
      })
    });
    const scope = manager.createScope("web-image-bitmap-scope");

    const handle = await scope.acquire<ImageBitmapResource>(pixel);
    await scope.dispose();
    await scope.dispose();
    await handle.release();

    expect(handle.released).toBe(true);
    expect(closeCount).toBe(1);
    expect(resourceSummary(manager, pixel)).toMatchObject({
      refCount: 0,
      state: "disposed"
    });
  });

  it("supports injected Blob and createImageBitmap boundaries", async () => {
    const blobSentinel = {} as Blob;
    let blobContentType = "";
    let blobByteLength = 0;
    let createImageBitmapBlob: Blob | undefined;
    const imageLoader = createImageBitmapLoader({
      createBlob(bytes, contentType) {
        blobByteLength = bytes.byteLength;
        blobContentType = contentType;
        return blobSentinel;
      },
      async createImageBitmap(blob) {
        createImageBitmapBlob = blob;
        return {
          width: 4,
          height: 5
        };
      }
    });
    const loaded = await imageLoader.load({
      assetId: pixel,
      source: {
        assetId: pixel,
        catalogVersion: catalog.catalogVersion,
        source: {
          url: "pixel.png"
        },
        sourceIndex: 0,
        type: "image/bitmap"
      },
      transport: new InMemoryTransport({
        "pixel.png": new Uint8Array([1, 2, 3, 4, 5])
      })
    });

    expect(blobByteLength).toBe(5);
    expect(blobContentType).toBe("image/png");
    expect(createImageBitmapBlob).toBe(blobSentinel);
    expect(loaded.value).toMatchObject({
      byteLength: 5,
      height: 5,
      sourceUrl: "pixel.png",
      width: 4
    });
  });

  it("keeps image decode failure distinct from runtime fallback success", async () => {
    const manager = createAssetManager({
      catalog,
      loaders: [
        createImageBitmapLoader({
          decode() {
            throw new Error("invalid image fixture");
          }
        }),
        createWebTextLoader()
      ],
      transport: new InMemoryTransport({
        "broken.png": new Uint8Array([0]),
        "fallback.txt": "fallback-after-image-decode"
      })
    });
    const scope = manager.createScope("web-image-fallback");

    const handle = await scope.acquire<string>(brokenPixel);
    const snapshot = manager.snapshot();

    expect(handle.value).toBe("fallback-after-image-decode");
    expect(snapshot.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: brokenPixel,
          causeCode: "IND_DECODE_FAILED",
          fallbackAssetId: fallbackLabel,
          state: "fallback-ready"
        }),
        expect.objectContaining({
          assetId: fallbackLabel,
          state: "ready"
        })
      ])
    );

    await handle.release();
    await scope.dispose();
  });

  it("rejects ImageBitmap decode when the acquire signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    let decoded = false;
    const imageLoader = createImageBitmapLoader({
      decode() {
        decoded = true;
        return {
          width: 1,
          height: 1
        };
      }
    });

    await expect(
      imageLoader.load({
        assetId: pixel,
        signal: controller.signal,
        source: {
          assetId: pixel,
          catalogVersion: catalog.catalogVersion,
          source: {
            url: "pixel.png"
          },
          sourceIndex: 0,
          type: "image/bitmap"
        },
        transport: new InMemoryTransport({
          "pixel.png": new Uint8Array([1])
        })
      })
    ).rejects.toThrow("ImageBitmap decode aborted");
    expect(decoded).toBe(false);
  });
});

function resourceSummary(
  manager: ReturnType<typeof createAssetManager>,
  assetId: string
): ResourceSnapshot {
  const resource = manager
    .snapshot()
    .resources.find((candidate) => candidate.assetId === assetId);
  if (resource === undefined) {
    throw new Error(`Missing resource snapshot for ${assetId}`);
  }

  return resource;
}
