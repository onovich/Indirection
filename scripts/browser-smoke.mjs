import { InMemoryTransport } from "@indirection/runtime";
import {
  createImageBitmapLoader,
  createWebDataLoaders,
  MemoryCacheStorageAdapter
} from "@indirection/loaders-web";

const imageClosures = [];
const imageLoader = createImageBitmapLoader({
  decode(input) {
    return {
      width: 1,
      height: 1,
      close() {
        imageClosures.push(input.sourceUrl);
      }
    };
  }
});
const loaders = [...createWebDataLoaders(), imageLoader];
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

const imageLoaded = await imageLoader.load({
  assetId: "browser:image.pixel",
  source: {
    assetId: "browser:image.pixel",
    type: "image/bitmap",
    catalogVersion: "browser-smoke",
    sourceIndex: 0,
    source: {
      url: "pixel.png"
    }
  },
  transport: new InMemoryTransport({
    "pixel.png": new Uint8Array([137, 80, 78, 71])
  })
});
await imageLoaded.dispose?.();
await imageLoaded.dispose?.();

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
  imageBitmap: {
    closeCount: imageClosures.length,
    closedSourceUrl: imageClosures[0],
    contentType: imageLoaded.value.contentType,
    dimensions: [imageLoaded.value.width, imageLoaded.value.height],
    sourceUrl: imageLoaded.value.sourceUrl
  },
  cacheHit:
    (await cache.match({
      catalogVersion: "browser-smoke",
      sourceUrl: "intro.txt"
    })) === loaded.value
};

console.log(JSON.stringify(result, null, 2));
