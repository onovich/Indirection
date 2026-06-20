import { describe, expect, it } from "vitest";
import {
  emptyImportResult,
  importIndirectionManifest,
  indirectionManifestImporter,
  runImporter,
  type AssetImporter
} from "@indirection/compiler";
import { defineDiagnostic } from "@indirection/protocol";

describe("importer pipeline", () => {
  it("normalizes an Indirection manifest into compiler input records", async () => {
    const result = await runImporter(indirectionManifestImporter, {
      schemaVersion: 1,
      namespace: "game",
      assets: {
        "character.hero": {
          type: "model/gltf",
          sources: [
            {
              when: {
                quality: ["low"]
              },
              url: "./models/hero.low.glb"
            },
            {
              url: "./models/hero.glb"
            }
          ],
          dependencies: ["material.hero-style"],
          fallback: "system:placeholder.model",
          metadata: {
            tags: ["character"]
          }
        }
      },
      groups: {
        "scene.gate": {
          assets: ["character.hero"]
        }
      }
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "assets": [
          {
            "dependencies": [
              "game:material.hero-style",
            ],
            "fallback": "system:placeholder.model",
            "id": "game:character.hero",
            "metadata": {
              "tags": [
                "character",
              ],
            },
            "sources": [
              {
                "url": "./models/hero.low.glb",
                "when": {
                  "quality": [
                    "low",
                  ],
                },
              },
              {
                "url": "./models/hero.glb",
              },
            ],
            "type": "model/gltf",
          },
        ],
        "diagnostics": [],
        "groups": [
          {
            "assets": [
              "game:character.hero",
            ],
            "id": "game:scene.gate",
          },
        ],
      }
    `);
  });

  it("uses an explicit context namespace when the manifest omits one", () => {
    const result = importIndirectionManifest(
      {
        schemaVersion: 1,
        assets: {
          hero: {
            type: "model/gltf",
            sources: [{ url: "./models/hero.glb" }]
          }
        }
      },
      { defaultNamespace: "demo" }
    );

    expect(result.assets[0]?.id).toBe("demo:hero");
  });

  it("supports host-owned importer implementations", async () => {
    const hostImporter: AssetImporter<{ readonly ids: readonly string[] }> = {
      id: "host-manifest",
      host: "example-host",
      import(input) {
        return emptyImportResult(
          input.ids.map((assetId) =>
            defineDiagnostic({
              code: "IND_ASSET_UNKNOWN",
              severity: "warning",
              phase: "importer",
              assetId,
              recoverable: true,
              message: "Host importer surfaced a placeholder diagnostic."
            })
          )
        );
      }
    };

    const result = await runImporter(hostImporter, {
      ids: ["host:missing.asset"]
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.code).toBe("IND_ASSET_UNKNOWN");
  });
});
