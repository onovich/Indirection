import {
  type AssetId,
  type CatalogAsset,
  type CatalogSource,
  type CompiledCatalog,
  protocolVersion
} from "@indirection/protocol";

export const runtimePackageName = "@indirection/runtime";
export const runtimeProtocolVersion = protocolVersion;

export interface CreateAssetManagerOptions {
  readonly catalog: CompiledCatalog;
  readonly context?: ResolutionContext;
  readonly resolverChain?: ResolverChain;
}

export interface AssetManager {
  readonly catalogStore: CatalogStore;

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
  const resolverChain = options.resolverChain ?? new ResolverChain();
  const defaultContext = options.context ?? {};

  return {
    catalogStore,
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
