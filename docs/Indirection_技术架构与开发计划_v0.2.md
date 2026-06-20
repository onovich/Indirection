# Indirection 技术架构与开发计划 v0.2

- 日期：2026-06-20
- 状态：当前执行口径
- 基于共识：Sinan RFC、技术顾问建议、商务合作函、Indirection v0.1 架构基线
- 目标：把 Indirection 从设计基线推进到可实现、可测试、可对接 Sinan POC 的研发计划

---

## 0. 当前结论

Indirection 的近期研发重心不是“做一个完整 Web Addressables”，而是先做稳一条窄核心链路：

```txt
稳定 AssetId
  -> host-owned authoring importer
  -> deterministic compiled catalog
  -> diagnostics/report
  -> runtime catalog store
  -> resolver/dependency graph
  -> AssetScope/AssetHandle lifecycle
  -> fake loaders + contract tests
```

Sinan Engine 是 first-party design partner，但不是 Indirection core 的边界。Sinan 保留 authoring manifest、schema、ReferenceResolver、budget/report policy 与 fallback policy；Indirection 提供 importer、compiled catalog、diagnostics、runtime backend、scope/handle lifecycle、loader adapter contract。

研发优先级：

1. 协议与诊断稳定。
2. 编译产物可复现。
3. 运行时生命周期可测试。
4. Sinan POC 先做 importer + report，不改 runtime。
5. Three、Vite、compression、Cache Storage 后置。

---

## 1. 产品与架构定位

### 1.1 一句话定义

Indirection 是面向 Web 游戏与 3D 编辑器的资源寻址协议、编译边界和运行时生命周期 backend。它让宿主用稳定 `AssetId` 表达资源身份，并把资源解析、依赖、加载、fallback、diagnostics 与释放行为变成可验证的工程系统。

### 1.2 非目标

v0.2 不做：

- 不替代成熟宿主的 authoring manifest。
- 不接管 Sinan `data/assets.manifest.json`。
- 不实现自定义二进制 AssetBundle。
- 不做 CDN SaaS、patching、remote update 商业管线。
- 不默认引入 Three、Vite、React、Zod 到 runtime core。
- 不在首轮实现 GLTF、KTX2、Draco、meshopt。
- 不把 Sinan Gate Demo 特例写进 core API。

### 1.3 关键边界

```txt
Host Authoring Contract
  owner: host
  examples: Sinan data/assets.manifest.json, schema, ReferenceResolver

Indirection Compilation Boundary
  owner: Indirection
  examples: importer, normalized records, diagnostics, compiled catalog, report

Indirection Runtime Backend
  owner: Indirection
  examples: CatalogStore, ResolverChain, ResourceTable, Scope, Handle

Host Adapter
  owner: host or adapter package
  examples: Sinan AssetSystem facade, WebRuntime bridge, Three runtime loader
```

原则：

- authoring source-of-truth 永远留在宿主或 Indirection 自己的 authoring manifest 中。
- compiled catalog 是派生产物，可以缓存、提交或 build 时生成，但不能成为手写事实源。
- runtime handle、scope id、cache hit、decoded object 都不能进入宿主 JSON。
- adapter 可以懂宿主，core 不懂宿主。

---

## 2. 总体架构设计

### 2.1 分层架构

```txt
Authoring Layer
  host manifest / Indirection manifest / fixtures

Compiler Layer
  importer -> normalized authoring model -> validation -> catalog -> report

Protocol Layer
  AssetId, catalog types, diagnostics, loader contracts, state contracts

Runtime Layer
  CatalogStore, ResolverChain, DependencyPlanner, ResourceTable, Scope, Handle

Adapter Layer
  fake loaders, web loaders, Three adapter, Sinan bridge, future Vite plugin
```

### 2.2 数据流

```txt
Host data/assets.manifest.json
  -> host validation
  -> Indirection importer
  -> normalized asset records
  -> Indirection validation
  -> deterministic compiled catalog
  -> JSON report / diagnostics
  -> runtime CatalogStore
  -> scope.acquire(assetId)
  -> resolver + dependency graph
  -> ResourceTable state machine
  -> loader adapter
  -> AssetHandle
```

