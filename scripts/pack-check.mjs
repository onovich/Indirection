import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  basename,
  dirname,
  join,
  relative,
  resolve
} from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagesRoot = join(repoRoot, "packages");

let tempRoot;
let failed = false;

try {
  const packages = await readWorkspacePackages();
  await assertPackageMetadata(packages);
  await assertExportTargets(packages);

  tempRoot = await mkdtemp(join(tmpdir(), "indirection-pack-check-"));
  const packedPackages = await packWorkspacePackages(packages, tempRoot);
  await assertPackedFiles(packedPackages);
  await runInstallSmoke(packedPackages, tempRoot);

  console.log(
    `pack-check passed: ${packedPackages.length} packages packed and imported`
  );
} catch (error) {
  failed = true;
  console.error(error instanceof Error ? error.message : String(error));
  if (tempRoot !== undefined) {
    console.error(`pack-check temp retained: ${tempRoot}`);
  }
  process.exitCode = 1;
} finally {
  if (!failed && tempRoot !== undefined && process.env.INDIRECTION_PACK_CHECK_KEEP !== "1") {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function readWorkspacePackages() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dir = join(packagesRoot, entry.name);
    const packageJsonPath = join(dir, "package.json");
    try {
      const json = JSON.parse(await readFile(packageJsonPath, "utf8"));
      packages.push({
        dir,
        manifest: json,
        manifestPath: packageJsonPath
      });
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return packages.sort((left, right) =>
    left.manifest.name.localeCompare(right.manifest.name)
  );
}

async function assertPackageMetadata(packages) {
  for (const packageInfo of packages) {
    const { dir, manifest } = packageInfo;
    assertString(manifest.license, "license", manifest.name);
    assertObject(manifest.repository, "repository", manifest.name);
    assertString(manifest.repository.type, "repository.type", manifest.name);
    assertString(manifest.repository.url, "repository.url", manifest.name);
    assertString(
      manifest.repository.directory,
      "repository.directory",
      manifest.name
    );
    assertString(manifest.homepage, "homepage", manifest.name);
    assertString(manifest.engines?.node, "engines.node", manifest.name);
    assertStringArray(manifest.keywords, "keywords", manifest.name);
    assertBoolean(manifest.sideEffects, "sideEffects", manifest.name);
    assertStringArray(manifest.files, "files", manifest.name);

    const expectedDirectory = relative(repoRoot, dir).replaceAll("\\", "/");
    if (manifest.repository.directory !== expectedDirectory) {
      throw new Error(
        `${manifest.name} repository.directory must be ${expectedDirectory}`
      );
    }

    for (const filePattern of [
      "dist/**/*.d.ts",
      "dist/**/*.d.ts.map",
      "dist/**/*.js",
      "dist/**/*.js.map"
    ]) {
      if (!manifest.files.includes(filePattern)) {
        throw new Error(`${manifest.name} files must include ${filePattern}`);
      }
    }

    for (const peerName of Object.keys(manifest.peerDependencies ?? {})) {
      if (manifest.peerDependenciesMeta?.[peerName]?.optional !== true) {
        throw new Error(`${manifest.name} peer ${peerName} must be optional`);
      }
    }
  }
}

async function assertExportTargets(packages) {
  for (const packageInfo of packages) {
    const { dir, manifest } = packageInfo;
    assertString(manifest.name, "package name", manifest.name);
    assertString(manifest.main, "main", manifest.name);
    assertString(manifest.types, "types", manifest.name);
    assertObject(manifest.exports, "exports", manifest.name);
    assertObject(manifest.exports["."], "exports[.]", manifest.name);
    assertString(manifest.exports["."].import, "exports[.].import", manifest.name);
    assertString(manifest.exports["."].types, "exports[.].types", manifest.name);

    await assertFileExists(dir, manifest.main, `${manifest.name} main`);
    await assertFileExists(dir, manifest.types, `${manifest.name} types`);
    await assertFileExists(
      dir,
      manifest.exports["."].import,
      `${manifest.name} export import`
    );
    await assertFileExists(
      dir,
      manifest.exports["."].types,
      `${manifest.name} export types`
    );

    for (const [binName, binPath] of Object.entries(manifest.bin ?? {})) {
      assertString(binPath, `bin ${binName}`, manifest.name);
      await assertFileExists(dir, binPath, `${manifest.name} bin ${binName}`);
    }
  }
}

async function packWorkspacePackages(packages, destination) {
  const packedPackages = [];

  for (const packageInfo of packages) {
    const stdout = runPnpm(
      ["pack", "--pack-destination", destination, "--json"],
      packageInfo.dir
    );
    const packResult = JSON.parse(stdout.trim());
    packedPackages.push({
      ...packageInfo,
      packResult
    });
  }

  return packedPackages;
}

async function assertPackedFiles(packedPackages) {
  for (const packageInfo of packedPackages) {
    const { manifest, packResult } = packageInfo;
    await assertPathIsFile(packResult.filename, `${manifest.name} tarball`);

    const packedPaths = new Set(packResult.files.map((file) => file.path));
    assertPackedPath(packedPaths, "package.json", manifest.name);
    assertPackedPath(packedPaths, "dist/index.js", manifest.name);
    assertPackedPath(packedPaths, "dist/index.d.ts", manifest.name);
    for (const binPath of Object.values(manifest.bin ?? {})) {
      assertPackedPath(packedPaths, withoutLeadingDotSlash(binPath), manifest.name);
    }

    for (const file of packedPaths) {
      if (!isAllowedPackedFile(file)) {
        throw new Error(`${manifest.name} packed unexpected file: ${file}`);
      }
    }
  }
}

async function runInstallSmoke(packedPackages, destination) {
  const consumerDir = join(destination, "consumer");
  await mkdir(consumerDir);

  const dependencies = Object.fromEntries(
    packedPackages.map((packageInfo) => [
      packageInfo.manifest.name,
      fileDependencySpecifier(consumerDir, packageInfo.packResult.filename)
    ])
  );

  await writeJson(join(consumerDir, "package.json"), {
    name: "indirection-pack-smoke",
    private: true,
    type: "module",
    dependencies
  });
  await writeFile(
    join(consumerDir, "pnpm-workspace.yaml"),
    createPnpmWorkspaceYaml(dependencies),
    "utf8"
  );
  await writeFile(
    join(consumerDir, ".npmrc"),
    "auto-install-peers=false\nignore-scripts=true\n",
    "utf8"
  );

  runPnpm(
    [
      "install",
      "--config.auto-install-peers=false",
      "--ignore-scripts",
      "--reporter",
      "append-only",
      "--fetch-timeout",
      "600000"
    ],
    consumerDir
  );

  await writeFile(join(consumerDir, "smoke.mjs"), createSmokeSource(), "utf8");
  runNode(["smoke.mjs"], consumerDir);
  runInstalledCliSmoke(consumerDir);
}

function createSmokeSource() {
  return `import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  protocolPackageName,
  normalizeAssetId
} from "@indirection/protocol";
import {
  schemaPackageName,
  parseIndirectionManifest
} from "@indirection/schema";
import {
  compilerPackageName,
  importIndirectionManifest,
  compileNormalizedModel
} from "@indirection/compiler";
import {
  runtimePackageName,
  createAssetManager,
  InMemoryTransport,
  textAssetLoader
} from "@indirection/runtime";
import {
  testkitPackageName,
  corePackageNames
} from "@indirection/testkit";
import {
  loadersWebPackageName,
  createWebDataLoaders,
  MemoryCacheStorageAdapter
} from "@indirection/loaders-web";
import {
  threePackageName,
  createThreeGltfLoader
} from "@indirection/three";
import {
  vitePackageName,
  virtualCatalogModuleId,
  resolvedVirtualCatalogModuleId,
  createIndirectionVitePlugin
} from "@indirection/vite";
import {
  cliPackageName,
  runIndirectionCli
} from "@indirection/cli";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const manifest = {
  schemaVersion: 1,
  namespace: "pack",
  assets: {
    "text.intro": {
      type: "text/plain",
      sources: [{ url: "intro.txt" }]
    }
  }
};

parseIndirectionManifest(manifest);
const model = importIndirectionManifest(manifest);
const result = compileNormalizedModel(model);

assert(protocolPackageName === "@indirection/protocol", "protocol import failed");
assert(schemaPackageName === "@indirection/schema", "schema import failed");
assert(compilerPackageName === "@indirection/compiler", "compiler import failed");
assert(runtimePackageName === "@indirection/runtime", "runtime import failed");
assert(testkitPackageName === "@indirection/testkit", "testkit import failed");
assert(loadersWebPackageName === "@indirection/loaders-web", "loaders-web import failed");
assert(threePackageName === "@indirection/three", "three import failed");
assert(vitePackageName === "@indirection/vite", "vite import failed");
assert(cliPackageName === "@indirection/cli", "cli import failed");
assert(corePackageNames.includes(protocolPackageName), "testkit export drift");
assert(normalizeAssetId("text.intro", { defaultNamespace: "pack" }) === "pack:text.intro", "asset id normalization failed");
assert(result.diagnostics.length === 0, "compiler diagnostics not empty");

const manager = createAssetManager({
  catalog: result.catalog,
  transport: new InMemoryTransport({ "intro.txt": "hello from pack" }),
  loaders: [textAssetLoader]
});
const scope = manager.createScope("pack-smoke");
const handle = await scope.acquire("pack:text.intro");
assert(handle.value === "hello from pack", "runtime acquire failed");
handle.release();
await scope.dispose();

assert(createWebDataLoaders().length === 3, "web loaders import failed");
const cache = new MemoryCacheStorageAdapter();
await cache.put({ catalogVersion: result.catalog.catalogVersion, sourceUrl: "intro.txt" }, "cached");
assert(await cache.match({ catalogVersion: result.catalog.catalogVersion, sourceUrl: "intro.txt" }) === "cached", "cache adapter failed");

const gltfLoader = createThreeGltfLoader();
assert(gltfLoader.types.includes("model/gltf"), "three loader boundary failed");

const plugin = createIndirectionVitePlugin({ model });
assert(plugin.resolveId(virtualCatalogModuleId) === resolvedVirtualCatalogModuleId, "vite resolve failed");
assert(plugin.load(resolvedVirtualCatalogModuleId)?.includes("pack:text.intro"), "vite load failed");

const manifestPath = join(process.cwd(), "indirection.manifest.json");
await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
const stdout = [];
const stderr = [];
const code = await runIndirectionCli(["validate", "--manifest", manifestPath], {
  stdout(text) {
    stdout.push(text);
  },
  stderr(text) {
    stderr.push(text);
  }
});
assert(code === 0, "cli validate failed");
assert(stderr.length === 0, "cli emitted stderr");
assert(JSON.parse(stdout[0]).ok === true, "cli output failed");
`;
}

function runInstalledCliSmoke(consumerDir) {
  const binPath = binCommandPath(consumerDir, "indirection");
  const binArgs = ["validate", "--manifest", "indirection.manifest.json"];
  const stdout =
    process.platform === "win32"
      ? run(
          process.env.ComSpec ?? "cmd.exe",
          ["/d", "/c", "call", binPath, ...binArgs],
          consumerDir
        )
      : run(binPath, binArgs, consumerDir);
  const parsed = JSON.parse(stdout);
  if (parsed.ok !== true || !Array.isArray(parsed.diagnostics)) {
    throw new Error("installed CLI bin smoke did not return ok diagnostics JSON");
  }
}

async function assertFileExists(baseDir, relativePath, label) {
  await assertPathIsFile(resolve(baseDir, relativePath), label);
}

async function assertPathIsFile(path, label) {
  try {
    const fileStat = await stat(path);
    if (!fileStat.isFile()) {
      throw new Error(`${label} is not a file: ${path}`);
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${label} does not exist: ${path}`);
    }

    throw error;
  }
}

function assertPackedPath(paths, path, packageName) {
  if (!paths.has(path)) {
    throw new Error(`${packageName} tarball is missing ${path}`);
  }
}

function isAllowedPackedFile(path) {
  return (
    path === "package.json" ||
    /^dist\/.+\.(?:d\.ts|d\.ts\.map|js|js\.map)$/.test(path)
  );
}

function withoutLeadingDotSlash(path) {
  return path.startsWith("./") ? path.slice(2) : path;
}

function assertString(value, field, packageName) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${packageName} must define ${field}`);
  }
}

function assertObject(value, field, packageName) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${packageName} must define ${field}`);
  }
}

function assertBoolean(value, field, packageName) {
  if (typeof value !== "boolean") {
    throw new Error(`${packageName} must define boolean ${field}`);
  }
}

function assertStringArray(value, field, packageName) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((entry) => typeof entry !== "string" || entry.length === 0)
  ) {
    throw new Error(`${packageName} must define non-empty string array ${field}`);
  }
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function createPnpmWorkspaceYaml(overrides) {
  const lines = ["packages: []", "overrides:"];
  for (const [name, specifier] of Object.entries(overrides)) {
    lines.push(`  ${JSON.stringify(name)}: ${JSON.stringify(specifier)}`);
  }

  return `${lines.join("\n")}\n`;
}

function fileDependencySpecifier(fromDir, targetFile) {
  let relativePath = relative(fromDir, targetFile).replaceAll("\\", "/");
  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return `file:${relativePath}`;
}

function runPnpm(args, cwd) {
  if (process.env.npm_execpath !== undefined) {
    return run(process.execPath, [process.env.npm_execpath, ...args], cwd);
  }

  return run(commandPath("corepack"), ["pnpm", ...args], cwd);
}

function runNode(args, cwd) {
  return run(process.execPath, args, cwd);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  if (result.status !== 0) {
    const stdout = result.stdout ?? "";
    const stderr = result.stderr ?? "";
    const error = result.error === undefined ? "" : result.error.message;
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        stdout.trim(),
        stderr.trim(),
        error
      ]
        .filter(Boolean)
        .join("\\n")
    );
  }

  return result.stdout;
}

function commandPath(command) {
  return process.platform === "win32" ? `${command}.cmd` : command;
}

function binCommandPath(root, command) {
  const bin = join(root, "node_modules", ".bin", command);
  return process.platform === "win32" ? `${bin}.cmd` : bin;
}
