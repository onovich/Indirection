import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagesRoot = join(repoRoot, "packages");

const initialStatus = git(["status", "--porcelain", "--untracked-files=all"]);
const initialHeadTags = git(["tag", "--points-at", "HEAD"]);

const rootManifest = await readJson(join(repoRoot, "package.json"));
const packages = await readWorkspacePackages();

assertRootPolicy(rootManifest);
assertPackagePolicy(packages);
await assertWorkflowPolicy();
await assertPreflightDocs(packages);
assertNoRealPublishScripts([rootManifest, ...packages.map((entry) => entry.manifest)]);
await assertNoNpmCredentialsTracked();
assertNoForbiddenTrackedArtifacts();
assertNoHeadTags();

const finalStatus = git(["status", "--porcelain", "--untracked-files=all"]);
const finalHeadTags = git(["tag", "--points-at", "HEAD"]);

assertEqual(
  finalStatus,
  initialStatus,
  "publish preflight changed git status; it must be read-only"
);
assertEqual(
  finalHeadTags,
  initialHeadTags,
  "publish preflight changed tags pointing at HEAD"
);

console.log(
  `publish-preflight passed: ${packages.length} packages audited without publish, npm login, registry write, or tag side effects`
);

async function readWorkspacePackages() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dir = join(packagesRoot, entry.name);
    const manifestPath = join(dir, "package.json");
    const manifest = await readJson(manifestPath);
    packages.push({ dir, manifest, manifestPath });
  }

  return packages.sort((left, right) =>
    left.manifest.name.localeCompare(right.manifest.name)
  );
}

function assertRootPolicy(manifest) {
  assert(manifest.name === "indirection", "root package name must stay indirection");
  assert(manifest.private === true, "root package must stay private");
  assert(manifest.version === "0.0.0", "root package version must stay 0.0.0");
  assert(manifest.license === "UNLICENSED", "root package must stay UNLICENSED");
  assert(
    manifest.scripts?.["release:dry-run"] === "node scripts/release-dry-run.mjs",
    "release:dry-run must run scripts/release-dry-run.mjs"
  );
  assert(
    manifest.scripts?.["publish:preflight"] === "node scripts/publish-preflight.mjs",
    "publish:preflight must run scripts/publish-preflight.mjs"
  );
}

function assertPackagePolicy(packages) {
  for (const { dir, manifest } of packages) {
    assert(
      typeof manifest.name === "string" &&
        manifest.name.startsWith("@indirection/"),
      `${manifest.name} must keep the @indirection scope`
    );
    assert(manifest.private === true, `${manifest.name} must stay private`);
    assert(manifest.version === "0.0.0", `${manifest.name} version must stay 0.0.0`);
    assert(
      manifest.license === "UNLICENSED",
      `${manifest.name} must stay UNLICENSED until a public license is accepted`
    );
    assert(
      manifest.publishConfig === undefined,
      `${manifest.name} must not define publishConfig in Phase 11`
    );
    assert(
      manifest.repository?.directory ===
        relative(repoRoot, dir).replaceAll("\\", "/"),
      `${manifest.name} repository.directory must match its package directory`
    );
    assertWorkspaceDependencyRanges(manifest.dependencies, manifest.name);
    assertWorkspaceDependencyRanges(manifest.devDependencies, manifest.name);
  }
}

function assertWorkspaceDependencyRanges(dependencies, packageName) {
  for (const [name, range] of Object.entries(dependencies ?? {})) {
    if (name.startsWith("@indirection/")) {
      assert(
        range === "workspace:*",
        `${packageName} dependency ${name} must use workspace:* before real publish`
      );
    }
  }
}

async function assertPreflightDocs(packages) {
  const policy = await readText(join(repoRoot, "docs/publish-preflight-policy.md"));
  const workflow = await readText(join(repoRoot, "docs/release-workflow.md"));
  const versioning = await readText(
    join(repoRoot, "docs/release-versioning-adr.md")
  );
  const readiness = await readText(join(repoRoot, "docs/release-readiness.md"));

  for (const text of [
    "Phase 11 must not",
    "Decision Status Model",
    "Workspace Publish Candidate Matrix",
    "| Package | Phase 11 decision status | Future v0.1 candidacy | Owner decision needed before real publish |",
    "License Policy",
    "Npm Scope, Account, And Permission Policy",
    "Git Tag And GitHub Release Policy",
    "Rollback And Accidental Publish Policy",
    "Versioning And Release Notes Policy",
    "corepack pnpm publish:preflight"
  ]) {
    assert(policy.includes(text), `publish preflight policy missing '${text}'`);
  }

  for (const { manifest } of packages) {
    assert(
      policy.includes(`\`${manifest.name}\``),
      `publish preflight policy missing ${manifest.name}`
    );
    assert(
      policy.includes(`| \`${manifest.name}\` | \`pending\` |`),
      `publish preflight policy must mark ${manifest.name} as pending`
    );
  }

  for (const text of ["UNLICENSED", "private dry-run/preflight only"]) {
    assert(workflow.includes(text), `release workflow missing '${text}'`);
  }

  for (const text of [
    "reaffirmed for Phase 11 publish preflight",
    "package versions stay unchanged",
    "must not add Changesets"
  ]) {
    assert(versioning.includes(text), `release versioning ADR missing '${text}'`);
  }

  assert(
    readiness.includes("docs/publish-preflight-policy.md"),
    "release readiness must point at publish preflight policy"
  );
}

