import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const outputDir = resolve(
  repoRoot,
  args.out ??
    (args.smoke ? "build/public-demo-site-smoke" : "build/public-demo-site")
);

const sourceDocs = [
  {
    label: "Repository README",
    path: "README.md",
    requiredText: "docs/evaluator-quickstart.md"
  },
  {
    label: "Evaluator quickstart",
    path: "docs/evaluator-quickstart.md",
    requiredText: "corepack pnpm validate:full"
  },
  {
    label: "Package entrypoints",
    path: "docs/package-entrypoints.md",
    requiredText: "@indirection/runtime"
  },
  {
    label: "Example workflows",
    path: "docs/example-workflows.md",
    requiredText: "Phase 7 Integrated Example"
  },
  {
    label: "Release readiness",
    path: "docs/release-readiness.md",
    requiredText: "Phase 21 Public Website, Demo Packaging, And Docs Site Rehearsal"
  },
  {
    label: "Release candidate handoff",
    path: "docs/release-candidate-handoff.md",
    requiredText: "owner decision blockers"
  },
  {
    label: "Local public demo site",
    path: "docs/public-demo-site.md",
    requiredText: "corepack pnpm smoke:site-demo"
  }
];

const packageEntrypoints = [
  "@indirection/protocol",
  "@indirection/schema",
  "@indirection/compiler",
  "@indirection/runtime",
  "@indirection/loaders-web",
  "@indirection/three",
  "@indirection/vite",
  "@indirection/cli",
  "@indirection/testkit"
];

const commands = [
  {
    label: "Install",
    command: "corepack pnpm install --frozen-lockfile"
  },
  {
    label: "Build local demo site",
    command: "corepack pnpm site:demo"
  },
  {
    label: "Smoke local demo site",
    command: "corepack pnpm smoke:site-demo"
  },
  {
    label: "Full validation",
    command: "corepack pnpm validate:full"
  },
  {
    label: "Release candidate rehearsal",
    command: "corepack pnpm release:rc-check"
  },
  {
    label: "Publish preflight",
    command: "corepack pnpm publish:preflight"
  }
];

const policy = {
  deploy: false,
  publish: false,
  npmLogin: false,
  registryWrite: false,
  gitTag: false,
  githubRelease: false,
  signing: false,
  sigstore: false,
  npmProvenanceUpload: false,
  oidcPublish: false,
  workflowWritePermissions: false,
  generatedOutputCommitted: false
};

