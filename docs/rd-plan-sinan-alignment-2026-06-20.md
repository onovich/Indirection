# Indirection R&D Plan After Sinan Alignment

日期：2026-06-20

输入资料：

- `docs/sinan-cooperation/rfc-001-sinan-asset-boundary.md`
- `docs/sinan-cooperation/sinan-technical-advisory-2026-06-20.md`
- `docs/sinan-cooperation/sinan-business-letter-2026-06-20.md`
- `docs/Indirection_寻址_架构与技术选型设计_v0.1.md`

## 1. 判断

Sinan 的 RFC、技术顾问建议和商务函整体合理，并且与 Indirection 原始设计中的核心原则高度一致：manifest-first、identity over location、adapter not invasion、runtime cache 不是 source-of-truth、fallback 和 diagnostics 必须可验证。

但这些资料也暴露出 Indirection v0.1 设计需要收窄的地方。原设计容易让外部合作方误解为“Indirection 要接管宿主 authoring manifest”。Sinan 明确要求 `data/assets.manifest.json`、schema、ReferenceResolver、budget/report policy、fallback policy 仍由 Sinan Engine 持有。这个要求合理，因为这些能力属于引擎语义和编辑器事实源，而不是通用资源 backend 的职责。

因此建议接受 Sinan 的 first-party design partner 关系，但只接受以下边界：

- Sinan owns contracts。
- Indirection owns specialized implementation。
- POC proves value。
- Validation protects boundaries。

Indirection 不应并入 Sinan，也不应让 Sinan 特例进入 core API。

## 2. 需要调整的项目定位

### 2.1 从“统一 authoring manifest”调整为“host-owned authoring + Indirection backend”

Indirection 仍可提供自己的 authoring manifest 规范，用于独立项目、fixtures、examples 和通用 CLI；但对成熟宿主来说，宿主 authoring manifest 可以继续作为 source-of-truth。

调整后的边界：

```txt
Host Authoring Contract
  host-owned manifest, schema, reference resolver, budget, fallback policy

Indirection Compilation Boundary
  importer, normalized catalog draft, diagnostics, deterministic report

Indirection Runtime Backend
  catalog store, resolver, dependency graph, scope/handle lifecycle, loader adapters
```

这意味着 `@indirection/compiler` 必须支持 importer 模型，而不是只接受 Indirection 自己的 manifest 格式。

### 2.2 Sinan 从首个 demo 宿主升级为 first-party design partner

README 和计划中的“Sinan Scene Director”应更新为 “Sinan Engine”。Scene Director 现在是 Sinan Engine 的 Director System，而不是完整产品边界。

Indirection 对 Sinan 的叙述应改为：

- Sinan Engine 是首个 first-party design partner。
- Gate Demo 是首个验收场景。
- Sinan 提供真实数据、validation pipeline、browser smoke 和预算报告。
- Sinan 不能定义 Indirection core 的宿主边界。

### 2.3 POC 顺序需要后移 runtime 替换

原 v0.1 设计把 Web/Three adapter、Vite plugin、GLTF、KTX2 等写得较完整，但实际研发顺序应收窄：

```txt
协议和报告
  -> runtime scope/handle
  -> fake loader 生命周期验证
  -> Sinan importer/report POC
  -> existing WebRuntime boundary behind adapter
  -> scene scope/group preload
  -> variant/compression/cache
```

第一阶段不应替换 Sinan runtime loader。

### 2.4 Runtime core 必须更严格地零依赖

保留并强化原设计原则：

- runtime core 不依赖 Zod。
- runtime core 不依赖 Three、React、Vite。
- runtime core 不隐式访问 `window`、`document`、`fetch`。
- transport、clock、logger、diagnostic sink、URL policy 全部注入。

### 2.5 提前把 ResourceTable 状态机变成 contract

资源生命周期是 Indirection 的护城河，需要作为 contract tests 的中心，而不是 Three adapter 的附属行为。

建议状态机：

```txt
idle
resolving
loading
decoding
ready
failed
fallback-ready
released
evictable
disposed
```

每个状态必须定义：

