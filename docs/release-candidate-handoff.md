# Release Candidate Handoff

This document records the Phase 19 no-publish release-candidate handoff. It is a human decision package for a future v0.1 release, not permission to publish packages, create tags, create GitHub Releases, upload artifacts, sign packages, or upload npm provenance.

For local checkout evaluation, start with [Evaluator quickstart](evaluator-quickstart.md), then use [Package entrypoints](package-entrypoints.md), [Example workflows](example-workflows.md), and [Public demo site rehearsal](public-demo-site.md) to inspect package boundaries and runnable examples. These onboarding and local demo docs explain how to evaluate the repository locally; they do not change the owner decision blockers, grant publish permission, or grant deployment permission.

## Commands

Run the local release-candidate rehearsal gate with:

```powershell
corepack pnpm release:rc-check
```

The gate creates a deterministic report in memory and prints a PASS line by default. Use JSON output only for local inspection or tests:

```powershell
node scripts/release-candidate-rehearsal.mjs --json
```

Do not commit generated RC JSON output, package tarballs, provenance output, workflow run output, release archives, npm caches, Playwright artifacts, traces, screenshots, videos, `dist/`, or `.tsbuildinfo`.

## Package Candidacy

Every workspace package remains `private: true`, version `0.0.0`, and `UNLICENSED`. The package candidacy below is a release-owner decision aid only.

| Package | RC candidacy | Current state | Required owner decision |
|---|---|---|---|
| `@indirection/protocol` | First-batch public candidate | `private: true`, `UNLICENSED` | Accept public API support scope for `AssetId`, diagnostics, and shared contracts. |
| `@indirection/schema` | First-batch public candidate | `private: true`, `UNLICENSED` | Accept schema tooling support and Zod-bearing package visibility. |
| `@indirection/compiler` | First-batch public candidate | `private: true`, `UNLICENSED` | Accept compiler/report contract support and importer compatibility policy. |
| `@indirection/runtime` | First-batch public candidate | `private: true`, `UNLICENSED` | Accept runtime lifecycle support scope and zero-DOM/adapter boundary. |
| `@indirection/loaders-web` | Public adapter candidate | `private: true`, `UNLICENSED` | Accept Web loader and Cache Storage adapter support scope. |
| `@indirection/three` | Public optional-peer adapter candidate | `private: true`, `UNLICENSED` | Accept optional-peer Three GLTF adapter maturity and support boundary. |
| `@indirection/vite` | Public tooling candidate | `private: true`, `UNLICENSED` | Accept Vite peer range and virtual catalog plugin support scope. |
| `@indirection/cli` | Public tooling candidate | `private: true`, `UNLICENSED` | Accept CLI command contract for validate/build/report/inspect workflows. |
| `@indirection/testkit` | Deferred or developer-support candidate | `private: true`, `UNLICENSED` | Decide whether testkit is public support surface or internal release fixture. |

## Validation Gate Evidence

The RC rehearsal summarizes evidence from existing local gates instead of redefining release semantics:

```powershell
corepack pnpm validate:full
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
corepack pnpm release:rc-check
git diff --check
```

- `validate:full` remains the main quality matrix.
- `release:ci-check` remains the workflow permission and command-parity source of truth.
- `release:provenance` remains the deterministic dry-run package artifact evidence source of truth.
- `release:dry-run` remains the private package policy and no publish/tag side-effect gate.
- `publish:preflight` remains the decision gate for future publishing.
- `release:rc-check` summarizes package candidacy, validation evidence, owner decision blockers, blocked real-publish actions, rollback, and release ownership handoff.

## Owner Decision Blockers

These owner decision blockers are expected output of the no-publish rehearsal. They block real publishing, but they do not fail the local RC rehearsal while the project intentionally remains private.

- package visibility for each workspace package;
- npm scope ownership, package names, owners, and maintainers;
- npm account, organization, 2FA, token, and automation identity policy;
- public SPDX license, repository LICENSE contents, notices, and docs license posture;
- package versioning, workspace dependency versioning, release notes, and Changesets policy;
- Git tag naming, signing, owner, and failed-publish-after-tag handling;
- GitHub Release timing, asset policy, and owner;
- npm provenance upload policy;
- package signing or Sigstore policy;
- workflow write permission and secret policy;
- package or release artifact upload policy;
- release owner and approver list;
- rollback, deprecate, unpublish, and accidental publish response policy.

## Blocked Real-Publish Actions

No real npm publish is allowed in Phase 19. The RC rehearsal keeps these actions blocked:

- `npm publish` and `pnpm publish`;
- `npm login`, `npm whoami`, `npm access`, `npm token`, `npm owner`, and `npm dist-tag`;
- npm registry writes;
- Git tag creation and tag pushes;
- GitHub Release creation or mutation;
- package upload workflows and artifact upload workflows;
- signing, Sigstore, npm provenance upload, and OIDC publish workflows;
- GitHub Actions write permissions such as `contents: write`, `packages: write`, or `id-token: write`.

## Rollback And Incident Handoff

The Phase 19 rollback state is repository-only because no package, tag, GitHub Release, provenance upload, signing output, or release artifact exists.

- If a rehearsal-only change is wrong, fix it with a normal follow-up commit or an explicitly owner-requested git revert.
- If local validation fails, do not commit or push the failing change.
- If a future phase accidentally publishes a package, stop release work and require an owner incident decision before deprecate or unpublish behavior.
- Do not run `npm unpublish` during Phase 19.
- Do not create a GitHub Release to explain a failed rehearsal because no release exists.

## Release Ownership Handoff

Release ownership is still `pending-owner-decision`. Before any future phase may remove `private: true`, change `UNLICENSED`, create a tag, create a GitHub Release, add workflow write permissions, or run a publish command, the owner must accept:

- release owner and approvers;
- final package list and visibility;
- npm account/scope/2FA/token policy;
- public license and notices;
- versioning and release notes policy;
- tag and GitHub Release policy;
- provenance upload, signing, and package upload policy;
- rollback and incident response policy.

## Report Shape

`scripts/release-candidate-rehearsal.mjs --json` emits a deterministic `ReleaseCandidateRehearsalReport` documented in `docs/report-json-shapes.md`. The report must not include timestamps, absolute local paths, local usernames, environment variable values, npm tokens, registry credentials, Git SHAs, generated artifact paths, tags, releases, signing evidence, Sigstore attestations, npm provenance uploads, or OIDC publish workflow state.
