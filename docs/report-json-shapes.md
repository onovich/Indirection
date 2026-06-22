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
  sources: readonly AssetReportSource[];
  dependencyCount: number;
  fallback?: string;
}

interface AssetReportSource {
  index: number;
  url: string;
  default: boolean;
  when?: Record<string, readonly string[]>;
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

## Release Provenance Report

`scripts/release-provenance.mjs` emits a local dry-run artifact provenance report when run with `--json`. The generated output is for local inspection and test assertions only; do not commit generated provenance reports.

```ts
interface ReleaseProvenanceReport {
  schemaVersion: 1;
  generatedBy: "scripts/release-provenance.mjs";
  packageCount: number;
  policy: ReleaseProvenancePolicy;
  validation: ReleaseProvenanceValidation;
  packages: readonly ReleaseProvenancePackage[];
}
```

Policy fields must stay false while packages are private dry-run artifacts:

```ts
interface ReleaseProvenancePolicy {
  packageArtifacts: "dry-run-only";
  publish: false;
  npmLogin: false;
  registryWrite: false;
  gitTag: false;
  githubRelease: false;
  signing: false;
  sigstore: false;
  npmProvenanceUpload: false;
  oidcPublish: false;
}
```

Validation evidence:

```ts
interface ReleaseProvenanceValidation {
  commands: readonly ReleaseProvenanceCommand[];
  determinism: {
    canonicalJsonVersion: 1;
    hashAlgorithm: "sha256";
    excludes: readonly [
      "absolutePaths",
      "environmentVariables",
      "gitSha",
      "npmTokens",
      "registryCredentials",
      "timestamps",
      "usernames"
    ];
    verification: "repeat-pack-canonical-json-match";
  };
}

interface ReleaseProvenanceCommand {
  name: string;
  command: string;
  evidence: string;
}
```

Package entries:

```ts
interface ReleaseProvenancePackage {
  name: string;
  version: string;
  private: true;
  license: "UNLICENSED";
  packageDirectory: string;
  tarball: {
    filename: string;
    sha256: string;
    sha256Subject: "canonical-packed-payload";
    byteSize: number;
  };
  exports: readonly ReleaseProvenanceExport[];
  bin: readonly ReleaseProvenanceBin[];
  files: {
    count: number;
    paths: readonly string[];
  };
  validation: {
    packCommand: string;
    packageSmokeCommand: string;
    releaseGateCommand: string;
  };
}

interface ReleaseProvenanceExport {
  subpath: string;
  types?: string;
  import?: string;
  require?: string;
  default?: string;
  target?: string;
}

interface ReleaseProvenanceBin {
  name: string;
  path: string;
}
```

Release provenance reports must not include timestamps, absolute paths, local usernames, environment variable values, npm tokens, registry credentials, Git tags, GitHub Releases, signing evidence, Sigstore attestations, npm provenance uploads, or OIDC publish workflow state.

## Release CI Policy Report

`scripts/release-ci-check.mjs` emits a local static workflow policy report when run with `--json`. The generated output is for local inspection and test assertions only; do not commit generated CI policy reports.

```ts
interface ReleaseCiPolicyReport {
  schemaVersion: 1;
  generatedBy: "scripts/release-ci-check.mjs";
  workflowCount: number;
  policy: ReleaseCiPolicy;
  validation: ReleaseCiPolicyValidation;
  workflows: readonly ReleaseCiPolicyWorkflow[];
}
```

Policy fields must stay no-publish and read-only while release workflows are validation gates:

```ts
interface ReleaseCiPolicy {
  repositoryPermissions: "read-only";
  localCommandsAreSourceOfTruth: true;
  publish: false;
  npmLogin: false;
  registryWrite: false;
  gitTag: false;
  githubRelease: false;
  signing: false;
  sigstore: false;
  npmProvenanceUpload: false;
  oidcPublish: false;
  packageUpload: false;
  workflowWritePermissions: false;
}
```

Validation evidence:

```ts
interface ReleaseCiPolicyValidation {
  releaseCommandOrder: readonly [
    "corepack pnpm install --frozen-lockfile",
    "corepack pnpm release:ci-check",
    "corepack pnpm release:provenance",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight",
    "git diff --check"
  ];
  forbiddenActions: readonly string[];
  workflowPermissions: {
    required: {
      contents: "read";
    };
    forbiddenWritePermissions: readonly string[];
  };
}
```

Workflow entries:

```ts
interface ReleaseCiPolicyWorkflow {
  path: ".github/workflows/validate.yml" | ".github/workflows/release-dry-run.yml" | ".github/workflows/publish-preflight.yml";
  role: "validation" | "release-gate";
  trigger: "push-and-pull-request" | "workflow-dispatch";
  permissions: readonly ReleaseCiPolicyPermission[];
  commands: readonly string[];
  requiredCommands: readonly ReleaseCiPolicyCommandCheck[];
  forbiddenMatches: readonly ReleaseCiPolicyForbiddenMatch[];
  requiredText: readonly ReleaseCiPolicyTextCheck[];
  forbiddenCommands: readonly ReleaseCiPolicyForbiddenCommand[];
}

interface ReleaseCiPolicyPermission {
  name: string;
  access: "read";
}

interface ReleaseCiPolicyCommandCheck {
  command: string;
  order: number;
}

interface ReleaseCiPolicyForbiddenMatch {
  name: string;
  evidence: string;
}

interface ReleaseCiPolicyTextCheck {
  text: string;
  present: boolean;
}

interface ReleaseCiPolicyForbiddenCommand {
  command: string;
  present: false;
}
```

Release CI policy reports must not include workflow write permissions, secrets, registry credentials, npm publish commands, package uploads, artifact uploads, Git tag creation, Git tag pushes, GitHub Release creation, signing, Sigstore, npm provenance uploads, or OIDC publish workflow state.

## Release Candidate Rehearsal Report

`scripts/release-candidate-rehearsal.mjs` emits a local no-publish release-candidate handoff report when run with `--json`. The generated output is for local inspection and test assertions only; do not commit generated RC reports.

Run the local gate with:

```powershell
corepack pnpm release:rc-check
```

The report summarizes `release:ci-check` and `release:provenance` helper reports, then records required command evidence for `validate:full`, `release:dry-run`, `publish:preflight`, and `release:rc-check`.

```ts
interface ReleaseCandidateRehearsalReport {
  schemaVersion: 1;
  generatedBy: "scripts/release-candidate-rehearsal.mjs";
  releaseCandidate: ReleaseCandidateSummary;
  policy: ReleaseCandidatePolicy;
  validation: ReleaseCandidateValidation;
  packageCount: number;
  packageCandidates: readonly ReleaseCandidatePackage[];
  ownerDecisionBlockerCount: number;
  ownerDecisionBlockers: readonly ReleaseCandidateOwnerDecisionBlocker[];
  blockedActionCount: number;
  blockedActions: readonly ReleaseCandidateBlockedAction[];
  rollback: ReleaseCandidateRollback;
  handoff: ReleaseCandidateHandoff;
}
```

Summary and policy:

```ts
interface ReleaseCandidateSummary {
  name: "indirection-v0.1-local-rc";
  packageArtifacts: "dry-run-only";
  publishState: "blocked-pending-owner-decisions";
  targetPackageVersion: "0.1-owner-decision-pending";
  currentManifestVersion: "0.0.0";
}

interface ReleaseCandidatePolicy {
  localCommandsAreSourceOfTruth: true;
  packageArtifacts: "dry-run-only";
  privatePackagesRequired: true;
  licensePolicy: "UNLICENSED-private-only";
  publish: false;
  npmLogin: false;
  registryWrite: false;
  gitTag: false;
  tagPush: false;
  githubRelease: false;
  signing: false;
  sigstore: false;
  npmProvenanceUpload: false;
  oidcPublish: false;
  packageUpload: false;
  artifactUpload: false;
  workflowWritePermissions: false;
}
```

Validation evidence:

```ts
interface ReleaseCandidateValidation {
  gates: readonly ReleaseCandidateValidationGate[];
  sourceReports: readonly ReleaseCandidateSourceReport[];
  determinism: {
    canonicalJsonVersion: 1;
    hashAlgorithm: "sha256";
    excludes: readonly [
      "absolutePaths",
      "environmentVariables",
      "gitSha",
      "npmTokens",
      "registryCredentials",
      "timestamps",
      "usernames"
    ];
    verification: "canonical-rc-rehearsal-json";
  };
}

interface ReleaseCandidateValidationGate {
  name: string;
  command:
    | "corepack pnpm validate:full"
    | "corepack pnpm release:ci-check"
    | "corepack pnpm release:provenance"
    | "corepack pnpm release:dry-run"
    | "corepack pnpm publish:preflight"
    | "corepack pnpm release:rc-check";
  evidence: string;
  required: true;
}

interface ReleaseCandidateSourceReport {
  name: "release-ci-policy" | "release-provenance";
  command: "corepack pnpm release:ci-check" | "corepack pnpm release:provenance";
  generatedBy: "scripts/release-ci-check.mjs" | "scripts/release-provenance.mjs";
  workflowCount?: number;
  packageCount?: number;
}
```

Package entries:

```ts
interface ReleaseCandidatePackage {
  name: string;
  version: "0.0.0";
  private: true;
  license: "UNLICENSED";
  packageDirectory: string;
  candidacy: string;
  decisionStatus: "pending";
  requiredOwnerDecision: string;
  dryRunArtifact: {
    sha256: string;
    byteSize: number;
    fileCount: number;
    exportCount: number;
    binCount: number;
  };
  validation: {
    provenanceCommand: "corepack pnpm release:provenance";
    packageSmokeCommand: "corepack pnpm pack:check";
    dryRunGateCommand: "corepack pnpm release:dry-run";
    publishPreflightCommand: "corepack pnpm publish:preflight";
  };
}
```

Owner decision blockers and blocked actions:

```ts
interface ReleaseCandidateOwnerDecisionBlocker {
  id: string;
  status: "pending";
  blocks: "real-publish";
  requiredBefore: string;
  summary: string;
}

interface ReleaseCandidateBlockedAction {
  id: string;
  action: string;
  status: "blocked";
  boundary: string;
}
```

Rollback and release-candidate handoff:

```ts
interface ReleaseCandidateRollback {
  currentState: "no-publish-no-registry-artifact-no-tag";
  repositoryOnlyRollback: string;
  accidentalPublishResponse: string;
  npmUnpublish: false;
  githubReleaseRollback: false;
  registryArtifactRollback: false;
}

interface ReleaseCandidateHandoff {
  releaseOwner: "pending-owner-decision";
  approvers: "pending-owner-decision";
  recommendedNextDecision: string;
  nextAllowedPhase: string;
  docs: readonly [
    "docs/release-candidate-handoff.md",
    "docs/report-json-shapes.md",
    "docs/release-workflow.md",
    "docs/publish-preflight-policy.md"
  ];
}
```

Release candidate rehearsal reports must not include timestamps, absolute paths, local usernames, environment variable values, npm tokens, registry credentials, Git SHAs, generated artifact paths, real publish permission, workflow write permissions, package uploads, artifact uploads, Git tags, GitHub Releases, signing evidence, Sigstore attestations, npm provenance uploads, or OIDC publish workflow state.

## Validation

Report shape changes must update:

- compiler report tests for the vanilla fixture.
- Sinan report contract tests for the compatibility fixture.
- release provenance guard tests and `docs/release-provenance.md` when provenance fields change.
- release CI policy guard tests and `docs/release-ci-policy.md` when workflow policy fields change.
- release candidate rehearsal guard tests and `docs/release-candidate-handoff.md` when RC handoff fields change.
- this document when adding, removing, or changing machine-readable fields.
