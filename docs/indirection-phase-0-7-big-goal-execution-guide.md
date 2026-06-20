# Indirection Phase 0-7 Big Goal 执行指南

日期：2026-06-20
状态：给 Goal 模式执行者使用的全阶段开发指令文档
范围：把 Phase 0 到 Phase 7 视为一个连续大 Goal，从文档执行口径推进到高级 loader/cache/variant 能力闭环。

---

## 0. 直接给执行者的 Goal Prompt

请以 Goal 模式执行 `D:\LabProjects\Engine\Indirection` 项目的 Phase 0-7 大 Goal。

总目标：按照 `docs/Indirection_技术架构与开发计划_v0.2.md` 和本执行指南，在不破坏 host-owned authoring 边界的前提下，完成 Indirection 从文档基线到可构建、可测试、可验证的资源寻址协议、compiler、runtime lifecycle、Sinan report POC、runtime adapter POC，以及后续 Web/Three/Vite/variant/cache 扩展。

总轮数预算：48 轮。

- 第 1-40 轮：主实现。
- 第 41-46 轮：缓冲修复、兼容性补齐、测试稳定化。
- 第 47 轮：release candidate 与文档同步。
- 第 48 轮：最终验证、提交、推送和 PASS 报告。

每一轮都必须：

- 先读本指南和本轮相关上下文。
- 明确本轮目标。
- 做 Debug 自检。
- 做架构边界自检。
- 运行本轮相关验证命令。
- 验证通过后提交并推送。
- 报告 commit hash、push 结果、下一轮目标。

推进规则：

- 验证失败：不得提交推送，不得进入下一轮。
- 验证通过但提交失败：不得进入下一轮。
- 提交成功但推送失败：不得进入下一轮。
- 推送成功：记录 commit hash 与远端分支，然后进入下一轮。

---

## 1. 必读上下文

执行前必须阅读：

- `README.md`
- `docs/Indirection_技术架构与开发计划_v0.2.md`
- `docs/rd-plan-sinan-alignment-2026-06-20.md`
- `docs/Indirection_寻址_架构与技术选型设计_v0.1.md`
- `docs/sinan-cooperation/rfc-001-sinan-asset-boundary.md`
- `docs/sinan-cooperation/sinan-technical-advisory-2026-06-20.md`
- `docs/sinan-cooperation/sinan-business-letter-2026-06-20.md`
- `docs/codex-git-workflow.md`
- `.codex/project-git-workflow.json`

已接受的项目共识：

- Sinan Engine 是 first-party design partner，但不是 Indirection core owner。
- Sinan 保留 authoring manifest、schema、ReferenceResolver、budget/report policy 与 fallback policy。
- Indirection 提供 importer、compiled catalog、diagnostics、runtime backend、scope/handle lifecycle 与 loader adapter contract。
- POC-1 只做 importer + report，不改 Sinan runtime。
- Runtime core 必须零 DOM、零 implicit fetch、零 Zod、零 Three、零 Vite、零 React。
- Sinan、Gate Demo、CameraShot、Timeline、Editor store、ThreeRuntime 等词不能进入 core API。

---

## 2. 本大 Goal 要完成什么

### Phase 0：文档与执行口径

完成当前文档基线、执行指南、README 入口和研发边界同步。

### Phase 1：Workspace Scaffold

建立 pnpm workspace、TypeScript project references、Vitest，以及 `protocol/schema/compiler/runtime/testkit` 五个首轮核心包。

### Phase 2：Protocol Baseline

实现 `AssetId` parser/normalizer、diagnostics code、catalog 最小类型、importer normalized model 和 protocol tests。

### Phase 3：Schema 与 Compiler Determinism

实现 schema、importer interface、canonical JSON、catalog hash、dependency/fallback/variant 基础校验、report 和 vanilla fixture。

### Phase 4：Runtime Lifecycle Core

实现 CatalogStore、ResolverChain、ResourceTable 状态机、AssetScope、AssetHandle、fake loader、in-memory transport、deterministic fallback 和 debug snapshot。

### Phase 5：Sinan Report POC

建立 Sinan fixture 和 importer prototype，输出 catalog draft、missing reference report、fallback report、budget compatibility report 与 compatibility note。

### Phase 6：Runtime Adapter POC

