import type {
  AssetLoader,
  LoaderContext,
  TransportBody
} from "@indirection/runtime";

export const threePackageName = "@indirection/three";

export interface ThreeGltfBasePathInput {
  readonly assetId: string;
  readonly sourceUrl: string;
  readonly source: LoaderContext["source"];
}

export interface ThreeGltfParseInput extends ThreeGltfBasePathInput {
  readonly basePath: string;
  readonly bytes: Uint8Array;
  readonly arrayBuffer: ArrayBuffer;
  readonly contentType?: string;
}

export type FakeGltfPayload = ThreeGltfParseInput;

export interface ThreeGltfParser<TValue = unknown> {
  readonly parseAsync: (input: ArrayBuffer, basePath: string) => TValue | Promise<TValue>;
}

export interface ThreeGltfLoaderOptions<TValue = unknown> {
  readonly basePath?: string | ((input: ThreeGltfBasePathInput) => string);
  readonly parse?: (input: ThreeGltfParseInput) => TValue | Promise<TValue>;
  readonly parser?: ThreeGltfParser<TValue>;
}

export function createThreeGltfLoader<TValue = FakeGltfPayload>(
  options: ThreeGltfLoaderOptions<TValue> = {}
): AssetLoader<TValue | FakeGltfPayload> {
  return {
    id: "three-gltf-peer-boundary",
    types: ["model/gltf"],
    async load(context) {
      const response = await context.transport.read(context);
      const sourceUrl = context.source.source.url;
      const bytes = bodyToBytes(response.body);
      const parseInput: ThreeGltfParseInput = {
        assetId: context.assetId,
        sourceUrl,
        source: context.source,
        basePath: resolveBasePath(options, {
          assetId: context.assetId,
          sourceUrl,
          source: context.source
        }),
        bytes,
        arrayBuffer: bytesToArrayBuffer(bytes),
        ...(response.contentType === undefined ? {} : { contentType: response.contentType })
      };

      return {
        value: await parseGltf(options, parseInput)
      };
    }
  };
}

async function parseGltf<TValue>(
  options: ThreeGltfLoaderOptions<TValue>,
  input: ThreeGltfParseInput
): Promise<TValue | FakeGltfPayload> {
  if (options.parse !== undefined) {
    return options.parse(input);
  }

  if (options.parser !== undefined) {
    return options.parser.parseAsync(input.arrayBuffer, input.basePath);
  }

  return input;
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

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function resolveBasePath(
  options: ThreeGltfLoaderOptions<unknown>,
  input: ThreeGltfBasePathInput
): string {
  if (typeof options.basePath === "string") {
    return options.basePath;
  }

  if (options.basePath !== undefined) {
    return options.basePath(input);
  }

  const lastSlashIndex = input.sourceUrl.lastIndexOf("/");
  return lastSlashIndex < 0 ? "" : input.sourceUrl.slice(0, lastSlashIndex + 1);
}
