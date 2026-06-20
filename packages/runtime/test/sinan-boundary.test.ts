import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runtimeSourceUrl = new URL("../src/index.ts", import.meta.url);

describe("Sinan adapter boundary", () => {
  it("keeps Sinan-specific names out of runtime public source", () => {
    const source = readFileSync(runtimeSourceUrl, "utf8").toLowerCase();

    expect(source).not.toContain("sinan");
    expect(source).not.toContain("gate demo");
    expect(source).not.toContain("threeruntime");
  });
});
