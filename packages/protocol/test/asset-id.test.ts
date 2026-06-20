import { describe, expect, it } from "vitest";
import {
  AssetIdParseError,
  isAssetId,
  normalizeAssetId,
  parseAssetId
} from "@indirection/protocol";

describe("AssetId parsing", () => {
  it("parses namespaced asset ids into stable parts", () => {
    expect(parseAssetId("game:character.hero_idle")).toEqual({
      namespace: "game",
      path: ["character", "hero_idle"]
    });
  });

  it("parses namespace-free asset ids", () => {
    expect(parseAssetId("scene.gate-01")).toEqual({
      path: ["scene", "gate-01"]
    });
  });

  it("rejects malformed ids without path semantics", () => {
    const invalidIds = [
      "",
      " ",
      "Game:character.hero",
      "game:",
      ":character.hero",
      "game:character..hero",
      "game:character/hero",
      "game:character hero",
      " game:character.hero",
      "https://example.test/hero"
    ];

    for (const id of invalidIds) {
      expect(() => parseAssetId(id), id).toThrow(AssetIdParseError);
      expect(isAssetId(id), id).toBe(false);
    }
  });
});

describe("AssetId normalization", () => {
  it("trims and lowercases human input", () => {
    expect(normalizeAssetId(" Game:Character.Hero_Idle ")).toBe(
      "game:character.hero_idle"
    );
  });

  it("applies a default namespace to relative ids", () => {
    expect(normalizeAssetId("scene.gate", { defaultNamespace: "Game" })).toBe(
      "game:scene.gate"
    );
  });

  it("preserves explicit namespaces over defaults", () => {
    expect(normalizeAssetId("ui:button.primary", { defaultNamespace: "game" })).toBe(
      "ui:button.primary"
    );
  });

  it("rejects invalid default namespaces", () => {
    expect(() =>
      normalizeAssetId("scene.gate", { defaultNamespace: "game/world" })
    ).toThrow(AssetIdParseError);
  });
});
