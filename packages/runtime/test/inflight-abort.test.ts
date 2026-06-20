import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import {
  AssetAbortError,
  createAssetManager,
  type AssetTransport,
  type TransportRequest,
  type TransportResponse
} from "@indirection/runtime";

const config = normalizeAssetId("game:config");

const catalog: CompiledCatalog = {
  protocolVersion,
  catalogVersion: "sha256-inflight",
  assets: {
    [config]: {
      type: "data/json",
      sources: [{ url: "config.json" }]
    }
  }
};

class DeferredTransport implements AssetTransport {
  readCount = 0;
  aborted = false;
  #resolve: ((response: TransportResponse) => void) | undefined;
  #reject: ((error: unknown) => void) | undefined;

  read(request: TransportRequest): Promise<TransportResponse> {
    this.readCount += 1;

    return new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
      request.signal?.addEventListener(
        "abort",
        () => {
          this.aborted = true;
          reject(new AssetAbortError(request.assetId));
        },
        { once: true }
      );
    });
  }

  resolve(body: TransportResponse["body"]): void {
    this.#resolve?.({ body });
  }

  reject(error: unknown): void {
    this.#reject?.(error);
  }
}

describe("in-flight dedup and consumer abort", () => {
  it("shares one loader request across concurrent consumers", async () => {
    const transport = new DeferredTransport();
    const manager = createAssetManager({ catalog, transport });
    const scope = manager.createScope("scene");

    const first = scope.acquire(config);
    const second = scope.acquire(config);
    await Promise.resolve();

    expect(transport.readCount).toBe(1);
    transport.resolve({ enabled: true });

    await expect(first.then((handle) => handle.value)).resolves.toEqual({
      enabled: true
    });
    await expect(second.then((handle) => handle.value)).resolves.toEqual({
      enabled: true
    });
  });

  it("aborts one consumer without aborting the shared request", async () => {
    const transport = new DeferredTransport();
    const manager = createAssetManager({ catalog, transport });
    const scope = manager.createScope("scene");
    const firstAbort = new AbortController();

    const first = scope.acquire(config, { signal: firstAbort.signal });
    const second = scope.acquire(config);
    await Promise.resolve();

    firstAbort.abort();
    await expect(first).rejects.toThrow(AssetAbortError);
    expect(transport.aborted).toBe(false);

    transport.resolve({ enabled: true });
    await expect(second.then((handle) => handle.value)).resolves.toEqual({
      enabled: true
    });
  });

  it("aborts the shared request when all consumers abort", async () => {
    const transport = new DeferredTransport();
    const manager = createAssetManager({ catalog, transport });
    const scope = manager.createScope("scene");
    const firstAbort = new AbortController();
    const secondAbort = new AbortController();

    const first = scope.acquire(config, { signal: firstAbort.signal });
    const second = scope.acquire(config, { signal: secondAbort.signal });
    await Promise.resolve();

    firstAbort.abort();
    secondAbort.abort();

    await expect(first).rejects.toThrow(AssetAbortError);
    await expect(second).rejects.toThrow(AssetAbortError);
    expect(transport.aborted).toBe(true);
  });
});
