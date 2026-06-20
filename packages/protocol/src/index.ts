export const protocolPackageName = "@indirection/protocol";
export const protocolVersion = 1;

export type AssetId = string & { readonly __brand: "AssetId" };

export const diagnosticCodes = [
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
] as const;

export const diagnosticSeverities = ["info", "warning", "error"] as const;

export const diagnosticPhases = [
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
] as const;

export type DiagnosticCode = (typeof diagnosticCodes)[number];
export type DiagnosticSeverity = (typeof diagnosticSeverities)[number];
export type DiagnosticPhase = (typeof diagnosticPhases)[number];

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: DiagnosticSeverity;
  readonly phase: DiagnosticPhase;
  readonly assetId?: string;
  readonly path?: readonly string[];
  readonly sourceUrl?: string;
  readonly catalogVersion?: string;
  readonly causeCode?: string;
  readonly recoverable: boolean;
  readonly fallbackAssetId?: string;
  readonly message: string;
}

export function isDiagnosticCode(code: string): code is DiagnosticCode {
  return diagnosticCodes.includes(code as DiagnosticCode);
}

export function defineDiagnostic(diagnostic: Diagnostic): Diagnostic {
  return diagnostic;
}

export interface AssetIdParts {
  readonly namespace?: string;
  readonly path: readonly string[];
}

export interface NormalizeAssetIdOptions {
  readonly defaultNamespace?: string;
}

export type AssetIdParseErrorReason =
  | "empty"
  | "invalid-namespace"
  | "invalid-path"
  | "invalid-segment";

export class AssetIdParseError extends Error {
  readonly input: string;
  readonly reason: AssetIdParseErrorReason;

  constructor(input: string, reason: AssetIdParseErrorReason) {
    super(`Invalid AssetId: ${reason}`);
    this.name = "AssetIdParseError";
    this.input = input;
    this.reason = reason;
  }
}

const namespacePattern = /^[a-z0-9_-]+$/;
const segmentPattern = /^[a-z0-9_-]+$/;

export function parseAssetId(input: string): AssetIdParts {
  const value = input;

  if (value.length === 0) {
    throw new AssetIdParseError(input, "empty");
  }

  const colonIndex = value.indexOf(":");
  const hasNamespace = colonIndex >= 0;

  if (hasNamespace && value.indexOf(":", colonIndex + 1) >= 0) {
    throw new AssetIdParseError(input, "invalid-namespace");
  }

  const namespace = hasNamespace ? value.slice(0, colonIndex) : undefined;
  const pathValue = hasNamespace ? value.slice(colonIndex + 1) : value;

  if (namespace !== undefined && !namespacePattern.test(namespace)) {
    throw new AssetIdParseError(input, "invalid-namespace");
  }

  if (pathValue.length === 0) {
    throw new AssetIdParseError(input, "invalid-path");
  }

  const path = pathValue.split(".");
  for (const segment of path) {
    if (!segmentPattern.test(segment)) {
      throw new AssetIdParseError(input, "invalid-segment");
    }
  }

  return namespace === undefined ? { path } : { namespace, path };
}

export function normalizeAssetId(
  input: string,
  options: NormalizeAssetIdOptions = {}
): AssetId {
  const normalizedInput = input.trim().toLowerCase();
  const parts = parseAssetId(normalizedInput);
  const namespace = parts.namespace ?? normalizeDefaultNamespace(options.defaultNamespace);
  const pathValue = parts.path.join(".");

  return (namespace === undefined ? pathValue : `${namespace}:${pathValue}`) as AssetId;
}

export function isAssetId(input: string): input is AssetId {
  try {
    parseAssetId(input);
    return true;
  } catch (error) {
    if (error instanceof AssetIdParseError) {
      return false;
    }

    throw error;
  }
}

function normalizeDefaultNamespace(defaultNamespace: string | undefined): string | undefined {
  if (defaultNamespace === undefined) {
    return undefined;
  }

  const normalizedNamespace = defaultNamespace.trim().toLowerCase();
  if (!namespacePattern.test(normalizedNamespace)) {
    throw new AssetIdParseError(defaultNamespace, "invalid-namespace");
  }

  return normalizedNamespace;
}
