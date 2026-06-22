# Indirection Phase 11 Publish Preflight Policy Goal 模式执行指南

日期：2026-06-22
状态：给 Goal 模式执行者使用的 Phase 11 开发指令文档
上游 PASS：`docs/phase-10-pass-report.md`

---

## 0. 直接给执行者的 Goal Prompt

请以 Goal 模式执行 `D:\LabProjects\Engine\Indirection` 项目的 Phase 11：Publish Preflight Policy & Release Decision Gates。

Phase 10 已验收通过，最新 PASS 证据见 `docs/phase-10-pass-report.md`，最终提交为 `2975277 docs: add phase 10 pass report`。Phase 11 的目标不是执行真实 npm 发布，而是在保持所有包 `private: true`、不创建真实 tag/GitHub Release 的前提下，把 v0.1 真实发布前必须接受的 package visibility、npm 权限、公共 license、versioning、release tag、GitHub Release 和回滚策略固化为可审查文档与可执行 preflight 门禁。

总轮数预算：16 轮。

- 第 1-12 轮：主实现。
- 第 13-15 轮：缓冲修复、preflight 文档/脚本/CI 稳定化。
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
- `docs/phase-10-pass-report.md`
- `docs/indirection-phase-10-release-workflow-goal-guide.md`
- `docs/release-readiness.md`
- `docs/release-workflow.md`
- `docs/release-versioning-adr.md`
- `docs/browser-e2e.md`
- `docs/report-json-shapes.md`
- `docs/phase-7-integration.md`
- `docs/Indirection_寻址_架构与技术选型设计_v0.1.md`
- `docs/Indirection_技术架构与开发计划_v0.2.md`
- `docs/rd-plan-sinan-alignment-2026-06-20.md`
- `CHANGELOG.md`
- `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/validate.yml`
- `.github/workflows/release-dry-run.yml`
- `scripts/release-dry-run.mjs`
- `scripts/pack-check.mjs`
- `scripts/docs-drift-check.mjs`
- `scripts/core-boundary-check.mjs`
- 所有 `packages/*/package.json`

Phase 10 验收结论：

- `corepack pnpm validate:full` 通过。
- `corepack pnpm release:dry-run` 通过。
- `git diff --check` 通过。
- `pack:check` 已覆盖 9 个 workspace packages、tarball contents、temporary consumer imports 和 installed CLI bin。
- 所有 workspace packages 仍保持 `private: true`。
- 手动 GitHub Actions `Release Dry Run` workflow 使用只读权限，不 publish，不 tag。

Phase 11 选择说明：

Phase 11 候选包括真实 npm publish permission preflight、live Sinan Engine integration、真实 Three.js GLTF parser integration、Firefox/WebKit browser matrix expansion。本阶段选择 **Publish Preflight Policy & Release Decision Gates**，因为 Phase 10 已经把 dry-run 和 package readiness 打通，下一步最小风险是把“何时允许真实发布”的决策和门禁补齐。这样后续即使进入 Sinan、Three 或浏览器矩阵扩展，也不会在发布流程上留下含糊边界。

---

## 2. 本阶段要完成什么

Phase 11 要完成：

- 新增 publish preflight policy 文档，明确 package visibility、npm scope、npm account、license、versioning、tag、GitHub Release、rollback 的接受条件。
- 明确当前状态：Phase 11 仍不允许真实 publish，所有 package manifest 仍保持 `private: true`，当前 license 仍为 `UNLICENSED`，公共 SPDX license 待明确接受。
- 为每个 workspace package 输出 v0.1 publish candidate matrix：是否首批候选、是否可延后、是否需要额外 owner 决策。
- 建立本地 `publish:preflight` 或等价脚本，检查 release decision 文档、package private policy、version policy、license gate、npm publish script absence、tag absence、workflow permissions 和 dry-run gate 链接。
- 建立或更新 CI 手动 preflight gate，只运行本地安全 preflight，不发布、不登录 npm、不创建 tag。
- 重新评估 Changesets：接受“继续轻量 release notes”或“后续真实发布前引入 Changesets”的策略，并写入 ADR 或更新现有 ADR。
- 将 `docs/release-workflow.md` 从 Phase 10 dry-run policy 延伸为 Phase 11 publish-preflight policy，但不能移除 Phase 10 的 no-publish 安全边界。
- 增强 docs drift 检查，使 README、docs index、release readiness、release workflow、Phase 10 PASS、Phase 11 guide、validation/release/preflight commands 一致。
- 输出 Phase 11 PASS report。

首选验收形态：

