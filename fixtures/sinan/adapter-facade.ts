import {
  AssetAbortError,
  type AssetManager,
  AssetResolutionError,
  type AssetScope,
  type ResolvedSource
} from "@indirection/runtime";
import type { DiagnosticCode } from "@indirection/protocol";

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
  diagnostics(): readonly SinanAdapterDiagnostic[];
}

export interface SinanAdapterDiagnostic {
  readonly code: DiagnosticCode;
  readonly phase: "adapter";
  readonly assetId: string;
  readonly legacyUrl: string;
  readonly message: string;
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
  const diagnostics: SinanAdapterDiagnostic[] = [];

  return {
    featureFlag,
    sceneScope,
    async loadModel(assetId: string, url: string): Promise<unknown> {
      if (!featureFlag.enabled) {
        return options.hostRuntime.loadModel(assetId, url);
      }

      try {
        const handle = await sceneScope.acquire<ResolvedSource>(assetId);
        return handle.value;
      } catch (error) {
        diagnostics.push({
          code: mapAdapterErrorCode(error),
          phase: "adapter",
          assetId,
          legacyUrl: url,
          message: "Indirection adapter fell back to the host runtime."
        });
        return options.hostRuntime.loadModel(assetId, url);
      }
    },
    async disposeSceneScope(): Promise<void> {
      await sceneScope.dispose();
    },
    diagnostics() {
      return [...diagnostics];
    }
  };
}

function mapAdapterErrorCode(error: unknown): DiagnosticCode {
  if (error instanceof AssetResolutionError) {
    return "IND_ASSET_UNKNOWN";
  }

  if (error instanceof AssetAbortError) {
    return "IND_ABORTED";
  }

  return "IND_INTERNAL_ERROR";
}
