import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { gunzipSync } from "node:zlib";
import {
  mkdtemp,
  readFile,
  readdir,
  rm
} from "node:fs/promises";
import { homedir, tmpdir, userInfo } from "node:os";
import {
  basename,
  dirname,
  join,
  relative,
  resolve
} from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepoRoot = resolve(dirname(scriptPath), "..");
const defaultPackagesRoot = join(defaultRepoRoot, "packages");

const deterministicExcludes = [
  "absolutePaths",
  "environmentVariables",
  "gitSha",
  "npmTokens",
  "registryCredentials",
  "timestamps",
  "usernames"
];

const validationCommands = [
  {
    name: "pack",
    command: "corepack pnpm pack --pack-destination <temp> --json",
    evidence: "temporary tarball artifact metadata"
  },
  {
    name: "pack-check",
    command: "corepack pnpm pack:check",
    evidence: "temporary consumer import and CLI bin smoke"
  },
  {
    name: "release-dry-run",
    command: "corepack pnpm release:dry-run",
    evidence: "no-publish release gate invokes provenance verification"
  },
  {
    name: "publish-preflight",
    command: "corepack pnpm publish:preflight",
    evidence: "decision gate without npm login or registry writes"
  }
];
const deterministicPackEnv = {
  ...process.env,
  SOURCE_DATE_EPOCH: "0"
};

export async function createReleaseProvenance(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? defaultRepoRoot);
  const packagesRoot = join(repoRoot, "packages");
  const verifyRepeat = options.verifyRepeat !== false;
  const packages = await readWorkspacePackages(packagesRoot, repoRoot);
  const tempRoots = [];

  try {
    const firstTempRoot = await createTempRoot();
    tempRoots.push(firstTempRoot);
    const report = await createReleaseProvenanceReport(
      packages,
      firstTempRoot,
      repoRoot
    );
    assertReleaseProvenanceReport(report);

    if (verifyRepeat) {
      const secondTempRoot = await createTempRoot();
      tempRoots.push(secondTempRoot);
      const repeatedReport = await createReleaseProvenanceReport(
        packages,
        secondTempRoot,
        repoRoot
      );
      assertReleaseProvenanceReport(repeatedReport);
      assertEqualCanonicalReports(report, repeatedReport);
    }

    return report;
  } finally {
    if (process.env.INDIRECTION_RELEASE_PROVENANCE_KEEP !== "1") {
      for (const tempRoot of tempRoots) {
        await rm(tempRoot, { recursive: true, force: true });
      }
    }
  }
}

export function canonicalReleaseProvenanceJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function assertReleaseProvenanceReport(report) {
  assertObject(report, "release provenance report");
  assert(report.schemaVersion === 1, "release provenance schemaVersion must be 1");
  assert(
    report.generatedBy === "scripts/release-provenance.mjs",
    "release provenance generatedBy must be stable"
  );
  assert(
    report.packageCount === report.packages?.length,
    "release provenance packageCount must match packages length"
  );
  assert(
    Array.isArray(report.packages) && report.packages.length === 9,
    "release provenance must cover 9 workspace packages"
  );
  assertNoPublishPolicy(report.policy);
  assertValidationEvidence(report.validation);
  assertSorted(
    report.packages.map((entry) => entry.name),
    "release provenance packages"
  );

  for (const packageEntry of report.packages) {
    assertPackageEntry(packageEntry);
  }

  assertLocalSafeStrings(report);
}

async function readWorkspacePackages(packagesRoot, repoRoot) {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dir = join(packagesRoot, entry.name);
    const manifestPath = join(dir, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    packages.push({
      dir,
      manifest,
      manifestPath,
      packageDirectory: relative(repoRoot, dir).replaceAll("\\", "/")
    });
  }

  return packages.sort((left, right) =>
    left.manifest.name.localeCompare(right.manifest.name)
  );
}

async function createReleaseProvenanceReport(packages, tempRoot, repoRoot) {
  const packageReports = [];

  for (const packageInfo of packages) {
    const packResult = await packPackage(packageInfo, tempRoot);
    packageReports.push(
      await createPackageProvenance(packageInfo, packResult, repoRoot)
    );
  }

  return {
    schemaVersion: 1,
    generatedBy: "scripts/release-provenance.mjs",
    packageCount: packageReports.length,
    policy: {
      packageArtifacts: "dry-run-only",
      publish: false,
      npmLogin: false,
      registryWrite: false,
      gitTag: false,
      githubRelease: false,
      signing: false,
      sigstore: false,
      npmProvenanceUpload: false,
      oidcPublish: false
    },
    validation: {
      commands: validationCommands,
      determinism: {
        canonicalJsonVersion: 1,
        hashAlgorithm: "sha256",
        excludes: deterministicExcludes,
        verification: "repeat-pack-canonical-json-match"
      }
    },
    packages: packageReports
  };
}

