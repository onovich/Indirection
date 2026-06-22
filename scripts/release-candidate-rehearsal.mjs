import { spawnSync } from "node:child_process";
import { homedir, userInfo } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createReleaseCiPolicyReport } from "./release-ci-check.mjs";
import { createReleaseProvenance } from "./release-provenance.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepoRoot = resolve(dirname(scriptPath), "..");

const deterministicExcludes = [
  "absolutePaths",
  "environmentVariables",
  "gitSha",
  "npmTokens",
  "registryCredentials",
  "timestamps",
  "usernames"
];

const validationGates = [
  {
    name: "validate-full",
    command: "corepack pnpm validate:full",
    evidence: "main local matrix for build, tests, browser E2E, boundaries, smoke, and pack checks",
    required: true
  },
  {
    name: "release-ci-check",
    command: "corepack pnpm release:ci-check",
    evidence: "read-only workflow policy and release command parity",
    required: true
  },
  {
    name: "release-provenance",
    command: "corepack pnpm release:provenance",
    evidence: "deterministic dry-run package artifact provenance",
    required: true
  },
  {
    name: "release-dry-run",
    command: "corepack pnpm release:dry-run",
    evidence: "private package policy, package smoke, and no publish or tag side effects",
    required: true
  },
  {
    name: "publish-preflight",
    command: "corepack pnpm publish:preflight",
    evidence: "owner decision gate without npm login, registry write, or tag side effects",
    required: true
  },
  {
    name: "release-rc-check",
    command: "corepack pnpm release:rc-check",
    evidence: "no-publish release-candidate rehearsal and owner handoff summary",
    required: true
  }
];

const ownerDecisionBlockers = [
  {
    id: "git-tag-policy",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "git-tag-or-release",
    summary: "Accept tag naming, tag signing, tag owner, and failed-publish-after-tag handling."
  },
  {
    id: "github-release-policy",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "github-release",
    summary: "Accept whether GitHub Releases exist, when they are created, and which assets are attached."
  },
  {
    id: "npm-account-and-2fa",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "npm-login-or-token",
    summary: "Accept publishing account, organization membership, 2FA mode, and token policy."
  },
  {
    id: "npm-scope-ownership",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "package-visibility-change",
    summary: "Accept the final npm scope, package names, owners, and maintainers."
  },
  {
    id: "package-upload-policy",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "package-or-release-upload",
    summary: "Accept whether package or release artifacts may ever be uploaded by automation."
  },
  {
    id: "package-visibility",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "remove-private",
    summary: "Accept which workspace packages become public and which remain private or deferred."
  },
  {
    id: "provenance-upload-policy",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "npm-provenance-upload",
    summary: "Accept whether npm provenance upload is required, optional, or forbidden."
  },
  {
    id: "public-license",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "public-package-license",
    summary: "Accept SPDX license, repository LICENSE contents, notices, and docs license posture."
  },
  {
    id: "release-owner-approver",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "release-approval",
    summary: "Accept release owner, approver list, who may run publish, and how approval is recorded."
  },
  {
    id: "rollback-policy",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "registry-write",
    summary: "Accept deprecate versus unpublish response, incident owner, and consumer communication."
  },
  {
    id: "signing-policy",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "package-signing",
    summary: "Accept whether signing, Sigstore, or other attestations are in scope."
  },
  {
    id: "versioning-policy",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "version-change",
    summary: "Accept real package versions, workspace dependency versions, release notes, and Changesets policy."
  },
  {
    id: "workflow-write-permission-policy",
    status: "pending",
    blocks: "real-publish",
    requiredBefore: "workflow-publish-automation",
    summary: "Accept any future workflow write permissions, secrets, packages permission, or id-token permission."
  }
];

