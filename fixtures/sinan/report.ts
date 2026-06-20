import {
  compileNormalizedModel,
  runImporter,
  type ImportContext
} from "@indirection/compiler";
import {
  type CompiledCatalog,
  type Diagnostic,
  defineDiagnostic,
  normalizeAssetId
} from "@indirection/protocol";
import {
  sinanFixtureImporter,
  type SinanFixtureManifest,
  type SinanFixtureReference
} from "./importer.ts";

export interface SinanFixtureReportResult {
  readonly catalogDraft: CompiledCatalog;
  readonly missingReferenceReport: SinanMissingReferenceReport;
}

export interface SinanMissingReferenceReport {
  readonly host: string;
  readonly fixture: string;
  readonly missingReferences: readonly SinanMissingReference[];
  readonly diagnostics: readonly Diagnostic[];
}

export interface SinanMissingReference {
  readonly ownerType: string;
  readonly ownerId: string;
  readonly rawAssetId: string;
  readonly assetId: string;
}

export async function createSinanFixtureReport(
  manifest: SinanFixtureManifest,
  context: ImportContext = {}
): Promise<SinanFixtureReportResult> {
  const model = await runImporter(sinanFixtureImporter, manifest, context);
  const compiled = compileNormalizedModel(model);
  const defaultNamespace = context.defaultNamespace ?? "sinan";
  const knownAssetIds = new Set(model.assets.map((asset) => asset.id));
  const missingReferences = (manifest.references ?? [])
    .map((reference) => normalizeReference(reference, defaultNamespace))
    .filter((reference) => !knownAssetIds.has(reference.assetId));
  const diagnostics = missingReferences.map((reference) =>
    defineDiagnostic({
      code: "IND_ASSET_UNKNOWN",
      severity: "error",
      phase: "importer",
      assetId: reference.assetId,
      path: [reference.ownerType, reference.ownerId, reference.rawAssetId],
      recoverable: false,
      message: "Sinan fixture reference does not resolve to a declared asset."
    })
  );

  return {
    catalogDraft: compiled.catalog,
    missingReferenceReport: {
      host: manifest.host,
      fixture: manifest.fixture,
      missingReferences,
      diagnostics
    }
  };
}

function normalizeReference(
  reference: SinanFixtureReference,
  defaultNamespace: string
): SinanMissingReference {
  return {
    ownerType: reference.ownerType,
    ownerId: reference.ownerId,
    rawAssetId: reference.assetId,
    assetId: normalizeAssetId(reference.assetId, { defaultNamespace })
  };
}
