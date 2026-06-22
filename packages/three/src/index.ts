import type {
  AssetLoader,
  LoadedAsset,
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

export interface ThreeDisposableResource {
  dispose(): void | Promise<void>;
}

export type ThreeGltfOwnedResources<TValue = unknown> = (
  value: TValue,
  input: ThreeGltfParseInput
) => Iterable<ThreeDisposableResource> | undefined;

export interface ThreeGltfInstantiateContext {
  readonly assetId?: string;
  readonly sourceUrl?: string;
  readonly basePath?: string;
}

export interface ThreeGltfInstantiateInput<TValue = unknown>
  extends ThreeGltfInstantiateContext {
  readonly value: TValue;
}

export type ThreeGltfInstantiate<TValue = unknown, TInstance = TValue> = (
  input: ThreeGltfInstantiateInput<TValue>
) => TInstance | Promise<TInstance>;

export interface ThreeAnimationClipLike {
  readonly name?: string;
  readonly duration?: number;
  readonly tracks?: readonly unknown[];
}

export interface ThreeAnimationSourceLike {
  readonly animations?: readonly ThreeAnimationClipLike[];
}

export interface ThreeAnimationMetadata {
  readonly index: number;
  readonly durationSeconds: number;
  readonly trackCount: number;
  readonly name?: string;
}

export interface ThreeGltfLoaderOptions<TValue = unknown> {
  readonly basePath?: string | ((input: ThreeGltfBasePathInput) => string);
  readonly parse?: (input: ThreeGltfParseInput) => TValue | Promise<TValue>;
  readonly parser?: ThreeGltfParser<TValue>;
  readonly ownedResources?: ThreeGltfOwnedResources<TValue | FakeGltfPayload>;
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
      const value = await parseGltf(options, parseInput);

      return createLoadedThreeGltfAsset(value, parseInput, options);
    }
  };
}

export function extractThreeAnimationMetadata(
  input: ThreeAnimationSourceLike | readonly ThreeAnimationClipLike[]
): readonly ThreeAnimationMetadata[] {
  const animations = isAnimationClipArray(input) ? input : input.animations ?? [];
  return animations.map((clip, index) => {
    const metadata = {
      index,
      durationSeconds: normalizeAnimationDuration(clip.duration),
      trackCount: clip.tracks?.length ?? 0,
      ...(clip.name === undefined ? {} : { name: clip.name })
    };
    return metadata;
  });
}

export function instantiateThreeGltf<TValue, TInstance = TValue>(
  value: TValue,
  instantiate: ThreeGltfInstantiate<TValue, TInstance>,
  context: ThreeGltfInstantiateContext = {}
): TInstance | Promise<TInstance> {
  return instantiate({
    value,
    ...definedInstantiateContext(context)
  });
}

export function createThreeOwnedResourceDisposer(
  resources: Iterable<ThreeDisposableResource>
): (() => Promise<void>) | undefined {
  const ownedResources = Array.from(new Set(resources));
  if (ownedResources.length === 0) {
    return undefined;
  }

  let disposePromise: Promise<void> | undefined;
  return () => {
    disposePromise ??= disposeOwnedResources(ownedResources);
    return disposePromise;
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

function createLoadedThreeGltfAsset<TValue>(
  value: TValue | FakeGltfPayload,
  input: ThreeGltfParseInput,
  options: ThreeGltfLoaderOptions<TValue>
): LoadedAsset<TValue | FakeGltfPayload> {
  const resources = options.ownedResources?.(value, input);
  if (resources === undefined) {
    return { value };
  }

  const dispose = createThreeOwnedResourceDisposer(resources);
  return dispose === undefined ? { value } : { value, dispose };
}

async function disposeOwnedResources(resources: readonly ThreeDisposableResource[]): Promise<void> {
  const failures: unknown[] = [];
  for (const resource of resources) {
    try {
      await resource.dispose();
    } catch (error) {
      failures.push(error);
    }
  }

  if (failures.length === 1) {
    throw failures[0];
  }

  if (failures.length > 1) {
    throw new AggregateError(failures, "Failed to dispose one or more Three owned resources");
  }
}

function isAnimationClipArray(
  input: ThreeAnimationSourceLike | readonly ThreeAnimationClipLike[]
): input is readonly ThreeAnimationClipLike[] {
  return Array.isArray(input);
}

function normalizeAnimationDuration(duration: number | undefined): number {
  return typeof duration === "number" && Number.isFinite(duration) ? duration : 0;
}

function definedInstantiateContext(
  context: ThreeGltfInstantiateContext
): ThreeGltfInstantiateContext {
  return {
    ...(context.assetId === undefined ? {} : { assetId: context.assetId }),
    ...(context.sourceUrl === undefined ? {} : { sourceUrl: context.sourceUrl }),
    ...(context.basePath === undefined ? {} : { basePath: context.basePath })
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

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function resolveBasePath<TValue>(
  options: ThreeGltfLoaderOptions<TValue>,
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
