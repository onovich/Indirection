import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createSinanFixtureReport } from "../../../fixtures/sinan/report.ts";
import type { SinanFixtureManifest } from "../../../fixtures/sinan/importer.ts";

const fixtureUrl = new URL(
  "../../../fixtures/sinan/assets.manifest.json",
  import.meta.url
);

describe("Sinan report contract", () => {
  it("is deterministic and does not mutate host-owned fixture input", async () => {
    const manifest = JSON.parse(readFileSync(fixtureUrl, "utf8")) as SinanFixtureManifest;
    const before = JSON.stringify(manifest);

    const first = await createSinanFixtureReport(manifest);
    const second = await createSinanFixtureReport(manifest);

    expect(JSON.stringify(manifest)).toBe(before);
    expect(first).toEqual(second);
    expect(first.missingReferenceReport.diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      phase: diagnostic.phase,
      path: diagnostic.path
    }))).toEqual([
      {
        code: "IND_ASSET_UNKNOWN",
        phase: "importer",
        path: ["timeline", "intro", "gate.missing-audio"]
      }
    ]);
  });
});
