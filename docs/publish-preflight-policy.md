# Publish Preflight Policy

This document records the Phase 11 publish-preflight policy for a future v0.1 npm release. It is a decision gate, not permission to publish packages.

## Phase 11 Safety Boundary

Phase 11 must not:

- run a real `npm publish` or `pnpm publish`;
- log in to npm, require an npm token, use 2FA, or write to the npm registry;
- create a real Git tag;
- create a real GitHub Release;
- remove `private: true` from any package manifest;
- change package versions or workspace dependency ranges;
- change package licenses from `UNLICENSED`;
- commit generated tarballs, release archives, npm caches, Playwright artifacts, temporary consumers, `dist/`, or `*.tsbuildinfo`.

The only allowed publish-preflight work in Phase 11 is local documentation and local/CI-safe verification that the decisions required for a later real release are explicit.

## Decision Status Model

Each release decision must have one of these statuses:

| Status | Meaning | Phase 11 behavior |
|---|---|---|
| `pending` | The decision is known but not accepted. | Keep the current private/no-publish state. |
| `accepted` | The responsible owner has accepted the decision. | Record evidence, but do not publish in Phase 11. |
| `rejected` | The owner has declined the decision. | Keep packages private and document the blocker. |
| `deferred` | The decision belongs to a later phase. | Keep packages private and preserve the current dry-run gate. |
| `blocked` | Required evidence is missing or contradictory. | Stop real publish work until resolved. |

Phase 11 defaults all real-publish decisions to `pending` unless an explicit project-owner decision is already present in the repository.

## Required Decisions Before Real Publish

A later real publish phase must accept all of these decisions before any package can remove `private: true`:

- package visibility for each workspace package;
- npm scope ownership and package naming;
- npm account, organization, 2FA, and token policy;
- public SPDX license and repository license file;
- package versioning and workspace dependency version policy;
- Git tag naming and signing policy;
- GitHub Release creation policy;
- rollback, deprecate, and accidental publish response policy;
- release owner and approver list;
- final validation matrix and artifact retention policy.

## Current Phase 11 Decision Snapshot

| Decision | Status | Current policy |
|---|---|---|
| Package visibility | `pending` | All workspace packages remain `private: true`. |
| npm scope/account/permission | `pending` | No npm login, token, 2FA, registry write, or organization permission check runs in Phase 11. |
| Public license | `pending` | Packages remain `UNLICENSED`; no public SPDX license is selected in Phase 11. |
| Versioning | `pending` | Package versions stay `0.0.0`; workspace ranges stay `workspace:*`. |
| Git tag | `pending` | No real Git tag is created in Phase 11. |
| GitHub Release | `pending` | No GitHub Release is created in Phase 11. |
| Rollback/deprecate response | `pending` | Phase 11 has no npm artifact to roll back; future accidental publish response needs owner acceptance. |

## Workspace Publish Candidate Matrix

Every workspace package remains `private: true` in Phase 11. The matrix below describes future publish candidacy only.

| Package | Phase 11 decision status | Future v0.1 candidacy | Owner decision needed before real publish |
|---|---|---|---|
| `@indirection/protocol` | `pending` | First-batch public candidate | Accept public API support scope for `AssetId`, diagnostics, and shared contracts. |
| `@indirection/schema` | `pending` | First-batch public candidate | Accept Zod-bearing tooling package as public while keeping Zod out of runtime core. |
| `@indirection/compiler` | `pending` | First-batch public candidate | Accept compiler/report contract support and importer compatibility promise. |
| `@indirection/runtime` | `pending` | First-batch public candidate | Accept runtime lifecycle support scope and zero-dependency boundary. |
| `@indirection/loaders-web` | `pending` | Public adapter candidate | Accept browser/Web adapter support scope and Cache Storage surface. |
| `@indirection/three` | `pending` | Deferred or optional-peer public candidate | Decide whether skeleton Three GLTF boundary is mature enough before real parser integration. |
| `@indirection/vite` | `pending` | Public tooling candidate | Accept Vite peer range and virtual catalog plugin support scope. |
| `@indirection/cli` | `pending` | Public tooling candidate | Accept CLI command contract for validate/build/report/inspect workflows. |
| `@indirection/testkit` | `pending` | Deferred or developer-support public candidate | Decide whether testkit is public support surface or internal release fixture. |

Current default: no package may move from candidate to real publish until its owner decision is `accepted` and the publish-preflight gate passes.

## License Policy

Current Phase 11 license state:

- root package license: `UNLICENSED`;
- every workspace package license: `UNLICENSED`;
- no repository license file is accepted for public package distribution;
- no package manifest may switch to a public SPDX license during Phase 11 without an explicit owner decision.