- 是否持有 transport。
- 是否持有 decoded value。
- 是否持有 disposer。
- refCount 如何变化。
- dependency retain/release 如何传播。
- 原始错误 cause 是否保留。
- fallback 是否改变 recoverable 语义。

## 3. 对 Sinan 商务函问题的建议回复

1. 是否接受 `data/assets.manifest.json` 继续作为 Sinan authoring source-of-truth？

   接受。Indirection 不替代 Sinan authoring manifest、schema、ReferenceResolver、budget/report policy 或 fallback policy。Indirection 只读取并生成派生产物。

2. `POC-1` 是否可以只做 importer + report，不要求 Sinan runtime 改造？

   可以，而且应当如此。POC-1 的价值是证明 deterministic catalog draft、diagnostics、budget/fallback/missing-reference report 能稳定生成、可 diff、可进入 CI。

3. compiled catalog 第一版建议放在哪里？

   POC-1 建议默认输出到 build cache，另提供可选的 `data/.compiled/indirection/` 用于 diffable report 和评审。只有 POC-2 runtime 真正消费 catalog 时，才把 runtime catalog 输出到 `public` 或 Sinan build artifacts。

4. Indirection adapter 第一阶段更适合放在哪里？

   POC-1 importer/report 可以在 Indirection 侧以 compatibility fixture 或 adapter package 原型实现，但不得进入 core。POC-2 runtime adapter 建议先放在 Sinan repo 内，方便遵守 Sinan facade、feature flag 和回退策略。API 稳定后再抽出 `@indirection/sinan`。

5. 是否能提供 vanilla fixture，防止 core 被 Sinan 过拟合？

   必须提供。Indirection v0.1 DoD 应包含一个 vanilla fixture 和一个非 Sinan 的 generic Three fixture。Sinan 相关词汇不得出现在 core API。

## 4. 研发计划

### Stage 0：Alignment Baseline

目标：完成合作边界和 v0.1 研发计划重排。

交付：

- Sinan 对齐研发计划。
- README 定位更新。
- 明确 `host-owned authoring + Indirection backend`。
- 将 Sinan Scene Director 表述升级为 Sinan Engine。

DoD：

- 文档说明 Indirection 不接管 Sinan source-of-truth。
- 文档说明 POC-1 不改 Sinan runtime。
- 文档说明 Sinan adapter 不进入 core。

### Stage A：Protocol Baseline

目标：先稳定协议、诊断和 catalog 确定性。

交付：

- `@indirection/protocol`
- `@indirection/schema`
- `@indirection/compiler`
- `@indirection/testkit`
- AssetId parser/normalizer。
- manifest schema。
- importer interface。
- diagnostic model。
- canonical JSON。
- catalog hash。
- fake catalog fixtures。

DoD：

- manifest -> catalog 输出可复现。
- diagnostics code 稳定，不依赖 message 文本。
- catalog hash 不包含时间戳、绝对路径或 Git SHA。
- importer contract test 覆盖 host-owned manifest 输入。

暂缓：

- GLTF。
- Vite plugin。
- Cache Storage。
- compression。

### Stage B：Runtime Lifecycle Core

目标：验证 Indirection 最核心的 runtime 价值。

交付：

- `@indirection/runtime`
- CatalogStore。
- ResolverChain。
- ResourceTable 状态机。
- AssetScope。
- AssetHandle。
- in-flight dedup。
- retain/release/dispose。
- deterministic fallback。
- debug snapshot。
- json/text/binary fake loader。

DoD：

- core 无 Zod、Three、React、Vite、DOM、implicit fetch 依赖。
- `scope.acquire(id)`、`handle.release()`、`scope.dispose()` 有完整单测。
- dependency retain/release 可测。
- 多消费者取消不误杀共享加载。
- fallback 保留原始 error cause。
- snapshot 暴露 refCount、state、source、cost、lastAccess 和 recent errors。

### Stage C：Sinan Report POC

目标：不改 Sinan runtime，仅证明 Indirection 能理解 Sinan authoring contract 并产出有价值的报告。

交付：

