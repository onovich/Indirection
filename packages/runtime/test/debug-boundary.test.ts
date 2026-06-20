import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager } from "@indirection/runtime";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const hero = normalizeAssetId("game:character.hero");

describe("debug snapshot leak warnings", () => {
  it("reports live handles and clears warnings after release", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-debug",
      assets: {
        [hero]: {
          type: "text/plain",
          sources: [{ url: "hero.txt" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      transport: new InMemoryTransport({
        "hero.txt": "hero"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire(hero);

    expect(manager.snapshot().leakWarnings).toEqual([
      {
        assetId: "game:character.hero",
        state: "ready",
        refCount: 1
      }
    ]);

    handle.release();
    expect(manager.snapshot().leakWarnings).toEqual([]);
  });
});

describe("runtime package boundary", () => {
  it("depends only on protocol at runtime", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8")) as {
      readonly dependencies?: Readonly<Record<string, string>>;
    };

    expect(packageJson.dependencies).toEqual({
      "@indirection/protocol": "workspace:*"
    });
  });
});
