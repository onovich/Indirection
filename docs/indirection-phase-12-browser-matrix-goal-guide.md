# Indirection Phase 12 Browser Matrix Expansion Goal 模式执行指南

日期：2026-06-22
状态：给执行者使用的 Phase 12 开发指令文档
上游 PASS：`docs/phase-11-pass-report.md`

---

## 0. 直接给执行者的 Goal Prompt

请以 Goal 模式执行 `D:\LabProjects\Engine\Indirection` 项目的 Phase 12：Browser Matrix Expansion。

Phase 11 已验收通过，最新 PASS 证据见 `docs/phase-11-pass-report.md`，最终提交为 `876e721 docs: add phase 11 pass report`。Phase 12 的目标是把现有 Playwright Chromium E2E 扩展为 Chromium、Firefox、WebKit 的真实浏览器矩阵，并让本地、CI、文档和漂移检查对这个矩阵保持一致。

总轮数预算：16 轮。

- 第 1-12 轮：主实现。
- 第 13-15 轮：缓冲修复、跨浏览器稳定化、CI 差异修复。
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
- `docs/phase-11-pass-report.md`
- `docs/indirection-phase-11-publish-preflight-goal-guide.md`
- `docs/release-readiness.md`
- `docs/browser-e2e.md`
- `docs/phase-9-pass-report.md`
- `docs/publish-preflight-policy.md`
- `docs/release-workflow.md`
- `package.json`
- `playwright.config.ts`
- `.github/workflows/validate.yml`
- `tests/e2e/browser-fixture.e2e.ts`
- `tests/e2e/fixtures/minimal-app.js`
- `tests/e2e/server.mjs`
- `scripts/docs-drift-check.mjs`
- `scripts/core-boundary-check.mjs`

Phase 11 验收结论：

- `corepack pnpm validate:full` 通过。
- `corepack pnpm release:dry-run` 通过。
- `corepack pnpm publish:preflight` 通过。
- `git diff --check` 通过。
- 真实 npm publish、npm login、registry write、Git tag、GitHub Release 都没有执行。

Phase 12 选择说明：

Phase 11 之后的候选包括真实 npm publish release candidate、live Sinan Engine integration、真实 Three.js GLTF parser integration、Firefox/WebKit browser matrix expansion。真实 npm publish 仍需要包名、可见性、npm account/scope、license、tag、rollback 等所有者决策；live Sinan 集成依赖外部仓库；真实 Three GLTF 会扩大 adapter 功能面。本阶段选择 **Browser Matrix Expansion**，因为它能在当前仓库内消除明确剩余风险，并继续验证浏览器侧 runtime、loaders-web、Cache Storage、fallback diagnostics 和 virtual catalog 边界。

---

## 2. 本阶段要完成什么

Phase 12 要完成：

- 将 Playwright E2E 从 Chromium-only 扩展到 Chromium、Firefox、WebKit。
- 让 `corepack pnpm test:e2e` 默认覆盖三浏览器矩阵，或提供等价矩阵命令并把 `validate:full` 纳入矩阵门禁。
- 为调试保留单浏览器入口，例如 Chromium-only 子命令，但不能让 release gate 退回 Chromium-only。
- 更新 `.github/workflows/validate.yml`，安装并缓存三浏览器依赖。
- 修正 E2E fixture 中 Chromium 命名导致的隐性单浏览器假设，使断言对不同 browser project 稳定。
- 保持 Cache Storage、runtime lifecycle、fallback diagnostics、virtual catalog 的真实浏览器覆盖。
- 更新 `docs/browser-e2e.md`、`docs/release-readiness.md`、README、docs index、docs drift check。
- 输出 `docs/phase-12-pass-report.md`。

首选最终验收形态：

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:e2e
corepack pnpm validate:full
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

---

## 3. 本阶段不做什么

Phase 12 不做：

