import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createIndirectionVitePlugin,
  resolvedVirtualCatalogModuleId
} from "../../packages/vite/dist/index.js";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const fixtureRoot = join(repoRoot, "tests", "e2e", "fixtures");
const port = Number(process.env.PORT ?? 4173);
const idleExitMs = readIdleExitMs();
const virtualCatalogModule = createVirtualCatalogModule();
let idleExitTimer;

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".bin", "application/octet-stream"]
]);

const server = createServer(async (request, response) => {
  clearIdleExit();
  response.on("finish", scheduleIdleExit);
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  if (url.pathname === "/virtual/indirection/catalog.js") {
    response.writeHead(200, {
      "content-type": "text/javascript; charset=utf-8"
    });
    response.end(virtualCatalogModule);
    return;
  }

  const resolvedRequest = resolveRequestPath(url.pathname);

  if (!isWithinRoot(resolvedRequest.root, resolvedRequest.absolutePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(resolvedRequest.absolutePath);
    if (!fileStat.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type":
        contentTypes.get(extname(resolvedRequest.absolutePath)) ?? "application/octet-stream"
    });
    createReadStream(resolvedRequest.absolutePath).pipe(response);
  } catch (error) {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Indirection E2E fixture server listening on ${port}`);
  scheduleIdleExit();
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, shutdown);
}

function readIdleExitMs() {
  const prefix = "--idle-exit-ms=";
  const option = process.argv.find((entry) => entry.startsWith(prefix));
  if (option === undefined) {
    return 0;
  }

  const value = Number(option.slice(prefix.length));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid idle exit timeout: ${option}`);
  }

  return value;
}

function scheduleIdleExit() {
  if (idleExitMs === 0) {
    return;
  }

  clearIdleExit();
  idleExitTimer = setTimeout(shutdown, idleExitMs);
  idleExitTimer.unref();
}

function clearIdleExit() {
  if (idleExitTimer !== undefined) {
    clearTimeout(idleExitTimer);
    idleExitTimer = undefined;
  }
}

function shutdown() {
  clearIdleExit();
  server.close(() => process.exit(0));
}

function resolveRequestPath(pathname) {
  if (pathname.startsWith("/packages/")) {
    return {
      absolutePath: resolve(repoRoot, stripLeadingSlash(pathname)),
      root: repoRoot
    };
  }

  const fixturePath = pathname === "/" ? "index.html" : stripLeadingSlash(pathname);
  return {
    absolutePath: resolve(join(fixtureRoot, fixturePath)),
    root: fixtureRoot
  };
}

function stripLeadingSlash(pathname) {
  return pathname.replace(/^\/+/, "");
}

function isWithinRoot(root, absolutePath) {
  const relativePath = relative(root, absolutePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

function createVirtualCatalogModule() {
  const plugin = createIndirectionVitePlugin({
    model: {
      assets: [
        {
          dependencies: [],
          id: "browser:virtual.text",
          sources: [{ url: "virtual-catalog.txt" }],
          type: "text/plain"
        }
      ],
      diagnostics: [],
      groups: []
    }
  });
  const moduleText = plugin.load(resolvedVirtualCatalogModuleId);
  if (moduleText === undefined) {
    throw new Error("Indirection Vite plugin did not produce the virtual catalog module");
  }

  return moduleText;
}