Sinan POC-1 停在 `JSON report / diagnostics`，不进入 runtime 替换。

### 2.3 包架构

第一阶段只建立 5 个核心包：

```txt
packages/
  protocol/       # @indirection/protocol
  schema/         # @indirection/schema
  compiler/       # @indirection/compiler
  runtime/        # @indirection/runtime
  testkit/        # @indirection/testkit
```

后置包：

```txt
packages/
  loaders-web/    # browser fetch/image/audio/json loaders
  three/          # peerDependency: three
  vite/           # peerDependency: vite
  cli/            # may start as compiler bin before split
  sinan/          # only after adapter API stabilizes
```

依赖方向：

```txt
protocol
  <- schema
  <- compiler
  <- runtime
  <- testkit

schema -> compiler
runtime -> protocol
compiler -> protocol + schema
testkit -> protocol + compiler + runtime
```

禁止方向：

- `protocol` 不依赖任何业务包。
- `runtime` 不依赖 `schema`。
- `runtime` 不依赖 DOM、fetch、Three、Vite、React。
- `compiler` 不依赖 runtime object。
- `core` 包不出现 Sinan 专有类型。

---

## 3. 技术设计

### 3.1 TypeScript 与模块策略

基础策略：

- ESM-only。
- TypeScript strict。
- pnpm workspace。
- `tsc -b` project references。
- Vitest 作为第一阶段测试。
- Playwright 留给后续 browser smoke。

第一阶段不引入复杂 bundler。包发布验证后续加入 publint、Are the Types Wrong、pack install smoke。

### 3.2 Protocol 包

职责：

- 定义稳定公共类型。
- 提供 AssetId parser/normalizer。
- 定义 diagnostics code、severity、phase。
- 定义 catalog/runtime contract 的最小类型。
- 不做 I/O，不依赖 schema/runtime/compiler。

核心类型草案：

```ts
export type AssetId = string & { readonly __brand: "AssetId" };

export interface AssetIdParts {
  readonly namespace?: string;
  readonly path: readonly string[];
}

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: "info" | "warning" | "error";
  readonly phase: DiagnosticPhase;
  readonly assetId?: string;
  readonly path?: readonly string[];
  readonly sourceUrl?: string;
  readonly catalogVersion?: string;
  readonly causeCode?: string;
  readonly recoverable: boolean;
  readonly fallbackAssetId?: string;
  readonly message: string;
}
```

设计约束：

- `code` 是公共 API，`message` 不是。
- `AssetId` 不包含路径语义。
- protocol 不知道 Sinan、Three、Vite。

### 3.3 Schema 包

职责：

- 提供 Indirection 自有 authoring manifest schema。
- 提供 compiled catalog schema。
- 提供 diagnostics/report schema。
- 仅供 compiler/tooling 使用。

约束：

- 可以依赖 Zod。
- 不进入 runtime core bundle graph。
- schema 输出要能支持 JSON Schema 或机器报告消费。

### 3.4 Compiler 包

职责：

- 接收 Indirection manifest 或 host importer 输出。
- 执行结构校验、语义校验、引用校验、variant 校验、fallback 校验。
- 生成 deterministic compiled catalog。
- 生成 diffable report。

Importer contract 草案：

```ts
export interface AssetImporter<Input = unknown> {
  readonly id: string;
  readonly host?: string;

  import(input: Input, context: ImportContext): Promise<ImportResult> | ImportResult;
}

export interface ImportResult {
  readonly assets: readonly NormalizedAssetRecord[];
  readonly groups?: readonly NormalizedAssetGroup[];
  readonly diagnostics: readonly Diagnostic[];
}
```

编译阶段：

```txt
read inputs
  -> importer
  -> structural validation
  -> normalize AssetId
  -> dependency/group/fallback graph validation
  -> variant rule validation
  -> canonical ordering
  -> catalog hash
  -> report
```

