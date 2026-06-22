# Indirection Phase 9 Real Browser E2E Goal 模式执行指南

日期：2026-06-21
状态：给 Goal 模式执行者使用的 Phase 9 开发指令文档
上游 PASS：`docs/phase-8-pass-report.md`

---

## 0. 直接给执行者的 Goal Prompt

请以 Goal 模式执行 `D:\LabProjects\Engine\Indirection` 项目的 Phase 9：Real Browser E2E Matrix。

Phase 8 已验收通过，最新 PASS 证据见 `docs/phase-8-pass-report.md`，最终提交为 `e6cf02a docs: add phase 8 pass report`。Phase 9 的目标是把当前 Node 执行的 browser-facing smoke 升级为真实浏览器 E2E 验证矩阵，优先验证 browser runtime、loaders-web、Cache Storage 语义、Vite virtual catalog、diagnostics/fallback 和 package/browser import 边界。

总轮数预算：16 轮。

- 第 1-12 轮：主实现。
- 第 13-15 轮：缓冲修复、跨平台/CI 稳定化。
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
- `docs/phase-8-pass-report.md`
- `docs/release-readiness.md`
- `docs/report-json-shapes.md`
- `docs/phase-7-integration.md`
- `docs/indirection-phase-8-release-hardening-goal-guide.md`
- `docs/indirection-phase-0-7-big-goal-execution-guide.md`
- `docs/Indirection_技术架构与开发计划_v0.2.md`
- `docs/rd-plan-sinan-alignment-2026-06-20.md`
- `package.json`
- `.github/workflows/validate.yml`
- `scripts/browser-smoke.mjs`
- `scripts/core-boundary-check.mjs`
- `scripts/docs-drift-check.mjs`

Phase 8 验收结论：

- `corepack pnpm validate:full` 通过。
- `git diff --check` 通过。
- lint、format、docs drift、typecheck、unit tests、browser-facing smoke、boundary check、CLI smoke、Phase 7 smoke、pack/import smoke 均已纳入门禁。
- 剩余风险之一是：当前 browser smoke 仍是 Node 执行的 browser-facing loader smoke，不是真实浏览器 E2E 矩阵。

Phase 9 选择说明：

Phase 9 候选包括真实 npm 发布、真实浏览器 E2E、live Sinan Engine 集成、真实 Three.js GLTF parsing。因为 npm 发布需要包名和可见性决策，live Sinan 集成需要外部仓库，真实 Three GLTF 会扩大 adapter 功能面，本阶段选择最安全且本仓库内可完成的 **Real Browser E2E Matrix**。

---

## 2. 本阶段要完成什么

Phase 9 要完成：

- 引入真实浏览器 E2E runner。优先 Playwright；若选择其他 runner，必须在文档中解释原因。
- 新增可重复运行的 browser E2E fixture，不依赖外部服务。
- 在真实 Chromium 中验证 loaders-web 的 JSON/text/binary 路径。
- 在真实浏览器中验证 Cache Storage 或等价 persistent cache adapter 行为。
- 在真实浏览器中验证 runtime acquire/release、fallback、diagnostics snapshot。
- 在真实浏览器中验证 Vite virtual catalog 或浏览器 bundle fixture 能消费 compiler 输出。
- 将真实 browser E2E 纳入本地 validation 命令，并在 CI 中稳定运行。
- 保留原 Node browser-facing smoke，或明确其退场原因。
- 输出 Phase 9 PASS report。

首选验收形态：

```powershell
corepack pnpm test:e2e
corepack pnpm validate:full
git diff --check
```

如果真实 browser E2E 因环境限制只能先跑 Chromium，必须在 PASS report 中说明 Firefox/WebKit 后续计划。

---

## 3. 本阶段不做什么

Phase 9 不做：

- 不发布 npm 包。
- 不创建 release tag。
- 不接入 live Sinan Engine 仓库。
- 不实现真实 Three.js GLTF parser integration。
- 不把 Playwright 或浏览器 API 引入 runtime core。
- 不让浏览器 E2E fixture 成为 authoring source-of-truth。
- 不替换 Phase 8 的 lint/format/docs/typecheck/test/package 门禁。
- 不为了 E2E 方便而绕过 compiler/runtime/adapter 分层。

