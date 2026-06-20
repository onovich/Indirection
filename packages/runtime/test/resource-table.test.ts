import { describe, expect, it } from "vitest";
import { normalizeAssetId } from "@indirection/protocol";
import { ResourceTable, resourceStates } from "@indirection/runtime";

describe("ResourceTable state skeleton", () => {
  it("declares the full lifecycle vocabulary", () => {
    expect(resourceStates).toEqual([
      "idle",
      "resolving",
      "loading",
      "decoding",
      "ready",
      "failed",
      "fallback-ready",
      "released",
      "evictable",
      "disposed"
    ]);
  });

  it("creates idle entries and records ownership flags", () => {
    const table = new ResourceTable();
    const hero = normalizeAssetId("game:character.hero");

    expect(table.ensure(hero)).toEqual({
      assetId: "game:character.hero",
      state: "idle",
      refCount: 0,
      hasTransport: false,
      hasValue: false,
      hasDisposer: false,
      dependencyRefs: []
    });

    expect(
      table.transition(hero, {
        state: "loading",
        hasTransport: true
      })
    ).toMatchObject({
      state: "loading",
      hasTransport: true,
      hasValue: false
    });
  });

  it("tracks retain and release transitions", () => {
    const table = new ResourceTable();
    const hero = normalizeAssetId("game:character.hero");

    expect(table.retain(hero).refCount).toBe(1);
    table.transition(hero, {
      state: "ready",
      hasTransport: false,
      hasValue: true,
      hasDisposer: true
    });

    expect(table.release(hero)).toMatchObject({
      state: "released",
      refCount: 0,
      hasValue: true,
      hasDisposer: true
    });
  });

  it("records dependency refs and fallback cause metadata", () => {
    const table = new ResourceTable();
    const hero = normalizeAssetId("game:character.hero");
    const fallback = normalizeAssetId("system:placeholder.model");

    table.setDependencies(hero, [fallback]);
    expect(
      table.transition(hero, {
        state: "fallback-ready",
        hasValue: true,
        causeCode: "IND_DECODE_FAILED",
        fallbackAssetId: fallback
      })
    ).toMatchObject({
      dependencyRefs: ["system:placeholder.model"],
      causeCode: "IND_DECODE_FAILED",
      fallbackAssetId: "system:placeholder.model"
    });
  });

  it("reopens disposed entries through an explicit retain", () => {
    const table = new ResourceTable();
    const hero = normalizeAssetId("game:character.hero");

    table.transition(hero, {
      state: "disposed",
      hasTransport: false,
      hasValue: false,
      hasDisposer: false
    });

    expect(table.retain(hero)).toMatchObject({
      state: "idle",
      refCount: 1
    });
  });

  it("clears stale fallback cause metadata explicitly", () => {
    const table = new ResourceTable();
    const hero = normalizeAssetId("game:character.hero");
    const fallback = normalizeAssetId("system:placeholder.model");

    table.transition(hero, {
      state: "fallback-ready",
      hasValue: true,
      causeCode: "IND_DECODE_FAILED",
      fallbackAssetId: fallback
    });

    expect(
      table.transition(hero, {
        state: "ready",
        causeCode: undefined,
        fallbackAssetId: undefined
      })
    ).toEqual({
      assetId: "game:character.hero",
      state: "ready",
      refCount: 0,
      hasTransport: false,
      hasValue: true,
      hasDisposer: false,
      dependencyRefs: []
    });
  });
});
