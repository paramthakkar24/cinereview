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

const TMDB_BASE = "https://api.themoviedb.org/3";

createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0].split("#")[0]);

  /* Local mirror of api/tmdb.js (the Vercel proxy), so the site behaves the same
     under `node tools/serve.mjs` as it does deployed. Note: this still runs on
     THIS machine's network, so if your ISP blocks TMDB it will fail locally too
     — test on the deployed Vercel URL in that case. */
  if (path === "/api/tmdb") {
    try {
      const incoming = new URL(req.url, "http://localhost");
      const tmdbPath = incoming.searchParams.get("path") || "";
      if (!/^\/[A-Za-z0-9/_.,-]*$/.test(tmdbPath)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ status_message: "Invalid path" }));
      }
      const target = new URL(TMDB_BASE + tmdbPath);
      incoming.searchParams.forEach((value, k) => {
        if (k !== "path") target.searchParams.set(k, value);
      });
      if (process.env.TMDB_API_KEY) target.searchParams.set("api_key", process.env.TMDB_API_KEY);
      const upstream = await fetch(target.toString(), { headers: { accept: "application/json" } });
      const body = await upstream.text();
      res.writeHead(upstream.status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      return res.end(body);
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status_message: "Proxy could not reach TMDB", detail: String(err && err.message || err) }));
    }
  }

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
