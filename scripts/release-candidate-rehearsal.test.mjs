import { describe, expect, it } from "vitest";
import {
  assertReleaseCandidateRehearsalReport,
  canonicalReleaseCandidateRehearsalJson
} from "./release-candidate-rehearsal.mjs";

describe("release candidate rehearsal report guards", () => {
  it("accepts deterministic no-publish RC evidence", () => {
    const report = createFixtureReport();

    expect(() => assertReleaseCandidateRehearsalReport(report)).not.toThrow();
    expect(canonicalReleaseCandidateRehearsalJson(report)).toBe(
      `${JSON.stringify(report, null, 2)}\n`
    );
  });

  it("rejects accepted owner decisions in the no-publish rehearsal", () => {
    const report = createFixtureReport();
    report.ownerDecisionBlockers[0].status = "accepted";

    expect(() => assertReleaseCandidateRehearsalReport(report)).toThrow(/pending/);
  });

  it("rejects unblocked real-publish actions", () => {
    const report = createFixtureReport();
    report.blockedActions[0].status = "allowed";

    expect(() => assertReleaseCandidateRehearsalReport(report)).toThrow(/blocked/);
  });

  it("rejects timestamps in RC report output", () => {
    const report = createFixtureReport();
    report.handoff.nextAllowedPhase = "approved at 2026-06-23T00:00:00Z";

    expect(() => assertReleaseCandidateRehearsalReport(report)).toThrow(/timestamp/);
  });

  it("rejects absolute local paths in RC report output", () => {
    const report = createFixtureReport();
    report.handoff.docs.push("C:/Users/example/project/docs/release-candidate-handoff.md");

    expect(() => assertReleaseCandidateRehearsalReport(report)).toThrow(/absolute path/);
  });

  it("rejects registry credential assignments in RC report output", () => {
    const report = createFixtureReport();
    report.blockedActions[0].boundary = "_authToken=secret";

    expect(() => assertReleaseCandidateRehearsalReport(report)).toThrow(/credentials/);
  });
});