try {
  await assertSourceDocs();
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const manifest = createManifest();
  const html = createHtml(manifest);

  await writeFile(
    join(outputDir, "demo-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  await writeFile(join(outputDir, "index.html"), html, "utf8");

  await assertOutput(outputDir);

  if (args.smoke) {
    await rm(outputDir, { recursive: true, force: true });
    console.log(
      "public-demo-site smoke passed: local no-deploy rehearsal assembled and cleaned"
    );
  } else {
    console.log(
      `public-demo-site built: ${toPosix(relative(repoRoot, join(outputDir, "index.html")))}`
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function assertSourceDocs() {
  for (const doc of sourceDocs) {
    const text = await readUtf8(doc.path);
    if (!text.includes(doc.requiredText)) {
      throw new Error(`${doc.path}: missing required demo source text '${doc.requiredText}'`);
    }
  }
}

function createManifest() {
  return {
    schemaVersion: 1,
    generatedBy: "scripts/public-demo-site.mjs",
    output: "build/public-demo-site",
    sourceOfTruth: "repository-docs",
    sourceDocs: sourceDocs.map(({ label, path }) => ({ label, path })),
    packageEntrypoints,
    commands,
    policy
  };
}

function createHtml(manifest) {
  const sourceList = manifest.sourceDocs
    .map(
      (doc) =>
        `<li><a href="${escapeHtml(linkToSourceDoc(doc.path))}">${escapeHtml(doc.label)}</a><span>${escapeHtml(doc.path)}</span></li>`
    )
    .join("\n");
  const packageList = manifest.packageEntrypoints
    .map((name) => `<li><code>${escapeHtml(name)}</code></li>`)
    .join("\n");
  const commandList = manifest.commands
    .map(
      (entry) =>
        `<li><span>${escapeHtml(entry.label)}</span><code>${escapeHtml(entry.command)}</code></li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Indirection Local Public Demo</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1d2433;
      --muted: #596273;
      --line: #d9dde5;
      --panel: #f7f8fa;
      --accent: #0b6b61;
      --warn: #8a4b00;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 16px/1.55 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: #ffffff;
    }
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 40px 0 56px;
    }
    header {
      border-bottom: 1px solid var(--line);
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    h1 {
      font-size: clamp(2rem, 4vw, 3.5rem);
      line-height: 1.05;
      margin: 0 0 12px;
    }
    h2 {
      font-size: 1.2rem;
      margin: 0 0 12px;
    }
    p {
      max-width: 76ch;
      margin: 0 0 16px;
      color: var(--muted);
    }
    section {
      border-bottom: 1px solid var(--line);
      padding: 24px 0;
    }
    .status {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
      margin: 20px 0 0;
      padding: 0;
      list-style: none;
    }
    .status li {
      border: 1px solid var(--line);
      background: var(--panel);
      padding: 12px;
      min-height: 76px;
    }
    .status strong {
      display: block;
      color: var(--accent);
      margin-bottom: 4px;
    }
    .warning strong {
      color: var(--warn);
    }
    .docs, .commands, .packages {
      display: grid;
      gap: 8px;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .docs li, .commands li, .packages li {
      display: grid;
      grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
      gap: 12px;
      align-items: start;
      border: 1px solid var(--line);
      padding: 10px 12px;
    }
    .docs span, .commands span {
      color: var(--muted);
    }
    code {
      white-space: normal;
      overflow-wrap: anywhere;
      font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
      font-size: 0.92em;
    }
    a {
      color: var(--accent);
      font-weight: 650;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
    @media (max-width: 700px) {
      .docs li, .commands li, .packages li {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Indirection Local Public Demo</h1>
      <p>A deterministic docs-site rehearsal for evaluating Indirection from this repository checkout. It assembles links, commands, package entrypoints, and policy boundaries from source docs without deploying or publishing anything.</p>
      <ul class="status">
        <li><strong>Local only</strong><span>No GitHub Pages, Vercel, Netlify, custom hosting, npm CDN, or hosted preview.</span></li>
        <li class="warning"><strong>No publish</strong><span>No real npm publish, registry write, Git tag, GitHub Release, signing, OIDC, or workflow write permission.</span></li>
        <li><strong>Source docs canonical</strong><span>This page is generated presentation. Repository docs remain the source of truth.</span></li>
      </ul>
    </header>
    <section>
      <h2>Evaluator Path</h2>
      <p>Start with the quickstart, inspect package boundaries, run example workflows, then use the release-candidate gates to confirm the no-publish posture.</p>
      <ul class="docs">
${sourceList}
      </ul>
    </section>
    <section>
      <h2>Commands</h2>
      <ul class="commands">
${commandList}
      </ul>
    </section>
    <section>
      <h2>Package Entrypoints</h2>
      <p>The rehearsal surfaces all workspace package entrypoints but does not make them public npm packages.</p>
      <ul class="packages">
${packageList}
      </ul>
    </section>
  </main>
</body>
</html>
`;
}

async function assertOutput(dir) {
  const html = await readFile(join(dir, "index.html"), "utf8");
  const manifest = JSON.parse(await readFile(join(dir, "demo-manifest.json"), "utf8"));

  for (const text of [
    "Indirection Local Public Demo",
    "No GitHub Pages",
    "Vercel",
    "Netlify",
    "custom hosting",
    "npm CDN",
    "No real npm publish",
    "corepack pnpm smoke:site-demo",
    "corepack pnpm validate:full",
    "docs/evaluator-quickstart.md",
    "docs/package-entrypoints.md",
    "docs/example-workflows.md"
  ]) {
    if (!html.includes(text)) {
      throw new Error(`generated index.html missing '${text}'`);
    }
  }

  if (
    manifest.generatedBy !== "scripts/public-demo-site.mjs" ||
    manifest.policy.deploy !== false ||
    manifest.policy.publish !== false ||
    manifest.policy.workflowWritePermissions !== false ||
    manifest.packageEntrypoints.length !== 9
  ) {
    throw new Error("generated demo-manifest.json policy or package evidence drifted");
  }
}

function linkToSourceDoc(path) {
  const fromOutput = relative(outputDir, resolve(repoRoot, path)).replaceAll("\\", "/");
  return fromOutput.startsWith(".") ? fromOutput : `./${fromOutput}`;
}

async function readUtf8(path) {
  return readFile(resolve(repoRoot, path), "utf8");
}

function parseArgs(argv) {
  const parsed = {
    smoke: false,
    out: undefined
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--smoke") {
      parsed.smoke = true;
      continue;
    }
    if (arg === "--out") {
      const value = argv[index + 1];
      if (value === undefined || value.length === 0) {
        throw new Error("--out requires a path");
      }
      parsed.out = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toPosix(path) {
  return path.replaceAll("\\", "/");
}