---

## 4. 架构边界

必须继续满足：

- host-owned authoring 仍是 source-of-truth。
- compiled catalog 仍是派生产物。
- runtime handle、scope、cache、decoded value 不进入 authoring JSON。
- runtime core 仍零 DOM、零 implicit fetch、零 Zod、零 Three、零 Vite、零 React、零 Node-specific import。
- browser E2E 只存在于 tests/examples/scripts/CI，不进入 core 包。
- Vite/browser fixture 必须复用 compiler API，不复制 schema 或 semantic validation。
- Sinan-specific code 只允许出现在 docs、fixtures、tests、adapter POC 边界。

---

## 5. 每轮固定工作流

每轮开始：

```powershell
git status --short --branch
```

然后：

- 阅读本指南和本轮相关文件。
- 确认是否有用户/他人未提交变更。
- 明确本轮只处理哪些文件。
- 保持改动最小。

每轮验证至少运行：

```powershell
git diff --check
```

若 package 或脚本受影响，运行：

```powershell
corepack pnpm typecheck
corepack pnpm test
```

若改 E2E、CI、validation、browser fixture，运行：

```powershell
corepack pnpm test:e2e
corepack pnpm validate:full
```

---

## 6. 每轮通过后的提交推送工作流

优先使用项目 git wrapper：

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths "path1,path2"
```

如果 wrapper 不可用，才使用：

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
- 不提交 Playwright trace/video/screenshot 临时产物，除非它们是有意的 fixture。
- 不提交浏览器安装缓存。
- 不 force-push。
- 验证失败不提交。

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

---

## 8. Debug 自检

每轮必须回答：

- 当前变化能否用一个最小 browser fixture 或用户 workflow 解释？
- 失败能否定位到 dev server、browser runner、bundle/build、transport、cache、runtime、loader、Vite plugin、CI 环境中的具体层？
- 是否覆盖 success、failure、empty、stale、incompatible 状态？
- 如果改 Cache Storage，是否覆盖 cache hit、miss、version isolation、cleanup 或 unsupported fallback？
- 如果改 Vite/browser fixture，是否验证 compiler output 被真实浏览器消费？
- 如果改 CI，是否能在本地用同一命令复现？

---

## 9. 架构自检

每轮必须回答：

- source-of-truth 边界是否仍保持？
- runtime core 是否仍没有浏览器、Node、tooling、adapter 耦合？
- browser E2E 是否只验证外围路径，没有把测试便利推入 core API？
- compiler/schema/runtime 的语义是否仍分层？
- diagnostics code 是否仍稳定，测试是否不依赖自然语言 message？
- Vite/Three/loaders-web/CLI 是否仍是 adapter/外围层？
- 是否避免把 npm 发布、live Sinan、真实 Three GLTF 拉入 Phase 9？
- 是否保留 unrelated files、generated outputs 和用户变更？

---

## 10. 分轮安排

### Main Rounds

| Round | 目标 | 验证 |
|---:|---|---|
| 1 | 固化 Phase 9 goal guide，更新 README/docs index/release readiness/Phase 8 PASS report 的 next-phase 指向 | `git diff --check`，链接存在性检查 |
| 2 | 选择并落地真实浏览器 E2E runner，优先 Playwright；新增最小配置和忽略规则 | `corepack pnpm install --frozen-lockfile`，`git diff --check` |
| 3 | 建立最小 browser E2E fixture 和本地静态/dev server harness | `corepack pnpm test:e2e` |
| 4 | 在真实 Chromium 验证 loaders-web JSON/text/binary 路径 | `corepack pnpm test:e2e` |
| 5 | 在真实浏览器验证 Cache Storage 或 persistent cache adapter 的 hit/miss/version isolation | `corepack pnpm test:e2e` |
| 6 | 在真实浏览器验证 runtime acquire/release、scope dispose、diagnostics snapshot | `corepack pnpm test:e2e` |
| 7 | 在真实浏览器验证 fallback path 和 structured diagnostics | `corepack pnpm test:e2e` |
| 8 | 验证 Vite virtual catalog 或 browser bundle fixture 能消费 compiler 输出 | `corepack pnpm test:e2e`，`corepack pnpm test` |
| 9 | 将 `test:e2e` 纳入 `validate:full` 或明确拆分为 release gate，并更新 docs drift check | `corepack pnpm validate:full` |
| 10 | 更新 GitHub Actions，安装/缓存浏览器依赖并运行 E2E | 本地 `corepack pnpm validate:full`，workflow review |
| 11 | 补充 browser E2E 文档、troubleshooting、artifact ignore policy | `corepack pnpm check:docs`，`git diff --check` |
| 12 | Phase 9 主实现稳定轮，跑完整矩阵并修复发现的问题 | `corepack pnpm validate:full`，`corepack pnpm test:e2e`，`git diff --check` |

### Buffer Rounds

| Round | 用途 | 验证 |
|---:|---|---|
| 13 | 修复 browser runner/dev server/flaky timing 问题 | `corepack pnpm test:e2e`，`corepack pnpm validate:full` |
| 14 | 修复 CI/Linux browser dependency 或 artifact policy 问题 | `corepack pnpm validate:full` |
| 15 | 修复 docs drift、release readiness、E2E troubleshooting 遗留问题 | `corepack pnpm check:docs`，`git diff --check` |

### Final Validation

| Round | 目标 | 验证 |
|---:|---|---|
| 16 | 输出 Phase 9 PASS report，最终验证、提交、推送 | full validation matrix，commit hash，push result |

---

## 11. 验证矩阵

Phase 9 最终必须通过：

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
git diff --check
```

