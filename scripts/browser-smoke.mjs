const result = {
  name: "indirection-browser-smoke",
  status: "skipped",
  reason:
    "Browser-facing loaders are not established yet; Round 29 only provides the harness skeleton.",
  replacementSmoke: "corepack pnpm test -- packages/runtime/test/sinan-model-smoke.test.ts",
  plannedActivation: "Phase 6 browser smoke and Phase 7 loaders-web"
};

console.log(JSON.stringify(result, null, 2));
