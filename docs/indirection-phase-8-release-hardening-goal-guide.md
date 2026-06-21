# Indirection Phase 8 Release Hardening Goal 模式执行指南

日期：2026-06-21
状态：给 Goal 模式执行者使用的 Phase 8 开发指令文档
上游 PASS：`docs/phase-0-7-pass-report.md`

---

## 0. 直接给执行者的 Goal Prompt

请以 Goal 模式执行 `D:\LabProjects\Engine\Indirection` 项目的 Phase 8：Release Hardening & Quality Gates。

Phase 0-7 已验收通过，最新 PASS 证据见 `docs/phase-0-7-pass-report.md`，最终提交为 `5c4f29d docs: add phase 0-7 pass report`。Phase 8 的目标不是扩展新资源加载功能，而是把当前 release-candidate baseline 打磨成更接近 v0.1 发布前标准的工程质量门禁。

总轮数预算：16 轮。

- 第 1-12 轮：主实现。
- 第 13-15 轮：缓冲修复、兼容性补齐、测试稳定化。
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
- `docs/phase-0-7-pass-report.md`
- `docs/phase-7-integration.md`
- `docs/indirection-phase-0-7-big-goal-execution-guide.md`
- `docs/Indirection_技术架构与开发计划_v0.2.md`
- `docs/rd-plan-sinan-alignment-2026-06-20.md`
- `docs/codex-git-workflow.md`
- `.codex/project-git-workflow.json`
- `package.json`
- `tsconfig.base.json`
- `scripts/core-boundary-check.mjs`
- `scripts/pack-check.mjs`

Phase 0-7 验收结论：

- `corepack pnpm validate:full` 通过。
- `git diff --check` 通过。
- 31 个测试文件、83 个测试通过。
- browser smoke、core boundary、Phase 7 smoke、9 个包 pack/import smoke 通过。
- 工作区已与 `origin/main` 对齐。

Phase 8 的触发原因：

- `lint` 和 `format` 仍是占位脚本。
- `tsconfig.base.json` 仍启用 `skipLibCheck`。
- report JSON shape 已可机器读取，但还没有独立 schema/contract 文档作为发布前门禁。
- release candidate 有完整本地矩阵，但缺少发布前质量门禁说明和可复用 CI/automation 入口。

---

## 2. 本阶段要完成什么

Phase 8 要完成：

- 用真实 lint/format 或等价轻量质量门禁替换占位脚本。
- 明确是否保留 `skipLibCheck`，若保留必须有 ADR/说明；若移除必须保证全矩阵通过。
- 为 compile report / diagnostics report 补充 JSON shape 文档和 schema/contract tests。
- 加强 package/release readiness：exports、files、tarball、CLI、browser smoke 文档化。
- 补齐 docs drift 检查，使 README、docs index、PASS report、validation commands 一致。
- 提供 Phase 8 PASS report。
- 保持 Phase 0-7 所有验证继续通过。

---

## 3. 本阶段不做什么

Phase 8 不做：

- 不新增资源系统大功能。
- 不引入真实 Three.js GLTF 解码器。
- 不实现 CDN SaaS、patch、remote update。
- 不改变 Sinan authoring source-of-truth。
- 不把 Sinan adapter 移入 core。
- 不把 Vite plugin 扩成独立构建系统。
- 不发布 npm 包或创建真实 release tag，除非用户另行明确要求。
- 不为了 lint/format 引入过重工具链，导致 v0.1 发布风险上升。

---

## 4. 架构边界

必须继续满足：

- host-owned authoring 仍是 source-of-truth。
- compiled catalog 仍是派生产物。
- runtime handle、scope、cache、decoded value 不进入 authoring JSON。
- runtime core 仍零 DOM、零 implicit fetch、零 Zod、零 Three、零 Vite、零 React、零 Node-specific import。
- protocol 不依赖任何项目包。
- schema 不依赖 runtime 或 advanced adapters。
- compiler 不依赖 runtime 或 advanced adapters。
- Vite plugin 只能复用 compiler API，不复制 schema/semantic validation。
- Sinan-specific code 只允许出现在 docs、fixtures、tests、adapter POC 边界。

质量门禁工具本身也必须遵守边界：不能为了 lint/format 把 runtime core 变成 browser/Node 专属包。

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

若改 validation/release/package 相关，运行：

