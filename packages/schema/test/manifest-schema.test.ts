import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  indirectionManifestSchema,
  parseIndirectionManifest
} from "@indirection/schema";

describe("Indirection authoring manifest schema", () => {
  it("accepts a minimal manifest with host-owned asset references", () => {
    const manifest = parseIndirectionManifest({
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
              url: "./models/hero.low.glb",
              bytes: 812345
            },
            {
              url: "./models/hero.glb"
            }
          ],
          dependencies: ["material.hero-style"],
          fallback: "system:placeholder.model",
          metadata: {
            tags: ["character", "chapter-1"]
          },
          extensions: {
            sinan: {
              instancingHint: "never"
            }
          }
        }
      },
      groups: {
        "scene.gate": {
          assets: ["character.hero"]
        }
      }
    });

    expect(manifest.assets["character.hero"]?.fallback).toBe(
      "system:placeholder.model"
    );
    expect(manifest.groups?.["scene.gate"]?.assets).toEqual(["character.hero"]);
  });

  it("accepts compressed capability source conditions as declarative strings", () => {
    const manifest = parseIndirectionManifest({
      schemaVersion: 1,
      namespace: "game",
      assets: {
        "character.hero": {
          type: "model/gltf",
          sources: [
            {
              when: {
                capability: ["draco", "ktx2", "meshopt"]
              },
              url: "./models/hero.compressed.glb"
            },
            {
              url: "./models/hero.glb"
            }
          ]
        }
      }
    });

    expect(manifest.assets["character.hero"]?.sources[0]?.when).toEqual({
      capability: ["draco", "ktx2", "meshopt"]
    });
  });

  it("rejects missing sources and unknown top-level fields", () => {
    expect(() =>
      indirectionManifestSchema.parse({
        schemaVersion: 1,
        namespace: "game",
        assets: {
          "character.hero": {
            type: "model/gltf",
            sources: []
          }
        },
        runtimeCache: true
      })
    ).toThrow(ZodError);
  });

  it("rejects path-like asset references at the schema boundary", () => {
    expect(() =>
      parseIndirectionManifest({
        schemaVersion: 1,
        assets: {
          hero: {
            type: "model/gltf",
            sources: [{ url: "./models/hero.glb" }],
            dependencies: ["./models/material.glb"]
          }
        }
      })
    ).toThrow(ZodError);
  });

  it("rejects executable or object-shaped capability conditions", () => {
    expect(() =>
      parseIndirectionManifest({
        schemaVersion: 1,
        namespace: "game",
        assets: {
          "character.hero": {
            type: "model/gltf",
            sources: [
              {
                when: {
                  capability: [{ decoder: "draco" }]
                },
                url: "./models/hero.draco.glb"
              },
              {
                url: "./models/hero.glb"
              }
            ]
          }
        }
      })
    ).toThrow(ZodError);
  });
});
