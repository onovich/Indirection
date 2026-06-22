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

export interface ImageBitmapLike {
  readonly width: number;
  readonly height: number;

  close?(): void;
}

export interface ImageBitmapResource {
  readonly bitmap: ImageBitmapLike;
  readonly byteLength: number;
  readonly contentType: string;
  readonly height: number;
  readonly sourceUrl: string;
  readonly width: number;
}

export interface ImageBitmapDecodeInput {
  readonly assetId: string;
  readonly arrayBuffer: ArrayBuffer;
  readonly byteLength: number;
  readonly bytes: Uint8Array;
  readonly contentType: string;
  readonly signal?: AbortSignal;
  readonly source: LoaderContext["source"];
  readonly sourceUrl: string;
}

export interface ImageBitmapDisposeInput extends ImageBitmapDecodeInput {
  readonly resource: ImageBitmapResource;
}

export type ImageBitmapDecoder = (
  input: ImageBitmapDecodeInput
) => ImageBitmapLike | Promise<ImageBitmapLike>;

export type ImageBitmapDisposer = (
  input: ImageBitmapDisposeInput
) => void | Promise<void>;

export interface CreateImageBitmapLoaderOptions {
  readonly createBlob?: (
    bytes: Uint8Array,
    contentType: string
  ) => Blob;
  readonly createImageBitmap?: (blob: Blob) => Promise<ImageBitmapLike>;
  readonly decode?: ImageBitmapDecoder;
  readonly dispose?: ImageBitmapDisposer;
  readonly id?: string;
  readonly types?: readonly string[];
}

export function createImageBitmapLoader(
  options: CreateImageBitmapLoaderOptions = {}
): AssetLoader<ImageBitmapResource> {
  const id = options.id ?? "web-image-bitmap";
  const types = options.types ?? ["image/bitmap"];

  return {
    id,
    types,
    async load(context) {
      assertNotAborted(context.signal, context.assetId);

      const response = await context.transport.read(context);
      assertNotAborted(context.signal, context.assetId);

      const bytes = bodyToBytes(response.body);
      const contentType =
        response.contentType ?? inferImageContentType(context.source.type);
      const input = createImageBitmapDecodeInput(context, bytes, contentType);
      const bitmap = await decodeImageBitmap(input, options);
      assertNotAborted(context.signal, context.assetId, bitmap);

      const resource: ImageBitmapResource = {
        bitmap,
        byteLength: bytes.byteLength,
        contentType,
        height: bitmap.height,
        sourceUrl: context.source.source.url,
        width: bitmap.width
      };

      return {
        value: resource,
        dispose: createImageBitmapResourceDisposer(resource, input, options.dispose)
      };
    }
  };
}

function createImageBitmapResourceDisposer(
  resource: ImageBitmapResource,
  input: ImageBitmapDecodeInput,
  dispose?: ImageBitmapDisposer
): () => Promise<void> {
  let disposed = false;

  return async () => {
    if (disposed) {
      return;
    }

    disposed = true;
    if (dispose !== undefined) {
      await dispose({
        ...input,
        resource
      });
      return;
    }

    resource.bitmap.close?.();
  };
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

function createImageBitmapDecodeInput(
  context: LoaderContext,
  bytes: Uint8Array,
  contentType: string
): ImageBitmapDecodeInput {
  return {
    assetId: context.assetId,
    arrayBuffer: bodyToArrayBuffer(bytes),
    byteLength: bytes.byteLength,
    bytes,
    contentType,
    ...(context.signal === undefined ? {} : { signal: context.signal }),
    source: context.source,
    sourceUrl: context.source.source.url
  };
}

async function decodeImageBitmap(
  input: ImageBitmapDecodeInput,
  options: CreateImageBitmapLoaderOptions
): Promise<ImageBitmapLike> {
  if (options.decode !== undefined) {
    return options.decode(input);
  }

  const createBlob = options.createBlob ?? createBrowserBlob;
  return (options.createImageBitmap ?? createBrowserImageBitmap)(
    createBlob(input.bytes, input.contentType)
  );
}

function createBrowserBlob(bytes: Uint8Array, contentType: string): Blob {
  if (globalThis.Blob === undefined) {
    throw new Error("Blob is not available in this environment");
  }

  return new Blob([bodyToArrayBuffer(bytes)], {
    type: contentType
  });
}

function createBrowserImageBitmap(blob: Blob): Promise<ImageBitmapLike> {
  if (globalThis.createImageBitmap === undefined) {
    throw new Error("createImageBitmap is not available in this environment");
  }

  return globalThis.createImageBitmap(blob);
}

function inferImageContentType(type: string): string {
  if (type.startsWith("image/") && type !== "image/bitmap") {
    return type;
  }

  return "image/png";
}

function assertNotAborted(
  signal: AbortSignal | undefined,
  assetId: string,
  bitmap?: ImageBitmapLike
): void {
  if (signal?.aborted !== true) {
    return;
  }

  bitmap?.close?.();
  throw new Error(`ImageBitmap decode aborted: ${assetId}`);
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
