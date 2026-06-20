import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  ResolverChain,
  createAssetManager,
  variantSourceResolver,
  type SourceResolver
} from "@indirection/runtime";

const hero = normalizeAssetId("game:character.hero");

const catalog: CompiledCatalog = {
  protocolVersion,
  catalogVersion: "sha256-resolver",
  assets: {
    [hero]: {
      type: "model/gltf",
      sources: [
        {
          when: {
            quality: ["low"],
            capability: ["webgl2"]
          },
          url: "models/hero.low.glb"
        },
        {
          url: "models/hero.glb"
        }
      ]
    }
  }
};

describe("ResolverChain", () => {
  it("selects the first matching variant source", () => {
    const chain = new ResolverChain();
    const resolved = chain.resolve({
      assetId: hero,
      asset: catalog.assets[hero]!,
      catalogVersion: catalog.catalogVersion,
      context: {
        quality: "low",
        capability: ["webgl2"]
      }
    });

    expect(resolved?.source.url).toBe("models/hero.low.glb");
    expect(resolved?.sourceIndex).toBe(0);
  });

  it("falls back to the default source when variants do not match", () => {
    const resolved = variantSourceResolver.resolve({
      assetId: hero,
      asset: catalog.assets[hero]!,
      catalogVersion: catalog.catalogVersion,
      context: {
        quality: "high",
        capability: ["webgpu"]
      }
    });

    expect(resolved?.source.url).toBe("models/hero.glb");
    expect(resolved?.sourceIndex).toBe(1);
  });

  it("allows host resolvers before the default resolver", () => {
    const hostResolver: SourceResolver = {
      id: "host-cdn",
      resolve(input) {
        return {
          assetId: input.assetId,
          type: input.asset.type,
          catalogVersion: input.catalogVersion,
          sourceIndex: 99,
          source: {
            url: `https://cdn.example.test/${input.assetId}.bin`
          }
        };
      }
    };

    const chain = new ResolverChain([hostResolver, variantSourceResolver]);
    expect(
      chain.resolve({
        assetId: hero,
        asset: catalog.assets[hero]!,
        catalogVersion: catalog.catalogVersion,
        context: {}
      })?.source.url
    ).toBe("https://cdn.example.test/game:character.hero.bin");
  });
});

describe("AssetManager source resolution", () => {
  it("resolves through the manager catalog store", () => {
    const manager = createAssetManager({
      catalog,
      context: {
        quality: "low",
        capability: ["webgl2"]
      }
    });

    expect(manager.resolveSource(hero)?.source.url).toBe("models/hero.low.glb");
    expect(manager.resolveSource("game:missing")).toBeUndefined();
  });
});