确定性要求：

- 稳定 key 顺序。
- hash 不包含时间戳、绝对路径、Git SHA。
- report 可 diff。
- diagnostics path 稳定。

### 3.5 Runtime 包

职责：

- 加载 compiled catalog。
- 根据 context resolve source。
- 构建 dependency acquisition。
- 维护 ResourceTable 状态机。
- 管理 scope/handle lifecycle。
- 提供 diagnostics snapshot。
- 通过注入 transport/loader/clock/logger 运行。

核心对象：

```txt
CatalogStore
ResolverChain
DependencyPlanner
LoadScheduler
ResourceTable
AssetScope
AssetHandle
LoaderRegistry
DiagnosticSink
```

首轮 fake loader：

```txt
data/json
text/plain
binary/array-buffer
```

runtime 不直接使用 fetch。首轮 transport 可以是 in-memory test transport。

### 3.6 ResourceTable 状态机

状态：

| State | 说明 | 持有 value | 可 acquire | 可 release | 可 evict |
|---|---|---:|---:|---:|---:|
| idle | catalog 有记录但未请求 | 否 | 是 | 否 | 否 |
| resolving | 正在选择 source | 否 | 是 | 是 | 否 |
| loading | transport 进行中 | 否 | 是 | 是 | 否 |
| decoding | loader 解码中 | 否 | 是 | 是 | 否 |
| ready | 已有 decoded value | 是 | 是 | 是 | 否 |
| failed | 加载失败且无 fallback | 否 | 可重试 | 是 | 是 |
| fallback-ready | fallback 成功 | 是 | 是 | 是 | 否 |
| released | refCount 归零 | 可能 | 是 | 幂等 | 是 |
| evictable | 等待淘汰 | 是 | 是 | 幂等 | 是 |
| disposed | disposer 已执行 | 否 | 可重新加载 | 幂等 | 否 |

必须测试：

- 同一资源并发 acquire 只触发一次底层 load。
- 单消费者 abort 不取消共享底层请求。
- 所有消费者 abort 后可以取消底层请求。
- parent asset 持有 dependency，直到 parent 释放。
- `handle.release()` 幂等。
- `scope.dispose()` 释放其所有 handle。
- fallback-ready 保留原始 failure cause。
- disposed 后重新 acquire 可以重新加载。

### 3.7 Diagnostics 与 report

Diagnostics 是公共 API。

第一批 code：

```txt
IND_ASSET_ID_INVALID
IND_ASSET_DUPLICATE
IND_ASSET_UNKNOWN
IND_TYPE_UNSUPPORTED
IND_SOURCE_UNRESOLVED
IND_DEPENDENCY_CYCLE
IND_FALLBACK_CYCLE
IND_FALLBACK_TYPE_MISMATCH
IND_VARIANT_INVALID
IND_CATALOG_INVALID
IND_TRANSPORT_FAILED
IND_DECODE_FAILED
IND_ABORTED
IND_SCOPE_DISPOSED
IND_INTERNAL_ERROR
```

Report 第一阶段包含：

- catalog summary。
- asset list。
- group list。
- diagnostics。
- fallback summary。
- dependency graph summary。
- determinism metadata。

Report 不包含：

- 当前时间戳作为 diff 输入。
- 本地绝对路径作为稳定字段。
- loader handle。
- runtime cache state。

### 3.8 Variant 规则

v0.2 保持声明式规则：

```txt
quality
locale
platform
capability
```

规则：

- `sources` 按声明顺序匹配。
- 首个满足 `when` 的 source 生效。
- 默认 source 必须存在，且放在最后。
- 条件值是字符串集合，不允许表达式、函数、脚本。
- 自定义维度未来可扩展，但仍必须是字符串集合匹配。

### 3.9 Sinan POC 接入设计

POC-1：

```txt
Sinan data/assets.manifest.json
  -> Sinan validation remains authoritative
  -> Sinan importer prototype
  -> Indirection normalized records
  -> compiled catalog draft
  -> missing reference / budget / fallback report
```

