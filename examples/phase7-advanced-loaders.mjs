import {
  compileNormalizedModel,
  importIndirectionManifest
} from "@indirection/compiler";
import {
  createAssetManager,
  InMemoryTransport
} from "@indirection/runtime";
import {
  createWebDataLoaders,
  MemoryCacheStorageAdapter
} from "@indirection/loaders-web";
import { createThreeGltfLoader } from "@indirection/three";
import {
  createIndirectionVitePlugin,
  virtualCatalogModuleId
} from "@indirection/vite";

const manifest = {
  schemaVersion: 1,
  namespace: "phase7",
  assets: {
    "copy.intro": {
      type: "text/plain",
      sources: [
        {
          url: "copy/intro.en.txt",
          when: { locale: ["en", "en-US"] }
        },
        {
          url: "copy/intro.txt"
        }
      ]
    },
    "model.hero": {
      type: "model/gltf",
      dependencies: ["copy.intro"],
      sources: [
        {
          url: "models/hero.gltf",
          when: { quality: ["high"], platform: ["desktop"] }
        },
        {
          url: "models/hero-lite.gltf"
        }
      ],
      metadata: {
        example: "phase-7"
      }
    }
  }
};

const model = importIndirectionManifest(manifest);
const result = compileNormalizedModel(model);
const transport = new InMemoryTransport({
  "copy/intro.en.txt": "Phase 7 loader path",
  "copy/intro.txt": "Default loader path",
  "models/hero.gltf": new Uint8Array([103, 108, 84, 70, 45, 104, 105, 103, 104]),
  "models/hero-lite.gltf": new Uint8Array([103, 108, 84, 70, 45, 108, 105, 116, 101])
});

const manager = createAssetManager({
  catalog: result.catalog,
  context: {
    quality: "high",
    locale: "en-US",
    platform: "desktop"
  },
  transport,
  loaders: [
    ...createWebDataLoaders(),
    createThreeGltfLoader({
      parse(payload) {
        return {
          assetId: payload.assetId,
          byteLength: payload.bytes.byteLength,
          sourceUrl: payload.sourceUrl
        };
      }
    })
  ]
});

const scope = manager.createScope("phase-7-example");
const intro = await scope.acquire("phase7:copy.intro");
const modelHandle = await scope.acquire("phase7:model.hero");

const cache = new MemoryCacheStorageAdapter();
await cache.put(
  {
    catalogVersion: result.catalog.catalogVersion,
    sourceUrl: "models/hero.gltf"
  },
  "cached gltf placeholder"
);

const vitePlugin = createIndirectionVitePlugin({ model });
const resolvedVirtualModule = vitePlugin.resolveId(virtualCatalogModuleId);
const virtualModule = vitePlugin.load(resolvedVirtualModule);

const summary = {
  catalogVersion: result.catalog.catalogVersion,
  assetIds: Object.keys(result.catalog.assets).sort(),
  intro: intro.value,
  model: modelHandle.value,
  cacheKeys: await cache.keys(result.catalog.catalogVersion),
  viteVirtualModuleReady: virtualModule?.includes("phase7:model.hero") === true,
  resourceStates: manager.snapshot().resources.map((resource) => ({
    assetId: resource.assetId,
    state: resource.state,
    refCount: resource.refCount
  }))
};

modelHandle.release();
intro.release();
await scope.dispose();

console.log(JSON.stringify(summary, null, 2));
