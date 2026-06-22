import {
  type CatalogSource,
  type CompiledCatalog,
  type Diagnostic,
  type DiagnosticCode,
  type JsonObject,
  type NormalizedAssetGroup,
  type NormalizedAssetModel,
  type NormalizedAssetRecord,
  type NormalizeAssetIdOptions,
  normalizeAssetId,
  protocolVersion
} from "@indirection/protocol";
import {
  type IndirectionManifest,
  type IndirectionManifestSource,
  parseIndirectionManifest,
  schemaVersion
} from "@indirection/schema";
import { createHash } from "node:crypto";

export const compilerPackageName = "@indirection/compiler";
export const compilerBaseline = {
  protocolVersion,
  schemaVersion
} as const;

export interface ImportContext {
  readonly defaultNamespace?: string;
  readonly sourceUrl?: string;
}

export interface AssetImporter<Input = unknown> {
  readonly id: string;
  readonly host?: string;

  import(
    input: Input,
    context: ImportContext
  ): Promise<ImportResult> | ImportResult;
}

export interface ImportResult extends NormalizedAssetModel {}

export const indirectionManifestImporter: AssetImporter<unknown> = {
  id: "indirection-manifest",
  import(input, context) {
    return importIndirectionManifest(input, context);
  }
};

export async function runImporter<Input>(
  importer: AssetImporter<Input>,
  input: Input,
  context: ImportContext = {}
): Promise<ImportResult> {
  return importer.import(input, context);
}

export function importIndirectionManifest(
  input: unknown,
  context: ImportContext = {}
): ImportResult {
  const manifest = parseIndirectionManifest(input);
  const defaultNamespace = manifest.namespace ?? context.defaultNamespace;

  return {
    assets: normalizeManifestAssets(manifest, defaultNamespace),
    groups: normalizeManifestGroups(manifest, defaultNamespace),
    diagnostics: []
  };
}

function normalizeManifestAssets(
  manifest: IndirectionManifest,
  defaultNamespace: string | undefined
): readonly NormalizedAssetRecord[] {
  const options = createNormalizeOptions(defaultNamespace);

  return Object.entries(manifest.assets).map(([id, asset]) => ({
    id: normalizeAssetId(id, options),
    type: asset.type,
    sources: asset.sources.map(normalizeManifestSource),
    dependencies: (asset.dependencies ?? []).map((dependency) =>
      normalizeAssetId(dependency, options)
    ),
    ...(asset.fallback === undefined
      ? {}
      : { fallback: normalizeAssetId(asset.fallback, options) }),
    ...(asset.metadata === undefined
      ? {}
      : { metadata: asset.metadata as JsonObject })
  }));
}

function normalizeManifestGroups(
  manifest: IndirectionManifest,
  defaultNamespace: string | undefined
): readonly NormalizedAssetGroup[] {
  const options = createNormalizeOptions(defaultNamespace);

  return Object.entries(manifest.groups ?? {}).map(([id, group]) => ({
    id: normalizeAssetId(id, options),
    assets: group.assets.map((asset) => normalizeAssetId(asset, options))
  }));
}

function normalizeManifestSource(source: IndirectionManifestSource): CatalogSource {
  return {
    url: source.url,
    ...(source.when === undefined ? {} : { when: source.when }),
    ...(source.bytes === undefined ? {} : { bytes: source.bytes }),
    ...(source.integrity === undefined ? {} : { integrity: source.integrity })
  };
}

export function emptyImportResult(
  diagnostics: readonly Diagnostic[] = []
): ImportResult {
  return {
    assets: [],
    groups: [],
    diagnostics
  };
}

export type CatalogHashInput = Omit<CompiledCatalog, "catalogVersion">;

export function canonicalJson(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON does not support non-finite numbers.");
    }

    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const entries = keys.map((key) => {
      const item = record[key];
      if (item === undefined) {
        throw new TypeError("Canonical JSON does not support undefined values.");
      }

      return `${JSON.stringify(key)}:${canonicalJson(item)}`;
    });

    return `{${entries.join(",")}}`;
  }

  throw new TypeError(`Canonical JSON does not support ${typeof value}.`);
}

export function computeCatalogHash(input: CatalogHashInput): string {
  const digest = createHash("sha256").update(canonicalJson(input)).digest("hex");
  return `sha256-${digest}`;
}

export interface ValidationOptions {
  readonly catalogVersion?: string;
  readonly sourceUrl?: string;
}

export interface CompileOptions extends ValidationOptions {}

export interface CompileResult {
  readonly catalog: CompiledCatalog;
  readonly report: AssetReport;
  readonly diagnostics: readonly Diagnostic[];
}

export interface AssetReport {
  readonly summary: {
    readonly protocolVersion: typeof protocolVersion;
    readonly catalogVersion: string;
    readonly assetCount: number;
    readonly groupCount: number;
    readonly diagnosticCount: number;
  };
  readonly assets: readonly AssetReportAsset[];
  readonly groups: readonly AssetReportGroup[];
  readonly diagnostics: readonly Diagnostic[];
  readonly fallbackSummary: readonly AssetReportFallback[];
  readonly dependencyGraph: readonly AssetReportDependency[];
  readonly determinism: {
    readonly canonicalJsonVersion: 1;
    readonly hashAlgorithm: "sha256";
    readonly excludes: readonly ["timestamps", "absolutePaths", "gitSha"];
  };
}

