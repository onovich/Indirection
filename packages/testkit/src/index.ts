import { compilerPackageName } from "@indirection/compiler";
import { protocolPackageName } from "@indirection/protocol";
import { runtimePackageName } from "@indirection/runtime";

export const testkitPackageName = "@indirection/testkit";
export const corePackageNames = [
  protocolPackageName,
  compilerPackageName,
  runtimePackageName
] as const;
