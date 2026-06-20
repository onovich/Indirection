import {
  type AssetImporter,
  type ImportContext,
  type ImportResult
} from "@indirection/compiler";
import { type JsonObject, normalizeAssetId } from "@indirection/protocol";

export interface SinanFixtureManifest {
  readonly schemaVersion: 1;
  readonly host: "sinan-engine";
  readonly fixture: string;
  readonly assets: readonly SinanFixtureAsset[];
  readonly groups?: Readonly<Record<string, readonly string[]>>;
  readonly references?: readonly SinanFixtureReference[];
  readonly budgets?: JsonObject;
}

export interface SinanFixtureAsset {
  readonly id: string;
  readonly type: string;
  readonly url: string;
  readonly fallback?: string;
  readonly budget?: JsonObject;
  readonly metadata?: JsonObject;
}

export interface SinanFixtureReference {
  readonly ownerType: string;
  readonly ownerId: string;
  readonly assetId: string;
}

export const sinanFixtureImporter: AssetImporter<SinanFixtureManifest> = {
  id: "sinan-fixture-importer",
  host: "sinan-engine",
  import(input, context) {
    return importSinanFixture(input, context);
  }
};

export function importSinanFixture(
  input: SinanFixtureManifest,
  context: ImportContext = {}
): ImportResult {
  const defaultNamespace = context.defaultNamespace ?? "sinan";

  return {
    assets: input.assets.map((asset) => ({
      id: normalizeAssetId(asset.id, { defaultNamespace }),
      type: asset.type,
      sources: [{ url: asset.url }],
      dependencies: [],
      ...(asset.fallback === undefined
        ? {}
        : { fallback: normalizeAssetId(asset.fallback, { defaultNamespace }) }),
      metadata: {
        ...(asset.metadata ?? {}),
        ...(asset.budget === undefined ? {} : { budget: asset.budget }),
        sinanFixture: input.fixture
      }
    })),
    groups: Object.entries(input.groups ?? {}).map(([id, assets]) => ({
      id: normalizeAssetId(id, { defaultNamespace }),
      assets: assets.map((assetId) => normalizeAssetId(assetId, { defaultNamespace }))
    })),
    diagnostics: []
  };
}
