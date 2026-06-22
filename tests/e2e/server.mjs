import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const fixtureRoot = join(repoRoot, "tests", "e2e", "fixtures");
const port = Number(process.env.PORT ?? 4173);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".bin", "application/octet-stream"]
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
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
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
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
