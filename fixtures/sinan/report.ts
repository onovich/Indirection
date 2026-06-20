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
  readonly fallbackReport: SinanFallbackReport;
  readonly budgetCompatibilityReport: SinanBudgetCompatibilityReport;
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

export interface SinanFallbackReport {
  readonly host: string;
  readonly fixture: string;
  readonly fallbacks: readonly SinanFallbackEntry[];
}

export interface SinanFallbackEntry {
  readonly assetId: string;
  readonly fallbackAssetId: string;
  readonly type: string;
  readonly fallbackType?: string;
  readonly compatible: boolean;
}

export interface SinanBudgetCompatibilityReport {
  readonly host: string;
  readonly fixture: string;
  readonly groups: readonly SinanBudgetGroupEntry[];
  readonly assets: readonly SinanBudgetAssetEntry[];
}

export interface SinanBudgetGroupEntry {
  readonly groupId: string;
  readonly budgetTransferBytes?: number;
  readonly actualTransferBytes: number;
  readonly withinBudget: boolean;
}

export interface SinanBudgetAssetEntry {
  readonly assetId: string;
  readonly transferBytes?: number;
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
    },
    fallbackReport: createFallbackReport(manifest, defaultNamespace),
    budgetCompatibilityReport: createBudgetCompatibilityReport(
      manifest,
      defaultNamespace
    )
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

function createFallbackReport(
  manifest: SinanFixtureManifest,
  defaultNamespace: string
): SinanFallbackReport {
  const assetsById = new Map(
    manifest.assets.map((asset) => [
      normalizeAssetId(asset.id, { defaultNamespace }),
      asset
    ])
  );

  return {
    host: manifest.host,
    fixture: manifest.fixture,
    fallbacks: manifest.assets.flatMap((asset) => {
      if (asset.fallback === undefined) {
        return [];
      }

      const assetId = normalizeAssetId(asset.id, { defaultNamespace });
      const fallbackAssetId = normalizeAssetId(asset.fallback, { defaultNamespace });
      const fallback = assetsById.get(fallbackAssetId);

      return [
        {
          assetId,
          fallbackAssetId,
          type: asset.type,
          ...(fallback === undefined ? {} : { fallbackType: fallback.type }),
          compatible: fallback?.type === asset.type
        }
      ];
    })
  };
}

function createBudgetCompatibilityReport(
  manifest: SinanFixtureManifest,
  defaultNamespace: string
): SinanBudgetCompatibilityReport {
  const assetsById = new Map(
    manifest.assets.map((asset) => [
      normalizeAssetId(asset.id, { defaultNamespace }),
      asset
    ])
  );
  const groups = Object.entries(manifest.groups ?? {}).map(([groupId, rawAssetIds]) => {
    const normalizedGroupId = normalizeAssetId(groupId, { defaultNamespace });
    const actualTransferBytes = rawAssetIds.reduce((total, rawAssetId) => {
      const asset = assetsById.get(normalizeAssetId(rawAssetId, { defaultNamespace }));
      return total + (readTransferBytes(asset?.budget) ?? 0);
    }, 0);
    const budgetTransferBytes = readTransferBytes(
      readJsonObject(manifest.budgets?.[groupId])
    );

    return {
      groupId: normalizedGroupId,
      ...(budgetTransferBytes === undefined ? {} : { budgetTransferBytes }),
      actualTransferBytes,
      withinBudget:
        budgetTransferBytes === undefined
          ? true
          : actualTransferBytes <= budgetTransferBytes
    };
  });

  return {
    host: manifest.host,
    fixture: manifest.fixture,
    groups,
    assets: manifest.assets.map((asset) => ({
      assetId: normalizeAssetId(asset.id, { defaultNamespace }),
      ...(readTransferBytes(asset.budget) === undefined
        ? {}
        : { transferBytes: readTransferBytes(asset.budget) })
    }))
  };
}

function readTransferBytes(budget: JsonObject | undefined): number | undefined {
  const transferBytes = budget?.["transferBytes"];
  return typeof transferBytes === "number" ? transferBytes : undefined;
}

function readJsonObject(value: unknown): JsonObject | undefined {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    return undefined;
  }

  return value as JsonObject;
}
