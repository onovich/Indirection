# Indirection Phase 13 Real Three GLTF Adapter Goal 模式执行指南

日期：2026-06-22
状态：给执行者使用的 Phase 13 开发指令文档
上游 PASS：`docs/phase-12-pass-report.md`

---

## 0. 直接给执行者的 Goal Prompt

请以 Goal 模式执行 `D:\LabProjects\Engine\Indirection` 项目的 Phase 13：Real Three GLTF Adapter Integration。

Phase 12 已验收通过，最新 PASS 证据见 `docs/phase-12-pass-report.md`，最终提交为 `872babc docs: add phase 12 pass report`。Phase 13 的目标是把 `@indirection/three` 从 peer-boundary skeleton 推进到可验证的真实 Three.js GLTF parser adapter：使用 Indirection transport 读取 `model/gltf` source，由注入的 Three `GLTFLoader.parseAsync` 或等价 parser 完成真实最小 glTF 解析，同时保持 runtime core 对 Three、DOM、fetch、Vite、React、Sinan 零依赖。

总轮数预算：16 轮。

- 第 1-12 轮：主实现。
- 第 13-15 轮：缓冲修复、parser/fixture/typing/pack 兼容修复。
- 第 16 轮：最终验证、提交、推送和 PASS 报告。

每轮必须：

- 做 Debug 自检。
- 做架构自检。
- 运行本轮相关验证命令。
- 验证通过后提交并推送。
- 报告 commit hash、push 结果、下一轮目标和是否消耗缓冲轮。

推进规则：

- 验证失败：不得提交，不得推送，不得进入下一轮。
- 验证通过但提交失败：不得进入下一轮。
- 提交成功但推送失败：不得进入下一轮。
- 推送成功：记录 commit hash 和远端分支，然后进入下一轮。

---

## 1. 必读上下文

执行前必须阅读：

- `README.md`
- `docs/README.md`
- `docs/phase-12-pass-report.md`
- `docs/indirection-phase-12-browser-matrix-goal-guide.md`
- `docs/release-readiness.md`
- `docs/Indirection_技术架构与开发计划_v0.2.md`
- `docs/Indirection_寻址_架构与技术选型设计_v0.1.md`
- `docs/phase-7-integration.md`
- `packages/three/package.json`
- `packages/three/src/index.ts`
- `packages/three/test/three-boundary.test.ts`
- `packages/runtime/src/index.ts`
- `scripts/core-boundary-check.mjs`
- `scripts/docs-drift-check.mjs`
- `scripts/pack-check.mjs`

Phase 12 验收结论：

- `corepack pnpm install --frozen-lockfile` 通过。
- `corepack pnpm test:e2e` 通过，覆盖 Chromium、Firefox、WebKit。
- `corepack pnpm validate:full` 通过。
- `corepack pnpm release:dry-run` 通过。
- `corepack pnpm publish:preflight` 通过。
- `git diff --check` 通过。
- Playwright/browser APIs 保持在 tests/docs/CI 边界，没有进入 runtime core。

Phase 13 选择说明：

Phase 12 之后的候选包括真实 npm publish release candidate、live Sinan Engine integration、真实 Three.js GLTF parser integration、browser E2E stress and artifact diagnostics。真实 npm publish 仍需要包名、可见性、npm account/scope、license、tag、rollback 等所有者决策；live Sinan 集成依赖真实宿主仓库和集成面确认；browser E2E stress 更偏发布硬化。Phase 13 选择 **Real Three GLTF Adapter Integration**，因为它在当前仓库内可完成，直接兑现架构文档中的 `@indirection/three` adapter 承诺，并能证明 `model/gltf` 不再只是 fake payload。

---

## 2. 本阶段要完成什么

Phase 13 要完成：

