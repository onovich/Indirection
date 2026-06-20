import {
  type AssetId,
  type CatalogAsset,
  type CatalogSource,
  type CompiledCatalog,
  type JsonValue,
  protocolVersion
} from "@indirection/protocol";

export const runtimePackageName = "@indirection/runtime";
export const runtimeProtocolVersion = protocolVersion;

export interface CreateAssetManagerOptions {
  readonly catalog: CompiledCatalog;
  readonly context?: ResolutionContext;
  readonly loaders?: readonly AssetLoader[];
  readonly resolverChain?: ResolverChain;
  readonly transport?: AssetTransport;
}

export interface AssetManager {
  readonly catalogStore: CatalogStore;
  readonly resourceTable: ResourceTable;

  createScope(id?: string): AssetScope;
  replaceCatalog(catalog: CompiledCatalog): void;
  resolveSource(
    assetId: AssetId | string,
    context?: ResolutionContext
  ): ResolvedSource | undefined;
  snapshot(): AssetManagerSnapshot;
}

export interface AssetManagerSnapshot {
  readonly catalogVersion: string;
  readonly assetCount: number;
  readonly groupCount: number;
  readonly resources: readonly ResourceSnapshot[];
}

export interface AssetHandle<T = ResolvedSource> {
  readonly assetId: string;
  readonly value: T;
  readonly released: boolean;

  release(): void;
}

export interface AssetScope {
  readonly id: string;
  readonly disposed: boolean;

  acquire<T = ResolvedSource>(
    assetId: AssetId | string,
    context?: ResolutionContext
  ): Promise<AssetHandle<T>>;
  dispose(): Promise<void>;
  snapshot(): AssetScopeSnapshot;
}

export interface AssetScopeSnapshot {
  readonly id: string;
  readonly disposed: boolean;
  readonly handleCount: number;
  readonly assetIds: readonly string[];
}

export class AssetScopeDisposedError extends Error {
  readonly scopeId: string;

  constructor(scopeId: string) {
    super(`Asset scope is disposed: ${scopeId}`);
    this.name = "AssetScopeDisposedError";
    this.scopeId = scopeId;
  }
}

export class AssetResolutionError extends Error {
  readonly assetId: string;

  constructor(assetId: string) {
    super(`Asset could not be resolved: ${assetId}`);
    this.name = "AssetResolutionError";
    this.assetId = assetId;
  }
}

export class AssetLoaderError extends Error {
  readonly assetId: string;
  readonly type: string;

  constructor(assetId: string, type: string) {
    super(`No asset loader registered for ${type}: ${assetId}`);
    this.name = "AssetLoaderError";
    this.assetId = assetId;
    this.type = type;
  }
}

export class CatalogStore {
  #catalog: CompiledCatalog;

  constructor(catalog: CompiledCatalog) {
    this.#catalog = catalog;
  }

  get catalogVersion(): string {
    return this.#catalog.catalogVersion;
  }

  get catalog(): CompiledCatalog {
    return this.#catalog;
  }

  replaceCatalog(catalog: CompiledCatalog): void {
    this.#catalog = catalog;
  }

  getAsset(id: AssetId | string): CatalogAsset | undefined {
    return this.#catalog.assets[id];
  }

  getGroup(id: AssetId | string): readonly AssetId[] | undefined {
    return this.#catalog.groups?.[id];
  }

