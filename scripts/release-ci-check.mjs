import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepoRoot = resolve(dirname(scriptPath), "..");

const workflowPolicies = [
  {
    path: ".github/workflows/validate.yml",
    role: "validation",
    trigger: "push-and-pull-request",
    requiredText: ["push:", "pull_request:"],
    requiredCommands: [
      "corepack pnpm install --frozen-lockfile",
      "corepack pnpm validate:full",
      "git diff --check"
    ],
    forbiddenCommands: [
      "corepack pnpm release:provenance",
      "corepack pnpm release:dry-run",
      "corepack pnpm publish:preflight",
      "corepack pnpm release:ci-check"
    ]
  },
  {
    path: ".github/workflows/release-dry-run.yml",
    role: "release-gate",
    trigger: "workflow-dispatch",
    requiredText: ["workflow_dispatch:"],
    requiredCommands: [
      "corepack pnpm install --frozen-lockfile",
      "corepack pnpm release:ci-check",
      "corepack pnpm release:provenance",
      "corepack pnpm release:dry-run",
      "corepack pnpm publish:preflight",
      "git diff --check"
    ],
    forbiddenCommands: []
  },
  {
    path: ".github/workflows/publish-preflight.yml",
    role: "release-gate",
    trigger: "workflow-dispatch",
    requiredText: ["workflow_dispatch:"],
    requiredCommands: [
      "corepack pnpm install --frozen-lockfile",
      "corepack pnpm release:ci-check",
      "corepack pnpm release:provenance",
      "corepack pnpm release:dry-run",
      "corepack pnpm publish:preflight",
      "git diff --check"
    ],
    forbiddenCommands: []
  }
];

const forbiddenWorkflowPatterns = [
  {
    name: "npm-publish",
    pattern: /\bnpm\s+publish(?:\s|$)/
  },
  {
    name: "pnpm-publish",
    pattern: /\bpnpm\s+publish(?:\s|$)/
  },
  {
    name: "changeset-publish",
    pattern: /\bchangeset\s+publish(?:\s|$)/
  },
  {
    name: "npm-provenance-upload",
    pattern: /\b(?:npm|pnpm)\s+publish\b[^\n]*\s--provenance(?:\s|$)/
  },
  {
    name: "git-tag-create",
    pattern: /\bgit\s+tag(?:\s|$)/
  },
  {
    name: "git-push-tags",
    pattern: /\bgit\s+push\b[^\n]*(?:--tags|refs\/tags)/
  },
  {
    name: "github-release-cli",
    pattern: /\bgh\s+release(?:\s|$)/
  },
  {
    name: "github-release-action",
    pattern: /(?:softprops\/action-gh-release|actions\/create-release|ncipollo\/release-action)/i
  },
  {
    name: "artifact-upload",
    pattern: /actions\/upload-artifact/i
  },
  {
    name: "sigstore-or-cosign",
    pattern: /\b(?:sigstore|cosign|npm\s+provenance)\b/i
  },
  {
    name: "registry-credential",
    pattern: /(?:secrets\.|NODE_AUTH_TOKEN|NPM_TOKEN|_authToken|registry-url|always-auth)/i
  }
];

const forbiddenPermissionWrites = new Set([
  "actions",
  "attestations",
  "checks",
  "contents",
  "deployments",
  "id-token",
  "issues",
  "packages",
  "pull-requests",
  "releases",
  "statuses"
]);

export async function createReleaseCiPolicyReport(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? defaultRepoRoot);
  const workflows = [];

  for (const policy of workflowPolicies) {
    const text = await readFile(join(repoRoot, policy.path), "utf8");
    workflows.push(analyzeWorkflowText(text, policy));
  }

  const report = {
    schemaVersion: 1,
    generatedBy: "scripts/release-ci-check.mjs",
    workflowCount: workflows.length,
    policy: {
      repositoryPermissions: "read-only",
      localCommandsAreSourceOfTruth: true,
      publish: false,
      npmLogin: false,
      registryWrite: false,
      gitTag: false,
      githubRelease: false,
      signing: false,
      sigstore: false,
      npmProvenanceUpload: false,
      oidcPublish: false,
      packageUpload: false,
      workflowWritePermissions: false
    },
    validation: {
      releaseCommandOrder: [
        "corepack pnpm install --frozen-lockfile",
        "corepack pnpm release:ci-check",
        "corepack pnpm release:provenance",
        "corepack pnpm release:dry-run",
        "corepack pnpm publish:preflight",
        "git diff --check"
      ],
      forbiddenActions: forbiddenWorkflowPatterns.map((entry) => entry.name),
      workflowPermissions: {
        required: {
          contents: "read"
        },
        forbiddenWritePermissions: [...forbiddenPermissionWrites].sort()
      }
    },
    workflows
  };

  assertReleaseCiPolicyReport(report);
  return report;
}

export function canonicalReleaseCiPolicyJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function assertReleaseCiPolicyReport(report) {
  assertObject(report, "release CI policy report");
  assert(report.schemaVersion === 1, "release CI policy schemaVersion must be 1");
  assert(
    report.generatedBy === "scripts/release-ci-check.mjs",
    "release CI policy generatedBy must be stable"
  );
  assert(
    report.workflowCount === report.workflows?.length,
    "release CI policy workflowCount must match workflows length"
  );
  assert(
    Array.isArray(report.workflows) && report.workflows.length === workflowPolicies.length,
    `release CI policy must cover ${workflowPolicies.length} workflows`
  );
  assertNoPublishPolicy(report.policy);
  assertValidationEvidence(report.validation);

  for (const workflow of report.workflows) {
    assertWorkflowAnalysis(workflow);
  }
}

export function analyzeWorkflowText(text, policy) {
  const commands = collectRunCommands(text);
  const permissions = collectTopLevelPermissions(text);
  const requiredCommands = policy.requiredCommands.map((command) => ({
    command,
    order: commands.findIndex((entry) => entry.includes(command))
  }));
  const forbiddenMatches = findForbiddenMatches(text, policy);

  return {
    path: policy.path,
    role: policy.role,
    trigger: policy.trigger,
    permissions,
    commands,
    requiredCommands,
    forbiddenMatches,
    requiredText: policy.requiredText.map((entry) => ({
      text: entry,
      present: text.includes(entry)
    })),
    forbiddenCommands: policy.forbiddenCommands.map((entry) => ({
      command: entry,
      present: commands.some((command) => command.includes(entry))
    }))
  };
}

export function assertWorkflowAnalysis(workflow) {
  assertString(workflow.path, "workflow path");
  assert(
    workflow.path.startsWith(".github/workflows/"),
    `${workflow.path} must be a repository-relative workflow path`
  );
  assert(
    Array.isArray(workflow.permissions) && workflow.permissions.length === 1,
    `${workflow.path} must declare exactly one top-level permission`
  );
  assert(
    workflow.permissions[0].name === "contents" &&
      workflow.permissions[0].access === "read",
    `${workflow.path} must use only contents: read permissions`
  );
  assert(
    workflow.forbiddenMatches.length === 0,
    `${workflow.path} includes forbidden release workflow actions: ${workflow.forbiddenMatches
      .map((entry) => entry.name)
      .join(", ")}`
  );

  for (const textCheck of workflow.requiredText) {
    assert(textCheck.present, `${workflow.path} missing '${textCheck.text}'`);
  }

  let previousOrder = -1;
  for (const commandCheck of workflow.requiredCommands) {
    assert(
      commandCheck.order >= 0,
      `${workflow.path} missing '${commandCheck.command}'`
    );
    assert(
      commandCheck.order > previousOrder,
      `${workflow.path} command '${commandCheck.command}' is out of order`
    );
    previousOrder = commandCheck.order;
  }

  for (const commandCheck of workflow.forbiddenCommands) {
    assert(
      !commandCheck.present,
      `${workflow.path} must not run '${commandCheck.command}'`
    );
  }
}

