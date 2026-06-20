import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager } from "@indirection/runtime";
import {
  createWebBinaryLoader,
  createWebDataLoaders,
  createWebJsonLoader,
  createWebTextLoader,
  loadersWebPackageName
} from "@indirection/loaders-web";

const config = normalizeAssetId("web:config");
const label = normalizeAssetId("web:label");
const bytes = normalizeAssetId("web:bytes");

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
    }
  }
};

describe("loaders-web", () => {
  it("exports browser-friendly data loaders", () => {
    expect(loadersWebPackageName).toBe("@indirection/loaders-web");
    expect(createWebJsonLoader().id).toBe("web-json");
    expect(createWebTextLoader().id).toBe("web-text");
    expect(createWebBinaryLoader().id).toBe("web-binary");
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
});
