import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager, type AssetLoader } from "@indirection/runtime";
import {
  createThreeGltfLoader,
  createThreeOwnedResourceDisposer,
  createThreeTextureFromImageBitmap,
  extractThreeAnimationMetadata,
  instantiateThreeGltf,
  threePackageName,
  type ThreeGltfParseInput,
  type ThreeTextureResource
} from "@indirection/three";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const sourceUrl = new URL("../src/index.ts", import.meta.url);
const hero = normalizeAssetId("three:hero");
const fallback = normalizeAssetId("three:fallback");

type ParsedGltf = Awaited<ReturnType<InstanceType<typeof GLTFLoader>["parseAsync"]>>;

describe("three adapter", () => {
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

  it("creates idempotent owned resource disposers", async () => {
    const calls: string[] = [];
    const geometry = createDisposableResource("geometry", calls);
    const material = createDisposableResource("material", calls);
    const dispose = createThreeOwnedResourceDisposer([geometry, material, geometry]);

    expect(createThreeOwnedResourceDisposer([])).toBeUndefined();
    expect(dispose).toBeDefined();

    await dispose?.();
    await dispose?.();

    expect(calls).toEqual(["geometry", "material"]);
  });

  it("creates host-injected texture resources without importing Three constructors", async () => {
    const calls: string[] = [];
    const image = { tag: "image-bitmap-like" };
    const texture = createDisposableResource("texture", calls);
    const material = createDisposableResource("material", calls);
    const geometry = createDisposableResource("geometry", calls);

    const resource = createThreeTextureFromImageBitmap({
      image,
      width: 1,
      height: 1,
      assetId: "three:image.pixel",
      sourceUrl: "textures/pixel.png",
      createTexture(input) {
        expect(input).toEqual({
          image,
          width: 1,
          height: 1,
          assetId: "three:image.pixel",
          sourceUrl: "textures/pixel.png"
        });
        return texture;
      },
      ownedResources(createdTexture, input) {
        expect(createdTexture).toBe(texture);
        expect(input.image).toBe(image);
        return [material, geometry, material];
      }
    });

    expect(resource).toMatchObject({
      texture,
      width: 1,
      height: 1,
      assetId: "three:image.pixel",
      sourceUrl: "textures/pixel.png"
    });

    await resource.dispose();
    await resource.dispose();

    expect(calls).toEqual(["texture", "material", "geometry"]);
  });

  it("rejects invalid texture dimensions before calling the host factory", () => {
    expect(() =>
      createThreeTextureFromImageBitmap({
        image: {},
        width: 0,
        height: 1,
        createTexture() {
          throw new Error("unexpected factory call");
        }
      })
    ).toThrow("Three texture width must be a positive finite number");
  });

  it("uses a host injected instantiate hook without mutating the loaded value", async () => {
    const loadedValue = {
      sceneName: "Hero",
      cloneCount: 0
    };
    const instance = await instantiateThreeGltf(
      loadedValue,
      async ({ value, assetId, sourceUrl, basePath }) => {
        expect(assetId).toBe("three:hero");
        expect(sourceUrl).toBe("models/hero.gltf");
        expect(basePath).toBe("models/");
        return {
          instanceName: `${value.sceneName}-instance`,
          templateCloneCount: value.cloneCount
        };
      },
      {
        assetId: "three:hero",
        sourceUrl: "models/hero.gltf",
        basePath: "models/"
      }
    );

    expect(instance).toEqual({
      instanceName: "Hero-instance",
      templateCloneCount: 0
    });
    expect(loadedValue.cloneCount).toBe(0);
  });

  it("extracts empty animation metadata without changing the source", () => {
    const source = {};

    expect(extractThreeAnimationMetadata(source)).toEqual([]);
    expect(source).toEqual({});
  });

  it("extracts named animation metadata as a read-only summary", () => {
    const clips = [
      {
        name: "Idle",
        duration: 1.25,
        tracks: [{ name: "hip.position" }, { name: "arm.rotation" }]
      },
      {
        name: "Run",
        duration: 0.75,
        tracks: []
      }
    ];
    const source = { animations: clips };

    expect(extractThreeAnimationMetadata(source)).toEqual([
      {
        index: 0,
        name: "Idle",
        durationSeconds: 1.25,
        trackCount: 2
      },
      {
        index: 1,
        name: "Run",
        durationSeconds: 0.75,
        trackCount: 0
      }
    ]);
    expect(source.animations).toBe(clips);
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

  it("disposes explicitly owned resources after the final handle release", async () => {
    const calls: string[] = [];
    const geometry = createDisposableResource("geometry", calls);
    const material = createDisposableResource("material", calls);
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-three-dispose",
      assets: {
        [hero]: {
          type: "model/gltf",
          sources: [{ url: "models/owned.gltf" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      loaders: [
        createThreeGltfLoader({
          parse(input) {
            return {
              parsed: true,
              sourceUrl: input.sourceUrl
            };
          },
          ownedResources(value, input) {
            expect(value).toMatchObject({
              parsed: true,
              sourceUrl: "models/owned.gltf"
            });
            expect(input.assetId).toBe("three:hero");
            return [geometry, material, geometry];
          }
        })
      ],
      transport: new InMemoryTransport({
        "models/owned.gltf": "{\"asset\":{\"version\":\"2.0\"}}"
      })
    });
    const scope = manager.createScope("three");
    const handle = await scope.acquire<{ readonly parsed: boolean; readonly sourceUrl: string }>(
      hero
    );

    expect(handle.value.parsed).toBe(true);
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      refCount: 1,
      state: "ready",
      hasDisposer: true
    });

    await handle.release();

    expect(calls).toEqual(["geometry", "material"]);
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      refCount: 0,
      state: "disposed",
      hasValue: false,
      hasDisposer: false
    });
  });

  it("lets runtime scopes dispose host-owned texture resources after final release", async () => {
    const calls: string[] = [];
    const textureAssetId = normalizeAssetId("three:texture.pixel");
    const textureLoader: AssetLoader<ThreeTextureResource> = {
      id: "three-texture-resource-test",
      types: ["renderer/three-texture"],
      async load(context) {
        await context.transport.read(context);
        const texture = createDisposableResource("texture", calls);
        const material = createDisposableResource("material", calls);
        const geometry = createDisposableResource("geometry", calls);
        const resource = createThreeTextureFromImageBitmap({
          image: { label: "image-bitmap-like" },
          width: 1,
          height: 1,
          assetId: context.assetId,
          sourceUrl: context.source.source.url,
          createTexture() {
            return texture;
          },
          ownedResources() {
            return [material, geometry];
          }
        });

        return {
          value: resource,
          dispose: resource.dispose
        };
      }
    };
    const manager = createAssetManager({
      catalog: {
        protocolVersion,
        catalogVersion: "sha256-three-texture",
        assets: {
          [textureAssetId]: {
            type: "renderer/three-texture",
            sources: [{ url: "textures/pixel.png" }]
          }
        }
      },
      loaders: [textureLoader],
      transport: new InMemoryTransport({
        "textures/pixel.png": new Uint8Array([255, 0, 0, 255])
      })
    });
    const scope = manager.createScope("three-texture-scope");

    const handle = await scope.acquire<ThreeTextureResource>(textureAssetId);

    expect(handle.value.width).toBe(1);
    expect(handle.value.height).toBe(1);
    expect(manager.resourceTable.snapshot(textureAssetId)[0]).toMatchObject({
      refCount: 1,
      state: "ready",
      hasDisposer: true
    });

    await scope.dispose();
    await scope.dispose();

    expect(handle.released).toBe(true);
    expect(calls).toEqual(["texture", "material", "geometry"]);
    expect(manager.resourceTable.snapshot(textureAssetId)[0]).toMatchObject({
      refCount: 0,
      state: "disposed",
      hasValue: false,
      hasDisposer: false
    });
  });

  it("leaves shared resources to the host ownership policy", async () => {
    const calls: string[] = [];
    const owned = createDisposableResource("owned", calls);
    const shared = createDisposableResource("shared", calls);
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-three-shared-resource",
      assets: {
        [hero]: {
          type: "model/gltf",
          sources: [{ url: "models/shared.gltf" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      loaders: [
        createThreeGltfLoader({
          parse() {
            return {
              parsed: true,
              shared
            };
          },
          ownedResources() {
            return [owned];
          }
        })
      ],
      transport: new InMemoryTransport({
        "models/shared.gltf": "{\"asset\":{\"version\":\"2.0\"}}"
      })
    });
    const scope = manager.createScope("three");
    const handle = await scope.acquire(hero);

    await handle.release();

    expect(calls).toEqual(["owned"]);
  });

  it("parses minimal glTF through an injected GLTFLoader parser", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-three-real-gltf",
      assets: {
        [hero]: {
          type: "model/gltf",
          sources: [{ url: "models/hero.gltf" }]
        }
      }
    };
    const seenBasePaths: string[] = [];
    const manager = createAssetManager({
      catalog,
      loaders: [createThreeGltfLoader<ParsedGltf>({ parser: createGltfParser(seenBasePaths) })],
      transport: new InMemoryTransport({
        "models/hero.gltf": minimalGltfJson()
      })
    });
    const scope = manager.createScope("three");
    const handle = await scope.acquire<ParsedGltf>(hero);

    expect(handle.value.asset.version).toBe("2.0");
    expect(handle.value.scenes).toHaveLength(1);
    expect(handle.value.scene.type).toBe("Group");
    expect(seenBasePaths).toEqual(["models/"]);
  });

  it("falls back with IND_DECODE_FAILED when GLTFLoader rejects invalid glTF", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-three-real-gltf-fallback",
      assets: {
        [hero]: {
          type: "model/gltf",
          sources: [{ url: "models/broken.gltf" }],
          fallback
        },
        [fallback]: {
          type: "model/gltf",
          sources: [{ url: "models/fallback.gltf" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      loaders: [createThreeGltfLoader<ParsedGltf>({ parser: createGltfParser() })],
      transport: new InMemoryTransport({
        "models/broken.gltf": "not gltf",
        "models/fallback.gltf": minimalGltfJson()
      })
    });
    const scope = manager.createScope("three");
    const handle = await scope.acquire<ParsedGltf>(hero);

    expect(handle.value.asset.version).toBe("2.0");
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "fallback-ready",
      causeCode: "IND_DECODE_FAILED",
      fallbackAssetId: "three:fallback"
    });
    expect(manager.resourceTable.snapshot(fallback)[0]).toMatchObject({
      refCount: 1,
      state: "ready"
    });

    await handle.release();
    expect(manager.resourceTable.snapshot(fallback)[0]).toMatchObject({
      refCount: 0
    });
  });
});

function createGltfParser(seenBasePaths: string[] = []) {
  const parser = new GLTFLoader();

  return {
    async parseAsync(input: ArrayBuffer, basePath: string): Promise<ParsedGltf> {
      seenBasePaths.push(basePath);
      return parser.parseAsync(input, basePath);
    }
  };
}

function createDisposableResource(name: string, calls: string[]) {
  return {
    dispose() {
      calls.push(name);
    }
  };
}

function minimalGltfJson(): string {
  return JSON.stringify({
    asset: { version: "2.0" },
    scenes: [{}],
    scene: 0
  });
}