在保留 `WebRuntime.loadModel(assetId, url)` 外部边界的前提下，设计 runtime adapter facade、scene scope、feature flag、fallback path 和 browser smoke。

### Phase 7：Advanced Loaders

在核心稳定后扩展 `loaders-web`、`three`、variant profile、optional Cache Storage adapter、Vite plugin、CLI polish 与 package install smoke。

---

## 3. 本大 Goal 不做什么

- 不把 Sinan authoring manifest 迁入 Indirection core。
- 不绕过 Sinan schema validation 或 ReferenceResolver。
- 不把 compiled catalog 当作手写 source-of-truth。
- 不让 loader handle、scope id、runtime URL、decoded object 进入宿主 JSON。
- 不在 Phase 1-5 提前实现 GLTF/KTX2/Draco/meshopt。
- 不在 runtime core 中直接访问 `window`、`document`、`fetch`。
- 不在 core API 中出现 Sinan 专有实体。
- 不为了赶进度跳过每轮验证、提交和推送。
- 不批量暂存无关未跟踪文件。

---

## 4. 架构边界

### 4.1 分层

```txt
Host Authoring Contract
  host-owned manifest, schema, resolver, budgets, fallback policy

Indirection Compilation Boundary
  importer, normalized records, validation, deterministic catalog, report

Indirection Runtime Backend
  CatalogStore, ResolverChain, DependencyPlanner, ResourceTable, Scope, Handle

Adapter Layer
  fake loaders, web loaders, Three adapter, Sinan bridge, future Vite plugin
```

### 4.2 包依赖方向

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

禁止：

- `runtime -> schema`
- `runtime -> zod`
- `runtime -> three`
- `runtime -> vite`
- `runtime -> DOM/fetch implicit globals`
- `protocol -> any project package`

### 4.3 Diagnostics

Diagnostics code 是公共 API，message 不是公共 API。

每个 diagnostic 至少保留：

- `code`
- `severity`
- `phase`
- `assetId?`
- `path?`
- `sourceUrl?`
- `catalogVersion?`
- `causeCode?`
- `recoverable`
- `fallbackAssetId?`
- `message`

### 4.4 ResourceTable 状态机

必须覆盖：

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

每个状态必须说明：

- 是否持有 transport。
- 是否持有 decoded value。
- 是否有 disposer。
- refCount 如何变化。
- dependency retain/release 如何传播。
- 原始 error cause 是否保留。

---

## 5. 每轮固定工作流

每轮开始：

1. `git status --short --branch`
2. 阅读本指南和本轮所需文档。
3. 检查是否有用户/他人未提交变更。
4. 明确本轮只处理哪些文件和目标。
5. 如需修改计划，先更新文档，再实现代码。

每轮实现：

1. 最小范围修改。
2. 新能力必须配测试或 fixture。
3. 不把后置 Phase 范围提前拉入当前轮。
4. 不 stage 无关文件。

每轮验证：

1. 运行本轮相关验证命令。
2. 至少运行 `git diff --check`。
3. 若 package 已建立，运行 `pnpm typecheck` 和 `pnpm test`。
4. 若改 package exports，补 package import smoke。
5. 若改 browser-facing 能力，补 smoke 或说明为什么本轮还不需要。

每轮完成：

1. 用项目 git wrapper 或等价命令提交推送。
2. 记录 commit hash。
3. 记录 push 结果。
4. 报告下一轮目标。

---

## 6. 每轮通过后的提交推送工作流