- 保留 `@indirection/three` 作为 adapter 包，不把 Three 引入 runtime core。
- 将 `createThreeGltfLoader` 从 fake payload skeleton 扩展为可注入真实 parser 的 loader。
- 使用 Indirection transport 读取 `model/gltf` source，并把原始 body、sourceUrl、basePath、assetId、catalog source 上下文传给 parser。
- 在测试中使用真实 Three `GLTFLoader.parseAsync` 或等价 GLTFLoader parser 解析一个最小 glTF fixture。
- 保留无 Three parser 注入时的轻量 fake/bytes payload 路径，避免破坏现有测试和 Phase 7 smoke。
- 增加 invalid glTF / parser failure 覆盖，确认 runtime 仍产生 `IND_DECODE_FAILED`，fallback 行为仍稳定。
- 明确 `three` 仍是 `@indirection/three` 的 optional peer；若测试需要安装真实 `three`，只能作为 workspace/dev dependency 或 package dev dependency，不得变成 runtime core dependency。
- 输出 Three adapter 文档或更新现有文档，说明 parser injection、basePath/sourceUrl、non-scope、disposal limitation 和未来 Draco/KTX2/meshopt 边界。
- 输出 `docs/phase-13-pass-report.md`。

首选最终验收形态：

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm check:boundaries
corepack pnpm pack:check
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

---

## 3. 本阶段不做什么

Phase 13 不做：

- 不发布 npm 包。
- 不执行 npm login、npm token 检查、registry write。
- 不移除 `private: true`，不更改 `UNLICENSED` 策略。
- 不创建 Git tag 或 GitHub Release。
- 不接入 live Sinan Engine 仓库。
- 不实现 `@indirection/sinan`。
- 不实现 Draco、KTX2、meshopt、texture pipeline、ImageBitmap lifecycle 或 GPU memory estimator。
- 不实现模型 clone/instantiate helper、animation clip metadata 或 renderer-specific scene attachment。
- 不把 `three`、`GLTFLoader`、DOM、fetch、window、document 引入 `@indirection/runtime`、`@indirection/protocol`、`@indirection/schema`、`@indirection/compiler`。
- 不要求所有 `@indirection/three` 消费者在 import package root 时立刻安装或初始化 Three；真实 parser 应通过注入或明确的 adapter boundary 进入。
- 不把 Playwright/browser E2E 矩阵扩展成 Three renderer E2E。

---

## 4. 架构边界

必须继续满足：

- host-owned authoring 仍是 source-of-truth。
- compiled catalog 仍是派生产物。
- runtime core 只认识 asset type、source、transport、loader result、scope/handle lifecycle，不认识 Three 对象。
- `three` 只能出现在 `packages/three`、tests、examples、docs 或 dev/test 配置中。
- `@indirection/three` 可以知道 GLTFLoader parser 形态，但不能让 core API 暴露 Three-specific 类型。
- parser failure 必须通过 runtime 的 loader failure/fallback 语义表达，不能靠自然语言 error message 作为公共 contract。
- fake payload 路径和真实 parser 路径必须共享同一个 Indirection loader contract。
- Sinan-specific 词汇仍只允许出现在 docs、fixtures、tests、adapter POC 边界，不进入 core API。

关于 disposer：

- 当前 Phase 13 首要目标是真实 parse 和 adapter boundary，不要求完成 GPU/scene object disposal。
- 如果执行者发现必须触碰 `LoadedAsset.dispose` 语义，应将变更收敛为最小 runtime lifecycle contract，并补充 release/dispose 单测；不得顺手实现完整 GPU ownership。
- 若不触碰 disposer，必须在文档和 PASS report 中明确 disposal limitation 与后续阶段候选。

---

## 5. 每轮固定工作流

每轮开始：

```powershell
git status --short --branch
```

然后：

- 阅读本指南和本轮相关文件。
- 确认是否有用户或其他会话未提交变更。
- 明确本轮只处理哪些文件。
- 保持改动最小。

每轮至少运行：

```powershell
git diff --check
```

如果改动 `packages/three`、runtime loader contract、package metadata 或 tests：

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm check:boundaries
```

如果改动 package exports、files、dependencies、release docs 或 smoke：

```powershell
corepack pnpm pack:check
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm check:docs
```

---

## 6. 每轮通过后的提交推送工作流

优先使用项目 git wrapper：

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths "path1,path2"
```

如果 wrapper 不可用，使用：

```powershell
git status --short --branch
git diff --stat
git add -- <phase-relevant files>
git commit -m "<phase>: <round summary>"
git push
git status --short --branch
```