const blockedActions = [
  {
    id: "artifact-upload",
    action: "artifact upload",
    status: "blocked",
    boundary: "no workflow or release artifact upload is part of the RC rehearsal"
  },
  {
    id: "git-tag-create",
    action: "git tag",
    status: "blocked",
    boundary: "no real Git tag is created"
  },
  {
    id: "git-tag-push",
    action: "git push tags",
    status: "blocked",
    boundary: "no tag push is allowed"
  },
  {
    id: "github-release",
    action: "GitHub Release",
    status: "blocked",
    boundary: "no GitHub Release is created or mutated"
  },
  {
    id: "npm-access",
    action: "npm access",
    status: "blocked",
    boundary: "no live npm permission or access check runs"
  },
  {
    id: "npm-dist-tag",
    action: "npm dist-tag",
    status: "blocked",
    boundary: "no registry dist-tag read or write runs"
  },
  {
    id: "npm-login",
    action: "npm login",
    status: "blocked",
    boundary: "no npm login or interactive account flow runs"
  },
  {
    id: "npm-owner",
    action: "npm owner",
    status: "blocked",
    boundary: "no npm owner mutation or live ownership check runs"
  },
  {
    id: "npm-provenance-upload",
    action: "npm provenance upload",
    status: "blocked",
    boundary: "local sha256 provenance is not npm provenance upload"
  },
  {
    id: "npm-publish",
    action: "npm publish",
    status: "blocked",
    boundary: "no package is published"
  },
  {
    id: "npm-token",
    action: "npm token",
    status: "blocked",
    boundary: "no token inspection or mutation runs"
  },
  {
    id: "npm-whoami",
    action: "npm whoami",
    status: "blocked",
    boundary: "no live account identity check runs"
  },
  {
    id: "oidc-publish",
    action: "OIDC publish",
    status: "blocked",
    boundary: "no id-token permission or OIDC publish workflow is added"
  },
  {
    id: "package-upload",
    action: "package upload workflow",
    status: "blocked",
    boundary: "no package tarball or release archive is uploaded"
  },
  {
    id: "pnpm-publish",
    action: "pnpm publish",
    status: "blocked",
    boundary: "no package is published"
  },
  {
    id: "registry-write",
    action: "registry write",
    status: "blocked",
    boundary: "no npm registry write is allowed"
  },
  {
    id: "sigstore",
    action: "Sigstore",
    status: "blocked",
    boundary: "no signing or Sigstore attestation is created"
  },
  {
    id: "signing",
    action: "package signing",
    status: "blocked",
    boundary: "no package signing or attestation step runs"
  },
  {
    id: "workflow-write-permissions",
    action: "workflow write permissions",
    status: "blocked",
    boundary: "release workflows stay at contents read"
  }
];

const candidacyByPackage = new Map([
  ["@indirection/cli", "public-tooling-candidate"],
  ["@indirection/compiler", "first-batch-public-candidate"],
  ["@indirection/loaders-web", "public-adapter-candidate"],
  ["@indirection/protocol", "first-batch-public-candidate"],
  ["@indirection/runtime", "first-batch-public-candidate"],
  ["@indirection/schema", "first-batch-public-candidate"],
  ["@indirection/testkit", "deferred-or-developer-support-candidate"],
  ["@indirection/three", "public-optional-peer-adapter-candidate"],
  ["@indirection/vite", "public-tooling-candidate"]
]);

