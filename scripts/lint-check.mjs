import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const sourcePattern = /\.(?:js|mjs|ts)$/;
const focusedTestPattern = /\b(?:describe|it|test)\.only\s*\(/;
const skippedTestPattern = /\b(?:describe|it|test)\.skip\s*\(/;
const issues = [];

await checkRootScripts();
await checkWorkspacePackageManifests();
checkSourceFiles();

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(issue);
  }
  process.exitCode = 1;
} else {
  console.log("lint-check passed: structure and source guards are clean");
}

async function checkRootScripts() {
  const packageJson = readJson("package.json");
  const scripts = packageJson.scripts ?? {};

  for (const scriptName of ["lint", "format"]) {
    const command = scripts[scriptName];
    if (typeof command !== "string" || command.includes("not configured yet")) {
      issues.push(`package.json: script '${scriptName}' must be a real gate`);
    }
  }
}

async function checkWorkspacePackageManifests() {
  for (const packageDir of await readWorkspacePackageDirs()) {
    const manifestPath = join(packageDir, "package.json").replaceAll("\\", "/");
    const manifest = readJson(manifestPath);

    requireField(manifestPath, manifest.name, "name");
    requireField(manifestPath, manifest.version, "version");
    requireValue(manifestPath, manifest.private, true, "private");
    requireValue(manifestPath, manifest.type, "module", "type");
    requireValue(manifestPath, manifest.sideEffects, false, "sideEffects");
    requireValue(manifestPath, manifest.main, "./dist/index.js", "main");
    requireValue(manifestPath, manifest.types, "./dist/index.d.ts", "types");
    requireValue(
      manifestPath,
      manifest.exports?.["."]?.import,
      "./dist/index.js",
      "exports[.].import"
    );
    requireValue(
      manifestPath,
      manifest.exports?.["."]?.types,
      "./dist/index.d.ts",
      "exports[.].types"
    );

    const files = manifest.files ?? [];
    for (const expectedFile of [
      "dist/**/*.d.ts",
      "dist/**/*.d.ts.map",
      "dist/**/*.js",
      "dist/**/*.js.map"
    ]) {
      if (!files.includes(expectedFile)) {
        issues.push(`${manifestPath}: files must include ${expectedFile}`);
      }
    }
  }
}

function checkSourceFiles() {
  for (const file of git(["ls-files", "-z"]).split("\0").filter(Boolean)) {
    const path = file.replaceAll("\\", "/");
    if (!sourcePattern.test(path)) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      const location = `${path}:${index + 1}`;
      if (focusedTestPattern.test(line)) {
        issues.push(`${location}: focused test is not allowed`);
      }
      if (skippedTestPattern.test(line)) {
        issues.push(`${location}: skipped test must be documented outside committed code`);
      }
      if (/\bdebugger\b/.test(line)) {
        issues.push(`${location}: debugger statement is not allowed`);
      }
    });
  }
}

async function readWorkspacePackageDirs() {
  const entries = await readdir("packages", { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join("packages", entry.name))
    .sort();
}

function requireField(file, value, field) {
  if (typeof value !== "string" || value.length === 0) {
    issues.push(`${file}: missing ${field}`);
  }
}

function requireValue(file, actual, expected, field) {
  if (actual !== expected) {
    issues.push(`${file}: ${field} must be ${JSON.stringify(expected)}`);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
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
