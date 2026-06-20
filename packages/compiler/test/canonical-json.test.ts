import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  computeCatalogHash,
  type CatalogHashInput
} from "@indirection/compiler";
import { normalizeAssetId, protocolVersion } from "@indirection/protocol";

describe("canonical JSON", () => {
  it("sorts object keys recursively while preserving array order", () => {
    expect(
      canonicalJson({
        z: 1,
        a: {
          c: true,
          b: ["two", "one"]
        }
      })
    ).toBe('{"a":{"b":["two","one"],"c":true},"z":1}');
  });

  it("rejects values that are not valid JSON payloads", () => {
    expect(() => canonicalJson(Number.NaN)).toThrow(TypeError);
    expect(() => canonicalJson({ invalid: undefined })).toThrow(TypeError);
    expect(() => canonicalJson(() => undefined)).toThrow(TypeError);
  });
});

describe("catalog hash", () => {
  it("is deterministic across object insertion order", () => {
    const hero = normalizeAssetId("game:character.hero");
    const fallback = normalizeAssetId("system:placeholder.model");

    const first: CatalogHashInput = {
      protocolVersion,
      assets: {
        [hero]: {
          type: "model/gltf",
          sources: [{ url: "models/hero.glb" }],
          fallback
        }
      }
    };

    const second: CatalogHashInput = {
      assets: {
        [hero]: {
          fallback,
          sources: [{ url: "models/hero.glb" }],
          type: "model/gltf"
        }
      },
      protocolVersion
    };

    const firstHash = computeCatalogHash(first);
    const secondHash = computeCatalogHash(second);

    expect(firstHash).toMatch(/^sha256-[0-9a-f]{64}$/);
    expect(firstHash).toBe(secondHash);
    expect(firstHash).toBe(computeCatalogHash(first));
  });
});
