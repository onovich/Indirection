import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { runIndirectionCli, cliPackageName } from "@indirection/cli";

const manifestPath = fileURLToPath(new URL(
  "../../../fixtures/vanilla/indirection.manifest.json",
  import.meta.url
));

async function run(argv: readonly string[]): Promise<{
  readonly code: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
}> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runIndirectionCli(argv, {
    stdout(text) {
      stdout.push(text);
    },
    stderr(text) {
      stderr.push(text);
    }
  });

  return { code, stdout, stderr };
}

describe("indirection cli", () => {
  it("exports the cli package name", () => {
    expect(cliPackageName).toBe("@indirection/cli");
  });

  it("validates an Indirection manifest", async () => {
    const result = await run(["validate", "--manifest", manifestPath]);

    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout[0] ?? "{}")).toMatchObject({
      ok: true,
      diagnostics: []
    });
  });

  it("builds, reports, and inspects catalog data", async () => {
    await expect(
      run(["build", "--manifest", manifestPath]).then((result) =>
        JSON.parse(result.stdout[0] ?? "{}")
      )
    ).resolves.toMatchObject({
      assets: {
        "vanilla:text.intro": {
          fallback: "vanilla:text.fallback"
        }
      }
    });

    await expect(
      run(["report", "--manifest", manifestPath]).then((result) =>
        JSON.parse(result.stdout[0] ?? "{}")
      )
    ).resolves.toMatchObject({
      summary: {
        assetCount: 3
      }
    });

    await expect(
      run([
        "inspect",
        "--manifest",
        manifestPath,
        "--asset",
        "vanilla:text.intro"
      ]).then((result) => JSON.parse(result.stdout[0] ?? "{}"))
    ).resolves.toMatchObject({
      type: "text/plain"
    });
  });

  it("returns actionable errors for unknown commands and missing assets", async () => {
    await expect(run(["unknown", "--manifest", manifestPath])).resolves.toEqual({
      code: 1,
      stdout: [],
      stderr: ["Unknown command: unknown"]
    });

    await expect(
      run([
        "inspect",
        "--manifest",
        manifestPath,
        "--asset",
        "vanilla:text.missing"
      ])
    ).resolves.toEqual({
      code: 1,
      stdout: [],
      stderr: ["Asset not found: vanilla:text.missing"]
    });
  });
});
