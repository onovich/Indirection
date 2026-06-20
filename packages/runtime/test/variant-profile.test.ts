import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { createAssetManager } from "@indirection/runtime";

const image = normalizeAssetId("game:image.hero");

const catalog: CompiledCatalog = {
  protocolVersion,
  catalogVersion: "sha256-variant-profile",
  assets: {
    [image]: {
      type: "image/bitmap",
      sources: [
        {
          when: {
            quality: ["low"],
            platform: ["mobile"]
          },
          url: "hero.mobile.low.png"
        },
        {
          when: {
            locale: ["zh-CN"]
          },
          url: "hero.zh-CN.png"
        },
        {
          when: {
            capability: ["webp"]
          },
          url: "hero.webp"
        },
        {
          url: "hero.png"
        }
      ]
    }
  }
};

describe("variant profile resolution", () => {
  it("matches quality and platform together", () => {
    const manager = createAssetManager({
      catalog,
      context: {
        quality: "low",
        platform: "mobile"
      }
    });

    expect(manager.resolveSource(image)?.source.url).toBe("hero.mobile.low.png");
  });

  it("matches locale before later capability variants by declaration order", () => {
    const manager = createAssetManager({
      catalog,
      context: {
        locale: "zh-CN",
        capability: ["webp"]
      }
    });

    expect(manager.resolveSource(image)?.source.url).toBe("hero.zh-CN.png");
  });

  it("matches capability when earlier variants do not match", () => {
    const manager = createAssetManager({
      catalog,
      context: {
        quality: "high",
        platform: "desktop",
        capability: ["webp"]
      }
    });

    expect(manager.resolveSource(image)?.source.url).toBe("hero.webp");
  });

  it("uses the default source as deterministic fallback", () => {
    const manager = createAssetManager({ catalog });

    expect(manager.resolveSource(image)?.source.url).toBe("hero.png");
  });
});
