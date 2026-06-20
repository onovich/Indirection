import { describe, expect, it } from "vitest";
import {
  compileNormalizedModel,
  importIndirectionManifest
} from "@indirection/compiler";

function compileManifest(manifest: unknown) {
  return compileNormalizedModel(importIndirectionManifest(manifest));
}

describe("manifest compilation determinism", () => {
  it("is stable across authoring object insertion order", () => {
    const first = compileManifest({
      schemaVersion: 1,
      namespace: "order",
      assets: {
        b: {
          type: "text/plain",
          sources: [{ url: "b.txt" }]
        },
        a: {
          type: "data/json",
          sources: [{ url: "a.json" }],
          extensions: {
            hostOnly: {
              note: "schema accepts this but compiler drops it"
            }
          }
        }
      },
      groups: {
        scene: {
          assets: ["b", "a"]
        }
      }
    });

    const second = compileManifest({
      groups: {
        scene: {
          assets: ["b", "a"]
        }
      },
      assets: {
        a: {
          extensions: {
            hostOnly: {
              note: "schema accepts this but compiler drops it"
            }
          },
          sources: [{ url: "a.json" }],
          type: "data/json"
        },
        b: {
          sources: [{ url: "b.txt" }],
          type: "text/plain"
        }
      },
      namespace: "order",
      schemaVersion: 1
    });

    expect(first.catalog).toEqual(second.catalog);
    expect(first.report).toEqual(second.report);
    expect(first.report.assets.map((asset) => asset.id)).toEqual([
      "order:a",
      "order:b"
    ]);
    expect(first.catalog.assets["order:a"]).not.toHaveProperty("extensions");
  });
});
