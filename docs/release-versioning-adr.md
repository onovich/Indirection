# Release Versioning ADR

Status: Accepted for Phase 10 dry-run.

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

## Rationale

This avoids introducing a release tool whose normal workflow is to mutate versions and changelog files before the project has accepted which packages may be public. The lightweight policy is enough for Phase 10 because this phase proves package metadata, tarball smoke, dry-run safety, and CI gates without writing to npm or GitHub release surfaces.

## Consequences

- Version changes are deferred by policy rather than automated by Changesets.
- Release notes must be maintained in `CHANGELOG.md` and checked by release dry-run tooling.
- A later publish-preflight phase can adopt Changesets or keep this lightweight policy, but it must record the decision before removing `private: true` from any package.