  listAssetIds(): readonly string[] {
    return Object.keys(this.#catalog.assets).sort();
  }

  listGroupIds(): readonly string[] {
    return Object.keys(this.#catalog.groups ?? {}).sort();
  }

  snapshot(): AssetManagerSnapshot {
    return {
      catalogVersion: this.#catalog.catalogVersion,
      assetCount: this.listAssetIds().length,
      groupCount: this.listGroupIds().length,
      resources: []
    };
  }
}

export const resourceStates = [
  "idle",
  "resolving",
  "loading",
  "decoding",
  "ready",
  "failed",
  "fallback-ready",
  "released",
  "evictable",
  "disposed"
] as const;

export type ResourceStateName = (typeof resourceStates)[number];

export interface ResourceTransition {
  readonly state: ResourceStateName;
  readonly hasTransport?: boolean;
  readonly hasValue?: boolean;
  readonly hasDisposer?: boolean;
  readonly causeCode?: string;
  readonly fallbackAssetId?: string;
}

export interface ResourceSnapshot {
  readonly assetId: string;
  readonly state: ResourceStateName;
  readonly refCount: number;
  readonly hasTransport: boolean;
  readonly hasValue: boolean;
  readonly hasDisposer: boolean;
  readonly dependencyRefs: readonly string[];
  readonly causeCode?: string;
  readonly fallbackAssetId?: string;
}

interface ResourceEntry {
  readonly assetId: string;
  state: ResourceStateName;
  refCount: number;
  hasTransport: boolean;
  hasValue: boolean;
  hasDisposer: boolean;
  dependencyRefs: readonly string[];
  causeCode?: string;
  fallbackAssetId?: string;
}

export class ResourceTable {
  readonly #entries = new Map<string, ResourceEntry>();

  ensure(assetId: AssetId | string): ResourceSnapshot {
    return this.snapshotEntry(this.ensureEntry(assetId));
  }

  retain(assetId: AssetId | string): ResourceSnapshot {
    const entry = this.ensureEntry(assetId);
    if (entry.state === "disposed") {
      entry.state = "idle";
    }

    entry.refCount += 1;
    return this.snapshotEntry(entry);
  }

  release(assetId: AssetId | string): ResourceSnapshot {
    const entry = this.ensureEntry(assetId);
    entry.refCount = Math.max(0, entry.refCount - 1);

    if (
      entry.refCount === 0 &&
      (entry.state === "ready" || entry.state === "fallback-ready")
    ) {
      entry.state = "released";
    }

    return this.snapshotEntry(entry);
  }

  transition(
    assetId: AssetId | string,
    transition: ResourceTransition
  ): ResourceSnapshot {
    const entry = this.ensureEntry(assetId);
    entry.state = transition.state;
    entry.hasTransport = transition.hasTransport ?? entry.hasTransport;
    entry.hasValue = transition.hasValue ?? entry.hasValue;
    entry.hasDisposer = transition.hasDisposer ?? entry.hasDisposer;
    if (transition.causeCode === undefined) {
      delete entry.causeCode;
    } else {
      entry.causeCode = transition.causeCode;
    }

    if (transition.fallbackAssetId === undefined) {
      delete entry.fallbackAssetId;
    } else {
      entry.fallbackAssetId = transition.fallbackAssetId;
    }

    return this.snapshotEntry(entry);
  }

  setDependencies(
    assetId: AssetId | string,
    dependencyRefs: readonly (AssetId | string)[]
  ): ResourceSnapshot {
    const entry = this.ensureEntry(assetId);
    entry.dependencyRefs = dependencyRefs.map((dependency) => String(dependency));
    return this.snapshotEntry(entry);
  }

  snapshot(assetId?: AssetId | string): readonly ResourceSnapshot[] {
    if (assetId !== undefined) {
      const entry = this.#entries.get(String(assetId));
      return entry === undefined ? [] : [this.snapshotEntry(entry)];
    }

    return [...this.#entries.values()]
      .sort((left, right) => left.assetId.localeCompare(right.assetId))
      .map((entry) => this.snapshotEntry(entry));
  }

  private ensureEntry(assetId: AssetId | string): ResourceEntry {
    const key = String(assetId);
    const existing = this.#entries.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const entry: ResourceEntry = {
      assetId: key,
      state: "idle",
      refCount: 0,
      hasTransport: false,
      hasValue: false,
      hasDisposer: false,
      dependencyRefs: []
    };
    this.#entries.set(key, entry);
    return entry;
  }

  private snapshotEntry(entry: ResourceEntry): ResourceSnapshot {
    return {
      assetId: entry.assetId,
      state: entry.state,
      refCount: entry.refCount,
      hasTransport: entry.hasTransport,
      hasValue: entry.hasValue,
      hasDisposer: entry.hasDisposer,
      dependencyRefs: entry.dependencyRefs,
      ...(entry.causeCode === undefined ? {} : { causeCode: entry.causeCode }),
      ...(entry.fallbackAssetId === undefined
        ? {}
        : { fallbackAssetId: entry.fallbackAssetId })
    };
  }
}

class RuntimeAssetHandle<T> implements AssetHandle<T> {
  readonly assetId: string;
  readonly value: T;
  #released = false;
  readonly #releaseHandle: () => void;

  constructor(assetId: string, value: T, releaseHandle: () => void) {
    this.assetId = assetId;
    this.value = value;
    this.#releaseHandle = releaseHandle;
  }

  get released(): boolean {
    return this.#released;
  }

  release(): void {
    if (this.#released) {
      return;
    }

    this.#released = true;
    this.#releaseHandle();
  }
}

class RuntimeAssetScope implements AssetScope {
  readonly id: string;
  readonly #resolveSource: (
    assetId: AssetId | string,
    context?: ResolutionContext
  ) => ResolvedSource | undefined;
  readonly #loadAsset: (resolved: ResolvedSource) => Promise<unknown>;
  readonly #resourceTable: ResourceTable;
  readonly #handles = new Set<RuntimeAssetHandle<unknown>>();
  #disposed = false;

  constructor(
    id: string,
    resourceTable: ResourceTable,
    resolveSource: (
      assetId: AssetId | string,
      context?: ResolutionContext
    ) => ResolvedSource | undefined,
    loadAsset: (resolved: ResolvedSource) => Promise<unknown>
  ) {
    this.id = id;
    this.#resourceTable = resourceTable;
    this.#resolveSource = resolveSource;
    this.#loadAsset = loadAsset;
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  async acquire<T = ResolvedSource>(
    assetId: AssetId | string,
    context?: ResolutionContext
  ): Promise<AssetHandle<T>> {
    if (this.#disposed) {
      throw new AssetScopeDisposedError(this.id);
    }

    const resolved = this.#resolveSource(assetId, context);
    if (resolved === undefined) {
      throw new AssetResolutionError(String(assetId));
    }

    this.#resourceTable.retain(assetId);
    this.#resourceTable.transition(assetId, {
      state: "resolving"
    });
    const value = await this.#loadAsset(resolved);

    this.#resourceTable.transition(assetId, {
      state: "ready",
      hasTransport: false,
      hasValue: true
    });

    const handle = new RuntimeAssetHandle(String(assetId), value as T, () => {
      this.#handles.delete(handle);
      this.#resourceTable.release(assetId);
    });
    this.#handles.add(handle);
    return handle;
  }

  async dispose(): Promise<void> {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    for (const handle of [...this.#handles]) {
      handle.release();
    }
  }

  snapshot(): AssetScopeSnapshot {
    return {
      id: this.id,
      disposed: this.#disposed,
      handleCount: this.#handles.size,
      assetIds: [...this.#handles].map((handle) => handle.assetId).sort()
    };
  }
}

export type ResolutionContextValue = string | readonly string[];

export interface ResolutionContext {
  readonly quality?: string;
  readonly locale?: string;
  readonly platform?: string;
  readonly capability?: readonly string[];
  readonly dimensions?: Readonly<Record<string, ResolutionContextValue>>;
}

export interface ResolvedSource {
  readonly assetId: string;
  readonly type: string;
  readonly catalogVersion: string;
  readonly sourceIndex: number;
  readonly source: CatalogSource;
}

export interface TransportRequest {
  readonly assetId: string;
  readonly source: ResolvedSource;
  readonly signal?: AbortSignal;
}

export interface TransportResponse {
  readonly body: TransportBody;
  readonly contentType?: string;
}

export type TransportBody = string | Uint8Array | ArrayBuffer | JsonValue;

export interface AssetTransport {
  read(request: TransportRequest): Promise<TransportResponse> | TransportResponse;
}

export interface LoadedAsset<T = unknown> {
  readonly value: T;
  readonly dispose?: () => void | Promise<void>;
  readonly cost?: {
    readonly cpuBytes?: number;
    readonly gpuBytes?: number;
  };
}

export interface LoaderContext {
  readonly assetId: string;
  readonly source: ResolvedSource;
  readonly signal?: AbortSignal;
  readonly transport: AssetTransport;
}

export interface AssetLoader<T = unknown> {
  readonly id: string;
  readonly types: readonly string[];

  load(context: LoaderContext): Promise<LoadedAsset<T>> | LoadedAsset<T>;
}

export class LoaderRegistry {
  readonly #loaders = new Map<string, AssetLoader>();

  constructor(loaders: readonly AssetLoader[] = []) {
    for (const loader of loaders) {
      this.register(loader);
    }
  }

  register(loader: AssetLoader): void {
    for (const type of loader.types) {
      this.#loaders.set(type, loader);
    }
  }

  get(type: string): AssetLoader | undefined {
    return this.#loaders.get(type);
  }
}

export class InMemoryTransport implements AssetTransport {
  readonly #records = new Map<string, TransportBody>();

  constructor(records: Readonly<Record<string, TransportBody>> = {}) {
    for (const [url, body] of Object.entries(records)) {
      this.#records.set(url, body);
    }
  }

  set(url: string, body: TransportBody): void {
    this.#records.set(url, body);
  }

  read(request: TransportRequest): TransportResponse {
    if (request.signal?.aborted) {
      throw new Error(`Transport request aborted: ${request.assetId}`);
    }

    const url = request.source.source.url;
    if (!this.#records.has(url)) {
      throw new Error(`Missing in-memory transport record: ${url}`);
    }

    return {
      body: this.#records.get(url) as TransportBody
    };
  }
}

export const jsonAssetLoader: AssetLoader<unknown> = {
  id: "fake-json",
  types: ["data/json"],
  async load(context) {
    const response = await context.transport.read(createTransportRequest(context));

    return {
      value: JSON.parse(bodyToText(response.body))
    };
  }
};

export const textAssetLoader: AssetLoader<string> = {
  id: "fake-text",
  types: ["text/plain"],
  async load(context) {
    const response = await context.transport.read(createTransportRequest(context));

    return {
      value: bodyToText(response.body)
    };
  }
};

export const binaryAssetLoader: AssetLoader<Uint8Array> = {
  id: "fake-binary",
  types: ["binary/array-buffer"],
  async load(context) {
    const response = await context.transport.read(createTransportRequest(context));

    return {
      value: bodyToBytes(response.body)
    };
  }
};

function createTransportRequest(context: LoaderContext): TransportRequest {
  return {
    assetId: context.assetId,
    source: context.source,
    ...(context.signal === undefined ? {} : { signal: context.signal })
  };
}

export interface SourceResolver {
  readonly id: string;

  resolve(input: SourceResolutionInput): ResolvedSource | undefined;
}

export interface SourceResolutionInput {
  readonly assetId: string;
  readonly asset: CatalogAsset;
  readonly catalogVersion: string;
  readonly context: ResolutionContext;
}

export class ResolverChain {
  readonly #resolvers: readonly SourceResolver[];

  constructor(resolvers: readonly SourceResolver[] = [variantSourceResolver]) {
    this.#resolvers = resolvers;
  }

  resolve(input: SourceResolutionInput): ResolvedSource | undefined {
    for (const resolver of this.#resolvers) {
      const resolved = resolver.resolve(input);
      if (resolved !== undefined) {
        return resolved;
      }
    }

    return undefined;
  }
}

export const variantSourceResolver: SourceResolver = {
  id: "variant-source",
  resolve(input) {
    const sourceIndex = input.asset.sources.findIndex((source) =>
      sourceMatchesContext(source, input.context)
    );

    if (sourceIndex < 0) {
      return undefined;
    }

    const source = input.asset.sources[sourceIndex];
    if (source === undefined) {
      return undefined;
    }

    return {
      assetId: input.assetId,
      type: input.asset.type,
      catalogVersion: input.catalogVersion,
      sourceIndex,
      source
    };
  }
};

export function createAssetManager(
  options: CreateAssetManagerOptions
): AssetManager {
  const catalogStore = new CatalogStore(options.catalog);
  const resourceTable = new ResourceTable();
  const loaderRegistry = new LoaderRegistry([
    jsonAssetLoader,
    textAssetLoader,
    binaryAssetLoader,
    ...(options.loaders ?? [])
  ]);
  const resolverChain = options.resolverChain ?? new ResolverChain();
  const defaultContext = options.context ?? {};
  let nextScopeId = 1;

  const manager: AssetManager = {
    catalogStore,
    resourceTable,
    createScope(id = `scope-${nextScopeId}`) {
      nextScopeId += 1;
      return new RuntimeAssetScope(
        id,
        resourceTable,
        manager.resolveSource,
        loadAsset
      );
    },
    replaceCatalog(catalog) {
      catalogStore.replaceCatalog(catalog);
    },
    resolveSource(assetId, context = defaultContext) {
      const asset = catalogStore.getAsset(assetId);
      if (asset === undefined) {
        return undefined;
      }

      return resolverChain.resolve({
        assetId,
        asset,
        catalogVersion: catalogStore.catalogVersion,
        context
      });
    },
    snapshot() {
      return {
        ...catalogStore.snapshot(),
        resources: resourceTable.snapshot()
      };
    }
  };

  return manager;

  async function loadAsset(resolved: ResolvedSource): Promise<unknown> {
    const loader = loaderRegistry.get(resolved.type);
    if (loader === undefined || options.transport === undefined) {
      return resolved;
    }

    resourceTable.transition(resolved.assetId, {
      state: "loading",
      hasTransport: true
    });
    resourceTable.transition(resolved.assetId, {
      state: "decoding"
    });

    const loaded = await loader.load({
      assetId: resolved.assetId,
      source: resolved,
      transport: options.transport
    });

    resourceTable.transition(resolved.assetId, {
      state: "ready",
      hasTransport: false,
      hasValue: true,
      hasDisposer: loaded.dispose !== undefined
    });

    return loaded.value;
  }
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

function sourceMatchesContext(
  source: CatalogSource,
  context: ResolutionContext
): boolean {
  if (source.when === undefined) {
    return true;
  }

  return Object.entries(source.when).every(([dimension, expectedValues]) => {
    const actualValues = getContextValues(context, dimension);
    return expectedValues.some((expectedValue) => actualValues.includes(expectedValue));
  });
}

function getContextValues(
  context: ResolutionContext,
  dimension: string
): readonly string[] {
  if (context.dimensions?.[dimension] !== undefined) {
    return toContextValues(context.dimensions[dimension]);
  }

  if (dimension === "quality") {
    return toContextValues(context.quality);
  }

  if (dimension === "locale") {
    return toContextValues(context.locale);
  }

  if (dimension === "platform") {
    return toContextValues(context.platform);
  }

  if (dimension === "capability") {
    return toContextValues(context.capability);
  }

  return [];
}

function toContextValues(
  value: ResolutionContextValue | undefined
): readonly string[] {
  if (value === undefined) {
    return [];
  }

  return typeof value === "string" ? [value] : value;
}
