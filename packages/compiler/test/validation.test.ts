import { describe, expect, it } from "vitest";
import {
  validateNormalizedModel,
  type ImportResult
} from "@indirection/compiler";
import { normalizeAssetId } from "@indirection/protocol";

function model(assets: ImportResult["assets"]): ImportResult {
  return {
    assets,
    groups: [],
    diagnostics: []
  };
}

describe("compiler validation", () => {
  it("reports duplicate assets and unknown dependencies", () => {
    const hero = normalizeAssetId("game:character.hero");
    const missing = normalizeAssetId("game:material.missing");
    const diagnostics = validateNormalizedModel(
      model([
        {
          id: hero,
          type: "model/gltf",
          sources: [{ url: "models/hero.glb" }],
          dependencies: [missing]
        },
        {
          id: hero,
          type: "model/gltf",
          sources: [{ url: "models/hero-copy.glb" }],
          dependencies: []
        }
      ])
    );

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "IND_ASSET_DUPLICATE",
      "IND_ASSET_UNKNOWN"
    ]);
  });

  it("reports dependency cycles", () => {
    const a = normalizeAssetId("game:a");
    const b = normalizeAssetId("game:b");
    const diagnostics = validateNormalizedModel(
      model([
        {
          id: a,
          type: "data/json",
          sources: [{ url: "a.json" }],
          dependencies: [b]
        },
        {
          id: b,
          type: "data/json",
          sources: [{ url: "b.json" }],
          dependencies: [a]
        }
      ])
    );

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "IND_DEPENDENCY_CYCLE"
    );
  });

  it("reports fallback cycles and type mismatches", () => {
    const modelA = normalizeAssetId("game:model-a");
    const modelB = normalizeAssetId("game:model-b");
    const jsonFallback = normalizeAssetId("game:json-fallback");
    const diagnostics = validateNormalizedModel(
      model([
        {
          id: modelA,
          type: "model/gltf",
          sources: [{ url: "model-a.glb" }],
          dependencies: [],
          fallback: modelB
        },
        {
          id: modelB,
          type: "model/gltf",
          sources: [{ url: "model-b.glb" }],
          dependencies: [],
          fallback: modelA
        },
        {
          id: jsonFallback,
          type: "data/json",
          sources: [{ url: "fallback.json" }],
          dependencies: []
        },
        {
          id: normalizeAssetId("game:model-c"),
          type: "model/gltf",
          sources: [{ url: "model-c.glb" }],
          dependencies: [],
          fallback: jsonFallback
        }
      ])
    );

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "IND_FALLBACK_TYPE_MISMATCH",
      "IND_FALLBACK_CYCLE"
    ]);
  });

  it("reports missing or misplaced default variant sources", () => {
    const diagnostics = validateNormalizedModel(
      model([
        {
          id: normalizeAssetId("game:hero"),
          type: "model/gltf",
          sources: [
            { url: "hero.glb" },
            { when: { quality: ["low"] }, url: "hero.low.glb" }
          ],
          dependencies: []
        },
        {
          id: normalizeAssetId("game:tree"),
          type: "model/gltf",
          sources: [{ when: { quality: ["low"] }, url: "tree.low.glb" }],
          dependencies: []
        }
      ])
    );

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "IND_VARIANT_INVALID",
      "IND_VARIANT_INVALID"
    ]);
  });

  it("accepts compressed capability sources when a default source is last", () => {
    const diagnostics = validateNormalizedModel(
      model([
        {
          id: normalizeAssetId("game:hero"),
          type: "model/gltf",
          sources: [
            { when: { capability: ["draco"] }, url: "hero.draco.glb" },
            { when: { capability: ["ktx2"] }, url: "hero.ktx2.glb" },
            { when: { capability: ["meshopt"] }, url: "hero.meshopt.glb" },
            { url: "hero.glb" }
          ],
          dependencies: []
        }
      ])
    );

    expect(diagnostics).toEqual([]);
  });

  it("reports empty compressed capability conditions as invalid variants", () => {
    const diagnostics = validateNormalizedModel(
      model([
        {
          id: normalizeAssetId("game:hero"),
          type: "model/gltf",
          sources: [
            { when: { capability: [] }, url: "hero.draco.glb" },
            { url: "hero.glb" }
          ],
          dependencies: []
        }
      ])
    );

    expect(diagnostics).toMatchObject([
      {
        code: "IND_VARIANT_INVALID",
        causeCode: "variant",
        path: ["assets", "game:hero", "sources", "0", "when"]
      }
    ]);
  });
});
