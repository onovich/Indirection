import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const textFilePattern =
  /(?:^|\/)(?:\.gitignore|\.npmrc)$|\.(?:css|html|js|json|md|mjs|ts|txt|yaml|yml)$/;
const stableJsonPattern =
  /(?:^|\/)(?:package|tsconfig(?:\.base)?)\.json$|^fixtures\/.*\.json$/;

const files = git(["ls-files", "-z"])
  .split("\0")
  .filter((file) => file.length > 0)
  .filter((file) => textFilePattern.test(toPosix(file)));
const issues = [];

for (const file of files) {
  const path = toPosix(file);
  const bytes = readFileSync(file);
  const text = bytes.toString("utf8");

  if (hasUtf8Bom(bytes)) {
    issues.push(`${path}: contains UTF-8 BOM`);
  }

  if (text.length > 0 && !text.endsWith("\n")) {
    issues.push(`${path}: missing final newline`);
  }

  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[ \t]$/.test(line)) {
      issues.push(`${path}:${index + 1}: trailing whitespace`);
    }
  });

  if (stableJsonPattern.test(path)) {
    checkStableJson(path, text);
  }
}

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(issue);
  }
  process.exitCode = 1;
} else {
  console.log(`format-check passed: ${files.length} tracked text files checked`);
}

function checkStableJson(path, text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    issues.push(`${path}: invalid JSON: ${error.message}`);
    return;
  }

  const expected = `${JSON.stringify(parsed, null, 2)}\n`;
  if (text !== expected) {
    issues.push(`${path}: JSON must use stable 2-space formatting`);
  }
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

function hasUtf8Bom(bytes) {
  return bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

function toPosix(path) {
  return path.replaceAll("\\", "/");
}
