import type {
  AssetLoader,
  LoaderContext,
  TransportBody
} from "@indirection/runtime";

export const loadersWebPackageName = "@indirection/loaders-web";

export function createWebJsonLoader(): AssetLoader<unknown> {
  return {
    id: "web-json",
    types: ["data/json"],
    async load(context) {
      return {
        value: JSON.parse(await readText(context))
      };
    }
  };
}

export function createWebTextLoader(): AssetLoader<string> {
  return {
    id: "web-text",
    types: ["text/plain"],
    async load(context) {
      return {
        value: await readText(context)
      };
    }
  };
}

export function createWebBinaryLoader(): AssetLoader<Uint8Array> {
  return {
    id: "web-binary",
    types: ["binary/array-buffer"],
    async load(context) {
      return {
        value: bodyToBytes((await context.transport.read(context)).body)
      };
    }
  };
}

export function createWebDataLoaders(): readonly AssetLoader[] {
  return [createWebJsonLoader(), createWebTextLoader(), createWebBinaryLoader()];
}

export interface CacheStorageKey {
  readonly catalogVersion: string;
  readonly sourceUrl: string;
}

export interface IndirectionCacheStorageAdapter {
  put(key: CacheStorageKey, body: TransportBody): Promise<void>;
  match(key: CacheStorageKey): Promise<TransportBody | undefined>;
  deleteCatalogVersion(catalogVersion: string): Promise<void>;
  keys(catalogVersion: string): Promise<readonly string[]>;
}

export interface BrowserCacheStorageAdapterOptions {
  readonly cacheName?: string;
  readonly cacheStorage?: CacheStorage;
}

export class BrowserCacheStorageAdapter implements IndirectionCacheStorageAdapter {
  readonly #cacheName: string;
  readonly #cacheStorage: CacheStorage;

  constructor(options: BrowserCacheStorageAdapterOptions = {}) {
    const cacheStorage = options.cacheStorage ?? globalThis.caches;
    if (cacheStorage === undefined) {
      throw new Error("Cache Storage is not available in this environment");
    }

    this.#cacheName = options.cacheName ?? "indirection-assets";
    this.#cacheStorage = cacheStorage;
  }

  async put(key: CacheStorageKey, body: TransportBody): Promise<void> {
    const cache = await this.openCache();
    await cache.put(createCacheRequest(key), createCacheResponse(body));
  }

  async match(key: CacheStorageKey): Promise<TransportBody | undefined> {
    const cache = await this.openCache();
    const response = await cache.match(createCacheRequest(key));
    if (response === undefined) {
      return undefined;
    }

    const bodyKind = response.headers.get("x-indirection-body-kind");
    if (bodyKind === "json") {
      return (await response.json()) as TransportBody;
    }

    if (bodyKind === "text") {
      return response.text();
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  async deleteCatalogVersion(catalogVersion: string): Promise<void> {
    const cache = await this.openCache();
    const requests = await cache.keys();
    await Promise.all(
      requests
        .filter((request) => cacheKeyFromRequest(request)?.catalogVersion === catalogVersion)
        .map((request) => cache.delete(request))
    );
  }

  async keys(catalogVersion: string): Promise<readonly string[]> {
    const cache = await this.openCache();
    const requests = await cache.keys();
    return requests
      .map((request) => cacheKeyFromRequest(request))
      .filter((key): key is CacheStorageKey => key?.catalogVersion === catalogVersion)
      .map((key) => key.sourceUrl)
      .sort();
  }

  private openCache(): Promise<Cache> {
    return this.#cacheStorage.open(this.#cacheName);
  }
}

export class MemoryCacheStorageAdapter implements IndirectionCacheStorageAdapter {
  readonly #versions = new Map<string, Map<string, TransportBody>>();

  async put(key: CacheStorageKey, body: TransportBody): Promise<void> {
    this.getVersion(key.catalogVersion).set(key.sourceUrl, body);
  }

  async match(key: CacheStorageKey): Promise<TransportBody | undefined> {
    return this.#versions.get(key.catalogVersion)?.get(key.sourceUrl);
  }

  async deleteCatalogVersion(catalogVersion: string): Promise<void> {
    this.#versions.delete(catalogVersion);
  }

  async keys(catalogVersion: string): Promise<readonly string[]> {
    return [...(this.#versions.get(catalogVersion)?.keys() ?? [])].sort();
  }

  private getVersion(catalogVersion: string): Map<string, TransportBody> {
    const existing = this.#versions.get(catalogVersion);
    if (existing !== undefined) {
      return existing;
    }

    const version = new Map<string, TransportBody>();
    this.#versions.set(catalogVersion, version);
    return version;
  }
}

async function readText(context: LoaderContext): Promise<string> {
  return bodyToText((await context.transport.read(context)).body);
}

function bodyToText(body: TransportBody): string {
  if (typeof body === "string") {
    return body;
  }

  if (body instanceof Uint8Array) {
    return new TextDecoder().decode(body);
  }

  if (body instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(body));
  }

  return JSON.stringify(body);
}

function bodyToBytes(body: TransportBody): Uint8Array {
  if (body instanceof Uint8Array) {
    return body;
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }

  return new TextEncoder().encode(bodyToText(body));
}

function createCacheRequest(key: CacheStorageKey): Request {
  const url = new URL("https://indirection.local/cache");
  url.searchParams.set("catalogVersion", key.catalogVersion);
  url.searchParams.set("sourceUrl", key.sourceUrl);
  return new Request(url.href);
}

function cacheKeyFromRequest(request: Request): CacheStorageKey | undefined {
  const url = new URL(request.url);
  const catalogVersion = url.searchParams.get("catalogVersion");
  const sourceUrl = url.searchParams.get("sourceUrl");
  if (catalogVersion === null || sourceUrl === null) {
    return undefined;
  }

  return {
    catalogVersion,
    sourceUrl
  };
}

function createCacheResponse(body: TransportBody): Response {
  if (typeof body === "string") {
    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-indirection-body-kind": "text"
      }
    });
  }

  if (body instanceof Uint8Array || body instanceof ArrayBuffer) {
    return new Response(bodyToArrayBuffer(body), {
      headers: {
        "content-type": "application/octet-stream",
        "x-indirection-body-kind": "binary"
      }
    });
  }

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-indirection-body-kind": "json"
    }
  });
}

function bodyToArrayBuffer(body: ArrayBuffer | Uint8Array): ArrayBuffer {
  const bytes = bodyToBytes(body);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