async function assertWorkflowPolicy() {
  const releaseDryRunWorkflow = await readText(
    join(repoRoot, ".github/workflows/release-dry-run.yml")
  );
  const publishPreflightWorkflow = await readText(
    join(repoRoot, ".github/workflows/publish-preflight.yml")
  );

  assertSafeWorkflow(releaseDryRunWorkflow, "release dry-run workflow", [
    "corepack pnpm release:dry-run"
  ]);
  assertSafeWorkflow(publishPreflightWorkflow, "publish preflight workflow", [
    "corepack pnpm publish:preflight",
    "corepack pnpm release:dry-run",
    "git diff --check"
  ]);
}

function assertSafeWorkflow(text, label, requiredCommands) {
  for (const required of ["workflow_dispatch:", "permissions:", "contents: read"]) {
    assert(text.includes(required), `${label} missing '${required}'`);
  }
  for (const command of requiredCommands) {
    assert(text.includes(command), `${label} missing '${command}'`);
  }
  for (const forbidden of [
    /\bnpm\s+publish(?:\s|$)/,
    /\bpnpm\s+publish(?:\s|$)/,
    /\bgit\s+tag(?:\s|$)/,
    /\bgh\s+release(?:\s|$)/,
    /\bcontents:\s+write\b/
  ]) {
    assert(
      !forbidden.test(text),
      `${label} must not match ${forbidden}`
    );
  }
}

function assertNoRealPublishScripts(manifests) {
  for (const manifest of manifests) {
    for (const [name, command] of Object.entries(manifest.scripts ?? {})) {
      if (
        /\b(?:npm|pnpm)\s+publish\b/.test(command) &&
        !/\s--dry-run(?:\s|$)/.test(command)
      ) {
        throw new Error(`${manifest.name} script ${name} may publish for real`);
      }
      if (/\bchangeset\s+publish\b/.test(command)) {
        throw new Error(`${manifest.name} script ${name} may publish for real`);
      }
    }
  }
}

async function assertNoNpmCredentialsTracked() {
  const trackedFiles = git(["ls-files", "-z"]).split("\0").filter(Boolean);
  for (const file of trackedFiles) {
    if (file.endsWith(".npmrc")) {
      const text = await readText(join(repoRoot, file));
      if (/(?:_authToken|_auth\s*=|username\s*=|password\s*=|email\s*=|always-auth\s*=\s*true)/i.test(text)) {
        throw new Error(`tracked npm credential config is forbidden in Phase 11: ${file}`);
      }
    }
  }
}

function assertNoForbiddenTrackedArtifacts() {
  const trackedFiles = git(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean)
    .map((file) => file.replaceAll("\\", "/"));

  const forbiddenFiles = trackedFiles.filter((file) =>
    /(?:^|\/)(?:playwright-report|test-results|release-artifacts|release-archives|npm-cache)(?:\/|$)|(?:^|\/)dist\/|\.tgz$|trace\.zip$|tsconfig\.tsbuildinfo$/.test(
      file
    )
  );

  if (forbiddenFiles.length > 0) {
    throw new Error(
      `publish preflight forbids tracked generated artifacts:\n${forbiddenFiles.join(
        "\n"
      )}`
    );
  }
}

function assertNoHeadTags() {
  if (initialHeadTags.trim().length > 0) {
    throw new Error(
      `publish preflight forbids release tags pointing at HEAD:\n${initialHeadTags.trim()}`
    );
  }
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

async function readText(path) {
  return readFile(path, "utf8");
}

function git(args) {
  return run("git", args);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  if (result.status !== 0) {
    const stdout = result.stdout ?? "";
    const stderr = result.stderr ?? "";
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        stdout.trim(),
        stderr.trim(),
        result.error?.message
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return result.stdout;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nBefore:\n${expected}\nAfter:\n${actual}`);
  }
}
