import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const binPath = resolve("packages/cli/dist/bin.js");
const manifestPath = resolve("fixtures/vanilla/indirection.manifest.json");

const validate = runCli(["validate", "--manifest", manifestPath], 0);
assertJson(validate.stdout, (value) => {
  assert(value.ok === true, "validate smoke did not return ok=true");
  assert(Array.isArray(value.diagnostics), "validate diagnostics must be an array");
});

const build = runCli(["build", "--manifest", manifestPath], 0);
assertJson(build.stdout, (value) => {
  assert(value.protocolVersion === 1, "build smoke missing protocolVersion");
  assert(
    value.assets?.["vanilla:text.intro"]?.fallback === "vanilla:text.fallback",
    "build smoke missing fallback asset"
  );
});

const report = runCli(["report", "--manifest", manifestPath], 0);
assertJson(report.stdout, (value) => {
  assert(value.summary?.assetCount === 3, "report smoke wrong asset count");
  assert(
    value.determinism?.hashAlgorithm === "sha256",
    "report smoke missing determinism metadata"
  );
});

const inspect = runCli(
  [
    "inspect",
    "--manifest",
    manifestPath,
    "--asset",
    "vanilla:text.intro"
  ],
  0
);
assertJson(inspect.stdout, (value) => {
  assert(value.type === "text/plain", "inspect smoke wrong asset type");
});

const missing = runCli(
  [
    "inspect",
    "--manifest",
    manifestPath,
    "--asset",
    "vanilla:text.missing"
  ],
  1
);
assert(
  missing.stderr.includes("Asset not found: vanilla:text.missing"),
  "inspect missing asset smoke did not explain failure"
);

console.log("cli-smoke passed: validate/build/report/inspect commands are functional");

function runCli(args, expectedStatus) {
  const result = spawnSync(process.execPath, [binPath, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  if (result.status !== expectedStatus) {
    throw new Error(
      [
        `CLI exited ${result.status}, expected ${expectedStatus}`,
        result.stdout.trim(),
        result.stderr.trim()
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function assertJson(text, check) {
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`CLI output was not JSON: ${error.message}`);
  }

  check(value);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