不做：

- 不改 Sinan runtime。
- 不改 Sinan data。
- 不删除 Sinan loader。
- 不把 Sinan schema 移入 Indirection core。

POC-2 以后：

```txt
WebRuntime.loadModel(assetId, url)
  -> Sinan AssetSystem facade
  -> Indirection backend adapter
  -> sceneScope.acquire(assetId)
  -> Three adapter
```

Adapter 初期建议放在 Sinan repo 或 compatibility package，稳定后再考虑 `@indirection/sinan`。

---

## 4. 仓库结构计划

首轮落地结构：

```txt
indirection/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  tsconfig.json
  packages/
    protocol/
      package.json
      tsconfig.json
      src/
      test/
    schema/
      package.json
      tsconfig.json
      src/
      test/
    compiler/
      package.json
      tsconfig.json
      src/
      test/
    runtime/
      package.json
      tsconfig.json
      src/
      test/
    testkit/
      package.json
      tsconfig.json
      src/
  fixtures/
    vanilla/
    sinan/
  docs/
```

首轮 scripts：

```json
{
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "echo \"lint not configured yet\"",
    "format": "prettier --check ."
  }
}
```

是否在第一轮加入 ESLint/Prettier，可在 scaffold 时决定。若加入，必须保持配置朴素，不能喧宾夺主。

---

## 5. 开发计划

### Phase 0：文档与执行口径

目标：完成当前共识归档。

交付：

- v0.2 技术架构与开发计划。
- README 指向当前执行文档。
- v0.1 基线保留历史记录。

验收：

- 文档明确 host-owned authoring。
- 文档明确第一阶段不替换 Sinan runtime。
- 文档明确 core 依赖边界。

### Phase 1：Workspace Scaffold

目标：建立可构建、可测试的 monorepo 骨架。

任务：

- 新建 pnpm workspace。
- 新建 `protocol/schema/compiler/runtime/testkit` 包。
- 建立 TypeScript project references。
- 建立 Vitest。
- 添加 root scripts。
- 添加基础 fixtures 目录。

验收：

- `pnpm install` 成功。
- `pnpm typecheck` 成功。
- `pnpm test` 成功。
- 各包 exports 可被测试导入。

### Phase 2：Protocol Baseline

目标：把公共协议最小闭环写稳。

任务：

- 实现 AssetId parser/normalizer。
- 定义 diagnostics types 与 code。
- 定义 catalog 最小类型。
- 定义 importer normalized model。
- 添加 protocol tests。

验收：

- AssetId 合法/非法用例覆盖。
- diagnostics snapshot 稳定。
- protocol 包零外部依赖。

### Phase 3：Schema 与 Compiler Determinism

目标：实现 manifest -> catalog 的确定性编译。

任务：

- 实现 Indirection manifest schema。
- 实现 importer interface。
- 实现 canonical JSON。
- 实现 catalog hash。
- 实现 dependency/fallback/variant 基础校验。
- 生成 report。
- 添加 vanilla fixture。

验收：

- 同一 fixture 多次编译 hash 一致。
- report 无时间戳噪音。
- dependency cycle、fallback cycle、missing asset 有稳定 diagnostics code。
- importer contract test 覆盖 host-owned manifest 输入。

### Phase 4：Runtime Lifecycle Core

目标：实现可测试的 runtime backend。

任务：

- CatalogStore。
- ResolverChain。
- ResourceTable 状态机。
- AssetScope。
- AssetHandle。
- fake loader registry。
- in-memory transport。
- deterministic fallback。
- debug snapshot。

验收：

- in-flight dedup 测试通过。
- handle/scope release 幂等。
- dependency retain/release 测试通过。
- fallback 保留原始 cause。
- runtime core 无 DOM/fetch/Zod/Three/Vite 依赖。

### Phase 5：Sinan Report POC

目标：证明 Indirection 能在不改 Sinan runtime 的前提下产出报告价值。

任务：

