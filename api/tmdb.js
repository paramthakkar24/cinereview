/* =============================================================================
   CineReview — TMDB proxy (Vercel serverless function)
   -----------------------------------------------------------------------------
   Some networks (notably many Indian ISPs) block api.themoviedb.org directly,
   so the browser's TMDB requests time out. This function runs on Vercel's
   servers — which are not blocked — and transparently relays each request:

     browser → /api/tmdb?path=/movie/now_playing&page=1&...  →  this function
             → https://api.themoviedb.org/3/movie/now_playing?page=1&...  → TMDB

   The TMDB key is taken from the TMDB_API_KEY env var when set (preferred, keeps
   the key off the client); otherwise whatever api_key the client sent is passed
   through, so it works with zero extra configuration too.

   Deploy: just commit this file. Vercel auto-detects /api/*.js as a Node
   serverless function — no vercel.json needed.
============================================================================= */
const TMDB_BASE = "https://api.themoviedb.org/3";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ status_message: "Method not allowed" });
    return;
  }

  try {
    const incoming = new URL(req.url, "http://localhost");
    const path = incoming.searchParams.get("path") || "";

    // Only allow well-formed TMDB resource paths — never an open relay.
    if (!/^\/[A-Za-z0-9/_.,-]*$/.test(path)) {
      res.status(400).json({ status_message: "Invalid path" });
      return;
    }

    const target = new URL(TMDB_BASE + path);
    incoming.searchParams.forEach((value, k) => {
      if (k !== "path") target.searchParams.set(k, value);
    });

    const headers = { accept: "application/json" };
    if (process.env.TMDB_BEARER) {
      headers.Authorization = "Bearer " + process.env.TMDB_BEARER;
      target.searchParams.delete("api_key");
    } else if (process.env.TMDB_API_KEY) {
      target.searchParams.set("api_key", process.env.TMDB_API_KEY);
    }

    const upstream = await fetch(target.toString(), { headers });
    const body = await upstream.text();

    res.status(upstream.status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Brief shared caching so repeat views are cheap at the edge.
    res.setHeader("Cache-Control", "public, max-age=120, s-maxage=300");
    res.send(body);
  } catch (err) {
    res.status(502).json({
      status_message: "Proxy could not reach TMDB",
      detail: String((err && err.message) || err)
    });
  }
};