function createFixtureReport() {
  const packageCandidates = [
    "cli",
    "compiler",
    "loaders-web",
    "protocol",
    "runtime",
    "schema",
    "testkit",
    "three",
    "vite"
  ].map((name) => createPackageCandidate(`@indirection/${name}`));
  const ownerDecisionBlockers = [
    "git-tag-policy",
    "github-release-policy",
    "npm-account-and-2fa",
    "npm-scope-ownership",
    "package-upload-policy",
    "package-visibility",
    "provenance-upload-policy",
    "public-license",
    "release-owner-approver",
    "rollback-policy",
    "signing-policy",
    "versioning-policy",
    "workflow-write-permission-policy"
  ]
    .map((id) => ({
      id,
      status: "pending",
      blocks: "real-publish",
      requiredBefore: "real-publish",
      summary: "Owner decision is required before real publish."
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const blockedActions = [
    "artifact-upload",
    "git-tag-create",
    "git-tag-push",
    "github-release",
    "npm-access",
    "npm-dist-tag",
    "npm-login",
    "npm-owner",
    "npm-provenance-upload",
    "npm-publish",
    "npm-token",
    "npm-whoami",
    "oidc-publish",
    "package-upload",
    "pnpm-publish",
    "registry-write",
    "sigstore",
    "signing",
    "workflow-write-permissions"
  ]
    .map((id) => ({
      id,
      action: id,
      status: "blocked",
      boundary: "Blocked during no-publish release-candidate rehearsal."
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    schemaVersion: 1,
    generatedBy: "scripts/release-candidate-rehearsal.mjs",
    releaseCandidate: {
      name: "indirection-v0.1-local-rc",
      packageArtifacts: "dry-run-only",
      publishState: "blocked-pending-owner-decisions",
      targetPackageVersion: "0.1-owner-decision-pending",
      currentManifestVersion: "0.0.0"
    },
    policy: {
      localCommandsAreSourceOfTruth: true,
      packageArtifacts: "dry-run-only",
      privatePackagesRequired: true,
      licensePolicy: "UNLICENSED-private-only",
      publish: false,
      npmLogin: false,
      registryWrite: false,
      gitTag: false,
      tagPush: false,
      githubRelease: false,
      signing: false,
      sigstore: false,
      npmProvenanceUpload: false,
      oidcPublish: false,
      packageUpload: false,
      artifactUpload: false,
      workflowWritePermissions: false
    },
    validation: {
      gates: [
        {
          name: "validate-full",
          command: "corepack pnpm validate:full",
          evidence: "main local matrix",
          required: true
        },
        {
          name: "release-ci-check",
          command: "corepack pnpm release:ci-check",
          evidence: "workflow policy",
          required: true
        },
        {
          name: "release-provenance",
          command: "corepack pnpm release:provenance",
          evidence: "package provenance",
          required: true
        },
        {
          name: "release-dry-run",
          command: "corepack pnpm release:dry-run",
          evidence: "dry-run safety",
          required: true
        },
        {
          name: "publish-preflight",
          command: "corepack pnpm publish:preflight",
          evidence: "publish preflight",
          required: true
        },
        {
          name: "release-rc-check",
          command: "corepack pnpm release:rc-check",
          evidence: "RC rehearsal",
          required: true
        }
      ],
      sourceReports: [
        {
          name: "release-ci-policy",
          command: "corepack pnpm release:ci-check",
          generatedBy: "scripts/release-ci-check.mjs",
          workflowCount: 3
        },
        {
          name: "release-provenance",
          command: "corepack pnpm release:provenance",
          generatedBy: "scripts/release-provenance.mjs",
          packageCount: 9
        }
      ],
      determinism: {
        canonicalJsonVersion: 1,
        hashAlgorithm: "sha256",
        excludes: [
          "absolutePaths",
          "environmentVariables",
          "gitSha",
          "npmTokens",
          "registryCredentials",
          "timestamps",
          "usernames"
        ],
        verification: "canonical-rc-rehearsal-json"
      }
    },
    packageCount: packageCandidates.length,
    packageCandidates,
    ownerDecisionBlockerCount: ownerDecisionBlockers.length,
    ownerDecisionBlockers,
    blockedActionCount: blockedActions.length,
    blockedActions,
    rollback: {
      currentState: "no-publish-no-registry-artifact-no-tag",
      repositoryOnlyRollback: "fix-forward commit or explicit owner-requested git revert",
      accidentalPublishResponse: "stop release work and require owner incident decision before deprecate or unpublish",
      npmUnpublish: false,
      githubReleaseRollback: false,
      registryArtifactRollback: false
    },
    handoff: {
      releaseOwner: "pending-owner-decision",
      approvers: "pending-owner-decision",
      recommendedNextDecision: "accept or reject owner decisions before publish",
      nextAllowedPhase: "planner-selected; no real publish until owner decisions are accepted",
      docs: [
        "docs/release-candidate-handoff.md",
        "docs/report-json-shapes.md",
        "docs/release-workflow.md",
        "docs/publish-preflight-policy.md"
      ]
    }
  };
}

function createPackageCandidate(name) {
  const directoryName = name.slice("@indirection/".length);

  return {
    name,
    version: "0.0.0",
    private: true,
    license: "UNLICENSED",
    packageDirectory: `packages/${directoryName}`,
    candidacy: "owner-decision-required",
    decisionStatus: "pending",
    requiredOwnerDecision: "accept package visibility before real publish",
    dryRunArtifact: {
      sha256: "a".repeat(64),
      byteSize: 1234,
      fileCount: 3,
      exportCount: 1,
      binCount: name === "@indirection/cli" ? 1 : 0
    },
    validation: {
      provenanceCommand: "corepack pnpm release:provenance",
      packageSmokeCommand: "corepack pnpm pack:check",
      dryRunGateCommand: "corepack pnpm release:dry-run",
      publishPreflightCommand: "corepack pnpm publish:preflight"
    }
  };
}
