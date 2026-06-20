import { describe, expect, it } from "vitest";
import { compilerBaseline, compilerPackageName } from "@indirection/compiler";
import { protocolPackageName, protocolVersion } from "@indirection/protocol";
import { runtimePackageName, runtimeProtocolVersion } from "@indirection/runtime";
import { corePackageNames, testkitPackageName } from "@indirection/testkit";

describe("package exports", () => {
  it("exposes core package names through package exports", () => {
    expect(protocolPackageName).toBe("@indirection/protocol");
    expect(compilerPackageName).toBe("@indirection/compiler");
    expect(runtimePackageName).toBe("@indirection/runtime");
    expect(testkitPackageName).toBe("@indirection/testkit");
  });

  it("keeps skeleton runtime and compiler versions wired through protocol", () => {
    expect(protocolVersion).toBe(1);
    expect(compilerBaseline.protocolVersion).toBe(protocolVersion);
    expect(compilerBaseline.schemaVersion).toBe(1);
    expect(runtimeProtocolVersion).toBe(protocolVersion);
    expect(corePackageNames).toEqual([
      "@indirection/protocol",
      "@indirection/compiler",
      "@indirection/runtime"
    ]);
  });
});