async function packPackage(packageInfo, tempRoot) {
  const stdout = runPnpm(
    ["pack", "--pack-destination", tempRoot, "--json"],
    packageInfo.dir
  );
  return JSON.parse(stdout.trim());
}

async function createPackageProvenance(packageInfo, packResult, repoRoot) {
  const tarballBytes = await readFile(packResult.filename);
  const manifest = packageInfo.manifest;
  const files = packResult.files
    .map((file) => file.path)
    .sort((left, right) => left.localeCompare(right));

  return {
    name: manifest.name,
    version: manifest.version,
    private: manifest.private,
    license: manifest.license,
    packageDirectory: relative(repoRoot, packageInfo.dir).replaceAll("\\", "/"),
    tarball: {
      filename: basename(packResult.filename),
      sha256: createCanonicalTarballSha256(tarballBytes),
      sha256Subject: "canonical-packed-payload",
      byteSize: tarballBytes.byteLength
    },
    exports: normalizeExports(manifest.exports),
    bin: normalizeBin(manifest.bin),
    files: {
      count: files.length,
      paths: files
    },
    validation: {
      packCommand: "corepack pnpm pack --pack-destination <temp> --json",
      packageSmokeCommand: "corepack pnpm pack:check",
      releaseGateCommand: "corepack pnpm release:dry-run"
    }
  };
}

function normalizeExports(exports) {
  assertObject(exports, "package exports");
  return Object.entries(exports)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([subpath, target]) => {
      if (typeof target === "string") {
        return {
          subpath,
          target
        };
      }

      assertObject(target, `package export ${subpath}`);
      return compactObject({
        subpath,
        types: target.types,
        import: target.import,
        require: target.require,
        default: target.default
      });
    });
}

function normalizeBin(bin) {
  return Object.entries(bin ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, path]) => ({
      name,
      path
    }));
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}

function assertNoPublishPolicy(policy) {
  assertObject(policy, "release provenance policy");
  for (const key of [
    "publish",
    "npmLogin",
    "registryWrite",
    "gitTag",
    "githubRelease",
    "signing",
    "sigstore",
    "npmProvenanceUpload",
    "oidcPublish"
  ]) {
    assert(policy[key] === false, `release provenance policy ${key} must be false`);
  }
}

function assertValidationEvidence(validation) {
  assertObject(validation, "release provenance validation");
  assert(
    Array.isArray(validation.commands),
    "release provenance validation commands must be an array"
  );
  for (const command of [
    "corepack pnpm pack:check",
    "corepack pnpm release:dry-run",
    "corepack pnpm publish:preflight"
  ]) {
    assert(
      validation.commands.some((entry) => entry.command === command),
      `release provenance validation commands must include ${command}`
    );
  }
  assert(
    validation.determinism?.hashAlgorithm === "sha256",
    "release provenance determinism must use sha256"
  );
  assertSorted(
    validation.determinism.excludes,
    "release provenance determinism excludes"
  );
}

