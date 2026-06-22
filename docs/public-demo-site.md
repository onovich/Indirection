# Public Demo Site Rehearsal

Phase 21 adds a local public website/docs-site rehearsal for technical evaluation. It is a generated local preview of the evaluator path, not a deployed website and not a release artifact.

## Commands

Build the local static rehearsal:

```powershell
corepack pnpm site:demo
```

The command writes:

```text
build/public-demo-site/index.html
build/public-demo-site/demo-manifest.json
```

Open `build/public-demo-site/index.html` from the checkout to inspect the local page. The generated page links back to the repository source docs and summarizes evaluator commands, package entrypoints, and policy boundaries.

Run the smoke gate:

```powershell
corepack pnpm smoke:site-demo
```

The smoke command assembles the same static page under `build/public-demo-site-smoke/`, validates required source docs and no-deploy/no-publish messaging, then removes the smoke output on success.

## Source Of Truth

The local site is presentation only. These repository docs remain canonical:

- `README.md`
- `docs/evaluator-quickstart.md`
- `docs/package-entrypoints.md`
- `docs/example-workflows.md`
- `docs/release-readiness.md`
- `docs/release-candidate-handoff.md`

Generated `index.html` and `demo-manifest.json` must not become a second source of truth. If package boundaries, commands, examples, release gates, or owner blockers change, update the source docs first and then rerun the site smoke.

## No-Deploy Boundary

Phase 21 does not deploy to:

- GitHub Pages;
- Vercel;
- Netlify;
- custom hosting;
- npm CDN;
- any public artifact host.

Do not add deployment secrets, hosted preview configuration, deployment environments, GitHub Pages workflow permissions, or upload steps for this local rehearsal.

## No-Publish Boundary

The site rehearsal does not grant permission to run real npm publish work. The repository remains blocked from:

- `npm publish` or `pnpm publish`;
- npm login, npm whoami, npm access, npm token, npm owner, npm dist-tag, or registry writes;
- Git tag creation or tag push;
- GitHub Release creation;
- package upload workflows, release upload workflows, signing, Sigstore, npm provenance upload, OIDC publish, or workflow write permissions.

All workspace packages remain `private: true`, version `0.0.0`, and `UNLICENSED` until a future owner-approved publish phase changes that policy.

## Generated Artifact Policy

`build/` is ignored by git. Do not commit:

- `build/public-demo-site/`;
- `build/public-demo-site-smoke/`;
- generated static site output;
- deployment output;
- release archives;
- package tarballs;
- temporary consumers;
- npm caches;
- provenance or release-candidate JSON output;
- Playwright reports, traces, screenshots, videos, `dist/`, or `.tsbuildinfo`.

Clean the generated local preview when you are done inspecting it:

```powershell
Remove-Item -Recurse -Force build/public-demo-site
```

## Validation

The local site rehearsal is covered by:

```powershell
corepack pnpm smoke:site-demo
corepack pnpm check:docs
corepack pnpm validate:full
git diff --check
```

`smoke:site-demo` is part of `validate:full`, so command drift and source-doc drift are caught by the regular local validation path.
