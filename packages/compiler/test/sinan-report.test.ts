import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createSinanFixtureReport
} from "../../../fixtures/sinan/report.ts";
import type { SinanFixtureManifest } from "../../../fixtures/sinan/importer.ts";

const fixtureUrl = new URL(
  "../../../fixtures/sinan/assets.manifest.json",
  import.meta.url
);

describe("Sinan fixture reports", () => {
  it("outputs a catalog draft and missing reference report", async () => {
    const manifest = JSON.parse(readFileSync(fixtureUrl, "utf8")) as SinanFixtureManifest;
    const result = await createSinanFixtureReport(manifest);

    expect(result.catalogDraft.catalogVersion).toMatch(/^sha256-[0-9a-f]{64}$/);
    expect({
      catalogDraft: {
        ...result.catalogDraft,
        catalogVersion: "<catalog-hash>"
      },
      missingReferenceReport: result.missingReferenceReport
    }).toMatchInlineSnapshot(`
      {
        "catalogDraft": {
          "assets": {
            "sinan:gate.caption": {
              "fallback": "sinan:system.placeholder.text",
              "metadata": {
                "budget": {
                  "transferBytes": 4096,
                },
                "sinanFixture": "gate-demo-desensitized",
                "tags": [
                  "caption",
                  "director",
                ],
              },
              "sources": [
                {
                  "url": "text/gate/caption.zh-CN.txt",
                },
              ],
              "type": "text/plain",
            },
            "sinan:gate.environment": {
              "fallback": "sinan:system.placeholder.model",
              "metadata": {
                "budget": {
                  "transferBytes": 4200000,
                },
                "owner": "runtime/three",
                "sinanFixture": "gate-demo-desensitized",
                "tags": [
                  "environment",
                  "gate-demo",
                ],
              },
              "sources": [
                {
                  "url": "models/gate/environment.glb",
                },
              ],
              "type": "model/gltf",
            },
            "sinan:gate.hero": {
              "fallback": "sinan:system.placeholder.model",
              "metadata": {
                "budget": {
                  "transferBytes": 1800000,
                },
                "owner": "runtime/three",
                "sinanFixture": "gate-demo-desensitized",
                "tags": [
                  "character",
                  "gate-demo",
                ],
              },
              "sources": [
                {
                  "url": "models/gate/hero.glb",
                },
              ],
              "type": "model/gltf",
            },
            "sinan:system.placeholder.model": {
              "metadata": {
                "budget": {
                  "transferBytes": 128000,
                },
                "sinanFixture": "gate-demo-desensitized",
                "tags": [
                  "fallback",
                ],
              },
              "sources": [
                {
                  "url": "models/system/placeholder.glb",
                },
              ],
              "type": "model/gltf",
            },
            "sinan:system.placeholder.text": {
              "metadata": {
                "budget": {
                  "transferBytes": 512,
                },
                "sinanFixture": "gate-demo-desensitized",
                "tags": [
                  "fallback",
                ],
              },
              "sources": [
                {
                  "url": "text/system/placeholder.txt",
                },
              ],
              "type": "text/plain",
            },
          },
          "catalogVersion": "<catalog-hash>",
          "groups": {
            "sinan:scene.gate-demo": [
              "sinan:gate.hero",
              "sinan:gate.environment",
              "sinan:gate.caption",
            ],
          },
          "protocolVersion": 1,
        },
        "missingReferenceReport": {
          "diagnostics": [
            {
              "assetId": "sinan:gate.missing-audio",
              "code": "IND_ASSET_UNKNOWN",
              "message": "Sinan fixture reference does not resolve to a declared asset.",
              "path": [
                "timeline",
                "intro",
                "gate.missing-audio",
              ],
              "phase": "importer",
              "recoverable": false,
              "severity": "error",
            },
          ],
          "fixture": "gate-demo-desensitized",
          "host": "sinan-engine",
          "missingReferences": [
            {
              "assetId": "sinan:gate.missing-audio",
              "ownerId": "intro",
              "ownerType": "timeline",
              "rawAssetId": "gate.missing-audio",
            },
          ],
        },
      }
    `);
  });

  it("outputs fallback and budget compatibility reports", async () => {
    const manifest = JSON.parse(readFileSync(fixtureUrl, "utf8")) as SinanFixtureManifest;
    const result = await createSinanFixtureReport(manifest);

    expect({
      fallbackReport: result.fallbackReport,
      budgetCompatibilityReport: result.budgetCompatibilityReport
    }).toMatchInlineSnapshot(`
      {
        "budgetCompatibilityReport": {
          "assets": [
            {
              "assetId": "sinan:gate.hero",
              "transferBytes": 1800000,
            },
            {
              "assetId": "sinan:gate.environment",
              "transferBytes": 4200000,
            },
            {
              "assetId": "sinan:gate.caption",
              "transferBytes": 4096,
            },
            {
              "assetId": "sinan:system.placeholder.model",
              "transferBytes": 128000,
            },
            {
              "assetId": "sinan:system.placeholder.text",
              "transferBytes": 512,
            },
          ],
          "fixture": "gate-demo-desensitized",
          "groups": [
            {
              "actualTransferBytes": 6004096,
              "budgetTransferBytes": 6500000,
              "groupId": "sinan:scene.gate-demo",
              "withinBudget": true,
            },
          ],
          "host": "sinan-engine",
        },
        "fallbackReport": {
          "fallbacks": [
            {
              "assetId": "sinan:gate.hero",
              "compatible": true,
              "fallbackAssetId": "sinan:system.placeholder.model",
              "fallbackType": "model/gltf",
              "type": "model/gltf",
            },
            {
              "assetId": "sinan:gate.environment",
              "compatible": true,
              "fallbackAssetId": "sinan:system.placeholder.model",
              "fallbackType": "model/gltf",
              "type": "model/gltf",
            },
            {
              "assetId": "sinan:gate.caption",
              "compatible": true,
              "fallbackAssetId": "sinan:system.placeholder.text",
              "fallbackType": "text/plain",
              "type": "text/plain",
            },
          ],
          "fixture": "gate-demo-desensitized",
          "host": "sinan-engine",
        },
      }
    `);
  });
});
