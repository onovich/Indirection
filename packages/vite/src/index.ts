import {
  compileNormalizedModel,
  type ImportResult
} from "@indirection/compiler";

export const vitePackageName = "@indirection/vite";
export const virtualCatalogModuleId = "virtual:indirection/catalog";
export const resolvedVirtualCatalogModuleId = "\0virtual:indirection/catalog";

export interface IndirectionVitePluginOptions {
  readonly model: ImportResult;
}

export interface IndirectionVitePlugin {
  readonly name: "indirection";

  resolveId(id: string): string | undefined;
  load(id: string): string | undefined;
}

export function createIndirectionVitePlugin(
  options: IndirectionVitePluginOptions
): IndirectionVitePlugin {
  return {
    name: "indirection",
    resolveId(id) {
      return id === virtualCatalogModuleId ? resolvedVirtualCatalogModuleId : undefined;
    },
    load(id) {
      if (id !== resolvedVirtualCatalogModuleId) {
        return undefined;
      }

      const result = compileNormalizedModel(options.model);
      return `export default ${JSON.stringify(result.catalog, null, 2)};\n`;
    }
  };
}
