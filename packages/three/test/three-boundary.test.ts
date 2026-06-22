import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager } from "@indirection/runtime";
import {
  createThreeGltfLoader,
  threePackageName,
  type ThreeGltfParseInput
} from "@indirection/three";

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

    const handle = await scope.acquire<ThreeGltfParseInput>(hero);

    expect(handle.value.assetId).toBe("three:hero");
    expect(handle.value.sourceUrl).toBe("hero.glb");
    expect(handle.value.basePath).toBe("");
    expect(Array.from(handle.value.bytes)).toEqual([1, 2, 3]);
    expect(handle.value.arrayBuffer.byteLength).toBe(3);
    expect(handle.value.source.sourceIndex).toBe(0);
  });

  it("passes transport bytes and source context to injected parsers", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-three-parse",
      assets: {
        [hero]: {
          type: "model/gltf",
          sources: [{ url: "models/hero.gltf" }]
        }
      }
    };
    const seenInputs: ThreeGltfParseInput[] = [];
    const manager = createAssetManager({
      catalog,
      loaders: [
        createThreeGltfLoader({
          parse(input) {
            seenInputs.push(input);
            return {
              parsed: true,
              basePath: input.basePath,
              sourceUrl: input.sourceUrl,
              byteLength: input.arrayBuffer.byteLength
            };
          }
        })
      ],
      transport: new InMemoryTransport({
        "models/hero.gltf": "{\"asset\":{\"version\":\"2.0\"}}"
      })
    });
    const scope = manager.createScope("three");

    await expect(scope.acquire(hero).then((handle) => handle.value)).resolves.toEqual({
      parsed: true,
      basePath: "models/",
      sourceUrl: "models/hero.gltf",
      byteLength: 27
    });
    expect(seenInputs).toHaveLength(1);
    expect(seenInputs[0]?.assetId).toBe("three:hero");
    expect(seenInputs[0]?.source.sourceIndex).toBe(0);
    expect(new TextDecoder().decode(seenInputs[0]?.bytes)).toBe(
      "{\"asset\":{\"version\":\"2.0\"}}"
    );
  });
});
