/* Dev server for CineReview. Serves the folder as-is on 127.0.0.1:8000.
   The site is static and also runs from file://, so this only needs to be
   correct about MIME types - notably image/svg+xml, or posters render as
   broken images. No-store keeps the browser from serving a stale script.js
   after an edit. Usage: node tools/serve.mjs [port] */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, sep } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.argv[2] || 8000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};

createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  let file = join(ROOT, path);
  /* A directory or extensionless path means the page of that name. */
  if (file.endsWith(sep) || extname(file) === "") file = join(file, "index.html");

  /* Refuse to serve outside the folder, via ../ or an absolute path. */
  if (!file.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("403");
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 " + path);
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log("CineReview dev server: http://127.0.0.1:" + PORT + "/");
});
