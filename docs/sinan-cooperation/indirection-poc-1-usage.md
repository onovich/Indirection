# Indirection / Sinan POC-1 Usage

日期：2026-06-20

## 1. 目标

POC-1 用脱敏 fixture 验证 importer + report 流程：

```txt
Sinan-style manifest
  -> fixture importer
  -> normalized model
  -> catalog draft
  -> missing reference / fallback / budget reports
```

## 2. Fixture

输入 fixture：

```txt
fixtures/sinan/assets.manifest.json
```

它包含：

- 5 个脱敏 asset。
- 1 个 scene group。
- 4 个 host references，其中 1 个故意缺失。
- group transfer budget。
- fallback hints。

## 3. 验证

运行：

```powershell
corepack pnpm test
```

关键测试：

```txt
packages/compiler/test/sinan-importer.test.ts
packages/compiler/test/sinan-report.test.ts
```

当前测试覆盖：

- Sinan fixture importer 输出 normalized model。
- catalog draft 可生成且 hash 稳定。
- missing reference report 输出 `sinan:gate.missing-audio`。
- fallback report 验证 fallback type compatibility。
- budget compatibility report 汇总 `sinan:scene.gate-demo` transfer bytes。

## 4. 解释报告

报告结果不是 Sinan authoring source-of-truth。它们是可重建的派生产物，用于 CI、评审和后续 adapter 决策。

当前 fixture 的 missing reference 是刻意保留的验证点：

```txt
timeline:intro -> gate.missing-audio
```

该引用会报告为：

```txt
IND_ASSET_UNKNOWN
```

## 5. 后续接入建议

POC-2 如果在 Sinan repo 中落地，应优先作为 feature-flagged adapter 接在现有 runtime facade 后面，保留回退到 Sinan 内置 loader 的路径。