export async function createReleaseCandidateRehearsalReport(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? defaultRepoRoot);
  const verifyRepeat = options.verifyRepeat !== false;
  const initialStatus = git(["status", "--porcelain", "--untracked-files=all"], repoRoot);
  const initialHeadTags = git(["tag", "--points-at", "HEAD"], repoRoot);

  const ciPolicyReport = await createReleaseCiPolicyReport({ repoRoot });
  const provenanceReport = await createReleaseProvenance({
    repoRoot,
    verifyRepeat
  });
  const sortedOwnerDecisionBlockers = sortById(ownerDecisionBlockers);
  const sortedBlockedActions = sortById(blockedActions);

  const finalStatus = git(["status", "--porcelain", "--untracked-files=all"], repoRoot);
  const finalHeadTags = git(["tag", "--points-at", "HEAD"], repoRoot);
  assertEqual(
    finalStatus,
    initialStatus,
    "release candidate rehearsal changed git status; generated RC output must stay local"
  );
  assertEqual(
    finalHeadTags,
    initialHeadTags,
    "release candidate rehearsal changed tags pointing at HEAD"
  );

  const report = {
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
      gates: validationGates,
      sourceReports: [
        {
          name: "release-ci-policy",
          command: "corepack pnpm release:ci-check",
          generatedBy: ciPolicyReport.generatedBy,
          workflowCount: ciPolicyReport.workflowCount
        },
        {
          name: "release-provenance",
          command: "corepack pnpm release:provenance",
          generatedBy: provenanceReport.generatedBy,
          packageCount: provenanceReport.packageCount
        }
      ],
      determinism: {
        canonicalJsonVersion: 1,
        hashAlgorithm: "sha256",
        excludes: deterministicExcludes,
        verification: "canonical-rc-rehearsal-json"
      }
    },
    packageCount: provenanceReport.packageCount,
    packageCandidates: provenanceReport.packages.map(createPackageCandidate),
    ownerDecisionBlockerCount: sortedOwnerDecisionBlockers.length,
    ownerDecisionBlockers: sortedOwnerDecisionBlockers,
    blockedActionCount: sortedBlockedActions.length,
    blockedActions: sortedBlockedActions,
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
      recommendedNextDecision: "accept or reject owner decisions before changing private flags, license, versions, workflow permissions, tags, or publish commands",
      nextAllowedPhase: "planner-selected; no real publish until owner decisions are accepted",
      docs: [
        "docs/release-candidate-handoff.md",
        "docs/report-json-shapes.md",
        "docs/release-workflow.md",
        "docs/publish-preflight-policy.md"
      ]
    }
  };

  assertReleaseCandidateRehearsalReport(report);
  return report;
}

export function canonicalReleaseCandidateRehearsalJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function assertReleaseCandidateRehearsalReport(report) {
  assertObject(report, "release candidate rehearsal report");
  assert(report.schemaVersion === 1, "release candidate rehearsal schemaVersion must be 1");
  assert(
    report.generatedBy === "scripts/release-candidate-rehearsal.mjs",
    "release candidate rehearsal generatedBy must be stable"
  );
  assertReleaseCandidateSummary(report.releaseCandidate);
  assertNoPublishPolicy(report.policy);
  assertValidationEvidence(report.validation);
  assert(
    report.packageCount === report.packageCandidates?.length,
    "release candidate packageCount must match packageCandidates length"
  );
  assert(
    Array.isArray(report.packageCandidates) && report.packageCandidates.length === 9,
    "release candidate rehearsal must cover 9 package candidates"
  );
  assertSorted(
    report.packageCandidates.map((entry) => entry.name),
    "release candidate package candidates"
  );
  for (const packageCandidate of report.packageCandidates) {
    assertPackageCandidate(packageCandidate);
  }
  assertOwnerDecisionBlockers(report);
  assertBlockedActions(report);
  assertRollback(report.rollback);
  assertHandoff(report.handoff);
  assertLocalSafeStrings(report);
}

function createPackageCandidate(packageEntry) {
  return {
    name: packageEntry.name,
    version: packageEntry.version,
    private: packageEntry.private,
    license: packageEntry.license,
    packageDirectory: packageEntry.packageDirectory,
    candidacy: candidacyByPackage.get(packageEntry.name) ?? "owner-decision-required",
    decisionStatus: "pending",
    requiredOwnerDecision: "accept package visibility, support scope, license, version, and publish owner before real publish",
    dryRunArtifact: {
      sha256: packageEntry.tarball.sha256,
      byteSize: packageEntry.tarball.byteSize,
      fileCount: packageEntry.files.count,
      exportCount: packageEntry.exports.length,
      binCount: packageEntry.bin.length
    },
    validation: {
      provenanceCommand: "corepack pnpm release:provenance",
      packageSmokeCommand: packageEntry.validation.packageSmokeCommand,
      dryRunGateCommand: "corepack pnpm release:dry-run",
      publishPreflightCommand: "corepack pnpm publish:preflight"
    }
  };
}

