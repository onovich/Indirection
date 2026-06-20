import { describe, expect, it } from "vitest";
import {
  schemaPackageName,
  schemaVersion,
  supportedProtocolVersion
} from "@indirection/schema";

describe("schema package exports", () => {
  it("exposes the schema package without runtime dependencies", () => {
    expect(schemaPackageName).toBe("@indirection/schema");
    expect(schemaVersion).toBe(1);
    expect(supportedProtocolVersion).toBe(1);
  });
});
