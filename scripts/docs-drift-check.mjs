import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const issues = [];
const packageJson = readJson("package.json");

checkValidateFull();
checkReleaseDryRun();
checkPublishPreflight();
checkRequiredDocPointers();
checkMarkdownLinks();

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(issue);
  }
  process.exitCode = 1;
} else {
  console.log("docs-drift-check passed: docs links and validation commands are aligned");
}

function checkValidateFull() {
  const command = packageJson.scripts?.["validate:full"];
  const expectedScripts = [
    "pnpm lint",
    "pnpm format",
    "pnpm check:docs",
    "pnpm typecheck",
    "pnpm test",
    "pnpm test:browser",
    "pnpm test:e2e",
    "pnpm check:boundaries",
    "pnpm smoke:cli",
    "pnpm smoke:phase7",
    "pnpm pack:check"
  ];

  for (const script of expectedScripts) {
    if (typeof command !== "string" || !command.includes(script)) {
      issues.push(`package.json: validate:full must include '${script}'`);
    }
  }
}

function checkReleaseDryRun() {
  const command = packageJson.scripts?.["release:dry-run"];
  if (typeof command !== "string" || !command.includes("scripts/release-dry-run.mjs")) {
    issues.push("package.json: release:dry-run must run scripts/release-dry-run.mjs");
  }
}

function checkPublishPreflight() {
  const command = packageJson.scripts?.["publish:preflight"];
  if (typeof command !== "string" || !command.includes("scripts/publish-preflight.mjs")) {
    issues.push("package.json: publish:preflight must run scripts/publish-preflight.mjs");
  }

  const workflow = readText(".github/workflows/publish-preflight.yml");
  const requiredWorkflowText = [
    "workflow_dispatch:",
    "permissions:",
    "contents: read",
    "corepack pnpm install --frozen-lockfile",
    "corepack pnpm publish:preflight",
    "corepack pnpm release:dry-run",
    "git diff --check"
  ];

  for (const text of requiredWorkflowText) {
    if (!workflow.includes(text)) {
      issues.push(`.github/workflows/publish-preflight.yml: missing '${text}'`);
    }
  }

  const forbiddenWorkflowPatterns = [
    /\bnpm\s+publish(?:\s|$)/,
    /\bpnpm\s+publish(?:\s|$)/,
    /\bgit\s+tag(?:\s|$)/,
    /\bgh\s+release(?:\s|$)/,
    /\bcontents:\s+write\b/
  ];

  for (const pattern of forbiddenWorkflowPatterns) {
    if (pattern.test(workflow)) {
      issues.push(`.github/workflows/publish-preflight.yml: must not match ${pattern}`);
    }
  }
}

