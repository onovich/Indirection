import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  type AssetLoader,
  AssetResolutionError,
  AssetScopeDisposedError,
  InMemoryTransport,
  createAssetManager
} from "@indirection/runtime";

const hero = normalizeAssetId("game:character.hero");
const tree = normalizeAssetId("game:prop.tree");
const disposable = normalizeAssetId("game:prop.disposable");

const catalog: CompiledCatalog = {
  protocolVersion,
  catalogVersion: "sha256-scope",
  assets: {
    [hero]: {
      type: "model/gltf",
      sources: [{ url: "models/hero.glb" }]
    },
    [tree]: {
      type: "model/gltf",
      sources: [{ url: "models/tree.glb" }]
    },
    [disposable]: {
      type: "test/disposable",
      sources: [{ url: "disposable.txt" }]
    }
  }
};

describe("AssetScope and AssetHandle", () => {
  it("acquires a source handle and releases it idempotently", async () => {
    const manager = createAssetManager({ catalog });
    const scope = manager.createScope("scene.gate");
    const handle = await scope.acquire(hero);

    expect(handle.value.source.url).toBe("models/hero.glb");
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "ready",
      refCount: 1
    });

    await handle.release();
    await handle.release();

    expect(handle.released).toBe(true);
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "released",
      refCount: 0
    });
    expect(scope.snapshot()).toMatchObject({
      handleCount: 0,
      disposed: false
    });
  });

  it("disposes every live handle once", async () => {
    const manager = createAssetManager({ catalog });
    const scope = manager.createScope("scene.gate");

    await scope.acquire(hero);
    await scope.acquire(tree);

    expect(scope.snapshot().assetIds).toEqual([
      "game:character.hero",
      "game:prop.tree"
    ]);

    await scope.dispose();
    await scope.dispose();

    expect(scope.snapshot()).toEqual({
      id: "scene.gate",
      disposed: true,
      handleCount: 0,
      assetIds: []
    });
    expect(manager.snapshot().resources).toEqual([
      expect.objectContaining({
        assetId: "game:character.hero",
        refCount: 0,
        state: "released"
      }),
      expect.objectContaining({
        assetId: "game:prop.tree",
        refCount: 0,
        state: "released"
      })
    ]);
  });

  it("calls a loaded asset disposer once after the final handle release", async () => {
    const disposeCalls: string[] = [];
    const manager = createAssetManager({
      catalog,
      loaders: [createDisposableLoader(disposeCalls)],
      transport: new InMemoryTransport({
        "disposable.txt": "owned"
      })
    });
    const scope = manager.createScope("scene.gate");
    const handle = await scope.acquire<{ readonly text: string }>(disposable);

    expect(handle.value.text).toBe("owned");
    expect(manager.resourceTable.snapshot(disposable)[0]).toMatchObject({
      state: "ready",
      refCount: 1,
      hasValue: true,
      hasDisposer: true
    });

    await handle.release();
    await handle.release();

    expect(disposeCalls).toEqual(["owned"]);
    expect(manager.resourceTable.snapshot(disposable)[0]).toMatchObject({
      state: "disposed",
      refCount: 0,
      hasValue: false,
      hasDisposer: false
    });
  });

  it("shares a live loaded value and disposes it after the final shared release", async () => {
    const disposeCalls: string[] = [];
    const loadCalls: string[] = [];
    const manager = createAssetManager({
      catalog,
      loaders: [createDisposableLoader(disposeCalls, { loadCalls })],
      transport: new InMemoryTransport({
        "disposable.txt": "owned"
      })
    });
    const scope = manager.createScope("scene.gate");
    const first = await scope.acquire<{ readonly text: string }>(disposable);
    const second = await scope.acquire<{ readonly text: string }>(disposable);

    expect(first.value).toBe(second.value);
    expect(loadCalls).toEqual(["disposable.txt"]);
    expect(manager.resourceTable.snapshot(disposable)[0]).toMatchObject({
      state: "ready",
      refCount: 2,
      hasDisposer: true
    });

    await first.release();
    expect(disposeCalls).toEqual([]);
    expect(manager.resourceTable.snapshot(disposable)[0]).toMatchObject({
      state: "ready",
      refCount: 1
    });

    await second.release();
    expect(disposeCalls).toEqual(["owned"]);
    expect(manager.resourceTable.snapshot(disposable)[0]).toMatchObject({
      state: "disposed",
      refCount: 0
    });
  });

  it("deduplicates in-flight loads and disposes the shared value once", async () => {
    const disposeCalls: string[] = [];
    const loadCalls: string[] = [];
    let resolveLoad!: () => void;
    let markStarted!: () => void;
    const loadGate = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    const loadStarted = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const manager = createAssetManager({
      catalog,
      loaders: [
        createDisposableLoader(disposeCalls, {
          beforeRead: () => loadGate,
          loadCalls,
          onLoadStart: markStarted
        })
      ],
      transport: new InMemoryTransport({
        "disposable.txt": "owned"
      })
    });
    const scope = manager.createScope("scene.gate");
    const firstAcquire = scope.acquire<{ readonly text: string }>(disposable);
    const secondAcquire = scope.acquire<{ readonly text: string }>(disposable);

    await loadStarted;
    expect(loadCalls).toEqual(["disposable.txt"]);
    resolveLoad();
    const [first, second] = await Promise.all([firstAcquire, secondAcquire]);

    expect(first.value).toBe(second.value);
    expect(manager.resourceTable.snapshot(disposable)[0]).toMatchObject({
      state: "ready",
      refCount: 2,
      hasDisposer: true
    });

    await Promise.all([first.release(), second.release()]);

    expect(disposeCalls).toEqual(["owned"]);
    expect(manager.resourceTable.snapshot(disposable)[0]).toMatchObject({
      state: "disposed",
      refCount: 0
    });
  });

  it("scope.dispose releases shared handles and calls their disposer once", async () => {
    const disposeCalls: string[] = [];
    const manager = createAssetManager({
      catalog,
      loaders: [createDisposableLoader(disposeCalls)],
      transport: new InMemoryTransport({
        "disposable.txt": "owned"
      })
    });
    const scope = manager.createScope("scene.gate");
    const first = await scope.acquire(disposable);
    const second = await scope.acquire(disposable);

    await scope.dispose();

    expect(first.released).toBe(true);
    expect(second.released).toBe(true);
    expect(disposeCalls).toEqual(["owned"]);
    expect(scope.snapshot()).toMatchObject({
      disposed: true,
      handleCount: 0
    });
    expect(manager.resourceTable.snapshot(disposable)[0]).toMatchObject({
      state: "disposed",
      refCount: 0
    });
  });

  it("rejects acquire after dispose and missing assets", async () => {
    const manager = createAssetManager({ catalog });
    const scope = manager.createScope("scene.gate");

    await expect(scope.acquire("game:missing")).rejects.toThrow(AssetResolutionError);
    await scope.dispose();
    await expect(scope.acquire(hero)).rejects.toThrow(AssetScopeDisposedError);
  });
});

interface DisposableLoaderOptions {
  readonly beforeRead?: () => Promise<void> | void;
  readonly loadCalls?: string[];
  readonly onLoadStart?: () => void;
}

function createDisposableLoader(
  disposeCalls: string[],
  options: DisposableLoaderOptions = {}
): AssetLoader<{ readonly text: string }> {
  return {
    id: "test-disposable",
    types: ["test/disposable"],
    async load(context) {
      options.loadCalls?.push(context.source.source.url);
      options.onLoadStart?.();
      await options.beforeRead?.();
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
        }
      };
    }
  };
}
