import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const hostSpecificPattern =
  /\b(?:sinan|Gate Demo|CameraShot|Timeline|ThreeRuntime)\b/i;

const sourceRules = [
  {
    root: "packages/protocol/src",
    rules: [
      {
        name: "protocol must not import project packages",
        pattern: /from\s+["']@indirection\/|import\s*\([^)]*["']@indirection\//
      },
      {
        name: "protocol must stay platform and tool neutral",
        pattern: /\b(?:zod|three|vite|react|window|document|fetch)\b|node:/
      }
    ]
  },
  {
    root: "packages/schema/src",
    rules: [
      {
        name: "schema must not depend on runtime or advanced adapters",
        pattern:
          /@indirection\/(?:compiler|runtime|testkit|loaders-web|three|vite|cli)\b/
      },
      {
        name: "schema must stay out of runtime and browser APIs",
        pattern: /\b(?:three|vite|react|window|document|fetch)\b|node:/
      }
    ]
  },
  {
    root: "packages/compiler/src",
    rules: [
      {
        name: "compiler must not depend on runtime or advanced adapters",
        pattern: /@indirection\/(?:runtime|testkit|loaders-web|three|vite|cli)\b/
      },
      {
        name: "compiler must stay out of runtime and browser APIs",
        pattern: /\b(?:three|vite|react|window|document|fetch)\b/
      }
    ]
  },
  {
    root: "packages/runtime/src",
    rules: [
      {
        name: "runtime core must not depend on schema/compiler/testkit/adapters",
        pattern:
          /@indirection\/(?:schema|compiler|testkit|loaders-web|three|vite|cli)\b/
      },
      {
        name: "runtime core must stay platform and tool neutral",
        pattern: /\b(?:zod|three|vite|react|window|document|fetch)\b|node:/
      }
    ]
  }
];

const issues = [];

for (const sourceRule of sourceRules) {
  const files = await listSourceFiles(join(repoRoot, sourceRule.root));
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const lines = text.split(/\r?\n/);

    checkLines(file, lines, [
      ...sourceRule.rules,
      {
        name: "core API must not expose host-specific entities",
        pattern: hostSpecificPattern
      }
    ]);
  }
}

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(
      `${relativePath(issue.file)}:${issue.line}: ${issue.rule}: ${issue.text}`
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    "core-boundary-check passed: core packages are free of host and advanced adapter coupling"
  );
}

async function listSourceFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(path)));
    } else if (entry.isFile() && path.endsWith(".ts")) {
      files.push(path);
    }
  }

  return files.sort();
}

function checkLines(file, lines, rules) {
  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        issues.push({
          file,
          line: index + 1,
          rule: rule.name,
          text: line.trim()
        });
      }
    }
  });
}

function relativePath(path) {
  return path.slice(repoRoot.length + 1).replaceAll("\\", "/");
}