```powershell
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
- 不提交临时目录、pack tarball、coverage、dist 之外的 build cache。
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

- 当前变化能否用一个最小脚本、fixture 或 release workflow 解释？
- 失败能否定位到 lint、format、typecheck、test、browser smoke、boundary check、pack smoke、CLI smoke 中的具体层？
- 是否覆盖 success、failure、empty、stale、incompatible 状态？
- 如果改 report/schema，是否保证可 diff、可机器读取、无时间戳噪音？
- 如果改 release/package，是否覆盖 tarball install/import smoke？
- 如果改 CI/validation，是否能在本地用同一命令复现？

---

## 9. 架构自检

每轮必须回答：

- source-of-truth 边界是否仍保持？
- runtime core 是否仍没有平台、工具、adapter 耦合？
- compiler/schema/runtime 的语义是否仍分层？
- diagnostics code 是否仍稳定，测试是否不依赖自然语言 message？
- Vite/Three/loaders-web/CLI 是否仍是 adapter/外围层？
- 是否避免把 Phase 9 或未来功能拉入 Phase 8？
- 是否保留 unrelated files、generated outputs 和用户变更？

---

## 10. 分轮安排

### Main Rounds

| Round | 目标 | 验证 |
|---:|---|---|
| 1 | 固化 Phase 8 goal guide，更新 README/docs index/Phase 0-7 PASS report 的 next-phase 指向 | `git diff --check`，链接存在性检查 |
| 2 | 设计并落地轻量 format 门禁，替换 `format` 占位脚本 | `corepack pnpm format`，`git diff --check` |
| 3 | 设计并落地轻量 lint/structure 门禁，替换 `lint` 占位脚本 | `corepack pnpm lint`，`corepack pnpm check:boundaries` |
| 4 | 评估 `skipLibCheck`：移除并修复，或保留并写 ADR/说明 | `corepack pnpm typecheck` |
| 5 | 为 diagnostics/report JSON shape 添加 schema 或 contract 文档 | `corepack pnpm test` |
| 6 | 增加 report schema/contract tests，覆盖 vanilla 与 Sinan report | `corepack pnpm test` |
| 7 | 增强 CLI validate/build/report/inspect release smoke | `corepack pnpm test`，CLI smoke |
| 8 | 增强 package exports/files smoke，确保 tarball 不含 tsbuildinfo/临时文件 | `corepack pnpm pack:check` |
| 9 | 增强 docs drift check：README、docs index、PASS report、validation commands 一致 | docs check，`git diff --check` |
| 10 | 可选添加 CI workflow 或本地 automation 文档；若不加 CI，写清楚原因与替代门禁 | `corepack pnpm validate:full` |
| 11 | 整合 release readiness 文档，明确 v0.1 前剩余风险 | `git diff --check`，`corepack pnpm test` |
| 12 | Phase 8 主实现稳定轮，跑完整矩阵并修复发现的问题 | `corepack pnpm validate:full`，`git diff --check` |

### Buffer Rounds

| Round | 用途 | 验证 |
|---:|---|---|
| 13 | 修复 lint/format/typecheck 引发的兼容性问题 | `corepack pnpm validate:full` |
| 14 | 修复 report schema/CLI/package smoke 遗留问题 | `corepack pnpm validate:full` |
| 15 | 修复 docs drift、CI/automation、release note 遗留问题 | `corepack pnpm validate:full`，`git diff --check` |

### Final Validation

| Round | 目标 | 验证 |
|---:|---|---|
| 16 | 输出 Phase 8 PASS report，最终验证、提交、推送 | full validation matrix，commit hash，push result |

---

## 11. 验证矩阵

Phase 8 最终必须通过：

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm format
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:browser
corepack pnpm check:boundaries
corepack pnpm smoke:phase7
corepack pnpm pack:check
corepack pnpm validate:full
git diff --check
```

如果某个命令在 Phase 8 设计中被替换，必须在 Phase 8 PASS report 中写明替代命令、原因和覆盖范围。

---

## 12. PASS 标准

Phase 8 PASS 必须满足：

- `lint` 不再是占位脚本，或有明确、可验证的等价质量门禁。
- `format` 不再是占位脚本，或有明确、可验证的等价格式门禁。
- `skipLibCheck` 的处理有结论：移除并通过，或保留并有 ADR/风险说明。
- report/diagnostics JSON shape 有文档和 contract tests。
- CLI、package exports、tarball/import smoke 继续通过。
- docs index、README、PASS report、validation commands 一致。
- runtime core boundary 继续通过。
- `corepack pnpm validate:full` 继续通过。
- 工作区干净并已推送。

---

## 13. 最终报告模板

最终报告必须包含：

```markdown
## Phase 8 Release Hardening PASS Report

目标：

完成状态：

质量门禁：
- lint：
- format：
- skipLibCheck：
- report schema/contract：
- CLI smoke：
- package smoke：

核心架构边界验证：
- host-owned authoring：
- runtime core zero dependency：
- diagnostics stability：
- adapter/core separation：

验证命令与结果：
- corepack pnpm install --frozen-lockfile：
- corepack pnpm lint：
- corepack pnpm format：
- corepack pnpm typecheck：
- corepack pnpm test：
- corepack pnpm test:browser：
- corepack pnpm check:boundaries：
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

Phase 8 通过后，下一阶段可从以下方向选择：

- Phase 9：真实 Sinan Engine 仓库接入试点。
- Phase 9：真实 browser E2E 与 Playwright 矩阵。
- Phase 9：v0.1 npm 发布准备与 Changesets/release workflow。
- Phase 9：Three adapter 从 skeleton 走向真实 GLTF parser integration。

选择标准：优先选择能继续验证核心边界的最小真实工作流，而不是扩展最大功能面。
