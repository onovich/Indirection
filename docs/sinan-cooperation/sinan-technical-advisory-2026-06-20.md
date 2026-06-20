# Sinan 技术顾问建议：Indirection

> 日期：2026-06-20
> 角色：Sinan Engine 领头技术顾问视角
> 阅读对象：Indirection 项目负责人、架构负责人、后续 Sinan adapter 负责人
> 依据文档：`docs/Indirection_寻址_架构与技术选型设计_v0.1.md`、`docs/sinan-cooperation/rfc-001-sinan-asset-boundary.md`

## 1. 总体判断

Indirection 的方向是四个外部基础设施项目里最适合尽早进入 Sinan POC 的一个。原因很简单：Sinan 已经有 `data/assets.manifest.json`、asset schema、asset budget/report、ReferenceResolver、Three GLB loader 和 fallback 路线，Indirection 的 manifest-first、compiled catalog、scope/handle lifecycle 正好补足 Sinan 后续 LOD、variant、compression、preload、dispose 和资源可观测性。

但也正因为它会触到资源事实源，Indirection 必须非常克制。Indirection 的核心价值不是替代宿主 manifest，也不是让所有引擎改用 Indirection 自己的资源数据库；它应该成为“稳定 AssetId 到运行时资源生命周期”的协议和 backend。对 Sinan 来说，Indirection 可以成为 resource backend，但不能成为 authoring source-of-truth。

建议路线：

```txt
先做协议和报告
再做 runtime scope/handle
再做 Web/Three loader
最后才做 variant/compression/cache strategy
```

首个 POC 不应替换 Sinan 的 runtime loader。先读取 Sinan manifest，输出 compiled catalog draft、diagnostics、budget/fallback report，并证明输出可 diff、可复现、可在 CI 中稳定运行。

## 2. 架构建议

### 2.1 保持三层边界

建议把项目架构固定为三层：

```txt
Authoring Manifest
  human/AI editable, friendly, host-owned

Compiled Catalog
  deterministic build artifact, Indirection-owned format

Runtime Resource Graph
  handles, scopes, in-flight dedup, retain/release, diagnostics
```

这三层不要混在同一个对象模型里。尤其注意：

- `AssetHandle` 不得进入 authoring manifest。
- `AssetScope` 不得进入宿主 JSON。
- `CompiledAssetCatalog` 可以缓存和提交，也可以 build 时生成，但永远是派生产物。
- runtime cache 命中、HTTP cache 命中、decoded resource 命中要分层报告，不能只给一个 `loaded: true`。

### 2.2 M0 先做 fake loader，不要急着上 GLTF

设计文档里 Web loader、Three adapter、GLTF、KTX2、Draco、meshopt 都写得很完整，但 v0.1 最危险的不是“没有 GLTF”，而是核心生命周期没站稳。

建议 M0/M1 的第一个可运行切片只支持：

```txt
json/text/binary fake loader
manifest -> catalog
scope.acquire(id)
in-flight dedup
handle.release()
scope.dispose()
diagnostic snapshot
deterministic fallback
```

等这些测试稳定，再做 GLTF。这样后续 Three adapter 出问题时，不会反过来污染核心 API。

### 2.3 ResourceTable 需要显式状态机

建议尽早写出资源状态机，并把它作为 contract test 的核心：

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

每个状态都要回答：

- 是否持有 transport？
- 是否持有 decoded value？
- 是否有 disposer？
- refCount 如何变化？
- dependent resources 是否被 retain？
- 出错时是否保留原始 cause？

如果状态机不清晰，后续 Cache Storage、variant、scene scope、Three GPU dispose 都会变成隐性 bug 来源。

### 2.4 Error code 要比 message 更稳定

Indirection 应该把 diagnostics 当作公共 API，而不是日志文本。建议所有错误都至少包含：

```txt
code
severity
assetId
phase
sourceUrl?
catalogVersion?
path?
causeCode?
recoverable
fallbackAssetId?
```

Message 可以变，但 `code` 不应该随意变。Sinan 的验证、report、Playwright smoke 和 AI 自动修复都会依赖稳定 code。

### 2.5 Variant 规则保持声明式

当前“声明顺序首个匹配，默认 source 最后”的选择很好。建议不要加入表达式、函数、脚本条件，也不要让 resolver 在 manifest 层执行任意逻辑。

推荐 v0.1 只保留：

```txt
quality
locale
platform
capability
```

自定义维度可以存在，但必须仍是字符串集合匹配。这样 AI、CI、compiler 和 report 都能解释为什么某个 variant 被选中。

## 3. 技术栈建议

### 3.1 包拆分可以规划，但实现顺序要更窄

设计文档里的 workspace 包结构合理，但第一批不必一次全建。建议第一阶段只做：

```txt
@indirection/protocol
@indirection/schema
@indirection/compiler
@indirection/runtime
@indirection/testkit
```

`loaders-web`、`three`、`vite`、`cli` 可以等 protocol 和 runtime contract 稳定后再加。CLI 可以先以 compiler 包里的 bin entry 形式存在，避免过早维护一堆包。