function assertReleaseCandidateSummary(summary) {
  assertObject(summary, "release candidate summary");
  assert(summary.name === "indirection-v0.1-local-rc", "release candidate name must be stable");
  assert(
    summary.packageArtifacts === "dry-run-only",
    "release candidate artifacts must stay dry-run-only"
  );
  assert(
    summary.publishState === "blocked-pending-owner-decisions",
    "release candidate publish state must expose owner blockers"
  );
  assert(
    summary.currentManifestVersion === "0.0.0",
    "release candidate current manifest version must stay 0.0.0"
  );
}

function assertNoPublishPolicy(policy) {
  assertObject(policy, "release candidate policy");
  assert(
    policy.localCommandsAreSourceOfTruth === true,
    "release candidate policy must keep local commands as source of truth"
  );
  assert(
    policy.privatePackagesRequired === true,
    "release candidate policy must keep packages private"
  );
  assert(
    policy.licensePolicy === "UNLICENSED-private-only",
    "release candidate policy must keep UNLICENSED private-only posture"
  );
  for (const key of [
    "publish",
    "npmLogin",
    "registryWrite",
    "gitTag",
    "tagPush",
    "githubRelease",
    "signing",
    "sigstore",
    "npmProvenanceUpload",
    "oidcPublish",
    "packageUpload",
    "artifactUpload",
    "workflowWritePermissions"
  ]) {
    assert(policy[key] === false, `release candidate policy ${key} must be false`);
  }
}

function assertValidationEvidence(validation) {
  assertObject(validation, "release candidate validation");
  assert(Array.isArray(validation.gates), "release candidate gates must be an array");
  for (const command of [
    "corepack pnpm validate:full",
    "corepack pnpm release:ci-check",
    "corepack pnpm release:provenance",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight",
    "corepack pnpm release:rc-check"
  ]) {
    assert(
      validation.gates.some((entry) => entry.command === command && entry.required === true),
      `release candidate validation gates must include ${command}`
    );
  }
  assert(
    Array.isArray(validation.sourceReports),
    "release candidate sourceReports must be an array"
  );
  assert(
    validation.sourceReports.some(
      (entry) =>
        entry.generatedBy === "scripts/release-ci-check.mjs" &&
        entry.command === "corepack pnpm release:ci-check"
    ),
    "release candidate validation must reference release CI policy report"
  );
  assert(
    validation.sourceReports.some(
      (entry) =>
        entry.generatedBy === "scripts/release-provenance.mjs" &&
        entry.command === "corepack pnpm release:provenance"
    ),
    "release candidate validation must reference release provenance report"
  );
  assert(
    validation.determinism?.hashAlgorithm === "sha256",
    "release candidate determinism must use sha256"
  );
  assertSorted(
    validation.determinism.excludes,
    "release candidate determinism excludes"
  );
}

function assertPackageCandidate(packageCandidate) {
  assertString(packageCandidate.name, "package candidate name");
  assert(
    packageCandidate.name.startsWith("@indirection/"),
    `${packageCandidate.name} must keep @indirection scope`
  );
  assert(packageCandidate.version === "0.0.0", `${packageCandidate.name} version must stay 0.0.0`);
  assert(packageCandidate.private === true, `${packageCandidate.name} must stay private`);
  assert(
    packageCandidate.license === "UNLICENSED",
    `${packageCandidate.name} license must stay UNLICENSED`
  );
  assertRelativePath(
    packageCandidate.packageDirectory,
    `${packageCandidate.name} packageDirectory`
  );
  assertString(packageCandidate.candidacy, `${packageCandidate.name} candidacy`);
  assert(
    packageCandidate.decisionStatus === "pending",
    `${packageCandidate.name} decisionStatus must remain pending`
  );
  assertString(
    packageCandidate.requiredOwnerDecision,
    `${packageCandidate.name} requiredOwnerDecision`
  );
  assertObject(packageCandidate.dryRunArtifact, `${packageCandidate.name} dryRunArtifact`);
  assert(
    /^[a-f0-9]{64}$/.test(packageCandidate.dryRunArtifact.sha256),
    `${packageCandidate.name} artifact sha256 must be 64 lowercase hex characters`
  );
  for (const key of ["byteSize", "fileCount", "exportCount", "binCount"]) {
    assert(
      Number.isInteger(packageCandidate.dryRunArtifact[key]) &&
        packageCandidate.dryRunArtifact[key] >= 0,
      `${packageCandidate.name} ${key} must be a non-negative integer`
    );
  }
  assert(packageCandidate.dryRunArtifact.byteSize > 0, `${packageCandidate.name} byteSize must be positive`);
  assert(packageCandidate.dryRunArtifact.fileCount > 0, `${packageCandidate.name} fileCount must be positive`);
  assert(packageCandidate.dryRunArtifact.exportCount > 0, `${packageCandidate.name} exportCount must be positive`);
  assertObject(packageCandidate.validation, `${packageCandidate.name} validation`);
  for (const command of [
    "corepack pnpm release:provenance",
    "corepack pnpm pack:check",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight"
  ]) {
    assert(
      Object.values(packageCandidate.validation).includes(command),
      `${packageCandidate.name} validation must include ${command}`
    );
  }
}

