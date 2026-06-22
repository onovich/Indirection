import { describe, expect, it } from "vitest";
import {
  assertReleaseProvenanceReport,
  canonicalReleaseProvenanceJson
} from "./release-provenance.mjs";

describe("release provenance report guards", () => {
  it("accepts deterministic local-safe provenance evidence", () => {
    const report = createFixtureReport();

    expect(() => assertReleaseProvenanceReport(report)).not.toThrow();
    expect(canonicalReleaseProvenanceJson(report)).toBe(
      `${JSON.stringify(report, null, 2)}\n`
    );
  });

  it("rejects timestamps in provenance output", () => {
    const report = createFixtureReport();
    report.packages[0].tarball.filename = "artifact-2026-06-22T00:00:00Z.tgz";

    expect(() => assertReleaseProvenanceReport(report)).toThrow(/timestamp/);
  });

  it("rejects absolute local paths in provenance output", () => {
    const report = createFixtureReport();
    report.packages[0].packageDirectory = "C:/Users/example/project/packages/cli";

    expect(() => assertReleaseProvenanceReport(report)).toThrow(/absolute path|relative/);
  });

  it("rejects registry credential assignments in provenance output", () => {
    const report = createFixtureReport();
    report.packages[0].validation.packCommand = "_authToken=secret";

    expect(() => assertReleaseProvenanceReport(report)).toThrow(/credentials/);
  });
});

function createFixtureReport() {
  const packageNames = [
    "cli",
    "compiler",
    "loaders-web",
    "protocol",
    "runtime",
    "schema",
    "testkit",
    "three",
    "vite"
  ].map((name) => `@indirection/${name}`);

  return {
    schemaVersion: 1,
    generatedBy: "scripts/release-provenance.mjs",
    packageCount: packageNames.length,
    policy: {
      packageArtifacts: "dry-run-only",
      publish: false,
      npmLogin: false,
      registryWrite: false,
      gitTag: false,
      githubRelease: false,
      signing: false,
      sigstore: false,
      npmProvenanceUpload: false,
      oidcPublish: false
    },
    validation: {
      commands: [
        {
          name: "pack",
          command: "corepack pnpm pack --pack-destination <temp> --json",
          evidence: "temporary tarball artifact metadata"
        },
        {
          name: "pack-check",
          command: "corepack pnpm pack:check",
          evidence: "temporary consumer import and CLI bin smoke"
        },
        {
          name: "release-dry-run",
          command: "corepack pnpm release:dry-run",
          evidence: "no-publish release gate invokes provenance verification"
        },
        {
          name: "publish-preflight",
          command: "corepack pnpm publish:preflight",
          evidence: "decision gate without npm login or registry writes"
        }
      ],
      determinism: {
        canonicalJsonVersion: 1,
        hashAlgorithm: "sha256",
        excludes: [
          "absolutePaths",
          "environmentVariables",
          "gitSha",
          "npmTokens",
          "registryCredentials",
          "timestamps",
          "usernames"
        ],
        verification: "repeat-pack-canonical-json-match"
      }
    },
    packages: packageNames.map((name) => createPackageEntry(name))
  };
}

function createPackageEntry(name) {
  const directoryName = name.slice("@indirection/".length);

  return {
    name,
    version: "0.0.0",
    private: true,
    license: "UNLICENSED",
    packageDirectory: `packages/${directoryName}`,
    tarball: {
      filename: `indirection-${directoryName}-0.0.0.tgz`,
      sha256: "a".repeat(64),
      sha256Subject: "canonical-packed-payload",
      byteSize: 1234
    },
    exports: [
      {
        subpath: ".",
        types: "./dist/index.d.ts",
        import: "./dist/index.js"
      }
    ],
    bin:
      name === "@indirection/cli"
        ? [
            {
              name: "indirection",
              path: "./dist/bin.js"
            }
          ]
        : [],
    files: {
      count: 3,
      paths: ["dist/index.d.ts", "dist/index.js", "package.json"]
    },
    validation: {
      packCommand: "corepack pnpm pack --pack-destination <temp> --json",
      packageSmokeCommand: "corepack pnpm pack:check",
      releaseGateCommand: "corepack pnpm release:dry-run"
    }
  };
}
