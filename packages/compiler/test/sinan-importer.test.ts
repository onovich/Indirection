import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compileNormalizedModel, runImporter } from "@indirection/compiler";
import {
  sinanFixtureImporter,
  type SinanFixtureManifest
} from "../../../fixtures/sinan/importer.ts";

const fixtureUrl = new URL(
  "../../../fixtures/sinan/assets.manifest.json",
  import.meta.url
);

describe("Sinan fixture importer prototype", () => {
  it("normalizes Sinan-owned fixture data without entering core API", async () => {
    const manifest = JSON.parse(readFileSync(fixtureUrl, "utf8")) as SinanFixtureManifest;
    const model = await runImporter(sinanFixtureImporter, manifest);
    const compiled = compileNormalizedModel(model);

    expect(model.assets.map((asset) => asset.id)).toEqual([
      "sinan:gate.hero",
      "sinan:gate.environment",
      "sinan:gate.caption",
      "sinan:system.placeholder.model",
      "sinan:system.placeholder.text"
    ]);
    expect(model.groups[0]).toEqual({
      id: "sinan:scene.gate-demo",
      assets: [
        "sinan:gate.hero",
        "sinan:gate.environment",
        "sinan:gate.caption"
      ]
    });
    expect(model.assets[0]?.fallback).toBe("sinan:system.placeholder.model");
    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.catalog.assets["sinan:gate.hero"]?.sources).toEqual([
      {
        url: "models/gate/hero.glb"
      }
    ]);
  });
});
