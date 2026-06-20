import type {
  AssetLoader,
  LoaderContext,
  TransportBody
} from "@indirection/runtime";

export const loadersWebPackageName = "@indirection/loaders-web";

export function createWebJsonLoader(): AssetLoader<unknown> {
  return {
    id: "web-json",
    types: ["data/json"],
    async load(context) {
      return {
        value: JSON.parse(await readText(context))
      };
    }
  };
}

export function createWebTextLoader(): AssetLoader<string> {
  return {
    id: "web-text",
    types: ["text/plain"],
    async load(context) {
      return {
        value: await readText(context)
      };
    }
  };
}

export function createWebBinaryLoader(): AssetLoader<Uint8Array> {
  return {
    id: "web-binary",
    types: ["binary/array-buffer"],
    async load(context) {
      return {
        value: bodyToBytes((await context.transport.read(context)).body)
      };
    }
  };
}

export function createWebDataLoaders(): readonly AssetLoader[] {
  return [createWebJsonLoader(), createWebTextLoader(), createWebBinaryLoader()];
}

async function readText(context: LoaderContext): Promise<string> {
  return bodyToText((await context.transport.read(context)).body);
}

function bodyToText(body: TransportBody): string {
  if (typeof body === "string") {
    return body;
  }

  if (body instanceof Uint8Array) {
    return new TextDecoder().decode(body);
  }

  if (body instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(body));
  }

  return JSON.stringify(body);
}

function bodyToBytes(body: TransportBody): Uint8Array {
  if (body instanceof Uint8Array) {
    return body;
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }

  return new TextEncoder().encode(bodyToText(body));
}
