import { describe, expect, it } from "vitest";
import { runSinanModelLoadSmoke } from "../../../fixtures/sinan/model-load-smoke.ts";

describe("Sinan model load fake adapter smoke", () => {
  it("loads a fake model without importing Three", async () => {
    await expect(runSinanModelLoadSmoke()).resolves.toEqual({
      loaded: true,
      value: {
        kind: "fake-model",
        assetId: "sinan:gate.hero",
        sourceUrl: "models/gate/hero.glb"
      },
      diagnostics: [],
      scopeDisposed: true
    });
  });
});
