import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const issues = [];
const packageJson = readJson("package.json");

checkValidateFull();
checkBrowserMatrix();
checkReleaseDryRun();
checkReleaseProvenance();
checkReleaseCiPolicy();
checkReleaseCandidateRehearsal();
checkPublicOnboarding();
checkPublicDemoDocsSitePlan();
checkImageBitmapLifecyclePlan();
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
    "pnpm smoke:site-demo",
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

function checkReleaseProvenance() {
  const command = packageJson.scripts?.["release:provenance"];
  if (typeof command !== "string" || !command.includes("scripts/release-provenance.mjs")) {
    issues.push("package.json: release:provenance must run scripts/release-provenance.mjs");
  }

  const releaseDryRun = readText("scripts/release-dry-run.mjs");
  for (const text of [
    "createReleaseProvenance",
    "deterministic provenance records"
  ]) {
    if (!releaseDryRun.includes(text)) {
      issues.push(`scripts/release-dry-run.mjs: missing '${text}'`);
    }
  }

  const provenanceScript = readText("scripts/release-provenance.mjs");
  for (const text of [
    "canonicalReleaseProvenanceJson",
    "repeat-pack-canonical-json-match",
    "sha256",
    "npmProvenanceUpload",
    "corepack pnpm publish:preflight",
    "release-provenance passed"
  ]) {
    if (!provenanceScript.includes(text)) {
      issues.push(`scripts/release-provenance.mjs: missing '${text}'`);
    }
  }

  const provenanceDocs = readText("docs/release-provenance.md");
  for (const text of [
    "corepack pnpm release:provenance",
    "tarball `sha256`",
    "repeat-pack-canonical-json-match",
    "Do not commit generated JSON output",
    "npm `--provenance`"
  ]) {
    if (!provenanceDocs.includes(text)) {
      issues.push(`docs/release-provenance.md: missing '${text}'`);
    }
  }

  const reportShapes = readText("docs/report-json-shapes.md");
  for (const text of [
    "ReleaseProvenanceReport",
    "ReleaseProvenancePolicy",
    "ReleaseProvenancePackage",
    "npmProvenanceUpload: false",
    "repeat-pack-canonical-json-match"
  ]) {
    if (!reportShapes.includes(text)) {
      issues.push(`docs/report-json-shapes.md: missing '${text}'`);
    }
  }
}

function checkReleaseCiPolicy() {
  const command = packageJson.scripts?.["release:ci-check"];
  if (typeof command !== "string" || !command.includes("scripts/release-ci-check.mjs")) {
    issues.push("package.json: release:ci-check must run scripts/release-ci-check.mjs");
  }

  const releaseDryRun = readText("scripts/release-dry-run.mjs");
  for (const text of [
    "createReleaseCiPolicyReport",
    "CI policy workflow records"
  ]) {
    if (!releaseDryRun.includes(text)) {
      issues.push(`scripts/release-dry-run.mjs: missing '${text}'`);
    }
  }

  const publishPreflight = readText("scripts/publish-preflight.mjs");
  for (const text of [
    "createReleaseCiPolicyReport",
    "read-only CI policy workflow records"
  ]) {
    if (!publishPreflight.includes(text)) {
      issues.push(`scripts/publish-preflight.mjs: missing '${text}'`);
    }
  }

  const ciPolicyScript = readText("scripts/release-ci-check.mjs");
  for (const text of [
    "canonicalReleaseCiPolicyJson",
    "workflowWritePermissions",
    "localCommandsAreSourceOfTruth",
    "corepack pnpm release:ci-check",
    "corepack pnpm release:provenance",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight",
    "release-ci-check passed"
  ]) {
    if (!ciPolicyScript.includes(text)) {
      issues.push(`scripts/release-ci-check.mjs: missing '${text}'`);
    }
  }

  const validateWorkflow = readText(".github/workflows/validate.yml");
  for (const text of [
    "permissions:",
    "contents: read",
    "corepack pnpm validate:full",
    "git diff --check"
  ]) {
    if (!validateWorkflow.includes(text)) {
      issues.push(`.github/workflows/validate.yml: missing '${text}'`);
    }
  }
  for (const forbidden of [
    "corepack pnpm release:ci-check",
    "corepack pnpm release:provenance",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight"
  ]) {
    if (validateWorkflow.includes(forbidden)) {
      issues.push(`.github/workflows/validate.yml: must not include '${forbidden}'`);
    }
  }

  for (const workflowFile of [
    ".github/workflows/release-dry-run.yml",
    ".github/workflows/publish-preflight.yml"
  ]) {
    const workflow = readText(workflowFile);
    for (const text of [
      "workflow_dispatch:",
      "permissions:",
      "contents: read",
      "corepack pnpm install --frozen-lockfile",
      "corepack pnpm release:ci-check",
      "corepack pnpm release:provenance",
      "corepack pnpm release:dry-run",
      "corepack pnpm publish:preflight",
      "git diff --check"
    ]) {
      if (!workflow.includes(text)) {
        issues.push(`${workflowFile}: missing '${text}'`);
      }
    }
  }

  const ciPolicyDocs = readText("docs/release-ci-policy.md");
  for (const text of [
    "corepack pnpm release:ci-check",
    "permissions: contents: read",
    "local release commands remain the semantic source of truth",
    "Release CI policy reports",
    "npm `--provenance`"
  ]) {
    if (!ciPolicyDocs.includes(text)) {
      issues.push(`docs/release-ci-policy.md: missing '${text}'`);
    }
  }

  const reportShapes = readText("docs/report-json-shapes.md");
  for (const text of [
    "ReleaseCiPolicyReport",
    "ReleaseCiPolicy",
    "workflowWritePermissions: false",
    "ReleaseCiPolicyWorkflow",
    "corepack pnpm release:ci-check"
  ]) {
    if (!reportShapes.includes(text)) {
      issues.push(`docs/report-json-shapes.md: missing '${text}'`);
    }
  }

  const passReport = readText("docs/phase-18-pass-report.md");
  for (const text of [
    "Status: PASS",
    "corepack pnpm release:ci-check",
    "3 workflows audited with read-only permissions",
    "workflow write permissions",
    "Real npm publish"
  ]) {
    if (!passReport.includes(text)) {
      issues.push(`docs/phase-18-pass-report.md: missing '${text}'`);
    }
  }
}

