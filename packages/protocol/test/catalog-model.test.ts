import { describe, expect, it } from "vitest";
import {
  type CompiledCatalog,
  type NormalizedAssetModel,
  defineDiagnostic,
  normalizeAssetId,
  protocolVersion
} from "@indirection/protocol";

describe("catalog model", () => {
  it("captures the minimal compiled catalog shape", () => {
    const hero = normalizeAssetId("game:character.hero");
    const material = normalizeAssetId("game:material.hero-style");
    const fallback = normalizeAssetId("system:placeholder.model");
    const group = normalizeAssetId("game:scene.gate");

    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-test-catalog",
      assets: {
        [hero]: {
          type: "model/gltf",
          sources: [
            {
              when: {
                quality: ["low"]
              },
              url: "models/hero.low.glb",
              bytes: 812345
            },
            {
              url: "models/hero.glb",
              bytes: 1854321
            }
          ],
          dependencies: [material],
          fallback,
          metadata: {
            tags: ["character", "chapter-1"]
          }
        }
      },
      groups: {
        [group]: [hero]
      }
    };

    expect(catalog).toMatchInlineSnapshot(`
      {
        "assets": {
          "game:character.hero": {
            "dependencies": [
              "game:material.hero-style",
            ],
            "fallback": "system:placeholder.model",
            "metadata": {
              "tags": [
                "character",
                "chapter-1",
              ],
            },
            "sources": [
              {
                "bytes": 812345,
                "url": "models/hero.low.glb",
                "when": {
                  "quality": [
                    "low",
                  ],
                },
              },
              {
                "bytes": 1854321,
                "url": "models/hero.glb",
              },
            ],
            "type": "model/gltf",
          },
        },
        "catalogVersion": "sha256-test-catalog",
        "groups": {
          "game:scene.gate": [
            "game:character.hero",
          ],
        },
        "protocolVersion": 1,
      }
    `);
  });
});

describe("normalized importer model", () => {
  it("keeps host input normalized before catalog compilation", () => {
    const missing = normalizeAssetId("game:missing.asset");
    const model: NormalizedAssetModel = {
      assets: [],
      groups: [],
      diagnostics: [
        defineDiagnostic({
          code: "IND_ASSET_UNKNOWN",
          severity: "error",
          phase: "importer",
          assetId: missing,
          recoverable: false,
          message: "The message is not part of the stable snapshot contract."
        })
      ]
    };

    expect(model).toMatchInlineSnapshot(`
      {
        "assets": [],
        "diagnostics": [
          {
            "assetId": "game:missing.asset",
            "code": "IND_ASSET_UNKNOWN",
            "message": "The message is not part of the stable snapshot contract.",
            "phase": "importer",
            "recoverable": false,
            "severity": "error",
          },
        ],
        "groups": [],
      }
    `);
  });
});