- Sinan manifest importer prototype。
- compiled catalog draft。
- missing reference report。
- budget report。
- fallback report。
- compatibility note。

DoD：

- 不修改 Sinan 正式 data。
- 不绕过 Sinan schema validation。
- report 可 diff，无时间戳噪音。
- Sinan 现有 validation 继续通过。
- report 可机器读取。

### Stage D：Runtime Adapter Behind Existing Boundary

目标：在不改变 Sinan 外部契约的前提下验证 Indirection runtime backend。

保留外部形态：

```txt
WebRuntime.loadModel(assetId, url)
```

内部可路由为：

```txt
Sinan AssetSystem facade
  -> sceneScope.acquire(assetId)
  -> Indirection runtime backend
  -> Three runtime adapter
```

DoD：

- Gate Demo 模型加载正常。
- 缺失资源触发 deterministic fallback。
- Browser smoke 通过。
- Three-specific decoder 仍只在 Three adapter 内。
- 可通过 feature flag 回退到 Sinan 内置 loader。

### Stage E：Scene Scope / Group Preload

目标：证明场景级生命周期和资源释放可观测。

交付：

- scene scope acquire/release。
- group preload。
- leak warning。
- scope diagnostics。
- repeated enter/exit smoke。

DoD：

- Gate Demo load 时 acquire scene scope。
- 退出时 scope dispose。
- 重复加载不重复泄漏。
- refCount 归零后资源进入 evictable/disposed。
- diagnostics 可被 editor/debug panel 消费。

### Stage F：Variant / Compression / Persistent Cache

目标：只在前面阶段稳定后推进高级加载策略。

交付：

- quality/locale/platform/capability variant。
- compressed source resolution。
- decoder capability detection。
- optional Cache Storage adapter。
- catalog version cache isolation。

DoD：

- low-end profile 可选择轻量 variant。
- 没有 decoder 时回退默认 source。
- compressed assets 不成为普通测试硬依赖。
- fallback path 始终存在。
- persistent cache 不改变 authoring source-of-truth。

## 5. v0.1 Definition of Done

Indirection v0.1 应满足：

- protocol/schema/compiler/runtime/testkit 可运行。
- runtime core 零外部依赖。
- manifest -> catalog 输出稳定。
- catalog hash 可复现。
- ResourceTable 状态机有 contract tests。
- Scope/Handle 生命周期有完整测试。
- dependency retain/release 有完整测试。
- deterministic fallback 保留原始 cause。
- diagnostics code 稳定。
- package install smoke 通过。
- Sinan importer 能输出 report，但不替换 Sinan runtime。
- 至少保留 vanilla fixture，避免 core 过拟合 Sinan。

## 6. 风险控制

### 6.1 防止做成大而全 Addressables

v0.1 禁止同时推进 CDN SaaS、patch、custom bundle、editor GUI、Cache Storage、GLTF compression 全套能力。每项能力必须服务于 AssetId、catalog、scope/handle、diagnostics 主线。

### 6.2 防止 Sinan 过拟合

Sinan、Gate Demo、CameraShot、Timeline、Editor store、ThreeRuntime 等词只能出现在 docs、fixtures、examples、adapter 或 compatibility package，不得进入 core API。

### 6.3 防止生命周期 API 难用

默认使用 `AssetScope` 管理生命周期，单独 `AssetHandle.release()` 作为高级用法。测试和文档都应优先展示 scope。

### 6.4 防止 diagnostics 退化为日志文本

稳定 `code` 是公共 API。`message` 可以变化，测试、report 和 AI 修复流程不得依赖自然语言 message。

## 7. 结论

Sinan 的三份材料不是在压缩 Indirection 的空间，反而帮助项目更准确地找到边界：Indirection 不应该争夺宿主 authoring source-of-truth，而应该成为稳定 AssetId 到可验证 catalog、运行时生命周期、fallback 和 diagnostics 的专门基础设施。

研发计划应立刻从“完整资源系统一次铺开”调整为“窄核心先稳定，Sinan POC 后接入，高级 loader/cache/variant 后置”。