function checkReleaseCandidateRehearsal() {
  const command = packageJson.scripts?.["release:rc-check"];
  if (
    typeof command !== "string" ||
    !command.includes("scripts/release-candidate-rehearsal.mjs")
  ) {
    issues.push("package.json: release:rc-check must run scripts/release-candidate-rehearsal.mjs");
  }

  const rcScript = readText("scripts/release-candidate-rehearsal.mjs");
  for (const text of [
    "createReleaseCandidateRehearsalReport",
    "canonicalReleaseCandidateRehearsalJson",
    "ownerDecisionBlockers",
    "blockedActions",
    "corepack pnpm release:ci-check",
    "corepack pnpm release:provenance",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight",
    "corepack pnpm release:rc-check",
    "npmProvenanceUpload",
    "workflowWritePermissions",
    "release-rc-check passed"
  ]) {
    if (!rcScript.includes(text)) {
      issues.push(`scripts/release-candidate-rehearsal.mjs: missing '${text}'`);
    }
  }

  const rcTest = readText("scripts/release-candidate-rehearsal.test.mjs");
  for (const text of [
    "release candidate rehearsal report guards",
    "accepted owner decisions",
    "unblocked real-publish actions",
    "absolute local paths",
    "registry credential assignments"
  ]) {
    if (!rcTest.includes(text)) {
      issues.push(`scripts/release-candidate-rehearsal.test.mjs: missing '${text}'`);
    }
  }

  const handoffDocs = readText("docs/release-candidate-handoff.md");
  for (const text of [
    "corepack pnpm release:rc-check",
    "owner decision blockers",
    "No real npm publish",
    "blocked real-publish actions",
    "rollback",
    "release ownership",
    "ReleaseCandidateRehearsalReport"
  ]) {
    if (!handoffDocs.includes(text)) {
      issues.push(`docs/release-candidate-handoff.md: missing '${text}'`);
    }
  }

  const reportShapes = readText("docs/report-json-shapes.md");
  for (const text of [
    "ReleaseCandidateRehearsalReport",
    "ReleaseCandidatePackage",
    "ownerDecisionBlockers",
    "blockedActions",
    "release-candidate handoff",
    "corepack pnpm release:rc-check"
  ]) {
    if (!reportShapes.includes(text)) {
      issues.push(`docs/report-json-shapes.md: missing '${text}'`);
    }
  }

  const passReport = readText("docs/phase-19-pass-report.md");
  for (const text of [
    "Status: PASS",
    "corepack pnpm release:rc-check",
    "owner decision blockers",
    "blocked real-publish actions",
    "ReleaseCandidateRehearsalReport",
    "Real npm publish"
  ]) {
    if (!passReport.includes(text)) {
      issues.push(`docs/phase-19-pass-report.md: missing '${text}'`);
    }
  }

  const changelog = readText("CHANGELOG.md");
  for (const text of [
    "0.0.0-phase-19-release-candidate-rehearsal",
    "release:rc-check",
    "owner decision blockers",
    "corepack pnpm release:rc-check"
  ]) {
    if (!changelog.includes(text)) {
      issues.push(`CHANGELOG.md: missing '${text}'`);
    }
  }
}

