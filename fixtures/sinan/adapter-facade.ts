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
  readonly enabled?: boolean;
  readonly scopeId?: string;
}

export interface SinanRuntimeAdapter extends SinanWebRuntimeBoundary {
  readonly scope: AssetScope;
}

export function createSinanRuntimeAdapter(
  options: SinanRuntimeAdapterOptions
): SinanRuntimeAdapter {
  const scope = options.manager.createScope(options.scopeId ?? "sinan-runtime-adapter");

  return {
    scope,
    async loadModel(assetId: string, url: string): Promise<unknown> {
      if (options.enabled === false) {
        return options.hostRuntime.loadModel(assetId, url);
      }

      const handle = await scope.acquire<ResolvedSource>(assetId);
      return handle.value;
    }
  };
}
