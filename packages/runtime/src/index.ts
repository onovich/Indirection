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
      groupCount: this.listGroupIds().length
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
      return catalogStore.snapshot();
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
