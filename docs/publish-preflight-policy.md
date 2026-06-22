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

## Safe Local Gates

The safe local gates are:

```powershell
corepack pnpm validate:full
corepack pnpm release:dry-run
git diff --check
```

Phase 11 adds `corepack pnpm publish:preflight` as a local policy gate. It must only inspect repository state and local Git metadata. It must not publish, login, create tags, create releases, or mutate manifests.

## Relationship To Phase 10

Phase 10 proved package readiness and release dry-run safety. Phase 11 adds the policy gate that says which human decisions are still required before a later real publish phase can start.

The Phase 10 `release:dry-run` gate remains required and must continue to pass.
