# Release Provenance

This document records the Phase 17 local release artifact provenance gate. It is a deterministic audit for packed dry-run package artifacts, not permission to publish packages or upload provenance to npm.

## Commands

Run the standalone provenance gate with:

```powershell
corepack pnpm release:provenance
```

The release dry-run gate invokes the same provenance verification:

```powershell
corepack pnpm release:dry-run
```

Use JSON output only for local inspection or tests:

```powershell
node scripts/release-provenance.mjs --json
```

Do not commit generated JSON output, package tarballs, temporary consumers, release archives, npm caches, or local machine artifacts.

## Provenance Coverage

`release:provenance` packs every workspace package into temporary directories and records deterministic evidence for all 9 package artifacts:

- package name, version, `private` state, and license;
- package directory as a repository-relative path;
- tarball filename only, without a local directory;
- tarball `sha256` over the canonical packed payload and byte size from the actual `.tgz` bytes;
- exported entrypoints from package `exports`;
- CLI bin entries from package `bin`;
- packed file count and file paths;
- validation command evidence for `pack`, `pack:check`, `release:dry-run`, and `publish:preflight`;
- no-publish policy booleans for publish, npm login, registry writes, Git tags, GitHub Releases, signing, Sigstore, npm provenance upload, and OIDC publish.

## Determinism And Local Safety

The gate creates the report twice from independent temporary pack roots and compares canonical JSON. A mismatch fails the command.

The report guard rejects:

- timestamps;
- absolute local paths and home directories;
- local usernames;
- selected npm token and auth environment values;
- registry credential assignments such as `_authToken`, `username=`, `password=`, or `always-auth=true`.

The report intentionally excludes Git SHAs, environment variables, machine cache paths, and temp directories. Tarballs and temporary consumers are removed after successful verification unless `INDIRECTION_RELEASE_PROVENANCE_KEEP=1` is set for local debugging.

## Report Shape Example

This is a hand-authored shape example, not generated local output:

```json
{
  "schemaVersion": 1,
  "generatedBy": "scripts/release-provenance.mjs",
  "packageCount": 9,
  "policy": {
    "packageArtifacts": "dry-run-only",
    "publish": false,
    "npmLogin": false,
    "registryWrite": false,
    "gitTag": false,
    "githubRelease": false,
    "signing": false,
    "sigstore": false,
    "npmProvenanceUpload": false,
    "oidcPublish": false
  },
  "validation": {
    "commands": [
      {
        "name": "pack",
        "command": "corepack pnpm pack --pack-destination <temp> --json",
        "evidence": "temporary tarball artifact metadata"
      }
    ],
    "determinism": {
      "canonicalJsonVersion": 1,
      "hashAlgorithm": "sha256",
      "excludes": [
        "absolutePaths",
        "environmentVariables",
        "gitSha",
        "npmTokens",
        "registryCredentials",
        "timestamps",
        "usernames"
      ],
      "verification": "repeat-pack-canonical-json-match"
    }
  },
  "packages": [
    {
      "name": "@indirection/cli",
      "version": "0.0.0",
      "private": true,
      "license": "UNLICENSED",
      "packageDirectory": "packages/cli",
      "tarball": {
        "filename": "indirection-cli-0.0.0.tgz",
        "sha256": "64 lowercase hex characters",
        "sha256Subject": "canonical-packed-payload",
        "byteSize": 1234
      },
      "exports": [
        {
          "subpath": ".",
          "types": "./dist/index.d.ts",
          "import": "./dist/index.js"
        }
      ],
      "bin": [
        {
          "name": "indirection",
          "path": "./dist/bin.js"
        }
      ],
      "files": {
        "count": 3,
        "paths": [
          "dist/index.d.ts",
          "dist/index.js",
          "package.json"
        ]
      },
      "validation": {
        "packCommand": "corepack pnpm pack --pack-destination <temp> --json",
        "packageSmokeCommand": "corepack pnpm pack:check",
        "releaseGateCommand": "corepack pnpm release:dry-run"
      }
    }
  ]
}
```

## Boundaries

Phase 17 provenance remains in scripts, docs, and release workflow policy. It does not move npm, tarball hashing, signing, registry, GitHub Release, or provenance-upload behavior into protocol, schema, compiler, or runtime core.

The gate must not run `npm publish`, `pnpm publish`, npm login, npm whoami, npm access, npm token, npm owner, npm dist-tag, registry writes, Git tag creation, GitHub Release creation, signing, Sigstore, npm `--provenance`, or OIDC publish workflows.
