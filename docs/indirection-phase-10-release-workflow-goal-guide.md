# Indirection Phase 10 Release Workflow Dry Run Goal 模式执行指南

日期：2026-06-22
状态：给 Goal 模式执行者使用的 Phase 10 开发指令文档
上游 PASS：`docs/phase-9-pass-report.md`

---

## 0. 直接给执行者的 Goal Prompt

请以 Goal 模式执行 `D:\LabProjects\Engine\Indirection` 项目的 Phase 10：Release Workflow Dry Run & Package Readiness。

Phase 9 已验收通过，最新 PASS 证据见 `docs/phase-9-pass-report.md`，最终提交为 `9bd68cd docs: add phase 9 pass report`。Phase 10 的目标是在不真实发布 npm 包、不创建真实 release tag 的前提下，建立 v0.1 发布前的包可见性策略、版本/变更流程、release dry-run、package metadata 审计、CI 手动 release gate 和文档闭环。

总轮数预算：16 轮。

- 第 1-12 轮：主实现。
- 第 13-15 轮：缓冲修复、包元数据/CI/release dry-run 稳定化。
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
- `docs/phase-9-pass-report.md`
- `docs/release-readiness.md`
- `docs/browser-e2e.md`
- `docs/report-json-shapes.md`
- `docs/phase-7-integration.md`
- `docs/indirection-phase-9-browser-e2e-goal-guide.md`
- `docs/indirection-phase-8-release-hardening-goal-guide.md`
- `docs/indirection-phase-0-7-big-goal-execution-guide.md`
- `docs/Indirection_寻址_架构与技术选型设计_v0.1.md`
- `docs/Indirection_技术架构与开发计划_v0.2.md`
- `docs/rd-plan-sinan-alignment-2026-06-20.md`
- `CHANGELOG.md`
- `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/validate.yml`
- `scripts/pack-check.mjs`
- `scripts/cli-smoke.mjs`
- `scripts/docs-drift-check.mjs`
- `scripts/core-boundary-check.mjs`
- 所有 `packages/*/package.json`

Phase 9 验收结论：

- `corepack pnpm validate:full` 通过。
- `git diff --check` 通过。
- `test:e2e` 已纳入 `validate:full`，Chromium E2E 覆盖 loaders-web、Cache Storage、runtime lifecycle、fallback diagnostics 和 virtual catalog consumption。
- GitHub Actions 已安装并缓存 Playwright Chromium。
- 剩余风险之一是：没有真实 npm publishing workflow，没有 release tag automation，package visibility/names/versioning policy 尚未正式固化。

Phase 10 选择说明：

Phase 10 候选包括 v0.1 npm release workflow、live Sinan Engine integration、真实 Three.js GLTF parsing、Firefox/WebKit browser matrix expansion。本阶段选择 **Release Workflow Dry Run & Package Readiness**，因为它能继续降低 v0.1 发布风险，且不依赖外部 Sinan 仓库，不扩大 Three adapter 功能面，也不需要真实 npm 权限。

---

## 2. 本阶段要完成什么

Phase 10 要完成：

- 明确 v0.1 包发布策略：哪些包是首批公开候选，哪些继续 private/internal。
- 明确包名、scope、license、repository、homepage、keywords、engines、files、exports、bin、peerDependencies、sideEffects 等 package metadata 规则。
- 建立 release dry-run 命令或脚本，不真实 publish、不创建 tag。
- 增强 package/release smoke，覆盖 package metadata、workspace dependency publishability、tarball contents、CLI bin、temporary consumer imports。
- 选择并落地 Changesets 或等价的轻量版本/变更记录流程；若不采用 Changesets，必须写明替代理由。
- 建立本地 release checklist 和 CI 手动 release dry-run gate。
- 更新 `CHANGELOG.md` 或 release notes 生成规则，使 Phase 8/9/10 的变更证据可追溯。
- 保持 `validate:full` 和 Phase 9 browser E2E 全部通过。
- 输出 Phase 10 PASS report。

首选验收形态：

```powershell
corepack pnpm validate:full
corepack pnpm pack:check
corepack pnpm release:dry-run
git diff --check
```

如果 `release:dry-run` 需要被拆成多个命令，必须在 PASS report 中列出替代命令和覆盖范围。

---

## 3. 本阶段不做什么

Phase 10 不做：

