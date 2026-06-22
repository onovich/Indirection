# Compressed Capability Source Selection

Phase 15 makes compressed asset readiness visible as catalog data and runtime context, without adding real decoder packages or renderer-specific APIs to core packages.

## Contract

Compressed variants are ordinary catalog sources with declarative `when` conditions that match `ResolutionContext.capability`:

```json
{
  "type": "model/gltf",
  "sources": [
    {
      "when": {
        "capability": ["draco"]
      },
      "url": "models/hero.draco.glb"
    },
    {
      "when": {
        "capability": ["ktx2"]
      },
      "url": "models/hero.ktx2.glb"
    },
    {
      "when": {
        "capability": ["meshopt"]
      },
      "url": "models/hero.meshopt.glb"
    },
    {
      "url": "models/hero.glb"
    }
  ]
}
```

The compiler and schema keep these values as string-set data. `draco`, `ktx2`, and `meshopt` are capability strings, not decoder objects, scripts, functions, or expressions.

Runtime source selection is deterministic:

- sources are checked in declaration order;
- the first source whose `when` conditions match the `ResolutionContext` is selected;
- exactly one source without `when` is the default source;
- the default source is selected when no capability-gated source matches.

## Host Capability Injection

Hosts decide which decoder plugins are actually available. A host that has configured Draco, KTX2, or meshopt support can pass matching capability strings into the runtime context:

```ts
const manager = createAssetManager({
  catalog,
  context: {
    capability: ["draco", "ktx2", "meshopt"]
  }
});
```

Per-acquire context can narrow or override the manager context:

```ts
await scope.acquire("game:character.hero", {
  context: {
    capability: ["draco"]
  }
});
```

Core packages do not import Three.js, `GLTFLoader`, decoder plugins, DOM globals, fetch, window, document, or renderer-specific APIs for this contract.

## Default Source Versus Error Fallback

The default source and runtime fallback are separate mechanisms.

Default source selection handles capability absence. If the host does not expose `draco`, `ktx2`, or `meshopt`, runtime selects the uncompressed default source when it exists.

Runtime fallback handles load or decode failure after a source has already been selected. If `capability: ["draco"]` selects `models/hero.draco.glb` and that selected source fails to load or decode, runtime records `IND_DECODE_FAILED` and uses the asset's explicit `fallback` asset when one is declared. It does not silently retry the uncompressed default source as an error fallback.

## Reports

`compileNormalizedModel(...).report.assets[].sources` lists source selection data in a machine-readable shape:

```ts
interface AssetReportSource {
  index: number;
  url: string;
  default: boolean;
  when?: Record<string, readonly string[]>;
}
```

This makes compressed capability contracts visible in CI reports without requiring binary fixtures or real decoder packages.

## Validation

```powershell
corepack pnpm test -- --run packages/schema packages/compiler
corepack pnpm test -- --run packages/runtime
corepack pnpm check:docs
corepack pnpm pack:check
corepack pnpm validate:full
git diff --check
```
