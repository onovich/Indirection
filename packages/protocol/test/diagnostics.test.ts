import { describe, expect, it } from "vitest";
import {
  defineDiagnostic,
  diagnosticCodes,
  diagnosticPhases,
  diagnosticSeverities,
  isDiagnosticCode
} from "@indirection/protocol";

describe("diagnostics", () => {
  it("keeps the first public diagnostic code set stable", () => {
    expect(diagnosticCodes).toEqual([
      "IND_ASSET_ID_INVALID",
      "IND_ASSET_DUPLICATE",
      "IND_ASSET_UNKNOWN",
      "IND_TYPE_UNSUPPORTED",
      "IND_SOURCE_UNRESOLVED",
      "IND_DEPENDENCY_CYCLE",
      "IND_FALLBACK_CYCLE",
      "IND_FALLBACK_TYPE_MISMATCH",
      "IND_VARIANT_INVALID",
      "IND_CATALOG_INVALID",
      "IND_TRANSPORT_FAILED",
      "IND_DECODE_FAILED",
      "IND_ABORTED",
      "IND_SCOPE_DISPOSED",
      "IND_INTERNAL_ERROR"
    ]);
  });

  it("defines severity and phase as protocol vocabulary", () => {
    expect(diagnosticSeverities).toEqual(["info", "warning", "error"]);
    expect(diagnosticPhases).toEqual([
      "protocol",
      "schema",
      "importer",
      "compiler",
      "runtime",
      "transport",
      "loader",
      "adapter",
      "cli",
      "browser-smoke",
      "internal"
    ]);
  });

  it("checks codes without relying on diagnostic messages", () => {
    expect(isDiagnosticCode("IND_ASSET_UNKNOWN")).toBe(true);
    expect(isDiagnosticCode("asset missing")).toBe(false);

    expect(
      defineDiagnostic({
        code: "IND_ASSET_UNKNOWN",
        severity: "error",
        phase: "runtime",
        assetId: "game:missing.asset",
        recoverable: true,
        fallbackAssetId: "system:placeholder.model",
        message: "Human-readable text can change without changing the code."
      })
    ).toMatchObject({
      code: "IND_ASSET_UNKNOWN",
      recoverable: true,
      fallbackAssetId: "system:placeholder.model"
    });
  });
});