- 不发布 npm 包。
- 不执行 npm login、npm token 检查、registry write。
- 不移除 `private: true`，不更改 `UNLICENSED` 策略。
- 不创建 Git tag 或 GitHub Release。
- 不接入 live Sinan Engine 仓库。
- 不实现真实 Three.js GLTF parser integration。
- 不把 Playwright、浏览器 API、DOM、fetch、Cache Storage 引入 runtime core。
- 不为了跨浏览器测试方便而复制 compiler/schema/runtime 语义。
- 不提交 Playwright report、trace、screenshot、browser cache、dist、tsbuildinfo 等生成物。

---

## 4. 架构边界

必须继续满足：

- host-owned authoring 仍是 source-of-truth。
- compiled catalog 仍是派生产物。
- runtime handle、scope、cache、decoded value 不进入 authoring JSON。
- runtime core 仍保持零 DOM、零 implicit fetch、零 Zod、零 Three、零 Vite、零 React、零 Node-specific import。
- browser E2E 只能存在于 tests、examples、scripts、CI 和文档中。
- E2E fixture 必须复用 compiler/runtime/adapter API，不能成为新的语义实现。
- 浏览器差异处理应在 fixture、test harness 或 adapter 边界中解决，不能污染 protocol/compiler/runtime core。
- Sinan-specific 内容只允许继续停留在 docs、fixtures、tests 或 adapter POC 边界。

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

如果改动 package scripts、Playwright 配置、E2E fixture、CI 或 validation：

```powershell
corepack pnpm test:e2e
corepack pnpm validate:full
```

如果改动 release-readiness、package metadata、publish workflow 或 docs drift：