function assertOwnerDecisionBlockers(report) {
  assert(
    report.ownerDecisionBlockerCount === report.ownerDecisionBlockers?.length,
    "ownerDecisionBlockerCount must match ownerDecisionBlockers length"
  );
  assert(
    Array.isArray(report.ownerDecisionBlockers) &&
      report.ownerDecisionBlockers.length >= 10,
    "release candidate rehearsal must include owner decision blockers"
  );
  assertSorted(
    report.ownerDecisionBlockers.map((entry) => entry.id),
    "owner decision blockers"
  );
  for (const blocker of report.ownerDecisionBlockers) {
    assertString(blocker.id, "owner decision blocker id");
    assert(
      blocker.status === "pending",
      `${blocker.id} owner decision blocker must stay pending`
    );
    assert(
      blocker.blocks === "real-publish",
      `${blocker.id} owner decision blocker must block real-publish`
    );
    assertString(blocker.requiredBefore, `${blocker.id} requiredBefore`);
    assertString(blocker.summary, `${blocker.id} summary`);
  }
}

function assertBlockedActions(report) {
  assert(
    report.blockedActionCount === report.blockedActions?.length,
    "blockedActionCount must match blockedActions length"
  );
  assert(
    Array.isArray(report.blockedActions) && report.blockedActions.length >= 15,
    "release candidate rehearsal must include blocked real-publish actions"
  );
  assertSorted(report.blockedActions.map((entry) => entry.id), "blocked actions");
  for (const action of report.blockedActions) {
    assertString(action.id, "blocked action id");
    assertString(action.action, `${action.id} action`);
    assert(action.status === "blocked", `${action.id} action must be blocked`);
    assertString(action.boundary, `${action.id} boundary`);
  }
}

function assertRollback(rollback) {
  assertObject(rollback, "release candidate rollback");
  assert(
    rollback.currentState === "no-publish-no-registry-artifact-no-tag",
    "rollback current state must be no-publish"
  );
  assertString(rollback.repositoryOnlyRollback, "repositoryOnlyRollback");
  assertString(rollback.accidentalPublishResponse, "accidentalPublishResponse");
  for (const key of ["npmUnpublish", "githubReleaseRollback", "registryArtifactRollback"]) {
    assert(rollback[key] === false, `rollback ${key} must be false`);
  }
}

function assertHandoff(handoff) {
  assertObject(handoff, "release candidate handoff");
  assert(
    handoff.releaseOwner === "pending-owner-decision",
    "handoff releaseOwner must remain pending"
  );
  assert(
    handoff.approvers === "pending-owner-decision",
    "handoff approvers must remain pending"
  );
  assertString(handoff.recommendedNextDecision, "recommendedNextDecision");
  assertString(handoff.nextAllowedPhase, "nextAllowedPhase");
  assert(Array.isArray(handoff.docs), "handoff docs must be an array");
  for (const doc of [
    "docs/release-candidate-handoff.md",
    "docs/report-json-shapes.md",
    "docs/release-workflow.md",
    "docs/publish-preflight-policy.md"
  ]) {
    assert(handoff.docs.includes(doc), `handoff docs must include ${doc}`);
  }
}

