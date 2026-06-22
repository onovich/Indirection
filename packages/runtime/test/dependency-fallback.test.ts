import { describe, expect, it } from "vitest";
import { normalizeAssetId, protocolVersion, type CompiledCatalog } from "@indirection/protocol";
import { InMemoryTransport, createAssetManager } from "@indirection/runtime";

const hero = normalizeAssetId("game:character.hero");
const material = normalizeAssetId("game:material.hero");
const fallback = normalizeAssetId("system:placeholder.text");

describe("dependency retain/release", () => {
  it("retains dependencies while the parent handle is live", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-dependencies",
      assets: {
        [hero]: {
          type: "text/plain",
          sources: [{ url: "hero.txt" }],
          dependencies: [material]
        },
        [material]: {
          type: "text/plain",
          sources: [{ url: "material.txt" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      transport: new InMemoryTransport({
        "hero.txt": "hero",
        "material.txt": "material"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire(hero);

    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      dependencyRefs: ["game:material.hero"],
      refCount: 1
    });
    expect(manager.resourceTable.snapshot(material)[0]).toMatchObject({
      refCount: 1
    });

    await handle.release();

    expect(manager.resourceTable.snapshot(material)[0]).toMatchObject({
      refCount: 0
    });
  });
});

describe("fallback cause retention", () => {
  it("loads a deterministic fallback and preserves the original cause code", async () => {
    const catalog: CompiledCatalog = {
      protocolVersion,
      catalogVersion: "sha256-fallback",
      assets: {
        [hero]: {
          type: "text/plain",
          sources: [{ url: "missing-hero.txt" }],
          fallback
        },
        [fallback]: {
          type: "text/plain",
          sources: [{ url: "fallback.txt" }]
        }
      }
    };
    const manager = createAssetManager({
      catalog,
      transport: new InMemoryTransport({
        "fallback.txt": "placeholder"
      })
    });
    const scope = manager.createScope("scene");
    const handle = await scope.acquire(hero);

    expect(handle.value).toBe("placeholder");
    expect(manager.resourceTable.snapshot(hero)[0]).toMatchObject({
      state: "fallback-ready",
      causeCode: "IND_DECODE_FAILED",
      fallbackAssetId: "system:placeholder.text"
    });
    expect(manager.resourceTable.snapshot(fallback)[0]).toMatchObject({
      refCount: 1,
      state: "ready"
    });

    await handle.release();
    expect(manager.resourceTable.snapshot(fallback)[0]).toMatchObject({
      refCount: 0
    });
  });
});
