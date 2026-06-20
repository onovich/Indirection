import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  InMemoryTransport,
  createAssetManager,
  type AssetLoader
} from "@indirection/runtime";
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
    expect(adapter.sceneScope.snapshot()).toMatchObject({
      id: "sinan-runtime-adapter",
      handleCount: 1
    });

    await adapter.disposeSceneScope();
    expect(adapter.sceneScope.snapshot()).toMatchObject({
      disposed: true,
      handleCount: 0
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
      featureFlag: {
        name: "indirection-runtime-adapter",
        enabled: false
      }
    });

    await expect(adapter.loadModel("sinan:gate.hero", "legacy/hero.glb")).resolves.toEqual({
      assetId: "sinan:gate.hero",
      url: "legacy/hero.glb",
      host: true
    });
  });

  it("falls back to host runtime and records adapter diagnostics", async () => {
    const manager = createAssetManager({ catalog });
    const hostRuntime: SinanWebRuntimeBoundary = {
      async loadModel(assetId, url) {
        return { assetId, url, host: true };
      }
    };
    const adapter = createSinanRuntimeAdapter({
      manager,
      hostRuntime
    });

    await expect(
      adapter.loadModel("sinan:missing.model", "legacy/missing.glb")
    ).resolves.toEqual({
      assetId: "sinan:missing.model",
      url: "legacy/missing.glb",
      host: true
    });
    expect(adapter.diagnostics()).toEqual([
      {
        code: "IND_ASSET_UNKNOWN",
        phase: "adapter",
        assetId: "sinan:missing.model",
        legacyUrl: "legacy/missing.glb",
        message: "Indirection adapter fell back to the host runtime."
      }
    ]);
  });

  it("falls back to host built-in loader when adapter loading fails", async () => {
    const failingModelLoader: AssetLoader = {
      id: "failing-model-loader",
      types: ["model/gltf"],
      load() {
        throw new Error("fake model decode failed");
      }
    };
    const manager = createAssetManager({
      catalog,
      loaders: [failingModelLoader],
      transport: new InMemoryTransport({
        "models/gate/hero.glb": "not-a-real-glb"
      })
    });
    const hostCalls: Array<readonly [string, string]> = [];
    const hostRuntime: SinanWebRuntimeBoundary = {
      async loadModel(assetId, url) {
        hostCalls.push([assetId, url]);
        return { assetId, url, host: true };
      }
    };
    const adapter = createSinanRuntimeAdapter({
      manager,
      hostRuntime
    });

    await expect(adapter.loadModel("sinan:gate.hero", "legacy/hero.glb")).resolves.toEqual({
      assetId: "sinan:gate.hero",
      url: "legacy/hero.glb",
      host: true
    });
    expect(hostCalls).toEqual([["sinan:gate.hero", "legacy/hero.glb"]]);
    expect(adapter.diagnostics()).toEqual([
      {
        code: "IND_INTERNAL_ERROR",
        phase: "adapter",
        assetId: "sinan:gate.hero",
        legacyUrl: "legacy/hero.glb",
        message: "Indirection adapter fell back to the host runtime."
      }
    ]);
  });

  it("clears scene scope handles and leak warnings after repeated loads", async () => {
    const manager = createAssetManager({ catalog });
    const hostRuntime: SinanWebRuntimeBoundary = {
      async loadModel(assetId, url) {
        return { assetId, url, host: true };
      }
    };
    const adapter = createSinanRuntimeAdapter({
      manager,
      hostRuntime
    });

    await adapter.loadModel("sinan:gate.hero", "legacy/hero.glb");
    await adapter.loadModel("sinan:gate.hero", "legacy/hero.glb");

    expect(adapter.sceneScope.snapshot()).toMatchObject({
      handleCount: 2
    });
    expect(manager.snapshot().leakWarnings).toEqual([
      {
        assetId: "sinan:gate.hero",
        state: "ready",
        refCount: 2
      }
    ]);

    await adapter.disposeSceneScope();

    expect(adapter.sceneScope.snapshot()).toMatchObject({
      disposed: true,
      handleCount: 0
    });
    expect(manager.snapshot().leakWarnings).toEqual([]);
  });
});