function assertPackageEntry(packageEntry) {
  assertString(packageEntry.name, "package name");
  assert(packageEntry.name.startsWith("@indirection/"), `${packageEntry.name} must keep @indirection scope`);
  assert(packageEntry.version === "0.0.0", `${packageEntry.name} version must stay 0.0.0`);
  assert(packageEntry.private === true, `${packageEntry.name} must stay private`);
  assert(packageEntry.license === "UNLICENSED", `${packageEntry.name} license must stay UNLICENSED`);
  assertRelativePath(packageEntry.packageDirectory, `${packageEntry.name} packageDirectory`);

  assertObject(packageEntry.tarball, `${packageEntry.name} tarball`);
  assertString(packageEntry.tarball.filename, `${packageEntry.name} tarball filename`);
  assert(
    !packageEntry.tarball.filename.includes("/") &&
      !packageEntry.tarball.filename.includes("\\"),
    `${packageEntry.name} tarball filename must not include a directory`
  );
  assert(
    /^[a-f0-9]{64}$/.test(packageEntry.tarball.sha256),
    `${packageEntry.name} tarball sha256 must be 64 lowercase hex characters`
  );
  assert(
    packageEntry.tarball.sha256Subject === "canonical-packed-payload",
    `${packageEntry.name} tarball sha256Subject must describe canonical payload hashing`
  );
  assert(
    Number.isInteger(packageEntry.tarball.byteSize) &&
      packageEntry.tarball.byteSize > 0,
    `${packageEntry.name} tarball byteSize must be positive`
  );

  assert(
    Array.isArray(packageEntry.exports) && packageEntry.exports.length > 0,
    `${packageEntry.name} exports evidence must be non-empty`
  );
  assertSorted(
    packageEntry.exports.map((entry) => entry.subpath),
    `${packageEntry.name} exports`
  );
  for (const exportEntry of packageEntry.exports) {
    assertString(exportEntry.subpath, `${packageEntry.name} export subpath`);
    for (const key of ["types", "import", "require", "default", "target"]) {
      if (exportEntry[key] !== undefined) {
        assertRelativePath(exportEntry[key], `${packageEntry.name} export ${key}`);
      }
    }
  }

  assert(Array.isArray(packageEntry.bin), `${packageEntry.name} bin evidence must be an array`);
  assertSorted(
    packageEntry.bin.map((entry) => entry.name),
    `${packageEntry.name} bin`
  );
  for (const binEntry of packageEntry.bin) {
    assertString(binEntry.name, `${packageEntry.name} bin name`);
    assertRelativePath(binEntry.path, `${packageEntry.name} bin path`);
  }

  assertObject(packageEntry.files, `${packageEntry.name} files`);
  assert(
    packageEntry.files.count === packageEntry.files.paths.length,
    `${packageEntry.name} file count must match file paths`
  );
  assertSorted(packageEntry.files.paths, `${packageEntry.name} file paths`);
  for (const file of packageEntry.files.paths) {
    assertRelativePath(file, `${packageEntry.name} packed file`);
  }

  assertObject(packageEntry.validation, `${packageEntry.name} validation`);
  for (const key of ["packCommand", "packageSmokeCommand", "releaseGateCommand"]) {
    assertString(packageEntry.validation[key], `${packageEntry.name} ${key}`);
  }
}

function assertLocalSafeStrings(report) {
  const strings = collectStrings(report);
  const localNames = collectLocalNames();
  const sensitiveEnvValues = collectSensitiveEnvironmentValues();
  const homeDirectory = homedir().replaceAll("\\", "/");

  for (const { path, value } of strings) {
    assert(!hasAbsolutePath(value), `${path} must not include an absolute path`);
    assert(!hasTimestamp(value), `${path} must not include a timestamp`);
    assert(!hasCredentialAssignment(value), `${path} must not include registry credentials`);
    if (homeDirectory.length > 1) {
      assert(
        !value.replaceAll("\\", "/").includes(homeDirectory),
        `${path} must not include the local home directory`
      );
    }
    for (const localName of localNames) {
      assert(!value.includes(localName), `${path} must not include local username`);
    }
    for (const secret of sensitiveEnvValues) {
      assert(!value.includes(secret), `${path} must not include sensitive environment values`);
    }
  }
}

function collectStrings(value, path = "$") {
  if (typeof value === "string") {
    return [{ path, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectStrings(entry, `${path}[${index}]`));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectStrings(entry, `${path}.${key}`)
    );
  }

  return [];
}

function collectLocalNames() {
  return [
    process.env.USERNAME,
    process.env.USER,
    safeUserName()
  ].filter((value, index, values) => {
    return (
      typeof value === "string" &&
      value.length >= 3 &&
      values.indexOf(value) === index
    );
  });
}

function collectSensitiveEnvironmentValues() {
  return [
    "NPM_TOKEN",
    "NODE_AUTH_TOKEN",
    "NPM_CONFIG__AUTH",
    "NPM_CONFIG__AUTH_TOKEN",
    "NPM_CONFIG_USERNAME",
    "NPM_CONFIG_PASSWORD",
    "NPM_CONFIG_EMAIL"
  ]
    .map((name) => process.env[name])
    .filter((value, index, values) => {
      return (
        typeof value === "string" &&
        value.length >= 8 &&
        values.indexOf(value) === index
      );
    });
}

function safeUserName() {
  try {
    return userInfo().username;
  } catch {
    return undefined;
  }
}

function hasAbsolutePath(value) {
  return (
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.startsWith("/") ||
    /(?:^|[\\/])(?:Users|home)[\\/][^\\/]+/.test(value)
  );
}

function hasTimestamp(value) {
  return (
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) ||
    /\b\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\b/.test(value)
  );
}

function hasCredentialAssignment(value) {
  return /(?:_authToken|_auth\s*=|password\s*=|username\s*=|email\s*=|always-auth\s*=\s*true)/i.test(
    value
  );
}

