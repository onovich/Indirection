# Report JSON Shapes

This document describes the machine-readable report shapes used by the Phase 8 release-candidate gates. Field order is intentionally stable in generated reports and tests, but consumers should key by property name rather than order.

## Stability Rules

- `code` fields are public contract values.
- `message` fields are explanatory text and may change.
- Reports must not include timestamps, absolute local paths, Git SHAs, runtime handles, scope ids, cache hits, or decoded runtime values.
- Catalogs and reports are derived artifacts. Host-owned authoring data remains the source of truth.
- Optional fields are omitted when the value is unavailable.

## Diagnostic

Diagnostics are shared by protocol, compiler, runtime, adapter, CLI, and report surfaces.

```ts
interface Diagnostic {
  code: DiagnosticCode;
  severity: "info" | "warning" | "error";
  phase:
    | "protocol"
    | "schema"
    | "importer"
    | "compiler"
    | "runtime"
    | "transport"
    | "loader"
    | "adapter"
    | "cli"
    | "browser-smoke"
    | "internal";
  assetId?: string;
  path?: readonly string[];
  sourceUrl?: string;
  catalogVersion?: string;
  causeCode?: string;
  recoverable: boolean;
  fallbackAssetId?: string;
  message: string;
}
```

Consumer guidance:

- Use `code`, `phase`, `assetId`, `path`, and `recoverable` for automation.
- Do not branch on `message`.
- Treat unknown future `code` values as errors unless a host policy explicitly marks them recoverable.

## Compiler Asset Report

`compileNormalizedModel(...).report` emits:

```ts
interface AssetReport {
  summary: {
    protocolVersion: number;
    catalogVersion: string;
    assetCount: number;
    groupCount: number;
    diagnosticCount: number;
  };
  assets: readonly AssetReportAsset[];
  groups: readonly AssetReportGroup[];
  diagnostics: readonly Diagnostic[];
  fallbackSummary: readonly AssetReportFallback[];
  dependencyGraph: readonly AssetReportDependency[];
  determinism: {
    canonicalJsonVersion: 1;
    hashAlgorithm: "sha256";
    excludes: readonly ["timestamps", "absolutePaths", "gitSha"];
  };
}
```

Asset entries:

```ts
interface AssetReportAsset {
  id: string;
  type: string;
  sourceCount: number;
  dependencyCount: number;
  fallback?: string;
}
```

Group entries:

```ts
interface AssetReportGroup {
  id: string;
  assets: readonly string[];
  assetCount: number;
}
```

Fallback entries:

```ts
interface AssetReportFallback {
  assetId: string;
  fallbackAssetId: string;
}
```

Dependency graph entries:

```ts
interface AssetReportDependency {
  assetId: string;
  dependencies: readonly string[];
}
```

## Sinan Fixture Reports

Sinan fixture reports are compatibility artifacts, not core public API. They are still covered by contract tests because they model host-owned importer/report workflows.

Top-level result:

```ts
interface SinanFixtureReportResult {
  catalogDraft: CompiledCatalog;
  missingReferenceReport: SinanMissingReferenceReport;
  fallbackReport: SinanFallbackReport;
  budgetCompatibilityReport: SinanBudgetCompatibilityReport;
}
```

Missing reference report:

```ts
interface SinanMissingReferenceReport {
  host: string;
  fixture: string;
  missingReferences: readonly SinanMissingReference[];
  diagnostics: readonly Diagnostic[];
}

interface SinanMissingReference {
  ownerType: string;
  ownerId: string;
  rawAssetId: string;
  assetId: string;
}
```

Fallback report:

```ts
interface SinanFallbackReport {
  host: string;
  fixture: string;
  fallbacks: readonly SinanFallbackEntry[];
}

interface SinanFallbackEntry {
  assetId: string;
  fallbackAssetId: string;
  type: string;
  fallbackType?: string;
  compatible: boolean;
}
```

Budget compatibility report:

```ts
interface SinanBudgetCompatibilityReport {
  host: string;
  fixture: string;
  groups: readonly SinanBudgetGroupEntry[];
  assets: readonly SinanBudgetAssetEntry[];
}

interface SinanBudgetGroupEntry {
  groupId: string;
  budgetTransferBytes?: number;
  actualTransferBytes: number;
  withinBudget: boolean;
}

interface SinanBudgetAssetEntry {
  assetId: string;
  transferBytes?: number;
}
```

## Validation

Report shape changes must update:

- compiler report tests for the vanilla fixture.
- Sinan report contract tests for the compatibility fixture.
- this document when adding, removing, or changing machine-readable fields.