A later real publish phase must accept all license items before removing `private: true` from any package:

- public SPDX license identifier;
- repository `LICENSE` file contents;
- whether every workspace package uses the same license;
- whether adapter packages with optional peers need additional notices;
- whether generated artifacts, examples, fixtures, and docs have the same license posture as packages;
- whether third-party dependencies require notices in package docs.

If the public license is still `pending`, `publish:preflight` must fail any attempt to mark packages publishable for real. Phase 11 policy gates may still pass because they prove the project is intentionally not publishing yet.

## Npm Scope, Account, And Permission Policy

Current Phase 11 npm state:

- package names remain under the logical `@indirection/*` scope;
- root package `indirection` remains private and non-publishable;
- no npm account is selected in repository policy;
- no npm organization ownership is verified in Phase 11;
- no npm token, login, 2FA, provenance, or registry write command runs in Phase 11.

A later real publish phase must accept:

- whether `@indirection/*` is the final npm scope;
- npm organization owner and maintainer list;
- publishing account or automation identity;
- 2FA and token policy;
- package provenance policy;
- whether package access is public or restricted;
- who may run the final publish command;
- how permission evidence is recorded without committing secrets.

Allowed Phase 11 checks:

- verify package manifest names use the current logical `@indirection/*` scope;
- verify all workspace packages remain `private: true`;
- verify there are no real publish scripts;
- verify CI workflows use read-only repository permissions for preflight jobs;
- verify no `.npmrc` token or registry credential is committed.

Disallowed Phase 11 checks:

- `npm login`;
- `npm whoami` when it requires a live user/session;
- `npm token` commands;
- `npm owner` mutation commands;
- `npm publish`, `pnpm publish`, or any registry write command.

## Git Tag And GitHub Release Policy

Current Phase 11 tag/release state:

- no real Git tag is created;
- no GitHub Release is created;
- no workflow has write permissions for contents or releases;
- release tag naming remains `pending`;
- tag signing and release notes attachment policy remain `pending`.

A later real publish phase must accept:

- tag name format, such as `v0.1.0` or a package-specific tag;
- whether tags are signed;
- which commit may be tagged;
- whether GitHub Releases are created before or after npm publish;
- which artifacts, if any, are attached to a GitHub Release;
- who approves and pushes the tag;
- how failed publish after tag creation is handled.

Allowed Phase 11 checks:

- inspect existing local Git tags pointing at `HEAD`;
- verify preflight workflows do not request write permissions;
- verify docs record that no tag/release is created in Phase 11.

Disallowed Phase 11 checks:

- `git tag` creation or deletion;
- `git push --tags`;
- GitHub Release creation, deletion, or mutation;
- release asset upload.

## Rollback And Accidental Publish Policy

Phase 11 has no npm artifact and no Git tag, so rollback is repository-only:

- if a preflight-only commit is wrong, fix it with a normal follow-up commit or an explicitly requested git revert;
- if local validation fails, do not commit or push the failing change;
- if a future real publish phase accidentally publishes a package, stop publish work and record package name, version, npm account, command, timestamp, and registry URL before choosing deprecate or unpublish behavior;
- do not run `npm unpublish` in Phase 11;
- do not create a GitHub Release to explain a failed Phase 11 preflight because no release exists.

Future rollback decisions must be accepted before real publish:

- whether accidental releases are deprecated or unpublished;
- who owns npm incident response;
- how to communicate a failed release candidate;
- whether a bad Git tag is deleted or superseded;
- whether package consumers receive a follow-up patch release.

## Versioning And Release Notes Policy

Phase 11 reaffirms `docs/release-versioning-adr.md`:

- package versions stay `0.0.0`;
- workspace dependency ranges stay `workspace:*`;
- `CHANGELOG.md` remains the human release-notes source;
- Changesets is not added in Phase 11;
- real publish cannot start until the release owner accepts either Changesets or the lightweight release notes policy for a real versioned release.

## Safe Local Gates

The safe local gates are:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
git diff --check
```

Phase 11 adds `corepack pnpm publish:preflight` as a local policy gate. It must only inspect repository state and local Git metadata. It must not publish, login, create tags, create releases, or mutate manifests.

Run the local publish preflight gate with:

```powershell
corepack pnpm publish:preflight
```

The same gate is available in GitHub Actions through the manual `Publish Preflight` workflow. It uses read-only repository permissions and runs `publish:preflight`, `release:dry-run`, and `git diff --check`.

## Relationship To Phase 10

Phase 10 proved package readiness and release dry-run safety. Phase 11 adds the policy gate that says which human decisions are still required before a later real publish phase can start.

The Phase 10 `release:dry-run` gate remains required and must continue to pass.