function checkPublicOnboarding() {
  const quickstart = readText("docs/evaluator-quickstart.md");
  for (const text of [
    "local checkout",
    "private and unpublished",
    "do not install them from npm",
    "corepack pnpm install --frozen-lockfile",
    "corepack pnpm validate:full",
    "corepack pnpm smoke:cli",
    "corepack pnpm smoke:phase7",
    "corepack pnpm pack:check",
    "corepack pnpm test:e2e:firefox",
    "corepack pnpm release:rc-check",
    "corepack pnpm publish:preflight",
    "Do not commit generated local artifacts"
  ]) {
    if (!quickstart.includes(text)) {
      issues.push(`docs/evaluator-quickstart.md: missing '${text}'`);
    }
  }

  const packageEntrypoints = readText("docs/package-entrypoints.md");
  for (const text of [
    "@indirection/protocol",
    "@indirection/schema",
    "@indirection/compiler",
    "@indirection/runtime",
    "@indirection/loaders-web",
    "@indirection/three",
    "@indirection/vite",
    "@indirection/cli",
    "@indirection/testkit",
    "Must not own",
    "Do not run npm install instructions",
    "private: true",
    "UNLICENSED",
    "corepack pnpm pack:check"
  ]) {
    if (!packageEntrypoints.includes(text)) {
      issues.push(`docs/package-entrypoints.md: missing '${text}'`);
    }
  }

  const examples = readText("docs/example-workflows.md");
  for (const text of [
    "Manifest To Catalog",
    "Runtime Loading And Lifecycle",
    "Browser Loaders And Cache",
    "Phase 7 Integrated Example",
    "Vite Virtual Catalog",
    "Three GLTF Adapter",
    "Compressed Capability Selection",
    "Release-Candidate Gates",
    "corepack pnpm smoke:phase7",
    "corepack pnpm release:rc-check"
  ]) {
    if (!examples.includes(text)) {
      issues.push(`docs/example-workflows.md: missing '${text}'`);
    }
  }

  const readme = readText("README.md");
  for (const text of [
    "docs/evaluator-quickstart.md",
    "docs/package-entrypoints.md",
    "docs/example-workflows.md",
    "docs/phase-20-pass-report.md",
    "private and unpublished",
    "corepack pnpm install --frozen-lockfile"
  ]) {
    if (!readme.includes(text)) {
      issues.push(`README.md: missing '${text}'`);
    }
  }

  const docsIndex = readText("docs/README.md");
  for (const text of [
    "evaluator-quickstart.md",
    "package-entrypoints.md",
    "example-workflows.md",
    "phase-20-pass-report.md",
    "public evaluator path"
  ]) {
    if (!docsIndex.includes(text)) {
      issues.push(`docs/README.md: missing '${text}'`);
    }
  }

  const passReport = readText("docs/phase-20-pass-report.md");
  for (const text of [
    "Status: PASS",
    "evaluator guide",
    "package entrypoint docs",
    "example workflow docs",
    "corepack pnpm validate:full",
    "corepack pnpm release:rc-check",
    "Real npm publish"
  ]) {
    if (!passReport.includes(text)) {
      issues.push(`docs/phase-20-pass-report.md: missing '${text}'`);
    }
  }

  const changelog = readText("CHANGELOG.md");
  for (const text of [
    "0.0.0-phase-20-public-docs-onboarding",
    "evaluator quickstart",
    "package entrypoint",
    "example workflow",
    "corepack pnpm release:rc-check"
  ]) {
    if (!changelog.includes(text)) {
      issues.push(`CHANGELOG.md: missing '${text}'`);
    }
  }
}

function checkPublicDemoDocsSitePlan() {
  assertScriptIncludes("site:demo", "scripts/public-demo-site.mjs --out build/public-demo-site");
  assertScriptIncludes("smoke:site-demo", "scripts/public-demo-site.mjs --smoke");

  const guide = readText("docs/indirection-phase-21-public-demo-docs-site-goal-guide.md");
  for (const text of [
    "Public Website, Demo Packaging, And Docs Site Rehearsal",
    "no-deploy",
    "GitHub Pages",
    "Vercel",
    "Netlify",
    "corepack pnpm validate:full",
    "corepack pnpm release:rc-check",
    "corepack pnpm publish:preflight",
    "docs/phase-21-pass-report.md"
  ]) {
    if (!guide.includes(text)) {
      issues.push(`docs/indirection-phase-21-public-demo-docs-site-goal-guide.md: missing '${text}'`);
    }
  }

  const demoScript = readText("scripts/public-demo-site.mjs");
  for (const text of [
    "public-demo-site built",
    "public-demo-site smoke passed",
    "build/public-demo-site",
    "build/public-demo-site-smoke",
    "No GitHub Pages",
    "Vercel",
    "Netlify",
    "custom hosting",
    "npm CDN",
    "No real npm publish",
    "generatedBy: \"scripts/public-demo-site.mjs\"",
    "packageEntrypoints.length !== 9"
  ]) {
    if (!demoScript.includes(text)) {
      issues.push(`scripts/public-demo-site.mjs: missing '${text}'`);
    }
  }

  const demoDocs = readText("docs/public-demo-site.md");
  for (const text of [
    "corepack pnpm site:demo",
    "corepack pnpm smoke:site-demo",
    "build/public-demo-site/index.html",
    "GitHub Pages",
    "Vercel",
    "Netlify",
    "custom hosting",
    "npm CDN",
    "Do not add deployment secrets",
    "All workspace packages remain `private: true`",
    "Generated Artifact Policy",
    "Remove-Item -Recurse -Force build/public-demo-site"
  ]) {
    if (!demoDocs.includes(text)) {
      issues.push(`docs/public-demo-site.md: missing '${text}'`);
    }
  }

  const readme = readText("README.md");
  for (const text of [
    "corepack pnpm smoke:site-demo",
    "docs/public-demo-site.md",
    "docs/phase-21-pass-report.md"
  ]) {
    if (!readme.includes(text)) {
      issues.push(`README.md: missing '${text}'`);
    }
  }

  const docsIndex = readText("docs/README.md");
  for (const text of [
    "public-demo-site.md",
    "phase-21-pass-report.md",
    "corepack pnpm smoke:site-demo",
    "no-publish and no-deploy boundaries"
  ]) {
    if (!docsIndex.includes(text)) {
      issues.push(`docs/README.md: missing '${text}'`);
    }
  }

  const quickstart = readText("docs/evaluator-quickstart.md");
  for (const text of [
    "Local Public Demo Site",
    "corepack pnpm site:demo",
    "corepack pnpm smoke:site-demo",
    "build/public-demo-site/index.html",
    "docs/public-demo-site.md"
  ]) {
    if (!quickstart.includes(text)) {
      issues.push(`docs/evaluator-quickstart.md: missing '${text}'`);
    }
  }

  const packageEntrypoints = readText("docs/package-entrypoints.md");
  if (!packageEntrypoints.includes("corepack pnpm smoke:site-demo")) {
    issues.push("docs/package-entrypoints.md: missing 'corepack pnpm smoke:site-demo'");
  }

  const examples = readText("docs/example-workflows.md");
  for (const text of [
    "Local Public Demo Site",
    "corepack pnpm site:demo",
    "corepack pnpm smoke:site-demo",
    "public-demo-site.md"
  ]) {
    if (!examples.includes(text)) {
      issues.push(`docs/example-workflows.md: missing '${text}'`);
    }
  }

  const releaseReadiness = readText("docs/release-readiness.md");
  for (const text of [
    "smoke:site-demo",
    "docs/public-demo-site.md",
    "docs/phase-21-pass-report.md",
    "Phase 21 local public demo site rehearsal"
  ]) {
    if (!releaseReadiness.includes(text)) {
      issues.push(`docs/release-readiness.md: missing '${text}'`);
    }
  }

  const passReport = readText("docs/phase-21-pass-report.md");
  for (const text of [
    "Status: PASS",
    "corepack pnpm smoke:site-demo",
    "docs/public-demo-site.md",
    "GitHub Pages",
    "Vercel",
    "Netlify",
    "custom hosting",
    "npm CDN",
    "Real npm publish",
    "generated artifact policy"
  ]) {
    if (!passReport.includes(text)) {
      issues.push(`docs/phase-21-pass-report.md: missing '${text}'`);
    }
  }

  const changelog = readText("CHANGELOG.md");
  for (const text of [
    "0.0.0-phase-21-public-demo-docs-site",
    "site:demo",
    "smoke:site-demo",
    "GitHub Pages",
    "corepack pnpm validate:full"
  ]) {
    if (!changelog.includes(text)) {
      issues.push(`CHANGELOG.md: missing '${text}'`);
    }
  }

  const phase20Pass = readText("docs/phase-20-pass-report.md");
  for (const text of [
    "Planner selection after PASS: Phase 21 Public Website, Demo Packaging, And Docs Site Rehearsal",
    "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md"
  ]) {
    if (!phase20Pass.includes(text)) {
      issues.push(`docs/phase-20-pass-report.md: missing '${text}'`);
    }
  }
}

