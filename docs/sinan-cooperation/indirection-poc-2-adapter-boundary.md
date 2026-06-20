# Indirection / Sinan POC-2 Adapter Boundary

日期：2026-06-20
状态：Adapter facade boundary note

## 1. 保留的外部契约

POC-2 adapter facade 保留 Sinan 外部调用形态：

```ts
WebRuntime.loadModel(assetId, url)
```

Indirection 只在 facade 内部尝试：

```txt
sceneScope.acquire(assetId)
```

如果 feature flag 关闭、asset 缺失、loader 失败或 adapter 抛错，facade 回退到 host built-in loader，并记录 adapter diagnostic。

## 2. 当前 fixture 实现

- Adapter facade：`fixtures/sinan/adapter-facade.ts`
- Fake model smoke：`fixtures/sinan/model-load-smoke.ts`
- Contract coverage：`packages/runtime/test/sinan-adapter-facade.test.ts`
- Smoke coverage：`packages/runtime/test/sinan-model-smoke.test.ts`

该实现不进入 `packages/runtime/src`、`packages/protocol/src`、`packages/compiler/src` 或 `packages/schema/src`。

## 3. 已覆盖失败场景

| 场景 | 预期 |
|---|---|
| feature flag disabled | 直接调用 host runtime |
| missing asset | 记录 `IND_ASSET_UNKNOWN`，回退 host runtime |
| fake loader failure | 记录 `IND_INTERNAL_ERROR`，回退 host runtime |
| successful fake model load | 使用 scene scope，dispose 后清空 handle |

## 4. 边界规则

- Sinan-specific code stays in fixture/adapter boundary.
- Runtime core does not import Sinan, Three, Vite, React, Zod, Node crypto, `window`, `document`, or implicit `fetch`.
- Adapter diagnostics use stable diagnostic codes; host-facing messages may change.
- `legacyUrl` remains available for host fallback and compatibility checks.