- 不执行真实 `npm publish`。允许在明确 `--dry-run`、不上传、不创建 tag、不写入 npm registry、不留下可提交产物的保护下使用 `npm publish --dry-run` 或 `pnpm publish --dry-run`。
- 不创建真实 Git tag 或 GitHub Release。
- 不更换 npm scope 到未确认的组织 scope。
- 不把 private/internal 包强行公开。
- 不接入 live Sinan Engine 仓库。
- 不实现真实 Three.js GLTF parser integration。
- 不扩大 Firefox/WebKit 浏览器矩阵。
- 不改变 runtime core API 或把 release tooling 引入 runtime core。
- 不让 release dry-run 绕过现有 `validate:full`、browser E2E、pack/import smoke。
- 不把 generated tarballs、release archives、Playwright artifacts 或临时 consumer 目录提交进 git。

---

## 4. 架构边界

必须继续满足：

- host-owned authoring 仍是 source-of-truth。
- compiled catalog 仍是派生产物。
- runtime handle、scope、cache、decoded value 不进入 authoring JSON。
- runtime core 仍零 DOM、零 implicit fetch、零 Zod、零 Three、零 Vite、零 React、零 Node-specific import。
- release tooling 只存在于 scripts/docs/CI/package metadata，不进入 core 包源码。
- package metadata 只能描述包边界，不能复制 compiler/runtime/schema 语义。
- Changesets/release notes 不能成为 authoring source-of-truth。
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

若改 package metadata、release scripts、pack checks、CI 或 lockfile，运行：

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm pack:check
```

若改 validation、CI、release dry-run、docs drift 或 package gates，运行：

```powershell
corepack pnpm validate:full
```

若新增 `release:dry-run` 或等价脚本，运行：

```powershell
corepack pnpm release:dry-run
```

---

## 6. 每轮通过后提交推送工作流

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
- 不提交 package tarball、temporary consumer、release archive、npm cache、Playwright trace/report/screenshot、`dist/` 或 `*.tsbuildinfo`。
- 不 force-push。
- 验证失败不提交。
- release dry-run 不得修改 package versions、lockfile、workspace dependency ranges，除非该轮目标明确是版本策略文件变更且已通过验证。

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

- 当前变化能否用一个最小 release workflow、package fixture、temporary consumer 或用户发布前检查流程解释？
- 失败能否定位到 package metadata、workspace dependency、pack tarball、consumer install/import、CLI bin、changeset/versioning、CI workflow、npm permission 或 docs drift 中的具体层？
- 是否覆盖 success、failure、empty、stale、incompatible 状态？
- 如果改 package metadata，是否覆盖 missing field、invalid exports、private/internal package、peer dependency、bin path 和 files whitelist？
- 如果改 release dry-run，是否保证不会真实 publish、不会创建真实 tag、不会留下可提交 artifacts？
- 如果改 CI，是否能在本地用同一核心命令复现？

---

## 9. 架构自检

每轮必须回答：

- source-of-truth 边界是否仍保持？
- runtime core 是否仍没有浏览器、Node tooling、release tooling、adapter 耦合？
- compiler/schema/runtime 的语义是否仍分层？
- package metadata 是否只是发布边界描述，没有复制 schema/runtime/compiler 语义？
- diagnostics code 是否仍稳定，测试是否不依赖自然语言 message？
- Vite/Three/loaders-web/CLI/release tooling 是否仍是 adapter/外围层？
- 是否避免把 live Sinan、真实 Three GLTF、Firefox/WebKit 矩阵拉入 Phase 10？
- 是否保留 unrelated files、generated outputs 和用户变更？

---

## 10. 分轮安排

### Main Rounds

| Round | 目标 | 验证 |
|---:|---|---|
| 1 | 固化 Phase 10 goal guide，更新 README/docs index/release readiness/Phase 9 PASS report 的 next-phase 指向 | `corepack pnpm check:docs`，`git diff --check`，链接存在性检查 |
| 2 | 定义 v0.1 package visibility policy：public candidate、internal/private、deferred packages | `git diff --check`，`corepack pnpm check:docs` |
| 3 | 审计并补齐 package metadata 规则和文档：license/repository/homepage/keywords/engines/files/exports/bin/peers | `corepack pnpm pack:check`，`corepack pnpm test` |
| 4 | 设计并落地 Changesets 或轻量 release notes/version policy；若不采用 Changesets，写替代 ADR | `corepack pnpm check:docs`，`git diff --check` |
| 5 | 新增 `release:dry-run` 或等价脚本，确保只做本地 dry-run、不 publish、不 tag | `corepack pnpm release:dry-run`，`git diff --check` |
| 6 | 增强 release dry-run：验证 package publishability、workspace dependency ranges、private/internal policy | `corepack pnpm release:dry-run`，`corepack pnpm pack:check` |
| 7 | 增强 package smoke：metadata whitelist、tarball contents、CLI bin、temporary consumer install/import | `corepack pnpm pack:check`，`corepack pnpm test` |
| 8 | 更新 CI：添加手动 release dry-run workflow 或 validation job，不发布、不打 tag | 本地 `corepack pnpm validate:full`，workflow review |
| 9 | 更新 release docs：本地发布前 checklist、npm permission preflight、rollback/no-publish policy | `corepack pnpm check:docs`，`git diff --check` |
| 10 | 更新 `CHANGELOG.md` 或 release notes 生成流程，保证 Phase 8/9/10 证据可追溯 | `corepack pnpm check:docs`，`git diff --check` |
| 11 | 增强 docs drift check：README、docs index、release readiness、PASS report、validation/release commands 一致 | `corepack pnpm check:docs`，`git diff --check` |
| 12 | Phase 10 主实现稳定轮，跑完整矩阵和 release dry-run，修复发现的问题 | `corepack pnpm validate:full`，`corepack pnpm release:dry-run`，`git diff --check` |

### Buffer Rounds

| Round | 用途 | 验证 |
|---:|---|---|
| 13 | 修复 package metadata、workspace dependency、exports/files/bin path 问题 | `corepack pnpm pack:check`，`corepack pnpm release:dry-run` |
| 14 | 修复 Changesets/release dry-run/CI 手动 workflow 稳定性问题 | `corepack pnpm validate:full`，`corepack pnpm release:dry-run` |
| 15 | 修复 docs drift、release readiness、changelog、PASS report 遗留问题 | `corepack pnpm check:docs`，`git diff --check` |

### Final Validation

| Round | 目标 | 验证 |
|---:|---|---|
| 16 | 输出 Phase 10 PASS report，最终验证、提交、推送 | full validation matrix，release dry-run，commit hash，push result |

---

## 11. 验证矩阵

Phase 10 最终必须通过：

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
corepack pnpm release:dry-run
corepack pnpm validate:full
git diff --check
```

