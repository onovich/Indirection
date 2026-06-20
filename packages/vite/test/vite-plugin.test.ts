import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeAssetId } from "@indirection/protocol";
import {
  createIndirectionVitePlugin,
  resolvedVirtualCatalogModuleId,
  virtualCatalogModuleId,
  vitePackageName
} from "@indirection/vite";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const sourceUrl = new URL("../src/index.ts", import.meta.url);

describe("Vite plugin skeleton", () => {
  it("declares Vite as an optional peer and avoids schema duplication", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8")) as {
      readonly peerDependencies?: Readonly<Record<string, string>>;
      readonly peerDependenciesMeta?: Readonly<Record<string, { readonly optional?: boolean }>>;
    };
    const source = readFileSync(sourceUrl, "utf8");

    expect(vitePackageName).toBe("@indirection/vite");
    expect(packageJson.peerDependencies?.["vite"]).toBeDefined();
    expect(packageJson.peerDependenciesMeta?.["vite"]?.optional).toBe(true);
    expect(source).not.toContain("@indirection/schema");
  });

  it("serves a virtual catalog through compiler output", () => {
    const hero = normalizeAssetId("game:hero");
    const plugin = createIndirectionVitePlugin({
      model: {
        assets: [
          {
            id: hero,
            type: "text/plain",
            sources: [{ url: "hero.txt" }],
            dependencies: []
          }
        ],
        groups: [],
        diagnostics: []
      }
    });

    expect(plugin.resolveId(virtualCatalogModuleId)).toBe(resolvedVirtualCatalogModuleId);
    expect(plugin.load("other")).toBeUndefined();
    expect(plugin.load(resolvedVirtualCatalogModuleId)).toContain(
      "\"game:hero\""
    );
  });
});
