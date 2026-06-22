import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  compileNormalizedModel,
  importIndirectionManifest
} from "@indirection/compiler";

const fixtureUrl = new URL(
  "../../../fixtures/vanilla/indirection.manifest.json",
  import.meta.url
);

describe("compile report", () => {
  it("compiles the vanilla fixture into a deterministic catalog and report", () => {
    const fixture = JSON.parse(readFileSync(fixtureUrl, "utf8")) as unknown;
    const model = importIndirectionManifest(fixture);
    const first = compileNormalizedModel(model);
    const second = compileNormalizedModel(model);

    expect(first.catalog.catalogVersion).toMatch(/^sha256-[0-9a-f]{64}$/);
    expect(first.catalog).toEqual(second.catalog);
    expect(first.report).toEqual(second.report);
    expect({
      ...first.report,
      summary: {
        ...first.report.summary,
        catalogVersion: "<catalog-hash>"
      }
    }).toMatchInlineSnapshot(`
      {
        "assets": [
          {
            "dependencyCount": 0,
            "id": "vanilla:config.gameplay",
            "sourceCount": 1,
            "sources": [
              {
                "default": true,
                "index": 0,
                "url": "./config/gameplay.json",
              },
            ],
            "type": "data/json",
          },
          {
            "dependencyCount": 0,
            "id": "vanilla:text.fallback",
            "sourceCount": 1,
            "sources": [
              {
                "default": true,
                "index": 0,
                "url": "./text/fallback.txt",
              },
            ],
            "type": "text/plain",
          },
          {
            "dependencyCount": 0,
            "fallback": "vanilla:text.fallback",
            "id": "vanilla:text.intro",
            "sourceCount": 2,
            "sources": [
              {
                "default": false,
                "index": 0,
                "url": "./text/intro.zh-CN.txt",
                "when": {
                  "locale": [
                    "zh-CN",
                  ],
                },
              },
              {
                "default": true,
                "index": 1,
                "url": "./text/intro.en.txt",
              },
            ],
            "type": "text/plain",
          },
        ],
        "dependencyGraph": [
          {
            "assetId": "vanilla:config.gameplay",
            "dependencies": [],
          },
          {
            "assetId": "vanilla:text.fallback",
            "dependencies": [],
          },
          {
            "assetId": "vanilla:text.intro",
            "dependencies": [],
          },
        ],
        "determinism": {
          "canonicalJsonVersion": 1,
          "excludes": [
            "timestamps",
            "absolutePaths",
            "gitSha",
          ],
          "hashAlgorithm": "sha256",
        },
        "diagnostics": [],
        "fallbackSummary": [
          {
            "assetId": "vanilla:text.intro",
            "fallbackAssetId": "vanilla:text.fallback",
          },
        ],
        "groups": [
          {
            "assetCount": 2,
            "assets": [
              "vanilla:config.gameplay",
              "vanilla:text.intro",
            ],
            "id": "vanilla:scene.intro",
          },
        ],
        "summary": {
          "assetCount": 3,
          "catalogVersion": "<catalog-hash>",
          "diagnosticCount": 0,
          "groupCount": 1,
          "protocolVersion": 1,
        },
      }
    `);
  });

  it("reports compressed capability source conditions without runtime decoder objects", () => {
    const model = importIndirectionManifest({
      schemaVersion: 1,
      namespace: "game",
      assets: {
        "character.hero": {
          type: "model/gltf",
          sources: [
            { when: { capability: ["draco"] }, url: "./models/hero.draco.glb" },
            { when: { capability: ["ktx2"] }, url: "./models/hero.ktx2.glb" },
            { when: { capability: ["meshopt"] }, url: "./models/hero.meshopt.glb" },
            { url: "./models/hero.glb" }
          ]
        }
      }
    });

    expect(compileNormalizedModel(model).report.assets[0]?.sources).toEqual([
      {
        index: 0,
        url: "./models/hero.draco.glb",
        default: false,
        when: { capability: ["draco"] }
      },
      {
        index: 1,
        url: "./models/hero.ktx2.glb",
        default: false,
        when: { capability: ["ktx2"] }
      },
      {
        index: 2,
        url: "./models/hero.meshopt.glb",
        default: false,
        when: { capability: ["meshopt"] }
      },
      {
        index: 3,
        url: "./models/hero.glb",
        default: true
      }
    ]);
  });
});
