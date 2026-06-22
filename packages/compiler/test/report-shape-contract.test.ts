import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  compileNormalizedModel,
  importIndirectionManifest
} from "@indirection/compiler";
import { createSinanFixtureReport } from "../../../fixtures/sinan/report.ts";
import type { SinanFixtureManifest } from "../../../fixtures/sinan/importer.ts";

const vanillaFixtureUrl = new URL(
  "../../../fixtures/vanilla/indirection.manifest.json",
  import.meta.url
);
const sinanFixtureUrl = new URL(
  "../../../fixtures/sinan/assets.manifest.json",
  import.meta.url
);

describe("report JSON shape contract", () => {
  it("keeps the compiler asset report machine-readable shape stable", () => {
    const fixture = JSON.parse(readFileSync(vanillaFixtureUrl, "utf8")) as unknown;
    const report = compileNormalizedModel(importIndirectionManifest(fixture)).report;

    expect(Object.keys(report)).toEqual([
      "summary",
      "assets",
      "groups",
      "diagnostics",
      "fallbackSummary",
      "dependencyGraph",
      "determinism"
    ]);
    expect(Object.keys(report.summary)).toEqual([
      "protocolVersion",
      "catalogVersion",
      "assetCount",
      "groupCount",
      "diagnosticCount"
    ]);
    expect(Object.keys(report.assets[0] ?? {})).toEqual([
      "id",
      "type",
      "sourceCount",
      "sources",
      "dependencyCount"
    ]);
    expect(Object.keys(report.assets[0]?.sources[0] ?? {})).toEqual([
      "index",
      "url",
      "default"
    ]);
    expect(Object.keys(report.groups[0] ?? {})).toEqual([
      "id",
      "assets",
      "assetCount"
    ]);
    expect(Object.keys(report.fallbackSummary[0] ?? {})).toEqual([
      "assetId",
      "fallbackAssetId"
    ]);
    expect(Object.keys(report.dependencyGraph[0] ?? {})).toEqual([
      "assetId",
      "dependencies"
    ]);
    expect(report.determinism).toEqual({
      canonicalJsonVersion: 1,
      hashAlgorithm: "sha256",
      excludes: ["timestamps", "absolutePaths", "gitSha"]
    });
    expect(collectKeys(report)).not.toEqual(
      expect.arrayContaining([
        "timestamp",
        "absolutePath",
        "gitSha",
        "scopeId",
        "handle",
        "cacheHit"
      ])
    );
  });

  it("keeps Sinan compatibility report shapes stable without relying on messages", async () => {
    const fixture = JSON.parse(readFileSync(sinanFixtureUrl, "utf8")) as SinanFixtureManifest;
    const report = await createSinanFixtureReport(fixture);

    expect(Object.keys(report)).toEqual([
      "catalogDraft",
      "missingReferenceReport",
      "fallbackReport",
      "budgetCompatibilityReport"
    ]);
    expect(Object.keys(report.missingReferenceReport)).toEqual([
      "host",
      "fixture",
      "missingReferences",
      "diagnostics"
    ]);
    expect(Object.keys(report.missingReferenceReport.missingReferences[0] ?? {})).toEqual([
      "ownerType",
      "ownerId",
      "rawAssetId",
      "assetId"
    ]);
    expect(
      report.missingReferenceReport.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        severity: diagnostic.severity,
        phase: diagnostic.phase,
        assetId: diagnostic.assetId,
        path: diagnostic.path,
        recoverable: diagnostic.recoverable
      }))
    ).toEqual([
      {
        code: "IND_ASSET_UNKNOWN",
        severity: "error",
        phase: "importer",
        assetId: "sinan:gate.missing-audio",
        path: ["timeline", "intro", "gate.missing-audio"],
        recoverable: false
      }
    ]);
    expect(Object.keys(report.fallbackReport.fallbacks[0] ?? {})).toEqual([
      "assetId",
      "fallbackAssetId",
      "type",
      "fallbackType",
      "compatible"
    ]);
    expect(Object.keys(report.budgetCompatibilityReport.groups[0] ?? {})).toEqual([
      "groupId",
      "budgetTransferBytes",
      "actualTransferBytes",
      "withinBudget"
    ]);
    expect(Object.keys(report.budgetCompatibilityReport.assets[0] ?? {})).toEqual([
      "assetId",
      "transferBytes"
    ]);
  });
});

function collectKeys(value: unknown): readonly string[] {
  if (value === null || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectKeys(item));
  }

  return Object.entries(value).flatMap(([key, item]) => [
    key,
    ...collectKeys(item)
  ]);
}
