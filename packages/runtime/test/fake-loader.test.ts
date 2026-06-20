import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  InMemoryTransport,
  LoaderRegistry,
  binaryAssetLoader,
  createAssetManager,
  jsonAssetLoader,
  textAssetLoader
} from "@indirection/runtime";

const config = normalizeAssetId("game:config");
const title = normalizeAssetId("game:title");
const blob = normalizeAssetId("game:blob");

const catalog: CompiledCatalog = {
  protocolVersion,
  catalogVersion: "sha256-loaders",
  assets: {
    [config]: {
      type: "data/json",
      sources: [{ url: "config.json" }]
    },
    [title]: {
      type: "text/plain",
      sources: [{ url: "title.txt" }]
    },
    [blob]: {
      type: "binary/array-buffer",
      sources: [{ url: "blob.bin" }]
    }
  }
};

describe("LoaderRegistry", () => {
  it("indexes fake loaders by supported type", () => {
    const registry = new LoaderRegistry([
      jsonAssetLoader,
      textAssetLoader,
      binaryAssetLoader
    ]);

    expect(registry.get("data/json")?.id).toBe("fake-json");
    expect(registry.get("text/plain")?.id).toBe("fake-text");
    expect(registry.get("binary/array-buffer")?.id).toBe("fake-binary");
  });
});

describe("fake loaders with in-memory transport", () => {
  it("loads json, text, and binary values through scope acquire", async () => {
    const manager = createAssetManager({
      catalog,
      transport: new InMemoryTransport({
        "config.json": { enabled: true },
        "title.txt": "Hello Indirection",
        "blob.bin": new Uint8Array([1, 2, 3])
      })
    });
    const scope = manager.createScope("test");

    await expect(scope.acquire(config).then((handle) => handle.value)).resolves.toEqual({
      enabled: true
    });
    await expect(scope.acquire(title).then((handle) => handle.value)).resolves.toBe(
      "Hello Indirection"
    );
    await expect(scope.acquire(blob).then((handle) => handle.value)).resolves.toEqual(
      new Uint8Array([1, 2, 3])
    );

    expect(manager.snapshot().resources).toEqual([
      expect.objectContaining({
        assetId: "game:blob",
        state: "ready"
      }),
      expect.objectContaining({
        assetId: "game:config",
        state: "ready"
      }),
      expect.objectContaining({
        assetId: "game:title",
        state: "ready"
      })
    ]);
  });
});
