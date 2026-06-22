import { describe, expect, it } from "vitest";
import {
  analyzeWorkflowText,
  assertReleaseCiPolicyReport,
  assertWorkflowAnalysis,
  canonicalReleaseCiPolicyJson,
  createReleaseCiPolicyReport
} from "./release-ci-check.mjs";

describe("release CI policy guards", () => {
  it("accepts the repository workflow policy report", async () => {
    const report = await createReleaseCiPolicyReport({ repoRoot: process.cwd() });

    expect(() => assertReleaseCiPolicyReport(report)).not.toThrow();
    expect(report.workflowCount).toBe(3);
    expect(report.policy.workflowWritePermissions).toBe(false);
    expect(report.workflows.map((workflow) => workflow.path)).toEqual([
      ".github/workflows/validate.yml",
      ".github/workflows/release-dry-run.yml",
      ".github/workflows/publish-preflight.yml"
    ]);
    expect(canonicalReleaseCiPolicyJson(report)).toBe(
      `${JSON.stringify(report, null, 2)}\n`
    );
  });

  it("rejects release workflow write permissions", () => {
    const workflow = analyzeWorkflowText(
      createReleaseWorkflowText().replace("contents: read", "contents: write"),
      releaseWorkflowPolicy()
    );

    expect(() => assertWorkflowAnalysis(workflow)).toThrow(/forbidden|contents: read/);
  });

  it("rejects publish commands in release workflows", () => {
    const workflow = analyzeWorkflowText(
      createReleaseWorkflowText("npm publish"),
      releaseWorkflowPolicy()
    );

    expect(() => assertWorkflowAnalysis(workflow)).toThrow(/forbidden release workflow actions/);
  });

  it("rejects release commands in the validation workflow", () => {
    const workflow = analyzeWorkflowText(
      createValidateWorkflowText("corepack pnpm release:dry-run"),
      validateWorkflowPolicy()
    );

    expect(() => assertWorkflowAnalysis(workflow)).toThrow(/forbidden-command|must not run/);
  });
});

function validateWorkflowPolicy() {
  return {
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
  };
}

function releaseWorkflowPolicy() {
  return {
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
  };
}

function createValidateWorkflowText(extraCommand = "") {
  return [
    "name: Validate",
    "on:",
    "  push:",
    "    branches:",
    "      - main",
    "  pull_request:",
    "permissions:",
    "  contents: read",
    "jobs:",
    "  validate:",
    "    steps:",
    "      - run: corepack pnpm install --frozen-lockfile",
    "      - run: corepack pnpm validate:full",
    extraCommand.length > 0 ? `      - run: ${extraCommand}` : "",
    "      - run: git diff --check",
    ""
  ].join("\n");
}

function createReleaseWorkflowText(extraCommand = "") {
  return [
    "name: Release Dry Run",
    "on:",
    "  workflow_dispatch:",
    "permissions:",
    "  contents: read",
    "jobs:",
    "  release-dry-run:",
    "    steps:",
    "      - run: corepack pnpm install --frozen-lockfile",
    "      - run: corepack pnpm release:ci-check",
    "      - run: corepack pnpm release:provenance",
    "      - run: corepack pnpm release:dry-run",
    "      - run: corepack pnpm publish:preflight",
    extraCommand.length > 0 ? `      - run: ${extraCommand}` : "",
    "      - run: git diff --check",
    ""
  ].join("\n");
}
