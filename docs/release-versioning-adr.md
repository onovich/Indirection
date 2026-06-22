# Release Versioning ADR

Status: Accepted for Phase 10 dry-run and reaffirmed for Phase 11 publish preflight.

## Context

The original v0.1 technical design listed Changesets as the preferred multi-package release tool. Phase 10 is intentionally earlier than a real release: all workspace packages still have `private: true`, npm visibility has not been accepted, the public license has not been selected, and real release tags are out of scope.

## Decision

Phase 10 uses a lightweight release notes and version policy instead of adding Changesets.

- Keep all package versions at `0.0.0` during release dry-run work.
- Keep `protocolVersion` independent from npm package versions.
- Treat `CHANGELOG.md` as the human release notes source for Phase 0-10 evidence.
- Treat Phase PASS reports as validation evidence, not version sources of truth.
- Require `release:dry-run` to fail if it would modify package versions, workspace dependency ranges, `pnpm-lock.yaml`, create tags, or leave publish artifacts.
- Reconsider Changesets before any real npm publish, after package visibility, npm permissions, and public license are accepted.

Phase 11 keeps this decision. `publish:preflight` should verify that real publish decisions are still pending and that package versions stay unchanged. It must not add Changesets, mutate package versions, write changelog entries automatically, or convert workspace dependency ranges.

## Rationale

This avoids introducing a release tool whose normal workflow is to mutate versions and changelog files before the project has accepted which packages may be public. The lightweight policy is enough for Phase 10 because this phase proves package metadata, tarball smoke, dry-run safety, and CI gates without writing to npm or GitHub release surfaces.

## Consequences

- Version changes are deferred by policy rather than automated by Changesets.
- Release notes must be maintained in `CHANGELOG.md` and checked by release dry-run tooling.
- A later publish-preflight phase can adopt Changesets or keep this lightweight policy, but it must record the decision before removing `private: true` from any package.

## Phase 11 Review

Changesets remains a good candidate for a later real publish phase because the project is a multi-package workspace and the original architecture document lists Changesets + SemVer as the preferred release tool. Phase 11 does not adopt it because:

- all packages are still `private: true`;
- public license is still `pending`;
- npm scope/account/permission decisions are still `pending`;
- tag and GitHub Release policy are still `pending`;
- package versions must remain `0.0.0`;
- workspace dependency ranges must remain `workspace:*`;
- the phase must not create a publishable release state.

Before real publish, the planner or release owner must choose one of these outcomes:

- adopt Changesets and validate version, changelog, and workspace dependency behavior before removing `private: true`;
- keep the lightweight policy and document how versions and release notes are updated manually;
- defer real publish until release ownership is accepted.
