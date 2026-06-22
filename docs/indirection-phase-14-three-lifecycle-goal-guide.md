# Indirection Phase 14 Three Adapter Lifecycle Goal 模式执行指南

日期：2026-06-22
状态：给执行者使用的 Phase 14 开发指令文档
上游 PASS：`docs/phase-13-pass-report.md`

---

## 0. 直接给执行者的 Goal Prompt

请以 Goal 模式执行 `D:\LabProjects\Engine\Indirection` 项目的 Phase 14：Three Adapter Lifecycle Contract。

Phase 13 已验收通过，最新 PASS 证据见 `docs/phase-13-pass-report.md`，最终提交为 `0e3a7f7 docs: add phase 13 pass report`。Phase 14 的目标是在 Phase 13 真实 GLTF parser adapter 之后，补上最小可验证的生命周期契约：让 runtime 真正持有并调用 `LoadedAsset.dispose`，让 `@indirection/three` 能表达 owned-resource disposer、instantiate hook 和 animation metadata extraction，同时继续保持 Three.js 不进入 protocol/schema/compiler/runtime core。

总轮数预算：16 轮。

- 第 1-12 轮：主实现。
- 第 13-15 轮：缓冲修复、lifecycle/disposer/typing/pack 兼容修复。
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
- `docs/phase-13-pass-report.md`
- `docs/indirection-phase-13-three-gltf-goal-guide.md`
- `docs/three-gltf-adapter.md`
- `docs/release-readiness.md`
- `docs/Indirection_技术架构与开发计划_v0.2.md`
- `docs/Indirection_寻址_架构与技术选型设计_v0.1.md`
- `packages/runtime/src/index.ts`
- `packages/runtime/test/scope-handle.test.ts`
- `packages/runtime/test/resource-table.test.ts`
- `packages/three/package.json`
- `packages/three/src/index.ts`
- `packages/three/test/three-boundary.test.ts`
- `scripts/core-boundary-check.mjs`
- `scripts/docs-drift-check.mjs`
- `scripts/pack-check.mjs`

Phase 13 验收结论：

- `corepack pnpm install --frozen-lockfile` 通过。
- `corepack pnpm test -- --run packages/three/test/three-boundary.test.ts` 通过。
- `corepack pnpm validate:full` 通过。
- `corepack pnpm release:dry-run` 通过。
- `corepack pnpm publish:preflight` 通过。
- `git diff --check` 通过。
- `@indirection/three` 已支持注入真实 `GLTFLoader.parseAsync`，但 full GPU disposal、instantiate helper 和 animation metadata 仍是后续项。

Phase 14 选择说明：

Phase 13 之后的候选包括 Three adapter disposal / instantiate / animation metadata lifecycle、真实 npm publish release candidate、live Sinan Engine integration、browser E2E stress and artifact diagnostics。真实 npm publish 仍需要所有者接受 npm account、license、package visibility、tag policy；live Sinan 集成仍依赖真实宿主集成面；browser E2E stress 更偏发布硬化。Phase 14 选择 **Three Adapter Lifecycle Contract**，因为它直接补齐 Phase 13 明确留下的生命周期缺口，并继续服务 Indirection 最核心的 `AssetScope` / `AssetHandle` 可观察释放承诺。

---

## 2. 本阶段要完成什么

Phase 14 要完成：

- 让 runtime 对 `LoadedAsset.dispose` 的语义可执行、可测试、幂等。
- 在最后一个 live handle release 或 `scope.dispose()` 释放最后引用时，调用该 loaded asset 的 disposer。
- 确认 in-flight dedup 下多个 handle 共享同一个 loaded value 时，disposer 只在最终释放时调用一次。
- 确认 acquire 失败、fallback、abort、parser failure 不会泄漏 disposer 或错误释放 fallback。
- 在 resource snapshot 中保持 `hasDisposer`、`state`、`refCount` 的可解释性；必要时明确 `released`、`evictable`、`disposed` 的最小阶段语义。
- 在 `@indirection/three` 中增加最小 lifecycle helper：owned-resource disposer contract、instantiate hook contract、animation metadata extraction。
- Three lifecycle helper 必须支持测试替身或真实 GLTFLoader 结果，不要求 WebGL renderer、不要求 GPU 上下文。
- 更新 `docs/three-gltf-adapter.md`，说明 disposer ownership、instantiate hook、animation metadata、non-scope 和 host responsibility。
- 更新 docs drift guard 和 package smoke，防止 lifecycle API 退化。
- 输出 `docs/phase-14-pass-report.md`。

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