优先使用项目已初始化的 wrapper：

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Validate.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths "path1,path2"
```

如果 wrapper 因配置缺失无法使用，才使用：

```powershell
git status --short --branch
git diff --stat
git add -- <phase-relevant files>
git commit -m "<phase>: <round summary>"
git push
git status --short --branch
```

提交规则：

- 不提交无关未跟踪文件。
- 不提交生成产物，除非该产物明确是 fixture 或 snapshot。
- 不 force-push。
- 不使用 destructive git command，除非用户明确要求。

推荐提交信息：

```txt
docs: add phase 0-7 goal guide
build: scaffold workspace
feat(protocol): add asset id parsing
feat(compiler): add deterministic catalog output
feat(runtime): add resource table lifecycle
feat(sinan): add report importer fixture
feat(adapter): add runtime facade poc
feat(loaders): add web loader baseline
```

---

## 7. 每轮必须报告的 Gate Template

每轮回复必须包含：

```txt
本轮目标：
本轮完成内容：
Debug 自检：
架构自检：
已运行验证命令与结果：
commit hash 与 push 结果：
下一轮目标：
是否消耗缓冲轮：
```

推进规则：

- 验证失败：不提交，不推送，不进入下一轮。
- 验证通过但提交失败：不进入下一轮。
- 提交成功但推送失败：不进入下一轮。
- 推送成功：记录 commit hash 和远端分支，进入下一轮。

---

## 8. Debug 自检清单

每轮必须回答：

- 当前变化能否用最小 fixture 或用户 workflow 解释？
- 失败能否定位到 parser、compiler、runtime、transport、loader、adapter、CLI、browser smoke 中的具体层？
- 是否覆盖 success、failure、empty、stale、incompatible 状态？
- 如果改了状态机，是否覆盖 export/import/validate/migration 边界？
- 如果改了 report，是否保证 report 可 diff、无时间戳噪音？
- 如果改了 runtime，是否覆盖并发、取消、release、fallback、dispose？
- 如果改了 UI/browser-facing 能力，是否增加可重复 smoke？

---

## 9. 架构自检清单

每轮必须回答：

- host-owned source-of-truth 是否仍然是 source-of-truth？
- compiled catalog 是否仍是派生产物？
- runtime handle/scope/cache 是否没有进入 authoring JSON？
- runtime core 是否仍零 DOM、零 implicit fetch、零 Zod、零 Three、零 Vite、零 React？
- compiler 是否没有复制 runtime 状态语义？
- adapter 是否没有把宿主特例推入 core API？
- diagnostics 是否使用稳定 code，而不是依赖 message？
- 本轮是否避免把后置 Phase 范围提前拉入？
- 是否保留 unrelated files、generated outputs 和用户变更？

---

## 10. 分轮安排

总预算：48 轮。

### Phase 0：文档与执行口径

| Round | 目标 | 验证 |
|---:|---|---|
| 1 | 固化 v0.2 计划、本大 Goal 指南、README 链接，提交文档基线 | `git diff --check`，链接存在性检查 |

### Phase 1：Workspace Scaffold

| Round | 目标 | 验证 |
|---:|---|---|
| 2 | 初始化 pnpm workspace、root package、tsconfig base、workspace config | `pnpm install`，`pnpm typecheck` |
| 3 | 创建 protocol/schema/compiler/runtime/testkit 包骨架与 exports | `pnpm typecheck`，`pnpm test` |

### Phase 2：Protocol Baseline

| Round | 目标 | 验证 |
|---:|---|---|
| 4 | 实现 AssetId 类型、parser、normalizer、基础非法用例 | `pnpm test -- --runInBand` 或 `pnpm test` |
| 5 | 定义 diagnostics code、severity、phase、Diagnostic 类型 | `pnpm typecheck`，`pnpm test` |
| 6 | 定义 catalog 最小类型、importer normalized model、protocol snapshot tests | `pnpm typecheck`，`pnpm test` |

### Phase 3：Schema 与 Compiler Determinism

| Round | 目标 | 验证 |
|---:|---|---|
| 7 | 建立 schema 包，定义 Indirection authoring manifest schema | `pnpm typecheck`，`pnpm test` |
| 8 | 建立 compiler importer interface 与 normalized input pipeline | `pnpm typecheck`，`pnpm test` |
| 9 | 实现 canonical JSON 与 catalog hash | `pnpm test`，重复运行 hash fixture |
| 10 | 实现 dependency/fallback/variant 基础校验和 diagnostics | `pnpm test` |
| 11 | 输出 diffable report 与 vanilla fixture，补 determinism tests | `pnpm typecheck`，`pnpm test`，`git diff --check` |

### Phase 4：Runtime Lifecycle Core

| Round | 目标 | 验证 |
|---:|---|---|
| 12 | 建立 runtime 包核心 API：createAssetManager、CatalogStore skeleton | `pnpm typecheck`，`pnpm test` |
| 13 | 实现 ResolverChain 与 source resolution context | `pnpm test` |
| 14 | 实现 ResourceTable 状态机 skeleton 与 state tests | `pnpm test` |
| 15 | 实现 AssetScope/AssetHandle acquire/release 幂等语义 | `pnpm test` |
| 16 | 实现 fake loader registry 与 in-memory transport | `pnpm test` |
| 17 | 实现 in-flight dedup 与多消费者 abort 语义 | `pnpm test` |
| 18 | 实现 dependency retain/release 与 fallback cause 保留 | `pnpm test` |
| 19 | 实现 debug snapshot、leak warning 基础与 runtime package boundary checks | `pnpm typecheck`，`pnpm test` |

### Phase 5：Sinan Report POC

| Round | 目标 | 验证 |
|---:|---|---|
| 20 | 建立 fixtures/sinan 与脱敏 Sinan manifest fixture | `pnpm test`，`git diff --check` |
| 21 | 实现 Sinan importer prototype，不进入 core API | `pnpm typecheck`，`pnpm test` |
| 22 | 输出 catalog draft 与 missing reference report | `pnpm test`，report snapshot |
| 23 | 输出 fallback report 与 budget compatibility report | `pnpm test`，report snapshot |
| 24 | 写 compatibility note 和 POC-1 使用文档 | `git diff --check`，`pnpm test` |

### Phase 6：Runtime Adapter POC

| Round | 目标 | 验证 |
|---:|---|---|
| 25 | 设计 adapter facade，不改变 `WebRuntime.loadModel(assetId, url)` 外部形态 | `pnpm typecheck`，`pnpm test` |
| 26 | 接入 sceneScope.acquire 内部流程与 feature flag | `pnpm test` |
| 27 | 实现 fallback path 与 adapter diagnostics mapping | `pnpm test` |
| 28 | 添加 model load fake adapter smoke，不接 Three 真 loader | `pnpm test` |
| 29 | 添加 browser smoke harness skeleton | `pnpm test`，browser smoke 可运行或有明确 skip |
| 30 | 增加回退到 host built-in loader 的 contract tests | `pnpm test` |
| 31 | 集成 Sinan POC 文档、adapter boundary check 和 failure cases | `pnpm typecheck`，`pnpm test` |
| 32 | Phase 6 稳定轮：修复 adapter POC 边界和测试不稳定 | `pnpm typecheck`，`pnpm test`，smoke |

### Phase 7：Advanced Loaders

| Round | 目标 | 验证 |
|---:|---|---|
| 33 | 建立 loaders-web 包，加入 JSON/text/binary browser-friendly loaders | `pnpm typecheck`，`pnpm test` |
| 34 | 建立 three adapter 包 skeleton，仅定义 peer boundary 与 fake GLTF tests | `pnpm typecheck`，`pnpm test` |
| 35 | 实现 variant profile resolution tests：quality/locale/platform/capability | `pnpm test` |
| 36 | 实现 optional Cache Storage adapter skeleton 与 version isolation tests | `pnpm test`，browser smoke if available |
| 37 | 建立 Vite plugin skeleton，复用 compiler API，不复制 schema 语义 | `pnpm typecheck`，`pnpm test` |
| 38 | CLI polish：compiler bin entry 或 cli 包，支持 validate/build/report/inspect 最小命令 | `pnpm typecheck`，`pnpm test`，CLI smoke |
| 39 | package install smoke、exports 检查、publint/ATTW 预备或替代 smoke | `pnpm typecheck`，`pnpm test`，pack smoke |
| 40 | Phase 7 集成轮：整理 docs/examples，确保 advanced scope 没污染 core | `pnpm typecheck`，`pnpm test`，smoke |

### Buffer Rounds

| Round | 用途 | 验证 |
|---:|---|---|
| 41 | 修复 Phase 1-3 遗留问题：protocol/schema/compiler determinism | `pnpm typecheck`，`pnpm test` |
| 42 | 修复 Phase 4 遗留问题：runtime lifecycle、state machine、fallback | `pnpm typecheck`，`pnpm test` |
| 43 | 修复 Phase 5 遗留问题：Sinan report、fixtures、compatibility docs | `pnpm typecheck`，`pnpm test` |
| 44 | 修复 Phase 6 遗留问题：adapter POC、feature flag、smoke | `pnpm typecheck`，`pnpm test`，smoke |
| 45 | 修复 Phase 7 遗留问题：advanced loaders、Vite/CLI/package smoke | `pnpm typecheck`，`pnpm test`，pack smoke |
| 46 | 全仓集成缓冲：收敛 flaky tests、docs drift、exports drift | all validation matrix |

### Final Validation

| Round | 目标 | 验证 |
|---:|---|---|
| 47 | Release candidate：更新 README、docs index、compatibility note、CHANGELOG/changeset 如适用 | docs checks，`pnpm typecheck`，`pnpm test` |
| 48 | 最终验证、提交、推送、PASS 报告 | full validation matrix，commit hash，push result |

---

## 11. 验证矩阵

### 始终运行

```powershell
git status --short --branch
git diff --check
```

### package 建立后运行

```powershell
pnpm install
pnpm typecheck
pnpm test
```

### compiler/report 相关

```powershell
pnpm test -- --run compiler
```

如果测试框架不支持该过滤参数，改用项目内实际 test 命令，并在报告中说明。

### runtime 相关

```powershell
pnpm test -- --run runtime
```

必须覆盖：

- acquire/release。
- scope.dispose。
- in-flight dedup。
- multi-consumer abort。
- dependency retain/release。
- fallback cause retention。
- disposed -> reacquire。

### adapter/browser 相关

```powershell
pnpm test
pnpm test:browser
```

如果 `test:browser` 尚未建立，必须报告：

- 尚未建立的原因。
- 本轮使用的替代 smoke。
- 后续建立轮次。

### package smoke

```powershell
pnpm build
pnpm pack:check
```

如果 `pack:check` 尚未建立，必须在 Phase 7 或 buffer 轮补上。

---

## 12. PASS 标准

整个 Phase 0-7 大 Goal PASS 需要同时满足：

- README 链接当前执行文档、Sinan 对齐文档和架构基线。
- pnpm workspace 可安装、可构建、可测试。
- `protocol/schema/compiler/runtime/testkit` 可用。
- runtime core 无 DOM、implicit fetch、Zod、Three、Vite、React 依赖。
- AssetId parser/normalizer 有完整 tests。
- diagnostics code 稳定并被 tests 使用。
- manifest/importer -> catalog 输出可复现。
- catalog hash 不包含时间戳、绝对路径或 Git SHA。
- report 可 diff、可机器读取。
- ResourceTable 状态机有 contract tests。
- Scope/Handle lifecycle 有完整 tests。
- dependency retain/release 有完整 tests。
- deterministic fallback 保留原始 cause。
- Sinan importer/report POC 不改 Sinan runtime、不替代 Sinan source-of-truth。
- runtime adapter POC 保留 `WebRuntime.loadModel(assetId, url)` 外部边界。
- advanced loaders 不污染 core。
- Vite plugin 复用 compiler API，不复制 schema/semantic validation。
- CLI 或 compiler bin 至少支持 validate/build/report 的最小 smoke。
- full validation matrix 通过。
- 最后一轮已提交并推送。

---

## 13. 最终报告模板

最终报告必须包含：

```markdown
## Phase 0-7 Big Goal Final Report

目标：

完成状态：

已完成 Phase：
- Phase 0：
- Phase 1：
- Phase 2：
- Phase 3：
- Phase 4：
- Phase 5：
- Phase 6：
- Phase 7：

核心架构边界验证：
- host-owned authoring：
- runtime core zero dependency：
- diagnostics code stability：
- adapter/core separation：

验证命令与结果：
- git diff --check：
- pnpm install：
- pnpm typecheck：
- pnpm test：
- pnpm build：
- pnpm test:browser：
- pnpm pack:check：

最终 commit：

push 结果：

未完成/后续事项：

风险与建议：
```

---

## 14. 重要提醒

这个大 Goal 的目标不是用最快速度堆完功能，而是让 Indirection 的核心契约变得可信。

优先级永远是：

```txt
source-of-truth boundary
  > deterministic compiler/report
  > runtime lifecycle correctness
  > diagnostics observability
  > adapter usefulness
  > advanced loader convenience
```

如果某轮遇到冲突，以边界和测试优先，宁愿消耗缓冲轮，也不要把 Sinan 特例、Three 细节或 Vite 实现拉进 core。
