import { readFile } from "node:fs/promises";
import {
  compileNormalizedModel,
  importIndirectionManifest
} from "@indirection/compiler";

export const cliPackageName = "@indirection/cli";

export interface CliIo {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

export async function runIndirectionCli(
  argv: readonly string[],
  io: CliIo
): Promise<number> {
  const [command, ...args] = argv;
  const manifestPath = readOption(args, "--manifest");

  if (command === undefined || manifestPath === undefined) {
    io.stderr("Usage: indirection <validate|build|report|inspect> --manifest <path>");
    return 1;
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  const model = importIndirectionManifest(manifest);
  const result = compileNormalizedModel(model);

  if (command === "validate") {
    io.stdout(
      JSON.stringify(
        {
          ok: result.diagnostics.length === 0,
          diagnostics: result.diagnostics
        },
        null,
        2
      )
    );
    return result.diagnostics.length === 0 ? 0 : 1;
  }

  if (command === "build") {
    io.stdout(JSON.stringify(result.catalog, null, 2));
    return 0;
  }

  if (command === "report") {
    io.stdout(JSON.stringify(result.report, null, 2));
    return 0;
  }

  if (command === "inspect") {
    const assetId = readOption(args, "--asset");
    if (assetId === undefined) {
      io.stderr("Usage: indirection inspect --manifest <path> --asset <assetId>");
      return 1;
    }

    const asset = result.catalog.assets[assetId];
    if (asset === undefined) {
      io.stderr(`Asset not found: ${assetId}`);
      return 1;
    }

    io.stdout(JSON.stringify(asset, null, 2));
    return 0;
  }

  io.stderr(`Unknown command: ${command}`);
  return 1;
}

function readOption(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}
