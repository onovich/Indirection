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
await assertDocsPolicy(packages);
assertNoRealPublishScripts([rootManifest, ...packages.map((entry) => entry.manifest)]);
assertNoForbiddenTrackedArtifacts();

runPnpm(["build"]);
runPnpm(["pack:check"]);

const finalStatus = git(["status", "--porcelain", "--untracked-files=all"]);
const finalHeadTags = git(["tag", "--points-at", "HEAD"]);

assertEqual(
  finalStatus,
  initialStatus,
  "release dry-run changed git status; no generated artifact may remain"
);
assertEqual(
  finalHeadTags,
  initialHeadTags,
  "release dry-run changed tags pointing at HEAD"
);

console.log(
  `release-dry-run passed: ${packages.length} packages audited, packed, and verified without publish or tag side effects`
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
  assert(
    manifest.version === "0.0.0",
    "root package version must stay 0.0.0 during Phase 10 dry-run"
  );
  assert(
    manifest.license === "UNLICENSED",
    "root package license must stay UNLICENSED until public license is accepted"
  );
}

function assertPackagePolicy(packages) {
  for (const packageInfo of packages) {
    const { dir, manifest } = packageInfo;
    assert(
      typeof manifest.name === "string" &&
        manifest.name.startsWith("@indirection/"),
      `${manifest.name} must keep the @indirection scope`
    );
    assert(manifest.private === true, `${manifest.name} must stay private`);
    assert(
      manifest.version === "0.0.0",
      `${manifest.name} version must stay 0.0.0 during Phase 10 dry-run`
    );
    assert(
      manifest.license === "UNLICENSED",
      `${manifest.name} license must stay UNLICENSED until public license is accepted`
    );
    assert(
      manifest.repository?.directory ===
        relative(repoRoot, dir).replaceAll("\\", "/"),
      `${manifest.name} repository.directory must match its package directory`
    );
    assert(
      manifest.engines?.node === ">=22.0.0",
      `${manifest.name} must require Node >=22.0.0`
    );
    assert(
      manifest.publishConfig === undefined,
      `${manifest.name} must not define publishConfig during Phase 10`
    );

    assertWorkspaceDependencyRanges(manifest.dependencies, manifest.name);
    assertWorkspaceDependencyRanges(manifest.devDependencies, manifest.name);

    for (const peerName of Object.keys(manifest.peerDependencies ?? {})) {
      assert(
        manifest.peerDependenciesMeta?.[peerName]?.optional === true,
        `${manifest.name} peer ${peerName} must be optional in Phase 10`
      );
    }
  }
}

function assertWorkspaceDependencyRanges(dependencies, packageName) {
  for (const [name, range] of Object.entries(dependencies ?? {})) {
    if (name.startsWith("@indirection/")) {
      assert(
        range === "workspace:*",
        `${packageName} dependency ${name} must use workspace:* during dry-run`
      );
    }
  }
}

async function assertDocsPolicy(packages) {
  const workflow = await readText(join(repoRoot, "docs/release-workflow.md"));
  const versioning = await readText(
    join(repoRoot, "docs/release-versioning-adr.md")
  );

  for (const text of [
    "Do not run a real `npm publish`",
    "All workspace packages remain `private: true`",
    "Package Metadata Rules",
    "No `@indirection/sinan` package is approved",
    "The root `indirection` workspace package is private"
  ]) {
    assert(workflow.includes(text), `release workflow missing '${text}'`);
  }

  for (const { manifest } of packages) {
    assert(
      workflow.includes(`\`${manifest.name}\``),
      `release workflow must include visibility policy for ${manifest.name}`
    );
  }

  for (const text of [
    "Keep all package versions at `0.0.0`",
    "Keep `protocolVersion` independent from npm package versions",
    "instead of adding Changesets"
  ]) {
    assert(versioning.includes(text), `release versioning ADR missing '${text}'`);
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
      `release dry-run forbids tracked generated artifacts:\n${forbiddenFiles.join(
        "\n"
      )}`
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

async function readJson(path) {
  return JSON.parse(await readText(path));
}

async function readText(path) {
  return readFile(path, "utf8");
}

function runPnpm(args) {
  if (process.env.npm_execpath !== undefined) {
    return run(process.execPath, [process.env.npm_execpath, ...args]);
  }

  return run(commandPath("corepack"), ["pnpm", ...args]);
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

function commandPath(command) {
  return process.platform === "win32" ? `${command}.cmd` : command;
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