Phase 14 不做：

- 不发布 npm 包。
- 不执行 npm login、npm token 检查、registry write。
- 不移除 `private: true`，不更改 `UNLICENSED` 策略。
- 不创建 Git tag 或 GitHub Release。
- 不接入 live Sinan Engine 仓库。
- 不实现 `@indirection/sinan`。
- 不实现 Draco、KTX2、meshopt、texture pipeline、ImageBitmap lifecycle 或 GPU memory estimator。
- 不做 Playwright/Three renderer E2E，不创建真实 WebGL scene smoke。
- 不要求 runtime core 认识 Three object、GLTF scene、AnimationClip、Object3D、Texture、Material 或 Geometry。
- 不把 `three`、`GLTFLoader`、DOM、fetch、window、document 引入 `@indirection/runtime`、`@indirection/protocol`、`@indirection/schema`、`@indirection/compiler`。
- 不尝试对所有 Three 资源做全自动深度销毁；owned-resource disposer 必须基于显式 ownership policy，避免销毁宿主共享资源。
- 不把 instantiate helper 变成宿主 scene attach、renderer attach、camera/light management 或 gameplay object factory。

---

## 4. 架构边界

必须继续满足：

- host-owned authoring 仍是 source-of-truth。
- compiled catalog 仍是派生产物。
- runtime core 只拥有通用 loaded asset lifecycle，不拥有 Three-specific disposal 语义。
- `LoadedAsset.dispose` 是通用 loader contract；Three disposer 只是 adapter 提供的一个使用者。
- `@indirection/three` 可以暴露 adapter-specific helper 和 metadata 类型，但不能让 core API 暴露 Three-specific 类型。
- parser failure、dispose failure 和 fallback 行为必须用结构化 state/code 或测试替身断言，不依赖自然语言 message。
- instantiate hook 应是 host/adapter 注入点，而不是 runtime core 的新职责。
- animation metadata extraction 应保持只读摘要，不改变 GLTF scene 或宿主 runtime state。
- Sinan-specific 词汇仍只允许出现在 docs、fixtures、tests、adapter POC 边界，不进入 core API。

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

如果改动 runtime lifecycle、`packages/three`、tests 或 package metadata：

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

- 当前变化能否用最小 loader/disposer fixture、Three adapter fixture 或 runtime acquire/release workflow 解释？
- 失败能否定位到 in-flight dedup、handle release、scope dispose、fallback acquire、disposer async rejection、Three ownership policy、instantiate hook、animation metadata extraction、pack/import smoke 中的具体层？
- 是否覆盖 success、double release、scope dispose、shared handle、fallback、loader failure、disposer failure、no-disposer states？
- disposer 是否只在最后一个引用释放后调用一次？
- fallback 场景是否只释放实际成功加载并被持有的 value？
- 如果 package metadata 变化，临时 consumer import 是否仍能复现？

---

## 9. 架构自检

每轮必须回答：

- source-of-truth 边界是否仍保持？
- runtime core 是否仍没有 Three、DOM、fetch、Vite、React、Sinan、Node-specific adapter 耦合？
- `LoadedAsset.dispose` 是否保持通用 lifecycle contract，而不是 Three-only 特例？
- `@indirection/three` 是否仍是 adapter 包，而不是 core 语义来源？
- instantiate 和 animation metadata 是否停留在 adapter helper 或 host injection 层？
- 是否避免把真实 npm publish、live Sinan、Draco/KTX2/meshopt、texture pipeline、renderer E2E 拉入 Phase 14？
- 是否保留 unrelated files、generated outputs 和用户变更？

---

## 10. 分轮安排

### Main Rounds

