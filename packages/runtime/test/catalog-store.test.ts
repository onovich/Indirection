import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { CatalogStore, createAssetManager } from "@indirection/runtime";

const hero = normalizeAssetId("game:character.hero");
const scene = normalizeAssetId("game:scene.gate");

function catalog(catalogVersion: string): CompiledCatalog {
  return {
    protocolVersion,
    catalogVersion,
    assets: {
      [hero]: {
        type: "model/gltf",
        sources: [{ url: "models/hero.glb" }]
      }
    },
    groups: {
      [scene]: [hero]
    }
  };
}

describe("CatalogStore", () => {
  it("indexes catalog assets and groups without loader semantics", () => {
    const store = new CatalogStore(catalog("sha256-initial"));

    expect(store.catalogVersion).toBe("sha256-initial");
    expect(store.getAsset(hero)?.type).toBe("model/gltf");
    expect(store.getGroup(scene)).toEqual([hero]);
    expect(store.getAsset("game:missing")).toBeUndefined();
    expect(store.snapshot()).toEqual({
      catalogVersion: "sha256-initial",
      assetCount: 1,
      groupCount: 1,
      resources: []
    });
  });

  it("supports explicit catalog replacement", () => {
    const store = new CatalogStore(catalog("sha256-initial"));

    store.replaceCatalog({
      protocolVersion,
      catalogVersion: "sha256-replacement",
      assets: {}
    });

    expect(store.catalogVersion).toBe("sha256-replacement");
    expect(store.listAssetIds()).toEqual([]);
    expect(store.listGroupIds()).toEqual([]);
  });
});

describe("createAssetManager", () => {
  it("creates the runtime entry point around a catalog store", () => {
    const manager = createAssetManager({ catalog: catalog("sha256-manager") });

    expect(manager.catalogStore.getAsset(hero)?.sources).toEqual([
      { url: "models/hero.glb" }
    ]);
    expect(manager.snapshot()).toEqual({
      catalogVersion: "sha256-manager",
      assetCount: 1,
      groupCount: 1,
      resources: []
    });
  });
});
