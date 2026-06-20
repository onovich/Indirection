import type {
  AssetLoader,
  LoaderContext,
  TransportBody
} from "@indirection/runtime";

export const threePackageName = "@indirection/three";

export interface ThreeGltfLoaderOptions<TValue = unknown> {
  readonly parse?: (input: FakeGltfPayload) => TValue | Promise<TValue>;
}

export interface FakeGltfPayload {
  readonly assetId: string;
  readonly sourceUrl: string;
  readonly bytes: Uint8Array;
}

export function createThreeGltfLoader<TValue = FakeGltfPayload>(
  options: ThreeGltfLoaderOptions<TValue> = {}
): AssetLoader<TValue | FakeGltfPayload> {
  return {
    id: "three-gltf-peer-boundary",
    types: ["model/gltf"],
    async load(context) {
      const payload: FakeGltfPayload = {
        assetId: context.assetId,
        sourceUrl: context.source.source.url,
        bytes: bodyToBytes((await context.transport.read(context)).body)
      };

      return {
        value: options.parse === undefined ? payload : await options.parse(payload)
      };
    }
  };
}

function bodyToBytes(body: TransportBody): Uint8Array {
  if (body instanceof Uint8Array) {
    return body;
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }

  return new TextEncoder().encode(typeof body === "string" ? body : JSON.stringify(body));
}
