import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  type AssetLoader,
  InMemoryTransport,
  createAssetManager
} from "@indirection/runtime";

const hero = normalizeAssetId("game:character.hero");
const material = normalizeAssetId("game:material.hero");
const fallback = normalizeAssetId("system:placeholder.text");
const disposableFallback = normalizeAssetId("system:placeholder.disposable");

describe("dependency retain/release", () => {
  it("retains dependencies while the parent handle is live", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-dependencies",
      assets: {
        [hero]: {
          type: "text/plain",
          sources: [{ url: "hero.txt" }],
          dependencies: [material]
        },
        [material]: {
          type: "text/plain",
          sources: [{ url: "material.txt" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      transport: new InMemoryTransport({
        "hero.txt": "hero",
        "material.txt": "material"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire(hero);

    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      dependencyRefs: ["game:material.hero"],
      refCount: 1
    });
    expect(manager.resourceTable.snapshot(material)[0]).toMatchObject({
      refCount: 1
    });

    await handle.release();

    expect(manager.resourceTable.snapshot(material)[0]).toMatchObject({
      refCount: 0
    });
  });
});

describe("fallback cause retention", () => {
  it("loads a deterministic fallback and preserves the original cause code", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-fallback",
      assets: {
        [hero]: {
          type: "text/plain",
          sources: [{ url: "missing-hero.txt" }],
          fallback
        },
        [fallback]: {
          type: "text/plain",
          sources: [{ url: "fallback.txt" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      transport: new InMemoryTransport({
        "fallback.txt": "placeholder"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire(hero);

    expect(handle.value).toBe("placeholder");
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "fallback-ready",
      causeCode: "IND_DECODE_FAILED",
      fallbackAssetId: "system:placeholder.text"
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

  it("does not call a disposer when loader acquisition fails before value creation", async () => {
    const disposeCalls: string[] = [];
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-loader-failure",
      assets: {
        [hero]: {
          type: "test/failing",
          sources: [{ url: "broken.txt" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      loaders: [createFailingLoader(disposeCalls)],
      transport: new InMemoryTransport({
        "broken.txt": "broken"
      })
    });
    const scope = manager.createScope("scene");

    await expect(scope.acquire(hero)).rejects.toThrow("decode failed");

    expect(disposeCalls).toEqual([]);
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "failed",
      refCount: 0,
      hasDisposer: false,
      causeCode: "IND_DECODE_FAILED"
    });
  });

  it("disposes the successful fallback value instead of the failed primary", async () => {
    const disposeCalls: string[] = [];
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-fallback-disposer",
      assets: {
        [hero]: {
          type: "test/failing",
          sources: [{ url: "broken.txt" }],
          fallback: disposableFallback
        },
        [disposableFallback]: {
          type: "test/disposable",
          sources: [{ url: "fallback.txt" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      loaders: [createFailingLoader(disposeCalls), createDisposableLoader(disposeCalls)],
      transport: new InMemoryTransport({
        "broken.txt": "broken",
        "fallback.txt": "fallback"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire<{ readonly text: string }>(hero);

    expect(handle.value.text).toBe("fallback");
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "fallback-ready",
      refCount: 1,
      hasDisposer: false,
      causeCode: "IND_DECODE_FAILED",
      fallbackAssetId: "system:placeholder.disposable"
    });
    expect(manager.resourceTable.snapshot(disposableFallback)[0]).toMatchObject({
      state: "ready",
      refCount: 1,
      hasDisposer: true
    });

    await handle.release();

    expect(disposeCalls).toEqual(["fallback"]);
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "released",
      refCount: 0,
      hasValue: false,
      hasDisposer: false,
      fallbackAssetId: "system:placeholder.disposable"
    });
    expect(manager.resourceTable.snapshot(disposableFallback)[0]).toMatchObject({
      state: "disposed",
      refCount: 0,
      hasValue: false,
      hasDisposer: false
    });
  });

  it("records disposer failures with a structured cause code", async () => {
    const disposeCalls: string[] = [];
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-disposer-failure",
      assets: {
        [hero]: {
          type: "test/disposable",
          sources: [{ url: "hero.txt" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      loaders: [createDisposableLoader(disposeCalls, { failDispose: true })],
      transport: new InMemoryTransport({
        "hero.txt": "hero"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire(hero);

    await expect(handle.release()).rejects.toThrow("dispose failed");
    await expect(handle.release()).rejects.toThrow("dispose failed");

    expect(disposeCalls).toEqual(["hero"]);
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "released",
      refCount: 0,
      hasValue: true,
      hasDisposer: true,
      causeCode: "IND_DISPOSE_FAILED"
    });
  });
});

function createFailingLoader(disposeCalls: string[]): AssetLoader<never> {
  void disposeCalls;
  return {
    id: "test-failing",
    types: ["test/failing"],
    async load() {
      throw new Error("decode failed");
    }
  };
}

interface DisposableLoaderOptions {
  readonly failDispose?: boolean;
}

function createDisposableLoader(
  disposeCalls: string[],
  options: DisposableLoaderOptions = {}
): AssetLoader<{ readonly text: string }> {
  return {
    id: "test-disposable",
    types: ["test/disposable"],
    async load(context) {
      const response = await context.transport.read({
        assetId: context.assetId,
        source: context.source,
        ...(context.signal === undefined ? {} : { signal: context.signal })
      });
      const text = String(response.body);

      return {
        value: { text },
        dispose() {
          disposeCalls.push(text);
          if (options.failDispose === true) {
            throw new Error("dispose failed");
          }
        }
      };
    }
  };
}
