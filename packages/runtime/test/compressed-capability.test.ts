import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  type AssetLoader,
  InMemoryTransport,
  createAssetManager
} from "@indirection/runtime";

const hero = normalizeAssetId("game:character.hero");
const fallback = normalizeAssetId("system:placeholder.model");

const catalog: CompiledCatalog = {
  protocolVersion,
  catalogVersion: "sha256-compressed-capability",
  assets: {
    [hero]: {
      type: "model/gltf",
      sources: [
        { when: { capability: ["draco"] }, url: "models/hero.draco.glb" },
        { when: { capability: ["ktx2"] }, url: "models/hero.ktx2.glb" },
        { when: { capability: ["meshopt"] }, url: "models/hero.meshopt.glb" },
        { url: "models/hero.glb" }
      ],
      fallback
    },
    [fallback]: {
      type: "model/gltf",
      sources: [{ url: "models/placeholder.glb" }]
    }
  }
};

describe("compressed capability source selection", () => {
  it.each([
    ["draco", "models/hero.draco.glb", 0],
    ["ktx2", "models/hero.ktx2.glb", 1],
    ["meshopt", "models/hero.meshopt.glb", 2]
  ] as const)(
    "selects the %s compressed source when the capability is present",
    (capability, expectedUrl, expectedIndex) => {
      const manager = createAssetManager({
        catalog,
        context: {
          capability: [capability]
        }
      });

      const resolved = manager.resolveSource(hero);

      expect(resolved?.source.url).toBe(expectedUrl);
      expect(resolved?.sourceIndex).toBe(expectedIndex);
    }
  );

  it("uses declaration order rather than capability array order", () => {
    const manager = createAssetManager({
      catalog,
      context: {
        capability: ["meshopt", "ktx2", "draco"]
      }
    });

    expect(manager.resolveSource(hero)?.source.url).toBe("models/hero.draco.glb");
  });

  it("selects the uncompressed default source when decoder capabilities are absent", () => {
    const manager = createAssetManager({ catalog });

    const resolved = manager.resolveSource(hero);

    expect(resolved?.source.url).toBe("models/hero.glb");
    expect(resolved?.sourceIndex).toBe(3);
  });

  it("keeps default source selection distinct from explicit runtime fallback", async () => {
    const manager = createAssetManager({
      catalog,
      context: {
        capability: ["draco"]
      },
      loaders: [gltfTextLoader],
      transport: new InMemoryTransport({
        "models/hero.glb": "uncompressed",
        "models/placeholder.glb": "placeholder"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire<LoadedGltfText>(hero);

    expect(handle.value).toEqual({
      sourceUrl: "models/placeholder.glb",
      body: "placeholder"
    });
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "fallback-ready",
      causeCode: "IND_DECODE_FAILED",
      fallbackAssetId: "system:placeholder.model"
    });

    await handle.release();
  });

  it("loads the uncompressed default source without fallback when capability is absent", async () => {
    const manager = createAssetManager({
      catalog,
      loaders: [gltfTextLoader],
      transport: new InMemoryTransport({
        "models/hero.glb": "uncompressed",
        "models/placeholder.glb": "placeholder"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire<LoadedGltfText>(hero);

    expect(handle.value).toEqual({
      sourceUrl: "models/hero.glb",
      body: "uncompressed"
    });
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "ready"
    });

    await handle.release();
  });
});

interface LoadedGltfText {
  readonly sourceUrl: string;
  readonly body: string;
}

const gltfTextLoader: AssetLoader<LoadedGltfText> = {
  id: "test-gltf-text-loader",
  types: ["model/gltf"],
  async load(context) {
    const response = await context.transport.read({
      assetId: context.assetId,
      source: context.source,
      ...(context.signal === undefined ? {} : { signal: context.signal })
    });

    return {
      value: {
        sourceUrl: context.source.source.url,
        body: String(response.body)
      }
    };
  }
};
