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
            "type": "data/json",
          },
          {
            "dependencyCount": 0,
            "id": "vanilla:text.fallback",
            "sourceCount": 1,
            "type": "text/plain",
          },
          {
            "dependencyCount": 0,
            "fallback": "vanilla:text.fallback",
            "id": "vanilla:text.intro",
            "sourceCount": 2,
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
});