function checkImageBitmapLifecyclePlan() {
  const guide = readText("docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md");
  for (const text of [
    "Browser ImageBitmap And Texture Source Lifecycle",
    "ImageBitmap",
    "image/bitmap",
    "createImageBitmap",
    "LoadedAsset.dispose",
    "renderer E2E",
    "WebGL scene smoke",
    "corepack pnpm validate:full",
    "corepack pnpm publish:preflight",
    "docs/phase-22-pass-report.md"
  ]) {
    if (!guide.includes(text)) {
      issues.push(`docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md: missing '${text}'`);
    }
  }

  const phase21Pass = readText("docs/phase-21-pass-report.md");
  for (const text of [
    "Planner selection after PASS: Phase 22 Browser ImageBitmap And Texture Source Lifecycle",
    "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md"
  ]) {
    if (!phase21Pass.includes(text)) {
      issues.push(`docs/phase-21-pass-report.md: missing '${text}'`);
    }
  }
}

function checkBrowserMatrix() {
  assertScriptIncludes("test:e2e", "playwright test");
  assertScriptIncludes("test:e2e:chromium", "--project=chromium");
  assertScriptIncludes("test:e2e:firefox", "--project=firefox");
  assertScriptIncludes("test:e2e:webkit", "--project=webkit");

  const playwrightConfig = readText("playwright.config.ts");
  for (const projectName of ["chromium", "firefox", "webkit"]) {
    if (!playwrightConfig.includes(`name: "${projectName}"`)) {
      issues.push(`playwright.config.ts: missing ${projectName} project`);
    }
  }
  if (!playwrightConfig.includes("MOZ_DISABLE_CONTENT_SANDBOX")) {
    issues.push("playwright.config.ts: missing Firefox sandbox stability setting");
  }
  if (!playwrightConfig.includes("--idle-exit-ms=5000")) {
    issues.push("playwright.config.ts: missing E2E server idle exit setting");
  }

  const workflow = readText(".github/workflows/validate.yml");
  for (const text of [
    "Install Playwright Browsers",
    "corepack pnpm exec playwright install --with-deps chromium firefox webkit",
    "corepack pnpm validate:full"
  ]) {
    if (!workflow.includes(text)) {
      issues.push(`.github/workflows/validate.yml: missing '${text}'`);
    }
  }

  for (const file of [
    "tests/e2e/browser-fixture.e2e.ts",
    "tests/e2e/fixtures/minimal-app.js"
  ]) {
    const text = readText(file);
    if (/from-chromium/.test(text)) {
      issues.push(`${file}: fixture data must stay browser-neutral`);
    }
  }
}