- 建立 `fixtures/sinan/`。
- 实现 Sinan manifest importer prototype。
- 输出 catalog draft。
- 输出 missing reference report。
- 输出 fallback report。
- 输出 budget compatibility report。
- 写 compatibility note。

验收：

- 不修改 Sinan 正式 data。
- report 可 diff。
- report 可机器读取。
- Sinan 专有代码不进入 core。
- README 或 docs 说明 POC-1 使用方式。

### Phase 6：Runtime Adapter POC

目标：在现有宿主边界后验证 runtime backend。

任务：

- 设计 adapter facade。
- 保留 `WebRuntime.loadModel(assetId, url)` 外部契约。
- 接入 scene scope。
- 添加 feature flag 和 fallback path。
- 增加 browser smoke。

验收：

- Gate Demo 加载正常。
- 缺失资源 deterministic fallback。
- 可回退到 Sinan 内置 loader。
- Three-specific code 不进入 core。

### Phase 7：Advanced Loaders

目标：在核心稳定后扩展 Web/Three/Vite/variant/cache。

任务：

- `@indirection/loaders-web`。
- `@indirection/three`。
- variant profile。
- optional Cache Storage adapter。
- Vite plugin。
- CLI polish。

验收：

- compressed decoder 不成为普通测试硬依赖。
- low-end profile 可选择轻量 variant。
- Cache Storage version isolation 可测。
- package install smoke 通过。

---

## 6. 最近一轮开发 Backlog

建议下一轮直接执行 Phase 1 + Phase 2 的最小切片。

### P1

- 初始化 pnpm workspace。
- 创建 5 个首轮包。
- 配置 TypeScript project references。
- 配置 Vitest。
- 实现 `parseAssetId()` 与测试。
- 定义 `Diagnostic` 与第一批 code。

### P2

- 实现 canonical JSON。
- 实现 catalog hash。
- 定义 importer normalized model。
- 添加 vanilla fixture。
- 添加 compiler determinism 测试。

### P3

- 起草 ResourceTable 状态机测试用例。
- 起草 Sinan importer input fixture。
- 起草 report JSON shape。

不进入下一轮：

- GLTF。
- Three adapter。
- Vite plugin。
- Cache Storage。
- compression。

---

## 7. 决策记录

| 决策 | 当前结论 |
|---|---|
| authoring source-of-truth | 宿主拥有；Indirection 可拥有自己的通用 manifest，但不替代成熟宿主 manifest |
| Sinan 定位 | first-party design partner，不是 core owner |
| POC-1 | importer + report，不改 runtime |
| runtime core 依赖 | 零 DOM、零 fetch、零 Zod、零 Three、零 Vite、零 React |
| 第一批包 | protocol/schema/compiler/runtime/testkit |
| 第一批 loader | json/text/binary fake loader |
| diagnostics | code 稳定，message 可变 |
| variant | 声明式字符串集合匹配 |
| adapter 位置 | 初期可在宿主 repo 或 compatibility package，稳定后再抽包 |

---

## 8. Open Questions

1. npm scope 是否最终使用 `@indirection/*`。
2. 首轮是否立刻加入 Prettier/ESLint，还是只用 TypeScript + Vitest。
3. Sinan POC fixture 是否能使用脱敏真实 manifest。
4. POC-1 catalog draft 默认输出到 build cache，还是在 fixtures 中提交一份 snapshot。
5. 是否需要在 v0.1 产品发布前定义完整 report JSON Schema。

---

## 9. Definition of Done for v0.2 Plan

本计划完成后，项目应该具备：

- 清晰的 host-owned authoring 边界。
- 清晰的 compiler/runtime/adapter 分层。
- 可执行的 monorepo scaffold 任务。
- 可测试的 protocol/compiler/runtime 最小闭环。
- 可对 Sinan 回复的 POC 路线。
- 明确哪些能力暂缓，避免首轮发散。

一句话：先把资源身份、编译报告、运行时生命周期和 fallback 变成稳定契约，再让 Web loader、Three adapter、Sinan Gate Demo 和高级 cache/variant 自然接上。