function createCanonicalTarballSha256(tarballBytes) {
  const entries = parseTarArchive(gunzipSync(tarballBytes))
    .filter((entry) => entry.type === "0" || entry.type === "")
    .sort((left, right) => left.path.localeCompare(right.path));
  const hash = createHash("sha256");

  for (const entry of entries) {
    const content = canonicalizeTarEntry(entry);
    hash.update(entry.path);
    hash.update("\0");
    hash.update(String(content.byteLength));
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }

  return hash.digest("hex");
}

function parseTarArchive(bytes) {
  const entries = [];
  let offset = 0;

  while (offset + 512 <= bytes.byteLength) {
    const header = bytes.subarray(offset, offset + 512);
    if (isZeroBlock(header)) {
      break;
    }

    const path = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const size = readTarOctal(header, 124, 12);
    const type = readTarString(header, 156, 1);
    const fullPath = prefix.length > 0 ? `${prefix}/${path}` : path;
    const contentStart = offset + 512;
    const contentEnd = contentStart + size;
    entries.push({
      path: fullPath,
      type,
      content: bytes.subarray(contentStart, contentEnd)
    });
    offset = contentStart + Math.ceil(size / 512) * 512;
  }

  return entries;
}

function canonicalizeTarEntry(entry) {
  if (entry.path !== "package/package.json") {
    return entry.content;
  }

  const parsed = JSON.parse(entry.content.toString("utf8"));
  return Buffer.from(`${JSON.stringify(sortJsonKeys(parsed), null, 2)}\n`, "utf8");
}

function sortJsonKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonKeys(entry));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortJsonKeys(entry)])
    );
  }

  return value;
}

function isZeroBlock(block) {
  return block.every((byte) => byte === 0);
}

function readTarString(block, offset, length) {
  const slice = block.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  const content = end === -1 ? slice : slice.subarray(0, end);
  return content.toString("utf8").trim();
}

function readTarOctal(block, offset, length) {
  const text = readTarString(block, offset, length).trim();
  return text.length === 0 ? 0 : Number.parseInt(text, 8);
}

function assertEqualCanonicalReports(left, right) {
  const leftJson = canonicalReleaseProvenanceJson(left);
  const rightJson = canonicalReleaseProvenanceJson(right);
  if (leftJson !== rightJson) {
    const differences = describeReportDifferences(left, right);
    throw new Error(
      [
        "release provenance output is not deterministic across repeated pack runs",
        ...differences
      ].join("\n")
    );
  }
}

function describeReportDifferences(left, right) {
  const differences = [];
  for (let index = 0; index < left.packages.length; index += 1) {
    const leftPackage = left.packages[index];
    const rightPackage = right.packages[index];
    if (JSON.stringify(leftPackage) === JSON.stringify(rightPackage)) {
      continue;
    }

    differences.push(
      `${leftPackage.name}: ${JSON.stringify(leftPackage.tarball)} !== ${JSON.stringify(rightPackage.tarball)}`
    );
  }

  return differences.length > 0 ? differences : ["top-level report metadata differs"];
}

function assertRelativePath(value, label) {
  assertString(value, label);
  assert(!hasAbsolutePath(value), `${label} must be relative`);
  assert(!value.includes("\\"), `${label} must use posix separators`);
}

function assertSorted(values, label) {
  const sorted = [...values].sort((left, right) => left.localeCompare(right));
  assert(
    values.join("\0") === sorted.join("\0"),
    `${label} must be sorted for deterministic provenance`
  );
}

function assertString(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} must be a string`);
}

function assertObject(value, label) {
  assert(
    typeof value === "object" && value !== null && !Array.isArray(value),
    `${label} must be an object`
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function createTempRoot() {
  return mkdtemp(join(tmpdir(), "indirection-release-provenance-"));
}

function runPnpm(args, cwd) {
  if (process.platform === "win32") {
    return run(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/c", "corepack", "pnpm", ...args],
      cwd,
      deterministicPackEnv
    );
  }

  if (process.env.npm_execpath !== undefined) {
    return run(process.execPath, [process.env.npm_execpath, ...args], cwd, deterministicPackEnv);
  }

  return run(commandPath("corepack"), ["pnpm", ...args], cwd, deterministicPackEnv);
}

function run(command, args, cwd, env) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env,
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

if (process.argv[1] !== undefined && resolve(process.argv[1]) === scriptPath) {
  try {
    const report = await createReleaseProvenance();
    if (process.argv.includes("--json")) {
      process.stdout.write(canonicalReleaseProvenanceJson(report));
    } else {
      console.log(
        `release-provenance passed: ${report.packageCount} packages audited with deterministic sha256 provenance`
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