function checkRequiredDocPointers() {
  const requiredPointers = [
    {
      file: "README.md",
      text: "docs/indirection-phase-8-release-hardening-goal-guide.md"
    },
    {
      file: "README.md",
      text: "corepack pnpm check:docs"
    },
    {
      file: "README.md",
      text: "corepack pnpm smoke:cli"
    },
    {
      file: "README.md",
      text: "corepack pnpm test:e2e"
    },
    {
      file: "README.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "README.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "README.md",
      text: "docs/phase-9-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-10-release-workflow-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-11-publish-preflight-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-12-browser-matrix-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/phase-10-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/phase-11-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/publish-preflight-policy.md"
    },
    {
      file: "README.md",
      text: "docs/release-workflow.md"
    },
    {
      file: "README.md",
      text: "docs/release-versioning-adr.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-8-release-hardening-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "report-json-shapes.md"
    },
    {
      file: "docs/README.md",
      text: "docs drift checks"
    },
    {
      file: "docs/README.md",
      text: "real browser E2E"
    },
    {
      file: "docs/README.md",
      text: "phase-9-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-10-release-workflow-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-11-publish-preflight-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-12-browser-matrix-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "phase-10-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "phase-11-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "publish-preflight-policy.md"
    },
    {
      file: "docs/README.md",
      text: "release-workflow.md"
    },
    {
      file: "docs/README.md",
      text: "release-versioning-adr.md"
    },
    {
      file: "docs/README.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/README.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/release-readiness.md",
      text: "`test:e2e`"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-10-release-workflow-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-10-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-11-publish-preflight-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/release-workflow.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/release-readiness.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/publish-preflight-policy.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-11-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-12-browser-matrix-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 12 Browser Matrix Expansion"
    },
    {
      file: "docs/release-readiness.md",
      text: "../.github/workflows/publish-preflight.yml"
    },
    {
      file: "docs/phase-9-pass-report.md",
      text: "docs/indirection-phase-10-release-workflow-goal-guide.md"
    },
    {
      file: "docs/phase-10-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-10-pass-report.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/phase-10-pass-report.md",
      text: "docs/indirection-phase-11-publish-preflight-goal-guide.md"
    },
    {
      file: "docs/phase-11-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-11-pass-report.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/phase-11-pass-report.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/phase-11-pass-report.md",
      text: "Phase 12 must be selected by the architect/strategist flow"
    },
    {
      file: "docs/phase-11-pass-report.md",
      text: "docs/indirection-phase-12-browser-matrix-goal-guide.md"
    },
    {
      file: "docs/phase-0-7-pass-report.md",
      text: "docs/indirection-phase-8-release-hardening-goal-guide.md"
    },
    {
      file: "docs/indirection-phase-8-release-hardening-goal-guide.md",
      text: "corepack pnpm lint"
    },
    {
      file: "docs/indirection-phase-8-release-hardening-goal-guide.md",
      text: "corepack pnpm format"
    },
    {
      file: "docs/indirection-phase-8-release-hardening-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-10-release-workflow-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-11-publish-preflight-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-11-publish-preflight-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-11-publish-preflight-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-12-browser-matrix-goal-guide.md",
      text: "corepack pnpm test:e2e"
    },
    {
      file: "docs/indirection-phase-12-browser-matrix-goal-guide.md",
      text: "Chromium、Firefox、WebKit"
    },
    {
      file: "docs/indirection-phase-12-browser-matrix-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-12-browser-matrix-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-12-browser-matrix-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/publish-preflight-policy.md",
      text: "| Package | Phase 11 decision status | Future v0.1 candidacy | Owner decision needed before real publish |"
    },
    {
      file: "docs/publish-preflight-policy.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/publish-preflight-policy.md",
      text: "Publish Preflight"
    },
    {
      file: "docs/release-workflow.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/release-workflow.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/release-versioning-adr.md",
      text: "instead of adding Changesets"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-9-browser-e2e"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-10-release-dry-run"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-11-publish-preflight"
    },
    {
      file: ".github/workflows/release-dry-run.yml",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: ".github/workflows/release-dry-run.yml",
      text: "contents: read"
    },
    {
      file: ".github/workflows/publish-preflight.yml",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: ".github/workflows/publish-preflight.yml",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: ".github/workflows/publish-preflight.yml",
      text: "contents: read"
    }
  ];

  for (const pointer of requiredPointers) {
    const text = readText(pointer.file);
    if (!text.includes(pointer.text)) {
      issues.push(`${pointer.file}: missing required pointer '${pointer.text}'`);
    }
  }
}

function checkMarkdownLinks() {
  const markdownFiles = git(["ls-files", "-z"])
    .split("\0")
    .filter((file) => file.endsWith(".md"));

  for (const file of markdownFiles) {
    const text = readText(file);
    const links = text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
    for (const match of links) {
      const target = match[1]?.trim();
      if (target === undefined || shouldSkipLink(target)) {
        continue;
      }

      const targetWithoutFragment = target.split("#")[0];
      if (targetWithoutFragment.length === 0) {
        continue;
      }

      const absoluteTarget = resolve(dirname(file), targetWithoutFragment);
      if (!existsSync(absoluteTarget)) {
        issues.push(`${file}: broken markdown link '${target}'`);
      }
    }
  }
}

function shouldSkipLink(target) {
  return /^(?:https?:|mailto:|#)/.test(target);
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function git(args) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim());
  }

  return result.stdout;
}
