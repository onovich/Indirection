import { protocolVersion } from "@indirection/protocol";
import { schemaVersion } from "@indirection/schema";

export const compilerPackageName = "@indirection/compiler";
export const compilerBaseline = {
  protocolVersion,
  schemaVersion
} as const;