```powershell
corepack pnpm validate:full
corepack pnpm pack:check
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

如果 `publish:preflight` 被命名为其他脚本，必须在 PASS report 中说明替代命令、覆盖范围和不触发真实发布的证据。

---

## 3. 本阶段不做什么

Phase 11 不做：

- 不执行真实 `npm publish`。
- 不执行需要真实 npm 登录、npm token、2FA 或 registry 写入的命令。
- 不创建真实 Git tag。
- 不创建真实 GitHub Release。
- 不删除任何 package 的 `private: true`。
- 不把 package license 从 `UNLICENSED` 改为公共 SPDX license，除非用户或项目负责人在本阶段明确接受具体 license。
- 不修改 package versions 或 workspace dependency ranges，除非本阶段明确接受版本策略且验证通过。
- 不把 `npm publish --dry-run` 或 `pnpm publish --dry-run` 作为默认 CI gate；只有在 policy 明确允许且不写 registry、不留产物时才能作为可选人工 preflight。
- 不接入 live Sinan Engine 仓库。
- 不实现真实 Three.js GLTF parser integration。
- 不扩大 Firefox/WebKit 浏览器矩阵。
- 不改变 runtime core API 或把 release/preflight tooling 引入 runtime core。
- 不提交 generated tarballs、release archives、npm caches、Playwright artifacts、temporary consumer 目录、`dist/` 或 `*.tsbuildinfo`。

---

## 4. 架构边界

必须继续满足：

- host-owned authoring 仍是 source-of-truth。
- compiled catalog 仍是派生产物。
- runtime handle、scope、cache、decoded value 不进入 authoring JSON。
- runtime core 仍零 DOM、零 implicit fetch、零 Zod、零 Three、零 Vite、零 React、零 Node-specific import。
- release/preflight tooling 只存在于 scripts/docs/CI/package metadata，不进入 core 包源码。
- package metadata 只能描述包发布边界，不能复制 compiler/runtime/schema 语义。
- release policy、license policy、versioning policy 不能成为 authoring source-of-truth。
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
- 不运行真实 publish/tag/release 命令。

每轮验证至少运行：

```powershell
git diff --check
```

若改 release/preflight docs、docs drift、README 或 docs index，运行：

```powershell
corepack pnpm check:docs
```

若改 package metadata、preflight scripts、release scripts、pack checks、CI 或 lockfile，运行：

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm pack:check
corepack pnpm release:dry-run
```

若新增 `publish:preflight` 或等价脚本，运行：

```powershell
corepack pnpm publish:preflight
```

若改 validation、CI、release dry-run、preflight gate 或 package gates，运行：

```powershell
corepack pnpm validate:full
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
- 不提交本地 `Role.md`、package tarball、temporary consumer、release archive、npm cache、Playwright trace/report/screenshot、`dist/` 或 `*.tsbuildinfo`。
- 不 force-push。
- 验证失败不提交。
- preflight 脚本不得修改 package versions、lockfile、workspace dependency ranges 或 package private state。

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

- 当前变化能否用一个最小 publish-preflight、release decision、package owner 或用户发布前检查流程解释？
- 失败能否定位到 license policy、npm scope/account、package visibility、versioning、tag policy、GitHub Release policy、rollback policy、CI permission、docs drift 或 package metadata 中的具体层？
- 是否覆盖 success、failure、pending decision、stale decision、incompatible policy 状态？
- 如果改 preflight script，是否保证不会真实 publish、不会登录 npm、不会创建 tag、不会留下可提交 artifacts？
- 如果改 license 或 versioning policy，是否避免在未接受决策前修改 package manifests？
- 如果改 CI，是否能在本地用同一核心命令复现？

---

## 9. 架构自检

每轮必须回答：

- source-of-truth 边界是否仍保持？
- runtime core 是否仍没有浏览器、Node tooling、release/preflight tooling、adapter 耦合？
- compiler/schema/runtime 的语义是否仍分层？
- package metadata 和 publish policy 是否只是发布边界描述，没有复制 schema/runtime/compiler 语义？
- diagnostics code 是否仍稳定，测试是否不依赖自然语言 message？
- Vite/Three/loaders-web/CLI/release tooling 是否仍是 adapter/外围层？
- 是否避免把 live Sinan、真实 Three GLTF、Firefox/WebKit 矩阵拉入 Phase 11？
- 是否保留 unrelated files、generated outputs、本地 `Role.md` 和用户变更？

---

## 10. 分轮安排

### Main Rounds

| Round | 目标 | 验证 |
|---:|---|---|
| 1 | 固化 Phase 11 goal guide，更新 README/docs index/release readiness/Phase 10 PASS report 的 next-phase 指向 | `corepack pnpm check:docs`，`git diff --check`，链接存在性检查 |
| 2 | 新增 publish preflight policy 文档，定义 decision 状态模型和 no-publish 安全边界 | `corepack pnpm check:docs`，`git diff --check` |
| 3 | 输出 workspace package publish candidate matrix：public candidate、deferred、internal、owner decision | `corepack pnpm check:docs`，`git diff --check` |
| 4 | 固化 license policy：当前 `UNLICENSED/private` 保持，公共 SPDX license 需后续明确接受 | `corepack pnpm check:docs`，`git diff --check` |
| 5 | 固化 npm account/scope/permission preflight：不登录、不写 registry，只记录人工接受项和安全检查 | `corepack pnpm check:docs`，`git diff --check` |
| 6 | 固化 Git tag/GitHub Release policy：真实 tag/release 仍禁止，定义后续接受条件和回滚决策 | `corepack pnpm check:docs`，`git diff --check` |
| 7 | 重新评估 Changesets 或轻量 release notes 策略，更新 ADR 或新增 Phase 11 release decision ADR | `corepack pnpm check:docs`，`git diff --check` |
| 8 | 新增 `publish:preflight` 或等价脚本，检查 docs、private policy、license gate、publish/tag absence | `corepack pnpm publish:preflight`，`git diff --check` |
| 9 | 增强 preflight script：验证 workflow permissions、release dry-run linkage、package candidate matrix consistency | `corepack pnpm publish:preflight`，`corepack pnpm release:dry-run` |
| 10 | 更新 CI：添加手动 publish preflight workflow 或扩展 release dry-run workflow，不 publish、不 tag | `corepack pnpm validate:full`，workflow review |
| 11 | 增强 docs drift check：README、docs index、release readiness、release workflow、Phase 11 guide、PASS report 指针一致 | `corepack pnpm check:docs`，`git diff --check` |
| 12 | Phase 11 主实现稳定轮，跑完整矩阵、release dry-run 和 publish preflight | `corepack pnpm validate:full`，`corepack pnpm release:dry-run`，`corepack pnpm publish:preflight`，`git diff --check` |

### Buffer Rounds

| Round | 用途 | 验证 |
|---:|---|---|
| 13 | 修复 publish candidate matrix、license policy、npm scope/account preflight 文档问题 | `corepack pnpm check:docs`，`corepack pnpm publish:preflight` |
| 14 | 修复 preflight script、CI 手动 workflow、release dry-run linkage 稳定性问题 | `corepack pnpm validate:full`，`corepack pnpm publish:preflight` |
| 15 | 修复 docs drift、release readiness、PASS report 遗留问题 | `corepack pnpm check:docs`，`git diff --check` |

### Final Validation

| Round | 目标 | 验证 |
|---:|---|---|
| 16 | 输出 Phase 11 PASS report，最终验证、提交、推送 | full validation matrix，release dry-run，publish preflight，commit hash，push result |

---

## 11. 验证矩阵

Phase 11 最终必须通过：

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
corepack pnpm publish:preflight
corepack pnpm validate:full
git diff --check
```