```powershell
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
- 不提交 Playwright 运行时产物。
- 不提交浏览器安装缓存。
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

- 当前变化能否用最小 E2E fixture 或用户工作流解释？
- 失败能否定位到 Playwright project、browser install、dev server、bundle/build、Cache Storage、runtime、loader、Vite plugin、CI 环境中的具体层？
- 是否覆盖 success、failure、empty、stale、incompatible 状态？
- 跨浏览器差异是否通过稳定断言、能力检测或 fixture 调整处理，而不是通过放松核心语义处理？
- 如果 UI/browser harness 变化，是否能用重复命令稳定复现？
- 如果 CI 变化，本地是否有等价命令能复现？

---

## 9. 架构自检

每轮必须回答：

- source-of-truth 边界是否仍保持？
- runtime core 是否仍没有浏览器、Node、tooling、adapter 耦合？
- browser E2E 是否只验证外围路径，没有把测试便利推入 core API？
- compiler/schema/runtime 的语义是否仍分层？
- diagnostics code 是否稳定，测试是否不依赖自然语言 message？
- Vite/Three/loaders-web/CLI 是否仍是 adapter 或外围层？
- 是否避免把真实 npm publish、live Sinan、真实 Three GLTF 拉入 Phase 12？
- 是否保留 unrelated files、generated outputs 和用户变更？

---

## 10. 分轮安排

### Main Rounds

| Round | 目标 | 验证 |
|---:|---|---|
| 1 | 固化 Phase 12 goal guide，更新 README/docs index/release readiness/Phase 11 PASS report 的 next-phase 指向 | `corepack pnpm check:docs`，`git diff --check` |
| 2 | 盘点当前 Playwright Chromium-only 假设，设计三浏览器 project 和脚本入口 | `corepack pnpm check:docs`，`git diff --check` |
| 3 | 更新 `playwright.config.ts`，加入 Chromium、Firefox、WebKit project，并保留可调试的单浏览器路径 | `corepack pnpm test:e2e -- --project=chromium`，`git diff --check` |
| 4 | 修正 fixture/断言中的 Chromium 命名假设，使数据与 browser project 解耦 | `corepack pnpm test:e2e -- --project=chromium` |
| 5 | 跑通 Firefox E2E，修复 Cache Storage、module import、server MIME 或 timing 差异 | `corepack pnpm test:e2e -- --project=firefox` |
| 6 | 跑通 WebKit E2E，修复 Cache Storage、fetch、module import、timing 或 CI 差异 | `corepack pnpm test:e2e -- --project=webkit` |
| 7 | 让 `corepack pnpm test:e2e` 覆盖三浏览器矩阵，并更新 `validate:full` 约束 | `corepack pnpm test:e2e`，`corepack pnpm validate:full` |
| 8 | 更新 GitHub Actions 安装三浏览器依赖与缓存策略 | `corepack pnpm validate:full`，workflow review |
| 9 | 更新 browser E2E 文档，写清本地安装、CI、单浏览器调试、artifact policy | `corepack pnpm check:docs`，`git diff --check` |
| 10 | 扩展 docs drift check，防止文档和 validation 退回 Chromium-only | `corepack pnpm check:docs` |
| 11 | 跑完整 release posture：validate、release dry-run、publish preflight | `corepack pnpm validate:full`，`corepack pnpm release:dry-run`，`corepack pnpm publish:preflight` |
| 12 | 主实现稳定轮，修复跨浏览器和文档漂移遗留问题 | full validation matrix，`git diff --check` |

### Buffer Rounds

| Round | 用途 | 验证 |
|---:|---|---|
| 13 | 修复 Firefox/WebKit 浏览器安装、系统依赖或本地路径问题 | `corepack pnpm test:e2e`，`corepack pnpm validate:full` |
| 14 | 修复 browser runner/dev server/flaky timing/Cache Storage 清理问题 | `corepack pnpm test:e2e`，`corepack pnpm validate:full` |
| 15 | 修复 docs drift、release readiness、CI workflow、artifact ignore 遗留问题 | `corepack pnpm check:docs`，`git diff --check` |

### Final Validation

| Round | 目标 | 验证 |
|---:|---|---|
| 16 | 输出 Phase 12 PASS report，最终验证、提交、推送 | full validation matrix，commit hash，push result |

---

## 11. 验证矩阵

Phase 12 最终必须通过：

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

`corepack pnpm test:e2e` 必须清楚覆盖 Chromium、Firefox、WebKit。若某个浏览器在当前 Windows 本地环境需要额外一次性安装命令，必须在 `docs/browser-e2e.md` 和 PASS report 中写清楚。CI 仍必须具备可复现的三浏览器安装和运行路径。

---

## 12. PASS 标准

Phase 12 PASS 必须满足：

- Playwright E2E projects 覆盖 Chromium、Firefox、WebKit。
- `corepack pnpm test:e2e` 或被 `validate:full` 调用的等价命令覆盖三浏览器矩阵。
- CI 安装并运行三浏览器 E2E。
- E2E 继续覆盖 loaders-web JSON/text/binary。
- E2E 继续覆盖 Cache Storage hit/miss/version isolation/cleanup。
- E2E 继续覆盖 runtime acquire/release、scope dispose、diagnostics snapshot。
- E2E 继续覆盖 fallback success/no-fallback failure 和 structured diagnostics。
- E2E 继续覆盖 compiler/Vite virtual catalog 被浏览器消费。
- Chromium-only 命名和断言不会误导或掩盖三浏览器矩阵。
- runtime core 不被浏览器测试污染。
- README、docs index、browser E2E docs、release readiness、PASS report、validation commands 保持一致。
- `corepack pnpm validate:full`、`release:dry-run`、`publish:preflight`、`git diff --check` 全部通过。
- 工作区干净并已推送。

---

## 13. 最终报告模板

最终报告必须包含：

```markdown
# Phase 12 Browser Matrix Expansion PASS Report

## Goal

## Completion Status

## Browser Matrix Coverage

- runner:
- browsers:
- loaders-web:
- cache:
- runtime lifecycle:
- fallback/diagnostics:
- compiler/Vite/browser fixture:
- CI/release gate:

## Core Architecture Boundary Validation

- host-owned authoring:
- runtime core zero dependency:
- diagnostics stability:
- adapter/core separation:

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

Phase 12 通过后，下一阶段可从以下方向选择：

- Phase 13：真实 npm publish release candidate，在用户明确接受 npm account、license、package visibility、tag policy 后执行。
- Phase 13：live Sinan Engine repository integration。
- Phase 13：真实 Three.js GLTF parser integration。
- Phase 13：browser E2E stress and artifact diagnostics，例如 trace-on-failure policy、fixture shard、network/error matrix。

选择标准：优先选择能继续验证核心边界的最小真实工作流，而不是扩大最大功能面。
