# Release CI Policy

This document records the Phase 18 release CI policy parity gate. It is a static audit for GitHub Actions release workflow safety and command parity, not permission to publish packages, create tags, create GitHub Releases, upload artifacts, sign packages, or upload npm provenance.

## Commands

Run the standalone CI policy gate with:

```powershell
corepack pnpm release:ci-check
```

The release dry-run and publish preflight gates invoke the same policy checker:

```powershell
corepack pnpm release:dry-run
corepack pnpm publish:preflight
```

Use JSON output only for local inspection or tests:

```powershell
node scripts/release-ci-check.mjs --json
```

Do not commit generated CI policy JSON output, workflow run output, package tarballs, provenance output, release archives, npm caches, or local runner artifacts.

## Policy Coverage

`release:ci-check` statically audits these fixed workflow files:

- `.github/workflows/validate.yml`
- `.github/workflows/release-dry-run.yml`
- `.github/workflows/publish-preflight.yml`

The gate verifies:

- every audited workflow declares top-level `permissions: contents: read`;
- `validate.yml` remains the regular validation source and runs `corepack pnpm validate:full` plus `git diff --check`;
- manual release workflows run `corepack pnpm release:ci-check`, `corepack pnpm release:provenance`, `corepack pnpm release:dry-run`, `corepack pnpm publish:preflight`, and `git diff --check` in a documented order;
- workflows do not include real `npm publish`, `pnpm publish`, Changesets publish, `git tag`, tag pushes, GitHub Release creation, package/artifact upload, signing, Sigstore, npm provenance upload, registry credentials, secrets, or write permissions.

## Local And CI Parity

Local and CI parity rule: local release commands remain the semantic source of truth. GitHub Actions workflows orchestrate those commands; they do not redefine package publishability, provenance, preflight, versioning, license, tag, or release semantics.

The manual release workflows use this order:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm release:ci-check
corepack pnpm release:provenance
corepack pnpm release:dry-run
corepack pnpm publish:preflight
git diff --check
```

`validate.yml` intentionally stays focused on the regular CI matrix:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm validate:full
git diff --check
```

## Report Shape Example

Release CI policy reports are local inspection and test artifacts only.

This is a hand-authored shape example, not generated local output:

```json
{
  "schemaVersion": 1,
  "generatedBy": "scripts/release-ci-check.mjs",
  "workflowCount": 3,
  "policy": {
    "repositoryPermissions": "read-only",
    "localCommandsAreSourceOfTruth": true,
    "publish": false,
    "npmLogin": false,
    "registryWrite": false,
    "gitTag": false,
    "githubRelease": false,
    "signing": false,
    "sigstore": false,
    "npmProvenanceUpload": false,
    "oidcPublish": false,
    "packageUpload": false,
    "workflowWritePermissions": false
  },
  "validation": {
    "releaseCommandOrder": [
      "corepack pnpm install --frozen-lockfile",
      "corepack pnpm release:ci-check",
      "corepack pnpm release:provenance",
      "corepack pnpm release:dry-run",
      "corepack pnpm publish:preflight",
      "git diff --check"
    ],
    "forbiddenActions": [
      "npm-publish",
      "pnpm-publish",
      "git-tag-create",
      "github-release-cli",
      "artifact-upload",
      "sigstore-or-cosign",
      "registry-credential"
    ],
    "workflowPermissions": {
      "required": {
        "contents": "read"
      },
      "forbiddenWritePermissions": [
        "contents",
        "id-token",
        "packages"
      ]
    }
  },
  "workflows": [
    {
      "path": ".github/workflows/release-dry-run.yml",
      "role": "release-gate",
      "trigger": "workflow-dispatch",
      "permissions": [
        {
          "name": "contents",
          "access": "read"
        }
      ],
      "commands": [
        "corepack pnpm install --frozen-lockfile",
        "corepack pnpm release:ci-check",
        "corepack pnpm release:provenance",
        "corepack pnpm release:dry-run",
        "corepack pnpm publish:preflight",
        "git diff --check"
      ],
      "forbiddenMatches": []
    }
  ]
}
```

## Boundaries

Phase 18 CI policy remains in scripts, docs, package scripts, and workflow orchestration. It does not move GitHub Actions, npm, registry, Git tag, GitHub Release, signing, Sigstore, provenance-upload, or package-upload behavior into protocol, schema, compiler, or runtime core.

The gate must not run `npm publish`, `pnpm publish`, npm login, npm whoami, npm access, npm token, npm owner, npm dist-tag, registry writes, Git tag creation, Git tag push, GitHub Release creation, package upload, artifact upload, signing, Sigstore, npm `--provenance`, or OIDC publish workflows.