提交规则：

- 不 stage 无关文件。
- 不提交 `dist/`、`.tsbuildinfo`、Playwright report、test results、package tarballs 或 runtime cache。
- 不提交浏览器或 Three 运行时缓存。
- 不 force-push。
- 验证失败不提交。

---

## 7. 每轮必须报告的 Gate Template

每轮回复必须包含：

```text
本轮目标：
本轮完成内容：
Debug 自检：
架构自检：
已运行验证命令与结果：
commit hash 与 push 结果：
下一轮目标：
是否消耗缓冲轮：
```

---

## 8. Debug 自检

每轮必须回答：

- 当前变化能否用最小 GLTF fixture 或 runtime acquire workflow 解释？
- 失败能否定位到 transport body conversion、basePath/sourceUrl、parser injection、GLTFLoader parse、runtime fallback、package peer dependency、type export、pack/import smoke 中的具体层？
- 是否覆盖 success、parser failure、missing source、fallback、no-parser fake path、package import states？
- parser failure 的断言是否依赖结构化 code/state，而不是自然语言 message？
- 如果 package metadata 变化，临时 consumer import 是否仍能复现？
- 如果碰到 disposer/lifecycle，是否有最小 release/dispose 测试证明不会 double-dispose 或 premature-dispose？

---

## 9. 架构自检

每轮必须回答：

- source-of-truth 边界是否仍保持？
- runtime core 是否仍没有 Three、DOM、fetch、Vite、React、Sinan、Node-specific adapter 耦合？
- `@indirection/three` 是否仍是 adapter 包，而不是 core 语义来源？
- GLTF parser 是否通过 adapter injection 或明确 peer boundary 进入？
- compiler/schema/runtime 的语义是否仍分层？
- 是否避免把真实 npm publish、live Sinan、Draco/KTX2/meshopt、GPU disposal 全套能力拉入 Phase 13？
- 是否保留 unrelated files、generated outputs 和用户变更？

---

## 10. 分轮安排

### Main Rounds

| Round | 目标 | 验证 |
|---:|---|---|
| 1 | 固化 Phase 13 goal guide，更新 README/docs index/release readiness/Phase 12 PASS report 的 next-phase 指向 | `corepack pnpm check:docs`，`git diff --check` |
| 2 | 盘点 `@indirection/three` skeleton、runtime loader contract、peer/dev dependency 策略，设计 parser injection API | `corepack pnpm typecheck`，`git diff --check` |
| 3 | 扩展 `createThreeGltfLoader` 输入模型，保留 fake payload 路径并增加 source/body/basePath 上下文 | `corepack pnpm test -- --run packages/three/test/three-boundary.test.ts` |
| 4 | 增加最小 glTF fixture 与真实 `GLTFLoader.parseAsync` 测试，验证真实 parse 结果 | `corepack pnpm test -- --run packages/three/test/three-boundary.test.ts` |
| 5 | 增加 parser failure/fallback 覆盖，确认 `IND_DECODE_FAILED` 和 fallback-ready 语义稳定 | `corepack pnpm test` |
| 6 | 补强 peer boundary 测试：core 不 import Three，package root 行为不要求隐式全局 Three | `corepack pnpm check:boundaries`，`corepack pnpm test` |
| 7 | 更新 docs 或新增 Three GLTF adapter 文档，记录 parser injection、basePath、non-scope、disposal limitation | `corepack pnpm check:docs`，`git diff --check` |
| 8 | 如有必要增加 `examples/phase13-three-gltf.mjs` 或轻量 smoke，证明 runtime acquire 返回真实 parsed GLTF wrapper | `corepack pnpm test`，相关 smoke |
| 9 | 更新 package metadata、exports/files、docs drift guard，防止 Phase 13 退回 fake-only | `corepack pnpm pack:check`，`corepack pnpm check:docs` |
| 10 | 跑完整本地质量门禁并修复 typing、pack、boundary、docs drift 问题 | `corepack pnpm validate:full` |
| 11 | 跑 release posture，确认 no publish/tag side effects 仍成立 | `corepack pnpm release:dry-run`，`corepack pnpm publish:preflight` |
| 12 | 主实现稳定轮，修复真实 parser、fallback、docs、package consumer 遗留问题 | full validation matrix，`git diff --check` |

