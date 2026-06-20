import {
  type AssetManager,
  type AssetScope,
  type ResolvedSource
} from "@indirection/runtime";

export interface SinanWebRuntimeBoundary {
  loadModel(assetId: string, url: string): Promise<unknown>;
}

export interface SinanRuntimeAdapterOptions {
  readonly manager: AssetManager;
  readonly hostRuntime: SinanWebRuntimeBoundary;
  readonly featureFlag?: SinanRuntimeAdapterFeatureFlag;
  readonly scopeId?: string;
}

export interface SinanRuntimeAdapterFeatureFlag {
  readonly name: "indirection-runtime-adapter";
  readonly enabled: boolean;
}

export interface SinanRuntimeAdapter extends SinanWebRuntimeBoundary {
  readonly featureFlag: SinanRuntimeAdapterFeatureFlag;
  readonly sceneScope: AssetScope;

  disposeSceneScope(): Promise<void>;
}

export function createSinanRuntimeAdapter(
  options: SinanRuntimeAdapterOptions
): SinanRuntimeAdapter {
  const sceneScope = options.manager.createScope(
    options.scopeId ?? "sinan-runtime-adapter"
  );
  const featureFlag = options.featureFlag ?? {
    name: "indirection-runtime-adapter",
    enabled: true
  };

  return {
    featureFlag,
    sceneScope,
    async loadModel(assetId: string, url: string): Promise<unknown> {
      if (!featureFlag.enabled) {
        return options.hostRuntime.loadModel(assetId, url);
      }

      const handle = await sceneScope.acquire<ResolvedSource>(assetId);
      return handle.value;
    },
    async disposeSceneScope(): Promise<void> {
      await sceneScope.dispose();
    }
  };
}