### 3.2 runtime core 维持零依赖

这个原则必须保留：

- runtime core 不依赖 Zod。
- runtime core 不依赖 Three、Vite、React。
- runtime core 不隐式访问 `window`、`document`、`fetch`。
- transport、clock、logger、diagnostic sink 都通过注入。

这样 Indirection 才能同时跑在 browser、Node tests、service worker、editor preview 和其他引擎宿主里。

### 3.3 构建链路优先选择朴素稳定

建议先使用：

```txt
TypeScript strict
project references
ESM-only
Vitest
Playwright for browser smoke
Changesets
publint / package install smoke
```

不要在 v0.1 引入自定义 bundler、复杂任务编排或 asset bundle 格式。Indirection 的复杂性应该来自资源语义，而不是构建系统。

## 4. 与 Sinan 的合作建议

### 4.1 Sinan adapter 不要放进 core

Sinan 相关代码建议一开始放在 Sinan 仓库，或者作为独立 `@indirection/sinan` adapter。Indirection core 只维护 importer/adapter 所需的公共接口和 contract tests。

Indirection core 不应该出现：

```txt
Sinan
CameraShot
Timeline
ThreeRuntime
Gate Demo
Editor store
```

这些词可以出现在 docs、examples、adapter、fixtures，但不能进入 core API。

### 4.2 POC 顺序

推荐按 RFC-001 执行，但把每步退出标准写得更硬：

1. **Manifest Importer + Report**
   - 输入 Sinan `data/assets.manifest.json`。
   - 输出 catalog draft 和 diagnostics。
   - 不改 Sinan runtime。
   - report 可 diff、无时间戳噪音。

2. **Runtime Loader Behind Existing Boundary**
   - 仍保留 `WebRuntime.loadModel(assetId, url)` 外部形态。
   - 内部可用 `sceneScope.acquire(assetId)`。
   - 缺失资源走 deterministic fallback。

3. **Scene Scope**
   - Gate Demo load 时 acquire scope。
   - dispose 后资源进入 evictable/disposed 状态。
   - 有 leak warning 和 snapshot。

4. **Variant / Compression**
   - 只在前三步稳定后开始。
   - 没有 decoder 时必须回退默认 source。

### 4.3 Sinan 最关心的验收

进入 Sinan 主线前，Indirection adapter 至少要证明：

- 不替代 `data/assets.manifest.json`。
- 不绕过 Sinan ReferenceResolver。
- 不让 Three object 泄漏到 Sinan semantic layer。
- fallback 可预测。
- report 可机器读取。
- failed load 不会破坏 editor session。
- scope dispose 可测。
- 同一资源并发加载只发生一次 decode。

## 5. 近期优先级

建议接下来 3 个阶段这样安排：

### Stage A：Protocol Baseline

- AssetId parser/normalizer。
- manifest schema。
- canonical JSON。
- diagnostics code。
- catalog hash。
- fake catalog fixtures。

### Stage B：Runtime Lifecycle

- CatalogStore。
- ResolverChain。
- ResourceTable。
- Scope/Handle。
- in-flight dedup。
- retain/release/dispose。
- debug snapshot。

### Stage C：Sinan Report POC

- Sinan manifest importer。
- budget/fallback/missing reference report。
- compatibility note。
- contract tests。

GLTF、Vite plugin、Cache Storage、KTX2/Draco 都可以排在这三步之后。

## 6. 最大风险

### 风险一：过早成为“大而全 Addressables”

如果 v0.1 同时做 CDN、bundle、patch、compression、editor GUI、GLTF、Cache Storage，很容易拖慢协议稳定。建议每个能力都必须先回答：它是否服务于 AssetId、catalog、handle/scope 这条主线。

### 风险二：POC 过拟合 Sinan

Sinan 是第一个真实宿主，但 Indirection 需要至少保留一个 vanilla fixture 和一个非 Sinan Three 示例。否则项目会被误解成 Sinan 内部资源模块。

### 风险三：生命周期 API 难用

如果用户必须手动管理每个 handle，泄漏会很多。建议默认鼓励 `AssetScope`，把单独 handle release 作为高级用法。

## 7. 建议的 v0.1 Definition of Done

Indirection v0.1 建议满足：

- protocol/schema/compiler/runtime/testkit 可运行。
- core 无 Zod、Three、React、Vite、DOM 依赖。
- manifest -> catalog 输出稳定。
- catalog hash 可复现。
- Scope/Handle 生命周期有完整测试。
- dependency retain/release 有完整测试。
- fallback 保留原始错误 cause。
- diagnostics code 稳定。
- package install smoke 通过。
- Sinan manifest importer 能输出 report，但不替换 Sinan runtime。

## 8. 给项目方的一句话建议

Indirection 的护城河不是“能加载 GLB”，而是“让资源身份、构建报告、运行时生命周期和 fallback 都变得可验证”。只要先把这个窄核心做稳，后续 Web loader、Three adapter、Vite plugin、compression 和 Sinan Gate Demo 都会自然接上。