如果 `test:e2e` 需要单独安装浏览器依赖，必须提供本地和 CI 两条说明。若 Windows 本地与 Linux CI 命令不同，必须在文档中解释。

---

## 12. PASS 标准

Phase 9 PASS 必须满足：

- 存在真实浏览器 E2E runner 和可重复 fixture。
- `test:e2e` 至少在 Chromium 中运行。
- E2E 覆盖 loaders-web JSON/text/binary。
- E2E 覆盖 persistent cache 或 Cache Storage 行为。
- E2E 覆盖 runtime acquire/release、fallback、diagnostics。
- E2E 覆盖 compiler output 被 browser/Vite fixture 消费。
- E2E 不污染 runtime core。
- CI 或明确的 release gate 能运行 E2E。
- README、docs index、release readiness、PASS report、validation commands 一致。
- `corepack pnpm validate:full` 继续通过。
- 工作区干净并已推送。

---

## 13. 最终报告模板

最终报告必须包含：

```markdown
## Phase 9 Real Browser E2E PASS Report

目标：

完成状态：

E2E 覆盖：
- runner：
- browsers：
- loaders-web：
- cache：
- runtime lifecycle：
- fallback/diagnostics：
- compiler/Vite/browser fixture：
- CI/release gate：

核心架构边界验证：
- host-owned authoring：
- runtime core zero dependency：
- diagnostics stability：
- adapter/core separation：

验证命令与结果：
- corepack pnpm install --frozen-lockfile：
- corepack pnpm lint：
- corepack pnpm format：
- corepack pnpm check:docs：
- corepack pnpm typecheck：
- corepack pnpm test：
- corepack pnpm test:browser：
- corepack pnpm test:e2e：
- corepack pnpm check:boundaries：
- corepack pnpm smoke:cli：
- corepack pnpm smoke:phase7：
- corepack pnpm pack:check：
- corepack pnpm validate:full：
- git diff --check：

最终 commit：

push 结果：

未完成/后续事项：

风险与建议：
```

---

## 14. 后续 Phase 候选

Phase 9 通过后，下一阶段可从以下方向选择：

- Phase 10：v0.1 npm release workflow and package visibility decisions。
- Phase 10：live Sinan Engine repository integration。
- Phase 10：真实 Three.js GLTF parser integration。
- Phase 10：Firefox/WebKit browser matrix expansion。

选择标准：优先选择能继续验证核心边界的最小真实工作流，而不是扩展最大功能面。