如果 `publish:preflight` 尚未建立，最终 PASS 前必须建立或在 PASS report 中记录被明确拒绝的理由和等价替代命令。

---

## 12. PASS 标准

Phase 11 PASS 必须满足：

- 存在明确的 publish preflight policy。
- package visibility、npm scope/account、license、versioning、tag、GitHub Release、rollback 决策状态被文档化。
- 当前 package manifests 仍保持 `private: true`，除非项目负责人明确接受真实发布前的 public package 变更。
- 当前 `UNLICENSED` / public SPDX license 状态有明确政策，不被脚本或执行者擅自修改。
- `publish:preflight` 或等价脚本可重复运行，且不会真实 publish、不会登录 npm、不会创建 tag、不会写 registry、不会提交生成产物。
- `release:dry-run` 继续通过。
- `pack:check` 继续覆盖 9 个 workspace packages。
- CI 有手动 publish preflight gate 或明确等价门禁，且权限不允许发布或 tag。
- README、docs index、release readiness、release workflow、PASS report、validation/release/preflight commands 一致。
- runtime core boundary 继续通过。
- Phase 9 browser E2E 继续通过。
- `corepack pnpm validate:full` 继续通过。
- 工作区干净并已推送。

---

## 13. 最终报告模板

最终报告必须包含：

```markdown
## Phase 11 Publish Preflight Policy PASS Report

目标：

完成状态：

Publish preflight 覆盖：
- package visibility decision：
- npm scope/account/permission：
- license policy：
- versioning policy：
- tag/GitHub Release policy：
- rollback/no-publish policy：
- publish preflight script：
- CI/preflight gate：

核心架构边界验证：
- host-owned authoring：
- runtime core zero dependency：
- release/preflight tooling isolation：
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
- corepack pnpm publish:preflight：
- corepack pnpm validate:full：
- git diff --check：

最终 commit：

push 结果：

未完成/后续事项：

风险与建议：
```

---

## 14. 后续 Phase 候选

Phase 11 通过后，下一阶段可从以下方向选择：

- Phase 12：真实 npm publish release candidate，在用户明确接受 npm account、license、package visibility、tag policy 后执行。
- Phase 12：live Sinan Engine repository integration。
- Phase 12：真实 Three.js GLTF parser integration。
- Phase 12：Firefox/WebKit browser matrix expansion。

选择标准：优先选择能继续验证核心边界的最小真实工作流，不把发布、Sinan、Three 和浏览器矩阵风险叠在同一阶段。
