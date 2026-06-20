# Indirection / Sinan POC-1 Compatibility Note

日期：2026-06-20
状态：POC-1 importer + report compatibility note

## 1. POC-1 边界

POC-1 只验证 Indirection 能读取 Sinan-owned authoring contract 并输出派生产物：

- compiled catalog draft。
- missing reference report。
- fallback report。
- budget compatibility report。

POC-1 不做：

- 不修改 Sinan runtime。
- 不替换 `WebRuntime.loadModel(assetId, url)`。
- 不接管 `data/assets.manifest.json`。
- 不绕过 Sinan schema、ReferenceResolver、budget policy 或 fallback policy。
- 不把 Sinan fixture importer 暴露为 Indirection core public API。

## 2. 当前实现位置

- Fixture：`fixtures/sinan/assets.manifest.json`
- Fixture importer：`fixtures/sinan/importer.ts`
- Fixture reports：`fixtures/sinan/report.ts`
- Coverage：`packages/compiler/test/sinan-importer.test.ts`
- Report snapshot：`packages/compiler/test/sinan-report.test.ts`
- Report contract：`packages/compiler/test/sinan-report-contract.test.ts`

这些文件位于 fixture/test 边界。`packages/protocol/src`、`packages/runtime/src`、`packages/compiler/src`、`packages/schema/src` 不包含 Sinan 专有 public API。

## 3. 兼容性判断

| 项目 | 当前状态 |
|---|---|
| Sinan authoring source-of-truth | 保留在 Sinan manifest fixture |
| Indirection compiled catalog | 派生产物，可重建 |
| Missing reference | 通过 `IND_ASSET_UNKNOWN` report 表达 |
| Fallback compatibility | 按 asset/fallback type 检查 |
| Budget compatibility | 按 group transfer bytes 汇总检查 |
| Runtime replacement | 未发生 |
| Three / Vite / React dependency | 未进入 runtime core |

## 4. 当前 POC-1 结论

POC-1 的当前结果支持继续推进到后续 POC：Indirection 可以在不改变 Sinan runtime 和 authoring ownership 的前提下，对 Sinan-style manifest 生成稳定 catalog draft 和可 diff reports。

下一步如果进入 POC-2，应继续保留 `WebRuntime.loadModel(assetId, url)` 外部边界，在宿主 adapter 内部接入 `sceneScope.acquire(assetId)`。
