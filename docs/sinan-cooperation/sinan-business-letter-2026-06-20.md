# Sinan Engine 给 Indirection 的合作沟通函

日期：2026-06-20
发件方：Sinan Engine 商务与生态合作评估
收件方：Indirection 项目负责人 / 维护者
关联 RFC：`rfc-001-sinan-asset-boundary.md`

## 1. 来信目的

我们已将 Sinan 本地决策者批准的 `RFC-001：Sinan Asset Boundary` 放入本目录。该 RFC 是 Sinan 对资源寻址、加载、catalog、fallback、report 和 adapter 边界的当前正式对齐草案。

这封信是商务侧补充说明：Sinan 希望邀请 Indirection 成为第一批 first-party design partner，而不是要求 Indirection 直接并入 Sinan。

## 2. Sinan 当前定位升级

Indirection 现有文档中仍以 `Sinan Scene Director` 描述我们。这里需要同步一个重要背景：

Sinan 已经升级为 **Sinan Engine**，即 AI-native、data-first、Web 原生 3D 游戏引擎与编辑器。原先的 Scene Director 范围现在是引擎内部的一等 Director System，和 runtime、renderer、assets、input、UI、physics、editor、data toolchain 一起组成运行闭环。

这意味着资源加载不再只是 demo 资产加载细节，而是 Sinan Engine 的底座能力之一。

## 3. 我们为什么优先联系 Indirection

在资源方向上，我们认为 Indirection 是当前最值得优先合作的项目。

原因很直接：

- Sinan 已有 `data/assets.manifest.json`、asset schema、ReferenceResolver、asset budget/report、Three runtime loader 和 deterministic fallback。
- Indirection 的设计正好覆盖 Sinan 接下来需要扩展的 compiled catalog、dependency graph、scope/handle lifecycle、variant、compressed asset、cache 和 loader backend。
- 双方都强调 manifest-first、identity over location、adapter not invasion、runtime cache 不是 source-of-truth。
- Sinan 可以提供真实 Gate Demo、browser smoke、validation pipeline 和资源预算报告作为 Indirection 的第一批强约束验收场。

## 4. 合作方式

我们建议从非排他 POC 开始：

1. `POC-1`：读取 Sinan manifest，生成 compiled catalog draft 和 diffable report，不改 runtime。
2. `POC-2`：在保留 `WebRuntime.loadModel(assetId, url)` 外部契约的前提下，将模型加载内部路由到 Indirection adapter。
3. `POC-3`：引入 scene scope / group preload / release diagnostics。
4. `POC-4`：在前面稳定后再验证 compressed variant，不把 decoder 变成普通测试硬依赖。

Sinan 会保留：

- authoring manifest。
- asset schema。
- ReferenceResolver。
- budget/report policy。
- fallback policy。
- Sinan adapter 验收权。

Indirection 保留：

- 独立 core。
- 独立包治理。
- 跨宿主价值。
- vanilla / Three / Sinan 等 adapter 生态。

## 5. 生态协同提示

Sinan 同期也在和几个同类 Web game infrastructure 项目对齐：

- InputFlow：输入 action、context routing、virtual replay。
- ViewRig：高级 camera rig / pose solver。
- LudoWeave：Runtime UI ViewModel / Prompt / Subtitle / Objective / Pause。

我们希望这些项目保持独立 core，但围绕 Sinan Engine 的真实 demo 和 contract tests 协同成长。Indirection 在其中承担资源基础设施角色，是优先级最高的一条线。

## 6. 希望 Indirection 回复的问题

请优先评估：

1. 是否接受 `data/assets.manifest.json` 继续作为 Sinan authoring source-of-truth？
2. `POC-1` 是否可以只做 importer + report，不要求 Sinan runtime 改造？
3. compiled catalog 第一版建议放在 build cache、`data/.compiled`、还是 `public`？
4. Indirection adapter 第一阶段更适合放在 Sinan repo，还是 `@indirection/sinan`？
5. 你们是否能提供 vanilla fixture，防止 Indirection core 被 Sinan 过拟合？

## 7. 商务边界

本函不是收购、合并或排他合作要约。当前阶段我们希望建立 first-party design partner 关系：

```txt
Sinan owns contracts.
Indirection owns specialized implementation.
POCs prove value.
Validation protects boundaries.
```

如果 POC 稳定、接口连续兼容、维护责任清晰，我们再讨论 Sinan Engine Infrastructure Kit、联合品牌、官方兼容席位或更深层合作。