| Round | 目标 | 验证 |
|---:|---|---|
| 1 | 固化 Phase 14 goal guide，更新 README/docs index/release readiness/Phase 13 PASS report 的 next-phase 指向 | `corepack pnpm check:docs`，`git diff --check` |
| 2 | 盘点 runtime `LoadedAsset.dispose` 当前只记录不执行的问题，设计最小 disposer storage 与 release trigger | `corepack pnpm typecheck`，`git diff --check` |
| 3 | 实现 runtime disposer 在最后引用释放时调用，覆盖单 handle release 和 idempotent double release | `corepack pnpm test -- --run packages/runtime/test/scope-handle.test.ts` |
| 4 | 覆盖 scope.dispose、多 handle 共享 loaded value、in-flight dedup 下 disposer 只调用一次 | `corepack pnpm test` |
| 5 | 覆盖 loader failure、fallback success、fallback release、disposer failure 的结构化状态 | `corepack pnpm test`，`corepack pnpm check:boundaries` |
| 6 | 更新 resource snapshot / docs，使 `hasDisposer`、`released`、`evictable`、`disposed` 语义可解释 | `corepack pnpm test`，`corepack pnpm check:docs` |
| 7 | 在 `@indirection/three` 增加 owned-resource disposer helper，使用 test doubles 验证 ownership policy | `corepack pnpm test -- --run packages/three/test/three-boundary.test.ts` |
| 8 | 增加 instantiate hook contract，证明 host 可注入 clone/instantiate 策略但 runtime core 不知道 Three | `corepack pnpm typecheck`，`corepack pnpm test` |
| 9 | 增加 animation metadata extraction，输出只读 clip 摘要并覆盖空 animations / named animations | `corepack pnpm test` |
| 10 | 更新 `docs/three-gltf-adapter.md`、release readiness、docs drift guard 和 package smoke | `corepack pnpm check:docs`，`corepack pnpm pack:check` |
| 11 | 跑完整本地质量门禁并修复 typing、pack、boundary、docs drift 问题 | `corepack pnpm validate:full` |
| 12 | 跑 release posture，确认 no publish/tag side effects 仍成立 | `corepack pnpm release:dry-run`，`corepack pnpm publish:preflight` |

### Buffer Rounds

| Round | 用途 | 验证 |
|---:|---|---|
| 13 | 修复 async disposer、shared handle、fallback release 的边界 bug | `corepack pnpm test`，`corepack pnpm typecheck` |
| 14 | 修复 package peer/dev dependency、exports、pack/import smoke 问题 | `corepack pnpm pack:check`，`corepack pnpm release:dry-run` |
| 15 | 修复 docs drift、boundary scan、lifecycle non-scope 表述或 follow-up 记录 | `corepack pnpm check:docs`，`corepack pnpm check:boundaries`，`git diff --check` |

### Final Validation

| Round | 目标 | 验证 |
|---:|---|---|
| 16 | 输出 Phase 14 PASS report，最终验证、提交、推送 | full validation matrix，commit hash，push result |

---

## 11. 验证矩阵

Phase 14 最终必须通过：

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

如果新增 Phase 14 smoke，则 `validate:full` 是否纳入由执行者基于耗时和稳定性决定；无论是否纳入，PASS report 必须列出该 smoke 的运行结果。

---

## 12. PASS 标准

Phase 14 PASS 必须满足：

- runtime 会执行 `LoadedAsset.dispose`，且最后引用释放时只调用一次。
- double release、scope.dispose、多 handle、in-flight dedup、fallback、loader failure、disposer failure 都有测试覆盖。
- resource snapshot 能解释 `hasDisposer`、refCount、released/evictable/disposed 状态。
- `@indirection/three` 有明确 owned-resource disposer helper 或等价 contract，并通过测试替身验证 ownership policy。
- `@indirection/three` 有 instantiate hook contract，且不把 scene attach / renderer attach 变成 runtime core 职责。
- `@indirection/three` 有 animation metadata extraction 或等价只读摘要。
- `three` 没有进入 protocol/schema/compiler/runtime core。
- package tarball/import smoke 不因 lifecycle API 扩展退化。
- README、docs index、release readiness、Three adapter docs、PASS report、validation commands 保持一致。
- `corepack pnpm validate:full`、`release:dry-run`、`publish:preflight`、`git diff --check` 全部通过。
- 工作区干净并已推送。

---

## 13. 最终报告模板

最终报告必须包含：

```markdown
# Phase 14 Three Adapter Lifecycle PASS Report

## Goal

## Completion Status

## Lifecycle Coverage

- runtime disposer:
- shared handles / in-flight dedup:
- scope dispose:
- fallback / failure:
- resource snapshots:
- Three owned-resource disposer:
- instantiate hook:
- animation metadata:
- package smoke:

## Core Architecture Boundary Validation

- host-owned authoring:
- runtime core generic lifecycle:
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

Phase 14 通过后，下一阶段可从以下方向选择：

- Phase 15：Draco/KTX2/meshopt capability injection and compressed source fallback。
- Phase 15：real npm publish release candidate，在用户明确接受 npm account、license、package visibility、tag policy 后执行。
- Phase 15：live Sinan Engine repository integration。
- Phase 15：browser E2E stress and artifact diagnostics。

选择标准：优先选择能继续验证核心边界的最小真实工作流，而不是扩大最大功能面。