function assertLocalSafeStrings(report) {
  const strings = collectStrings(report);
  const localNames = collectLocalNames();
  const sensitiveEnvValues = collectSensitiveEnvironmentValues();
  const homeDirectory = homedir().replaceAll("\\", "/");

  for (const { path, value } of strings) {
    assert(!hasAbsolutePath(value), `${path} must not include an absolute path`);
    assert(!hasTimestamp(value), `${path} must not include a timestamp`);
    assert(!hasCredentialAssignment(value), `${path} must not include registry credentials`);
    if (homeDirectory.length > 1) {
      assert(
        !value.replaceAll("\\", "/").includes(homeDirectory),
        `${path} must not include the local home directory`
      );
    }
    for (const localName of localNames) {
      assert(!value.includes(localName), `${path} must not include local username`);
    }
    for (const secret of sensitiveEnvValues) {
      assert(!value.includes(secret), `${path} must not include sensitive environment values`);
    }
  }
}

function collectStrings(value, path = "$") {
  if (typeof value === "string") {
    return [{ path, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectStrings(entry, `${path}[${index}]`));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectStrings(entry, `${path}.${key}`)
    );
  }

  return [];
}

function collectLocalNames() {
  return [
    process.env.USERNAME,
    process.env.USER,
    safeUserName()
  ].filter((value, index, values) => {
    return (
      typeof value === "string" &&
      value.length >= 3 &&
      values.indexOf(value) === index
    );
  });
}

function collectSensitiveEnvironmentValues() {
  return [
    "NPM_TOKEN",
    "NODE_AUTH_TOKEN",
    "NPM_CONFIG__AUTH",
    "NPM_CONFIG__AUTH_TOKEN",
    "NPM_CONFIG_USERNAME",
    "NPM_CONFIG_PASSWORD",
    "NPM_CONFIG_EMAIL"
  ]
    .map((name) => process.env[name])
    .filter((value, index, values) => {
      return (
        typeof value === "string" &&
        value.length >= 8 &&
        values.indexOf(value) === index
      );
    });
}

function safeUserName() {
  try {
    return userInfo().username;
  } catch {
    return undefined;
  }
}

function hasAbsolutePath(value) {
  return (
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.startsWith("/") ||
    /(?:^|[\\/])(?:Users|home)[\\/][^\\/]+/.test(value)
  );
}

function hasTimestamp(value) {
  return (
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) ||
    /\b\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\b/.test(value)
  );
}

function hasCredentialAssignment(value) {
  return /(?:_authToken|_auth\s*=|password\s*=|username\s*=|email\s*=|always-auth\s*=\s*true)/i.test(
    value
  );
}

function assertRelativePath(value, label) {
  assertString(value, label);
  assert(!hasAbsolutePath(value), `${label} must be relative`);
  assert(!value.includes("\\"), `${label} must use posix separators`);
}

function sortById(entries) {
  return [...entries].sort((left, right) => left.id.localeCompare(right.id));
}

function assertSorted(values, label) {
  const sorted = [...values].sort((left, right) => left.localeCompare(right));
  assert(values.join("\0") === sorted.join("\0"), `${label} must be sorted`);
}

function assertString(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} must be a string`);
}

function assertObject(value, label) {
  assert(
    typeof value === "object" && value !== null && !Array.isArray(value),
    `${label} must be an object`
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function git(args, repoRoot) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim());
  }

  return result.stdout;
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nBefore:\n${expected}\nAfter:\n${actual}`);
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === scriptPath) {
  try {
    const report = await createReleaseCandidateRehearsalReport();
    if (process.argv.includes("--json")) {
      process.stdout.write(canonicalReleaseCandidateRehearsalJson(report));
    } else {
      console.log(
        `release-rc-check passed: ${report.packageCount} package candidates rehearsed with ${report.ownerDecisionBlockerCount} owner decision blockers, ${report.blockedActionCount} blocked real-publish actions, and no publish side effects`
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
