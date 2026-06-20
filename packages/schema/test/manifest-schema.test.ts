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
});
