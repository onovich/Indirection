import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager } from "@indirection/runtime";
import { createThreeGltfLoader, threePackageName } from "@indirection/three";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const sourceUrl = new URL("../src/index.ts", import.meta.url);
const hero = normalizeAssetId("three:hero");

describe("three adapter skeleton", () => {
  it("declares Three as an optional peer boundary", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8")) as {
      readonly peerDependencies?: Readonly<Record<string, string>>;
      readonly peerDependenciesMeta?: Readonly<Record<string, { readonly optional?: boolean }>>;
    };
    const source = readFileSync(sourceUrl, "utf8");

    expect(threePackageName).toBe("@indirection/three");
    expect(packageJson.peerDependencies?.["three"]).toBeDefined();
    expect(packageJson.peerDependenciesMeta?.["three"]?.optional).toBe(true);
    expect(source).not.toContain("from \"three\"");
    expect(source).not.toContain("from 'three'");
  });

  it("loads fake GLTF payloads through injected transport", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-three",
      assets: {
        [hero]: {
          type: "model/gltf",
          sources: [{ url: "hero.glb" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      loaders: [createThreeGltfLoader()],
      transport: new InMemoryTransport({
        "hero.glb": new Uint8Array([1, 2, 3])
      })
    });
    const scope = manager.createScope("three");

    await expect(scope.acquire(hero).then((handle) => handle.value)).resolves.toEqual({
      assetId: "three:hero",
      sourceUrl: "hero.glb",
      bytes: new Uint8Array([1, 2, 3])
    });
  });
});
