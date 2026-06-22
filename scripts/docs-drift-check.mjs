import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const issues = [];
const packageJson = readJson("package.json");

checkValidateFull();
checkBrowserMatrix();
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
      file: "docs/browser-e2e.md",
      text: "corepack pnpm exec playwright install chromium firefox webkit"
    },
    {
      file: "docs/browser-e2e.md",
      text: "corepack pnpm test:e2e:firefox"
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