### Buffer Rounds

| Round | 用途 | 验证 |
|---:|---|---|
| 13 | 修复 GLTFLoader 在 Node/Vitest 下的 parser 环境差异 | `corepack pnpm test`，`corepack pnpm typecheck` |
| 14 | 修复 package peer/dev dependency、exports、pack/import smoke 问题 | `corepack pnpm pack:check`，`corepack pnpm release:dry-run` |
| 15 | 修复 docs drift、boundary scan、disposal limitation 表述或 follow-up 记录 | `corepack pnpm check:docs`，`corepack pnpm check:boundaries`，`git diff --check` |

### Final Validation

| Round | 目标 | 验证 |
|---:|---|---|
| 16 | 输出 Phase 13 PASS report，最终验证、提交、推送 | full validation matrix，commit hash，push result |

---

## 11. 验证矩阵

Phase 13 最终必须通过：

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm format
corepack pnpm check:docs
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:browser
corepack pnpm test:e2e
corepack pnpm check:boundaries
corepack pnpm smoke:cli
corepack pnpm smoke:phase7
corepack pnpm pack:check
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

如果新增 Phase 13 smoke，则 `validate:full` 是否纳入由执行者基于耗时和稳定性决定；无论是否纳入，PASS report 必须列出该 smoke 的运行结果。

---

## 12. PASS 标准

Phase 13 PASS 必须满足：

- `@indirection/three` 可以通过 Indirection transport 获取 `model/gltf` source。
- `@indirection/three` 可以通过注入的真实 Three GLTF parser 解析最小 glTF fixture。
- 未注入真实 parser 时，现有 fake payload/bytes path 仍可工作。
- parser failure 能触发 runtime loader failure/fallback 语义，structured state/code 可测试。
- `three` 没有进入 protocol/schema/compiler/runtime core。
- package peer/dev dependency 策略清楚，`three` 仍是 adapter peer boundary，不是 core dependency。
- package tarball/import smoke 不因 Three adapter 扩展退化。
- README、docs index、release readiness、Three adapter docs、PASS report、validation commands 保持一致。
- `corepack pnpm validate:full`、`release:dry-run`、`publish:preflight`、`git diff --check` 全部通过。
- 工作区干净并已推送。

---

## 13. 最终报告模板

最终报告必须包含：

```markdown
# Phase 13 Real Three GLTF Adapter PASS Report

## Goal

## Completion Status

## Three GLTF Adapter Coverage

- adapter API:
- parser injection:
- real GLTF fixture:
- fake/no-parser compatibility:
- fallback/diagnostics:
- package peer boundary:
- docs/smoke:

## Core Architecture Boundary Validation

- host-owned authoring:
- runtime core zero dependency:
- Three adapter boundary:
- diagnostics stability:
- deferred scope:

## Validation Commands And Results

- corepack pnpm install --frozen-lockfile:
- corepack pnpm lint:
- corepack pnpm format:
- corepack pnpm check:docs:
- corepack pnpm typecheck:
- corepack pnpm test:
- corepack pnpm test:browser:
- corepack pnpm test:e2e:
- corepack pnpm check:boundaries:
- corepack pnpm smoke:cli:
- corepack pnpm smoke:phase7:
- corepack pnpm pack:check:
- corepack pnpm validate:full:
- corepack pnpm release:dry-run:
- corepack pnpm publish:preflight:
- git diff --check:

## Final Commit

## Push Result

## Unfinished / Follow-Up Items

## Risks And Recommendations
```

---

## 14. 后续 Phase 候选

Phase 13 通过后，下一阶段可从以下方向选择：

- Phase 14：Three adapter disposal / instantiate / animation metadata lifecycle。
- Phase 14：real npm publish release candidate，在用户明确接受 npm account、license、package visibility、tag policy 后执行。
- Phase 14：live Sinan Engine repository integration。
- Phase 14：browser E2E stress and artifact diagnostics。

选择标准：优先选择能继续验证核心边界的最小真实工作流，而不是扩大最大功能面。