export interface AssetReportAsset {
  readonly id: string;
  readonly type: string;
  readonly sourceCount: number;
  readonly dependencyCount: number;
  readonly fallback?: string;
}

export interface AssetReportGroup {
  readonly id: string;
  readonly assets: readonly string[];
  readonly assetCount: number;
}

export interface AssetReportFallback {
  readonly assetId: string;
  readonly fallbackAssetId: string;
}

export interface AssetReportDependency {
  readonly assetId: string;
  readonly dependencies: readonly string[];
}

export function validateNormalizedModel(
  model: NormalizedAssetModel,
  options: ValidationOptions = {}
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const assetsById = new Map<string, NormalizedAssetRecord>();
  const duplicateIds = new Set<string>();

  for (const asset of model.assets) {
    if (assetsById.has(asset.id)) {
      duplicateIds.add(asset.id);
      diagnostics.push(
        createCompilerDiagnostic(
          "IND_ASSET_DUPLICATE",
          asset.id,
          "Duplicate asset id.",
          options
        )
      );
      continue;
    }

    assetsById.set(asset.id, asset);
  }

  for (const asset of model.assets) {
    diagnostics.push(...validateVariantSources(asset, options));

    for (const dependency of asset.dependencies) {
      if (!assetsById.has(dependency)) {
        diagnostics.push(
          createCompilerDiagnostic(
            "IND_ASSET_UNKNOWN",
            asset.id,
            "Asset dependency is not declared.",
            options,
            {
              path: ["assets", asset.id, "dependencies", dependency],
              causeCode: "dependency"
            }
          )
        );
      }
    }

    if (asset.fallback !== undefined) {
      const fallback = assetsById.get(asset.fallback);
      if (fallback === undefined) {
        diagnostics.push(
          createCompilerDiagnostic(
            "IND_ASSET_UNKNOWN",
            asset.id,
            "Asset fallback is not declared.",
            options,
            {
              path: ["assets", asset.id, "fallback"],
              fallbackAssetId: asset.fallback,
              causeCode: "fallback"
            }
          )
        );
      } else if (fallback.type !== asset.type) {
        diagnostics.push(
          createCompilerDiagnostic(
            "IND_FALLBACK_TYPE_MISMATCH",
            asset.id,
            "Asset fallback has an incompatible type.",
            options,
            {
              path: ["assets", asset.id, "fallback"],
              fallbackAssetId: asset.fallback
            }
          )
        );
      }
    }
  }

  diagnostics.push(
    ...detectAssetCycles(
      model.assets,
      assetsById,
      (asset) => asset.dependencies,
      "IND_DEPENDENCY_CYCLE",
      duplicateIds,
      options
    )
  );
  diagnostics.push(
    ...detectAssetCycles(
      model.assets,
      assetsById,
      (asset) => (asset.fallback === undefined ? [] : [asset.fallback]),
      "IND_FALLBACK_CYCLE",
      duplicateIds,
      options
    )
  );

  return diagnostics;
}

export function compileNormalizedModel(
  model: NormalizedAssetModel,
  options: CompileOptions = {}
): CompileResult {
  const diagnostics = [...model.diagnostics, ...validateNormalizedModel(model, options)];
  const catalogHashInput = createCatalogHashInput(model);
  const catalogVersion = computeCatalogHash(catalogHashInput);
  const catalog: CompiledCatalog = {
    ...catalogHashInput,
    catalogVersion
  };
  const report = createAssetReport(catalog, model, diagnostics);

  return {
    catalog,
    report,
    diagnostics
  };
}

function createNormalizeOptions(
  defaultNamespace: string | undefined
): NormalizeAssetIdOptions {
  return defaultNamespace === undefined ? {} : { defaultNamespace };
}

function createCatalogHashInput(model: NormalizedAssetModel): CatalogHashInput {
  const assets = Object.fromEntries(
    [...model.assets]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((asset) => [
        asset.id,
        {
          type: asset.type,
          sources: asset.sources,
          ...(asset.dependencies.length === 0
            ? {}
            : { dependencies: [...asset.dependencies].sort() }),
          ...(asset.fallback === undefined ? {} : { fallback: asset.fallback }),
          ...(asset.metadata === undefined ? {} : { metadata: asset.metadata })
        }
      ])
  );
  const groups = Object.fromEntries(
    [...model.groups]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((group) => [group.id, group.assets])
  );

  return {
    protocolVersion,
    assets,
    ...(Object.keys(groups).length === 0 ? {} : { groups })
  };
}