如果 `release:dry-run` 被拆成多个脚本，最终 PASS report 必须列出替代命令、原因和覆盖范围。

---

## 12. PASS 标准

Phase 10 PASS 必须满足：

- 存在明确的 package visibility policy。
- package metadata 规则已文档化，并被脚本或 smoke 覆盖。
- release dry-run 可重复运行，且不会真实 publish、不会创建 tag、不会提交生成产物。
- release dry-run 必须确认不会上传到 npm registry、不会创建 Git tag/GitHub Release、不会意外修改 package versions 或 lockfile，且不会留下未跟踪产物。
- pack/import smoke 继续覆盖 9 个 workspace packages。
- CLI bin、exports、types、files whitelist、peer dependency 和 workspace dependency publishability 被验证。
- Changesets 或等价 release notes/versioning 流程有结论和文档。
- CI 有手动 release dry-run gate 或明确等价门禁。
- README、docs index、release readiness、PASS report、validation/release commands 一致。
- runtime core boundary 继续通过。
- Phase 9 browser E2E 继续通过。
- `corepack pnpm validate:full` 继续通过。
- 工作区干净并已推送。

---

## 13. 最终报告模板

最终报告必须包含：

```markdown
## Phase 10 Release Workflow Dry Run PASS Report

目标：

完成状态：

Release 覆盖：
- package visibility policy：
- package metadata：
- version/release notes：
- release dry-run：
- package smoke：
- CI/release gate：
- artifact policy：

核心架构边界验证：
- host-owned authoring：
- runtime core zero dependency：
- release tooling isolation：
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
- corepack pnpm release:dry-run：
- corepack pnpm validate:full：
- git diff --check：

最终 commit：

push 结果：

未完成/后续事项：

风险与建议：
```

---

## 14. 后续 Phase 候选

Phase 10 通过后，下一阶段可从以下方向选择：

- Phase 11：真实 npm publish permission preflight and release tag automation。
- Phase 11：live Sinan Engine repository integration。
- Phase 11：真实 Three.js GLTF parser integration。
- Phase 11：Firefox/WebKit browser matrix expansion。

选择标准：优先选择能继续验证核心边界的最小真实工作流，而不是扩展最大功能面。