function assertScriptIncludes(scriptName, expected) {
  const command = packageJson.scripts?.[scriptName];
  if (typeof command !== "string" || !command.includes(expected)) {
    issues.push(`package.json: ${scriptName} must include '${expected}'`);
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
    "corepack pnpm release:ci-check",
    "corepack pnpm release:provenance",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight",
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
      text: "test:e2e:firefox"
    },
    {
      file: "README.md",
      text: "test:e2e:webkit"
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
      text: "docs/indirection-phase-13-three-gltf-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-14-three-lifecycle-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-15-compressed-capability-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-17-release-provenance-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-18-release-ci-policy-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md"
    },
    {
      file: "README.md",
      text: "docs/evaluator-quickstart.md"
    },
    {
      file: "README.md",
      text: "docs/package-entrypoints.md"
    },
    {
      file: "README.md",
      text: "docs/example-workflows.md"
    },
    {
      file: "README.md",
      text: "docs/public-demo-site.md"
    },
    {
      file: "README.md",
      text: "docs/phase-21-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/phase-20-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/release-candidate-handoff.md"
    },
    {
      file: "README.md",
      text: "docs/phase-19-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/release-ci-policy.md"
    },
    {
      file: "README.md",
      text: "docs/phase-18-pass-report.md"
    },
    {
      file: "README.md",
      text: "corepack pnpm release:ci-check"
    },
    {
      file: "README.md",
      text: "docs/release-provenance.md"
    },
    {
      file: "README.md",
      text: "docs/phase-17-pass-report.md"
    },
    {
      file: "README.md",
      text: "corepack pnpm release:provenance"
    },
    {
      file: "README.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "README.md",
      text: "docs/compressed-capability-source-selection.md"
    },
    {
      file: "README.md",
      text: "docs/runtime-lifecycle.md"
    },
    {
      file: "README.md",
      text: "docs/three-gltf-adapter.md"
    },
    {
      file: "README.md",
      text: "docs/phase-16-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/phase-15-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/phase-14-pass-report.md"
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
      text: "docs/phase-12-pass-report.md"
    },
    {
      file: "README.md",
      text: "docs/phase-13-pass-report.md"
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
      text: "Chromium, Firefox, and WebKit"
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
      text: "indirection-phase-13-three-gltf-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-14-three-lifecycle-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-15-compressed-capability-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-16-browser-e2e-stress-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-17-release-provenance-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-18-release-ci-policy-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-19-release-candidate-rehearsal-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-20-public-docs-onboarding-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-21-public-demo-docs-site-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "indirection-phase-22-image-bitmap-lifecycle-goal-guide.md"
    },
    {
      file: "docs/README.md",
      text: "evaluator-quickstart.md"
    },
    {
      file: "docs/README.md",
      text: "package-entrypoints.md"
    },
    {
      file: "docs/README.md",
      text: "example-workflows.md"
    },
    {
      file: "docs/README.md",
      text: "public-demo-site.md"
    },
    {
      file: "docs/README.md",
      text: "phase-21-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "phase-20-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "release-candidate-handoff.md"
    },
    {
      file: "docs/README.md",
      text: "phase-19-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "release-ci-policy.md"
    },
    {
      file: "docs/README.md",
      text: "phase-18-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "corepack pnpm release:ci-check"
    },
    {
      file: "docs/README.md",
      text: "release-provenance.md"
    },
    {
      file: "docs/README.md",
      text: "phase-17-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "compressed-capability-source-selection.md"
    },
    {
      file: "docs/README.md",
      text: "runtime-lifecycle.md"
    },
    {
      file: "docs/README.md",
      text: "three-gltf-adapter.md"
    },
    {
      file: "docs/README.md",
      text: "phase-16-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "phase-15-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "phase-14-pass-report.md"
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
      text: "phase-12-pass-report.md"
    },
    {
      file: "docs/README.md",
      text: "phase-13-pass-report.md"
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
      text: "corepack pnpm release:provenance"
    },
    {
      file: "docs/README.md",
      text: "corepack pnpm release:rc-check"
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
      text: "test:e2e:chromium"
    },
    {
      file: "docs/release-readiness.md",
      text: "Chromium, Firefox, and WebKit"
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
      text: "docs/phase-12-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-13-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-12-browser-matrix-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-13-three-gltf-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-14-three-lifecycle-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 14 Three Adapter Lifecycle"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 15 Compressed Capability Source Selection"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-15-compressed-capability-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 16 Browser E2E Stress And Artifact Diagnostics"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 17 Release Artifact Provenance And Verification"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-17-release-provenance-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 18 Release CI Policy Parity And Workflow Hardening"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-18-release-ci-policy-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 19 No-Publish Release Candidate Rehearsal And Decision Handoff"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 20 Public Docs, Examples, And Consumer Onboarding Polish"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 21 Public Website, Demo Packaging, And Docs Site Rehearsal"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 22 Browser ImageBitmap And Texture Source Lifecycle"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/public-demo-site.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-21-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/evaluator-quickstart.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/package-entrypoints.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/example-workflows.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-20-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/release-candidate-handoff.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-19-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/release-ci-policy.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-18-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "corepack pnpm release:ci-check"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/release-provenance.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-17-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "corepack pnpm release:provenance"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-16-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/compressed-capability-source-selection.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-15-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/runtime-lifecycle.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/phase-14-pass-report.md"
    },
    {
      file: "docs/release-readiness.md",
      text: "createThreeOwnedResourceDisposer"
    },
    {
      file: "docs/release-readiness.md",
      text: "instantiateThreeGltf"
    },
    {
      file: "docs/release-readiness.md",
      text: "extractThreeAnimationMetadata"
    },
    {
      file: "docs/runtime-lifecycle.md",
      text: "LoadedAsset.dispose"
    },
    {
      file: "docs/runtime-lifecycle.md",
      text: "AssetHandle.release()"
    },
    {
      file: "docs/runtime-lifecycle.md",
      text: "AssetScope.dispose()"
    },
    {
      file: "docs/runtime-lifecycle.md",
      text: "IND_DISPOSE_FAILED"
    },
    {
      file: "docs/runtime-lifecycle.md",
      text: "hasDisposer"
    },
    {
      file: "docs/runtime-lifecycle.md",
      text: "evictable"
    },
    {
      file: "docs/release-readiness.md",
      text: "Phase 13 Real Three GLTF Adapter"
    },
    {
      file: "docs/release-readiness.md",
      text: "docs/three-gltf-adapter.md"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "createThreeGltfLoader"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "ownedResources"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "createThreeOwnedResourceDisposer"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "instantiateThreeGltf"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "extractThreeAnimationMetadata"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "AssetHandle.release()"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "GLTFLoader.parseAsync"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "IND_DECODE_FAILED"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "ResolutionContext.capability"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "basePath"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "sourceUrl"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "Draco, KTX2, or meshopt"
    },
    {
      file: "docs/report-json-shapes.md",
      text: "AssetReportSource"
    },
    {
      file: "docs/report-json-shapes.md",
      text: "when?: Record<string, readonly string[]>"
    },
    {
      file: "docs/three-gltf-adapter.md",
      text: "Automatic deep GPU disposal"
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
      file: "docs/phase-12-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-12-pass-report.md",
      text: "Chromium, Firefox, and WebKit"
    },
    {
      file: "docs/phase-12-pass-report.md",
      text: "corepack pnpm test:e2e"
    },
    {
      file: "docs/phase-12-pass-report.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/phase-12-pass-report.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/phase-12-pass-report.md",
      text: "docs/indirection-phase-13-three-gltf-goal-guide.md"
    },
    {
      file: "docs/phase-13-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-13-pass-report.md",
      text: "GLTFLoader.parseAsync"
    },
    {
      file: "docs/phase-13-pass-report.md",
      text: "IND_DECODE_FAILED"
    },
    {
      file: "docs/phase-13-pass-report.md",
      text: "docs/three-gltf-adapter.md"
    },
    {
      file: "docs/phase-13-pass-report.md",
      text: "docs/indirection-phase-14-three-lifecycle-goal-guide.md"
    },
    {
      file: "docs/phase-13-pass-report.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/phase-13-pass-report.md",
      text: "Planner selection after PASS: Phase 14 Three Adapter Lifecycle Contract"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "LoadedAsset.dispose"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "createThreeOwnedResourceDisposer"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "instantiateThreeGltf"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "extractThreeAnimationMetadata"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "Real npm publish"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "Planner selection after PASS: Phase 15 Compressed Capability Source Selection"
    },
    {
      file: "docs/phase-14-pass-report.md",
      text: "docs/indirection-phase-15-compressed-capability-goal-guide.md"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "Planner selection after PASS: Phase 16 Browser E2E Stress And Artifact Diagnostics"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "ResolutionContext.capability"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "draco"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "ktx2"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "meshopt"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "default source"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "runtime fallback"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "docs/compressed-capability-source-selection.md"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/phase-15-pass-report.md",
      text: "Real npm publish"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "Planner selection after PASS: Phase 17 Release Artifact Provenance And Verification"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "docs/indirection-phase-17-release-provenance-goal-guide.md"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "repeated runtime lifecycle"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "Cache Storage isolation/cleanup"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "compressed capability source selection"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "indirection-e2e-result.json"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "corepack pnpm test:e2e:chromium"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "corepack pnpm test:e2e:firefox"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "corepack pnpm test:e2e:webkit"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/phase-16-pass-report.md",
      text: "Real npm publish"
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
      file: "docs/indirection-phase-13-three-gltf-goal-guide.md",
      text: "createThreeGltfLoader"
    },
    {
      file: "docs/indirection-phase-13-three-gltf-goal-guide.md",
      text: "GLTFLoader.parseAsync"
    },
    {
      file: "docs/indirection-phase-13-three-gltf-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-13-three-gltf-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-13-three-gltf-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-14-three-lifecycle-goal-guide.md",
      text: "LoadedAsset.dispose"
    },
    {
      file: "docs/indirection-phase-14-three-lifecycle-goal-guide.md",
      text: "owned-resource disposer"
    },
    {
      file: "docs/indirection-phase-14-three-lifecycle-goal-guide.md",
      text: "animation metadata"
    },
    {
      file: "docs/indirection-phase-14-three-lifecycle-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-14-three-lifecycle-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-14-three-lifecycle-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-15-compressed-capability-goal-guide.md",
      text: "Compressed Capability Source Selection"
    },
    {
      file: "docs/indirection-phase-15-compressed-capability-goal-guide.md",
      text: "ResolutionContext.capability"
    },
    {
      file: "docs/indirection-phase-15-compressed-capability-goal-guide.md",
      text: "draco"
    },
    {
      file: "docs/indirection-phase-15-compressed-capability-goal-guide.md",
      text: "ktx2"
    },
    {
      file: "docs/indirection-phase-15-compressed-capability-goal-guide.md",
      text: "meshopt"
    },
    {
      file: "docs/indirection-phase-15-compressed-capability-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-15-compressed-capability-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-15-compressed-capability-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "Browser E2E Stress And Artifact Diagnostics"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "corepack pnpm test:e2e"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "corepack pnpm test:e2e:chromium"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "corepack pnpm test:e2e:firefox"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "corepack pnpm test:e2e:webkit"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "playwright-report/"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "test-results/"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "docs/phase-16-pass-report.md"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-16-browser-e2e-stress-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-17-release-provenance-goal-guide.md",
      text: "Release Artifact Provenance And Verification"
    },
    {
      file: "docs/indirection-phase-17-release-provenance-goal-guide.md",
      text: "tarball sha256"
    },
    {
      file: "docs/indirection-phase-17-release-provenance-goal-guide.md",
      text: "corepack pnpm pack:check"
    },
    {
      file: "docs/indirection-phase-17-release-provenance-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-17-release-provenance-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-17-release-provenance-goal-guide.md",
      text: "Sigstore"
    },
    {
      file: "docs/indirection-phase-17-release-provenance-goal-guide.md",
      text: "npm provenance upload"
    },
    {
      file: "docs/indirection-phase-18-release-ci-policy-goal-guide.md",
      text: "Release CI Policy Parity And Workflow Hardening"
    },
    {
      file: "docs/indirection-phase-18-release-ci-policy-goal-guide.md",
      text: "release:ci-check"
    },
    {
      file: "docs/indirection-phase-18-release-ci-policy-goal-guide.md",
      text: "contents: write"
    },
    {
      file: "docs/indirection-phase-18-release-ci-policy-goal-guide.md",
      text: "id-token: write"
    },
    {
      file: "docs/indirection-phase-18-release-ci-policy-goal-guide.md",
      text: "corepack pnpm release:provenance"
    },
    {
      file: "docs/indirection-phase-18-release-ci-policy-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-18-release-ci-policy-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md",
      text: "No-Publish Release Candidate Rehearsal And Decision Handoff"
    },
    {
      file: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md",
      text: "release:rc-check"
    },
    {
      file: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md",
      text: "owner decision blockers"
    },
    {
      file: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md",
      text: "release-candidate handoff"
    },
    {
      file: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md",
      text: "corepack pnpm release:ci-check"
    },
    {
      file: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md",
      text: "corepack pnpm release:provenance"
    },
    {
      file: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md",
      text: "Public Docs, Examples, And Consumer Onboarding Polish"
    },
    {
      file: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md",
      text: "evaluator guide"
    },
    {
      file: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md",
      text: "package entrypoint documentation"
    },
    {
      file: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md",
      text: "no-publish"
    },
    {
      file: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md",
      text: "Public Website, Demo Packaging, And Docs Site Rehearsal"
    },
    {
      file: "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md",
      text: "no-deploy"
    },
    {
      file: "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md",
      text: "Browser ImageBitmap And Texture Source Lifecycle"
    },
    {
      file: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md",
      text: "createImageBitmap"
    },
    {
      file: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md",
      text: "LoadedAsset.dispose"
    },
    {
      file: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md",
      text: "renderer E2E"
    },
    {
      file: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md",
      text: "corepack pnpm publish:preflight"
    },
    {
      file: "docs/release-provenance.md",
      text: "Release Provenance"
    },
    {
      file: "docs/release-provenance.md",
      text: "corepack pnpm release:provenance"
    },
    {
      file: "docs/release-provenance.md",
      text: "tarball `sha256`"
    },
    {
      file: "docs/release-provenance.md",
      text: "repeat-pack-canonical-json-match"
    },
    {
      file: "docs/release-provenance.md",
      text: "npm `--provenance`"
    },
    {
      file: "docs/release-ci-policy.md",
      text: "Release CI Policy"
    },
    {
      file: "docs/release-ci-policy.md",
      text: "corepack pnpm release:ci-check"
    },
    {
      file: "docs/release-ci-policy.md",
      text: "permissions: contents: read"
    },
    {
      file: "docs/report-json-shapes.md",
      text: "ReleaseCiPolicyReport"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "Compressed Capability Source Selection"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "ResolutionContext.capability"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "draco"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "ktx2"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "meshopt"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "default source"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "runtime fallback"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/compressed-capability-source-selection.md",
      text: "corepack pnpm pack:check"
    },
    {
      file: "scripts/pack-check.mjs",
      text: "compressed.ktx2.txt"
    },
    {
      file: "scripts/pack-check.mjs",
      text: "capability report meshopt source missing"
    },
    {
      file: "tests/e2e/fixtures/minimal-app.js",
      text: "runRuntimeLifecycleStressProbe"
    },
    {
      file: "tests/e2e/fixtures/minimal-app.js",
      text: "runCacheStorageStressProbe"
    },
    {
      file: "tests/e2e/fixtures/minimal-app.js",
      text: "runCapabilitySelectionProbe"
    },
    {
      file: "tests/e2e/fixtures/minimal-app.js",
      text: "stress.cacheStorage"
    },
    {
      file: "tests/e2e/browser-fixture.e2e.ts",
      text: "indirection-e2e-result.json"
    },
    {
      file: "tests/e2e/browser-fixture.e2e.ts",
      text: "capabilitySelection"
    },
    {
      file: "tests/e2e/browser-fixture.e2e.ts",
      text: "runtimeLifecycle"
    },
    {
      file: "docs/browser-e2e.md",
      text: "corepack pnpm exec playwright install chromium firefox webkit"
    },
    {
      file: "docs/browser-e2e.md",
      text: "repeated runtime acquire/release loops"
    },
    {
      file: "docs/browser-e2e.md",
      text: "Cache Storage isolation across multiple catalog versions"
    },
    {
      file: "docs/browser-e2e.md",
      text: "compressed capability source selection"
    },
    {
      file: "docs/browser-e2e.md",
      text: "indirection-e2e-result.json"
    },
    {
      file: "docs/browser-e2e.md",
      text: "playwright-report/index.html"
    },
    {
      file: "docs/browser-e2e.md",
      text: "test-results/**/indirection-e2e-result.json"
    },
    {
      file: "docs/browser-e2e.md",
      text: "corepack pnpm test:e2e:firefox"
    },
    {
      file: "docs/browser-e2e.md",
      text: "MOZ_DISABLE_CONTENT_SANDBOX=1"
    },
    {
      file: "docs/browser-e2e.md",
      text: "--idle-exit-ms=5000"
    },
    {
      file: "docs/browser-e2e.md",
      text: "Install Playwright Browsers"
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
      text: "corepack pnpm release:ci-check"
    },
    {
      file: "docs/publish-preflight-policy.md",
      text: "corepack pnpm release:rc-check"
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
      text: "corepack pnpm release:ci-check"
    },
    {
      file: "docs/release-workflow.md",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: "docs/release-workflow.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "docs/release-ci-policy.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "docs/release-provenance.md",
      text: "corepack pnpm release:rc-check"
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
      file: "CHANGELOG.md",
      text: "0.0.0-phase-12-browser-matrix"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-13-three-gltf"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-14-three-lifecycle"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-15-compressed-capability"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-16-browser-e2e-stress"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-17-release-provenance"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-18-release-ci-policy"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-20-public-docs-onboarding"
    },
    {
      file: "CHANGELOG.md",
      text: "0.0.0-phase-21-public-demo-docs-site"
    },
    {
      file: "CHANGELOG.md",
      text: "corepack pnpm smoke:site-demo"
    },
    {
      file: "CHANGELOG.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "docs/phase-18-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-18-pass-report.md",
      text: "corepack pnpm release:ci-check"
    },
    {
      file: "docs/phase-18-pass-report.md",
      text: "Real npm publish"
    },
    {
      file: "docs/phase-18-pass-report.md",
      text: "Planner selection after PASS: Phase 19 No-Publish Release Candidate Rehearsal And Decision Handoff"
    },
    {
      file: "docs/phase-18-pass-report.md",
      text: "docs/indirection-phase-19-release-candidate-rehearsal-goal-guide.md"
    },
    {
      file: "docs/phase-19-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-19-pass-report.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "docs/phase-19-pass-report.md",
      text: "Real npm publish"
    },
    {
      file: "docs/phase-19-pass-report.md",
      text: "Planner selection after PASS: Phase 20 Public Docs, Examples, And Consumer Onboarding Polish"
    },
    {
      file: "docs/phase-19-pass-report.md",
      text: "docs/indirection-phase-20-public-docs-onboarding-goal-guide.md"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "docs/evaluator-quickstart.md"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "docs/package-entrypoints.md"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "docs/example-workflows.md"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "corepack pnpm release:rc-check"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "Real npm publish"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "Planner selection after PASS: Phase 21 Public Website, Demo Packaging, And Docs Site Rehearsal"
    },
    {
      file: "docs/phase-20-pass-report.md",
      text: "docs/indirection-phase-21-public-demo-docs-site-goal-guide.md"
    },
    {
      file: "docs/phase-21-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-21-pass-report.md",
      text: "docs/public-demo-site.md"
    },
    {
      file: "docs/phase-21-pass-report.md",
      text: "corepack pnpm smoke:site-demo"
    },
    {
      file: "docs/phase-21-pass-report.md",
      text: "corepack pnpm validate:full"
    },
    {
      file: "docs/phase-21-pass-report.md",
      text: "Real npm publish"
    },
    {
      file: "docs/phase-21-pass-report.md",
      text: "Planner selection after PASS: Phase 22 Browser ImageBitmap And Texture Source Lifecycle"
    },
    {
      file: "docs/phase-21-pass-report.md",
      text: "docs/indirection-phase-22-image-bitmap-lifecycle-goal-guide.md"
    },
    {
      file: "docs/phase-17-pass-report.md",
      text: "Status: PASS"
    },
    {
      file: "docs/phase-17-pass-report.md",
      text: "corepack pnpm release:provenance"
    },
    {
      file: "docs/phase-17-pass-report.md",
      text: "deterministic provenance records"
    },
    {
      file: "docs/phase-17-pass-report.md",
      text: "Real npm publish"
    },
    {
      file: "docs/phase-17-pass-report.md",
      text: "Planner selection after PASS: Phase 18 Release CI Policy Parity And Workflow Hardening"
    },
    {
      file: "docs/phase-17-pass-report.md",
      text: "docs/indirection-phase-18-release-ci-policy-goal-guide.md"
    },
    {
      file: ".github/workflows/release-dry-run.yml",
      text: "corepack pnpm release:dry-run"
    },
    {
      file: ".github/workflows/release-dry-run.yml",
      text: "corepack pnpm release:ci-check"
    },
    {
      file: ".github/workflows/release-dry-run.yml",
      text: "corepack pnpm release:provenance"
    },
    {
      file: ".github/workflows/release-dry-run.yml",
      text: "corepack pnpm publish:preflight"
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
      text: "corepack pnpm release:ci-check"
    },
    {
      file: ".github/workflows/publish-preflight.yml",
      text: "corepack pnpm release:provenance"
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
