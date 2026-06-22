import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const issues = [];
const packageJson = readJson("package.json");

checkValidateFull();
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
      text: "docs/phase-9-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-10-release-workflow-goal-guide.md"
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
      file: "docs/release-readiness.md",
      text: "`test:e2e`"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-10-release-workflow-goal-guide.md"
    },
    {
      file: "docs/phase-9-pass-report.md",
      text: "docs/indirection-phase-10-release-workflow-goal-guide.md"
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
