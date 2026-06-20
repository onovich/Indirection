import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager } from "@indirection/runtime";
import {
  createSinanRuntimeAdapter,
  type SinanWebRuntimeBoundary
} from "../../../fixtures/sinan/adapter-facade.ts";

const hero = normalizeAssetId("sinan:gate.hero");

const catalog: CompiledCatalog = {
  protocolVersion,
  catalogVersion: "sha256-sinan-adapter",
  assets: {
    [hero]: {
      type: "model/gltf",
      sources: [{ url: "models/gate/hero.glb" }]
    }
  }
};

describe("Sinan runtime adapter facade", () => {
  it("preserves the WebRuntime.loadModel(assetId, url) external shape", async () => {
    const manager = createAssetManager({
      catalog,
      transport: new InMemoryTransport()
    });
    const hostRuntime: SinanWebRuntimeBoundary = {
      async loadModel(assetId, url) {
        return { assetId, url, host: true };
      }
    };
    const adapter = createSinanRuntimeAdapter({
      manager,
      hostRuntime
    });

    const result = await adapter.loadModel("sinan:gate.hero", "legacy/hero.glb");

    expect(result).toMatchObject({
      assetId: "sinan:gate.hero",
      source: {
        url: "models/gate/hero.glb"
      }
    });
  });

  it("can be feature-disabled back to the host runtime", async () => {
    const manager = createAssetManager({ catalog });
    const hostRuntime: SinanWebRuntimeBoundary = {
      async loadModel(assetId, url) {
        return { assetId, url, host: true };
      }
    };
    const adapter = createSinanRuntimeAdapter({
      manager,
      hostRuntime,
      enabled: false
    });

    await expect(adapter.loadModel("sinan:gate.hero", "legacy/hero.glb")).resolves.toEqual({
      assetId: "sinan:gate.hero",
      url: "legacy/hero.glb",
      host: true
    });
  });
});
