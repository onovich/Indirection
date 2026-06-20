import { describe, expect, it } from "vitest";
import { MemoryCacheStorageAdapter } from "@indirection/loaders-web";

describe("MemoryCacheStorageAdapter", () => {
  it("isolates cached responses by catalog version", async () => {
    const cache = new MemoryCacheStorageAdapter();

    await cache.put(
      { catalogVersion: "sha256-old", sourceUrl: "hero.glb" },
      "old-bytes"
    );
    await cache.put(
      { catalogVersion: "sha256-new", sourceUrl: "hero.glb" },
      "new-bytes"
    );

    await expect(
      cache.match({ catalogVersion: "sha256-old", sourceUrl: "hero.glb" })
    ).resolves.toBe("old-bytes");
    await expect(
      cache.match({ catalogVersion: "sha256-new", sourceUrl: "hero.glb" })
    ).resolves.toBe("new-bytes");
  });

  it("deletes one catalog version without touching others", async () => {
    const cache = new MemoryCacheStorageAdapter();

    await cache.put(
      { catalogVersion: "sha256-old", sourceUrl: "a.txt" },
      "old-a"
    );
    await cache.put(
      { catalogVersion: "sha256-new", sourceUrl: "b.txt" },
      "new-b"
    );

    await cache.deleteCatalogVersion("sha256-old");

    await expect(cache.keys("sha256-old")).resolves.toEqual([]);
    await expect(cache.keys("sha256-new")).resolves.toEqual(["b.txt"]);
  });
});