function collectRunCommands(text) {
  const lines = text.split(/\r?\n/);
  const commands = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = /^(\s*)(?:-\s+)?run:\s*(.*)$/.exec(line);
    if (match === null) {
      continue;
    }

    const value = match[2].trim();
    if (value === "|" || value === ">") {
      const blockIndent = match[1].length + 2;
      const block = [];
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        const nextLine = lines[cursor];
        if (nextLine.trim().length === 0) {
          block.push("");
          index = cursor;
          continue;
        }
        if (countIndent(nextLine) < blockIndent) {
          break;
        }
        block.push(nextLine.slice(blockIndent));
        index = cursor;
      }
      commands.push(block.join("\n").trim());
    } else {
      commands.push(stripYamlQuotes(value));
    }
  }

  return commands;
}

function collectTopLevelPermissions(text) {
  const lines = text.split(/\r?\n/);
  const permissions = [];
  const permissionsIndex = lines.findIndex((line) => /^permissions:\s*$/.test(line));

  if (permissionsIndex < 0) {
    return permissions;
  }

  for (let index = permissionsIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().length === 0 || line.trimStart().startsWith("#")) {
      continue;
    }
    if (countIndent(line) === 0) {
      break;
    }

    const match = /^\s+([A-Za-z0-9_-]+):\s*([A-Za-z-]+)\s*(?:#.*)?$/.exec(line);
    if (match === null) {
      continue;
    }

    permissions.push({
      name: match[1],
      access: match[2]
    });
  }

  return permissions.sort((left, right) => left.name.localeCompare(right.name));
}

function findForbiddenMatches(text, policy) {
  const matches = [];

  for (const entry of forbiddenWorkflowPatterns) {
    if (entry.pattern.test(text)) {
      matches.push({
        name: entry.name,
        evidence: String(entry.pattern)
      });
    }
  }

  for (const permission of collectTopLevelPermissions(text)) {
    if (
      permission.access === "write" &&
      forbiddenPermissionWrites.has(permission.name)
    ) {
      matches.push({
        name: `${permission.name}-write-permission`,
        evidence: `${permission.name}: write`
      });
    }
  }

  for (const command of policy.forbiddenCommands) {
    if (collectRunCommands(text).some((entry) => entry.includes(command))) {
      matches.push({
        name: "forbidden-command",
        evidence: command
      });
    }
  }

  return matches.sort((left, right) => left.name.localeCompare(right.name));
}

function assertNoPublishPolicy(policy) {
  assertObject(policy, "release CI policy");
  assert(
    policy.repositoryPermissions === "read-only",
    "release CI policy repository permissions must be read-only"
  );
  assert(
    policy.localCommandsAreSourceOfTruth === true,
    "release CI policy must keep local commands as source of truth"
  );
  for (const key of [
    "publish",
    "npmLogin",
    "registryWrite",
    "gitTag",
    "githubRelease",
    "signing",
    "sigstore",
    "npmProvenanceUpload",
    "oidcPublish",
    "packageUpload",
    "workflowWritePermissions"
  ]) {
    assert(policy[key] === false, `release CI policy ${key} must be false`);
  }
}

function assertValidationEvidence(validation) {
  assertObject(validation, "release CI policy validation");
  for (const command of [
    "corepack pnpm release:ci-check",
    "corepack pnpm release:provenance",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight",
    "git diff --check"
  ]) {
    assert(
      validation.releaseCommandOrder.includes(command),
      `release CI policy validation must include ${command}`
    );
  }
  for (const action of [
    "npm-publish",
    "pnpm-publish",
    "git-tag-create",
    "github-release-cli",
    "artifact-upload",
    "sigstore-or-cosign",
    "registry-credential"
  ]) {
    assert(
      validation.forbiddenActions.includes(action),
      `release CI policy forbidden actions must include ${action}`
    );
  }
  assert(
    validation.workflowPermissions.required.contents === "read",
    "release CI policy must require contents: read"
  );
  assertSorted(
    validation.workflowPermissions.forbiddenWritePermissions,
    "forbidden workflow write permissions"
  );
}

function countIndent(line) {
  return line.length - line.trimStart().length;
}

function stripYamlQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
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

if (process.argv[1] !== undefined && resolve(process.argv[1]) === scriptPath) {
  try {
    const report = await createReleaseCiPolicyReport();
    if (process.argv.includes("--json")) {
      process.stdout.write(canonicalReleaseCiPolicyJson(report));
    } else {
      console.log(
        `release-ci-check passed: ${report.workflowCount} workflows audited with read-only permissions and release command parity`
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
