import {
  type CatalogSource,
  type CompiledCatalog,
  type Diagnostic,
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

function createNormalizeOptions(
  defaultNamespace: string | undefined
): NormalizeAssetIdOptions {
  return defaultNamespace === undefined ? {} : { defaultNamespace };
}
