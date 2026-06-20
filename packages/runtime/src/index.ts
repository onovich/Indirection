import {
  type AssetId,
  type CatalogAsset,
  type CompiledCatalog,
  protocolVersion
} from "@indirection/protocol";

export const runtimePackageName = "@indirection/runtime";
export const runtimeProtocolVersion = protocolVersion;

export interface CreateAssetManagerOptions {
  readonly catalog: CompiledCatalog;
}

export interface AssetManager {
  readonly catalogStore: CatalogStore;

  replaceCatalog(catalog: CompiledCatalog): void;
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

export function createAssetManager(
  options: CreateAssetManagerOptions
): AssetManager {
  const catalogStore = new CatalogStore(options.catalog);

  return {
    catalogStore,
    replaceCatalog(catalog) {
      catalogStore.replaceCatalog(catalog);
    },
    snapshot() {
      return catalogStore.snapshot();
    }
  };
}
