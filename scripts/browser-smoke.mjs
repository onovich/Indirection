import { InMemoryTransport } from "@indirection/runtime";
import {
  createWebDataLoaders,
  MemoryCacheStorageAdapter
} from "@indirection/loaders-web";

const loaders = createWebDataLoaders();
const textLoader = loaders.find((loader) => loader.types.includes("text/plain"));

if (textLoader === undefined) {
  throw new Error("text/plain web loader is not registered");
}

const loaded = await textLoader.load({
  assetId: "browser:text.intro",
  source: {
    assetId: "browser:text.intro",
    type: "text/plain",
    catalogVersion: "browser-smoke",
    sourceIndex: 0,
    source: {
      url: "intro.txt"
    }
  },
  transport: new InMemoryTransport({
    "intro.txt": "browser-facing loader smoke"
  })
});

const cache = new MemoryCacheStorageAdapter();
await cache.put(
  {
    catalogVersion: "browser-smoke",
    sourceUrl: "intro.txt"
  },
  loaded.value
);

const result = {
  name: "indirection-browser-smoke",
  status: "passed",
  loaderCount: loaders.length,
  textValue: loaded.value,
  cacheHit:
    (await cache.match({
      catalogVersion: "browser-smoke",
      sourceUrl: "intro.txt"
    })) === loaded.value
};

console.log(JSON.stringify(result, null, 2));