function createAssetReport(
  catalog: CompiledCatalog,
  model: NormalizedAssetModel,
  diagnostics: readonly Diagnostic[]
): AssetReport {
  const sortedAssets = [...model.assets].sort((left, right) =>
    left.id.localeCompare(right.id)
  );
  const sortedGroups = [...model.groups].sort((left, right) =>
    left.id.localeCompare(right.id)
  );

  return {
    summary: {
      protocolVersion,
      catalogVersion: catalog.catalogVersion,
      assetCount: sortedAssets.length,
      groupCount: sortedGroups.length,
      diagnosticCount: diagnostics.length
    },
    assets: sortedAssets.map((asset) => ({
      id: asset.id,
      type: asset.type,
      sourceCount: asset.sources.length,
      dependencyCount: asset.dependencies.length,
      ...(asset.fallback === undefined ? {} : { fallback: asset.fallback })
    })),
    groups: sortedGroups.map((group) => ({
      id: group.id,
      assets: group.assets,
      assetCount: group.assets.length
    })),
    diagnostics,
    fallbackSummary: sortedAssets.flatMap((asset) =>
      asset.fallback === undefined
        ? []
        : [{ assetId: asset.id, fallbackAssetId: asset.fallback }]
    ),
    dependencyGraph: sortedAssets.map((asset) => ({
      assetId: asset.id,
      dependencies: [...asset.dependencies].sort()
    })),
    determinism: {
      canonicalJsonVersion: 1,
      hashAlgorithm: "sha256",
      excludes: ["timestamps", "absolutePaths", "gitSha"]
    }
  };
}

function validateVariantSources(
  asset: NormalizedAssetRecord,
  options: ValidationOptions
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const defaultSourceIndexes = asset.sources
    .map((source, index) => (source.when === undefined ? index : -1))
    .filter((index) => index >= 0);

  if (defaultSourceIndexes.length !== 1) {
    diagnostics.push(
      createCompilerDiagnostic(
        "IND_VARIANT_INVALID",
        asset.id,
        "Asset sources must contain exactly one default source.",
        options,
        { causeCode: "variant", path: ["assets", asset.id, "sources"] }
      )
    );
  } else if (defaultSourceIndexes[0] !== asset.sources.length - 1) {
    diagnostics.push(
      createCompilerDiagnostic(
        "IND_VARIANT_INVALID",
        asset.id,
        "Asset default source must be last.",
        options,
        { causeCode: "variant", path: ["assets", asset.id, "sources"] }
      )
    );
  }

  asset.sources.forEach((source, sourceIndex) => {
    for (const [dimension, values] of Object.entries(source.when ?? {})) {
      if (dimension.length === 0 || values.length === 0) {
        diagnostics.push(
          createCompilerDiagnostic(
            "IND_VARIANT_INVALID",
            asset.id,
            "Variant conditions must use non-empty dimensions and values.",
            options,
            {
              causeCode: "variant",
              path: ["assets", asset.id, "sources", String(sourceIndex), "when"]
            }
          )
        );
      }
    }
  });

  return diagnostics;
}

function detectAssetCycles(
  assets: readonly NormalizedAssetRecord[],
  assetsById: ReadonlyMap<string, NormalizedAssetRecord>,
  getTargets: (asset: NormalizedAssetRecord) => readonly string[],
  code: Extract<DiagnosticCode, "IND_DEPENDENCY_CYCLE" | "IND_FALLBACK_CYCLE">,
  duplicateIds: ReadonlySet<string>,
  options: ValidationOptions
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const visited = new Set<string>();
  const active = new Set<string>();
  const reported = new Set<string>();

  function visit(asset: NormalizedAssetRecord, stack: readonly string[]): void {
    if (duplicateIds.has(asset.id)) {
      return;
    }

    if (active.has(asset.id)) {
      const cycleStart = stack.indexOf(asset.id);
      const cycle = [...stack.slice(cycleStart), asset.id];
      const key = cycle.join(">");

      if (!reported.has(key)) {
        reported.add(key);
        diagnostics.push(
          createCompilerDiagnostic(
            code,
            asset.id,
            "Asset reference graph contains a cycle.",
            options,
            {
              path: cycle,
              causeCode: code === "IND_DEPENDENCY_CYCLE" ? "dependency" : "fallback"
            }
          )
        );
      }

      return;
    }

    if (visited.has(asset.id)) {
      return;
    }

    active.add(asset.id);
    const nextStack = [...stack, asset.id];

    for (const targetId of getTargets(asset)) {
      const target = assetsById.get(targetId);
      if (target !== undefined) {
        visit(target, nextStack);
      }
    }

    active.delete(asset.id);
    visited.add(asset.id);
  }

  for (const asset of assets) {
    visit(asset, []);
  }

  return diagnostics;
}

function createCompilerDiagnostic(
  code: DiagnosticCode,
  assetId: string,
  message: string,
  options: ValidationOptions,
  details: Partial<
    Pick<Diagnostic, "causeCode" | "fallbackAssetId" | "path">
  > = {}
): Diagnostic {
  return {
    code,
    severity: "error",
    phase: "compiler",
    assetId,
    recoverable: false,
    message,
    ...(options.catalogVersion === undefined
      ? {}
      : { catalogVersion: options.catalogVersion }),
    ...(options.sourceUrl === undefined ? {} : { sourceUrl: options.sourceUrl }),
    ...details
  };
}
