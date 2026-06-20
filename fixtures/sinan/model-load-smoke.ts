import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  InMemoryTransport,
  createAssetManager,
  type AssetLoader
} from "@indirection/runtime";
import { createSinanRuntimeAdapter } from "./adapter-facade.ts";

export interface SinanModelLoadSmokeResult {
  readonly loaded: boolean;
  readonly value: unknown;
  readonly diagnostics: readonly unknown[];
  readonly scopeDisposed: boolean;
}

const hero = normalizeAssetId("sinan:gate.hero");

const fakeModelLoader: AssetLoader = {
  id: "fake-sinan-model-loader",
  types: ["model/gltf"],
  async load(context) {
    return {
      value: {
        kind: "fake-model",
        assetId: context.assetId,
        sourceUrl: context.source.source.url
      }
    };
  }
};

export async function runSinanModelLoadSmoke(): Promise<SinanModelLoadSmokeResult> {
  const catalog: CompiledCatalog = {
    protocolVersion,
    catalogVersion: "sha256-sinan-model-smoke",
    assets: {
      [hero]: {
        type: "model/gltf",
        sources: [{ url: "models/gate/hero.glb" }]
      }
    }
  };
  const manager = createAssetManager({
    catalog,
    loaders: [fakeModelLoader],
    transport: new InMemoryTransport({
      "models/gate/hero.glb": "fake-glb-bytes"
    })
  });
  const adapter = createSinanRuntimeAdapter({
    manager,
    hostRuntime: {
      async loadModel(assetId, url) {
        return {
          kind: "host-model",
          assetId,
          sourceUrl: url
        };
      }
    },
    scopeId: "smoke.scene.gate"
  });
  const value = await adapter.loadModel("sinan:gate.hero", "legacy/gate/hero.glb");

  await adapter.disposeSceneScope();

  return {
    loaded: true,
    value,
    diagnostics: adapter.diagnostics(),
    scopeDisposed: adapter.sceneScope.disposed
  };
}
