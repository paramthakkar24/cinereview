/* =============================================================================
   CineReview — tools/link-tmdb-ids.mjs
   -----------------------------------------------------------------------------
   One-off build step. js/data.js keys its movies by slug ("the-dark-knight"),
   but js/reviews.js has to key our own review text by TMDB movie id so it can be
   joined to live data. This script resolves those ids and writes them down.

   It does NOT trust a hand-typed table. For every bundled title it searches
   TMDB, scores the candidates on title similarity and release year, then fetches
   the credits of the winner to compare the director. Anything that does not
   line up is reported as LOW confidence for a human to confirm.

   Usage:
     node tools/link-tmdb-ids.mjs            # writes tools/tmdb-id-map.json
     node tools/link-tmdb-ids.mjs --report   # prints only, writes nothing

   The key is read from js/config.js (gitignored) or the TMDB_API_KEY env var.
   ========================================================================== */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = "https://api.themoviedb.org/3";
const REPORT_ONLY = process.argv.includes("--report");

/* ---------------------------------------------------------------------------
   Config / key
   ------------------------------------------------------------------------- */
function readKey() {
  const fromEnv = process.env.TMDB_API_KEY;
  if (fromEnv) return { apiKey: fromEnv, bearer: "" };

  const src = readFileSync(join(ROOT, "js", "config.js"), "utf8");
  const apiKey = (src.match(/apiKey:\s*"([^"]*)"/) || [])[1] || "";
  const bearer = (src.match(/bearer:\s*"([^"]*)"/) || [])[1] || "";
  if (!apiKey && !bearer) {
    console.error("No TMDB key found in js/config.js. Copy js/config.example.js first.");
    process.exit(1);
  }
  return { apiKey, bearer };
}

const { apiKey, bearer } = readKey();

async function tmdb(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const headers = { accept: "application/json" };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  else url.searchParams.set("api_key", apiKey);

  // Transient socket failures are common on flaky connections; retry a few times
  // before reporting an error, so a dropped packet does not look like a miss.
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = new Error(`TMDB ${res.status} on ${path}`);
        err.status = res.status;
        // 4xx will not fix itself; only retry the transient ones.
        if (res.status < 500 && res.status !== 429) throw err;
        lastError = err;
      } else {
        return res.json();
      }
    } catch (err) {
      if (err.status && err.status < 500 && err.status !== 429) throw err;
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, attempt * 600));
  }
  throw lastError || new Error(`TMDB request failed on ${path}`);
}

/* ---------------------------------------------------------------------------
   Read the bundled movie list out of js/data.js.
   It is a browser IIFE, so it cannot be imported here — the records are read
   with a regex that only has to survive edits to data.js (title + year are
   always the first two fields after id).
   ------------------------------------------------------------------------- */
function readBundledMovies() {
  const src = readFileSync(join(ROOT, "js", "data.js"), "utf8");
  const re =
    /id:\s*"(?<id>[^"]+)",\s*title:\s*"(?<title>[^"]+)",\s*year:\s*(?<year>\d+),[\s\S]*?director:\s*"(?<director>[^"]+)"/g;
  const out = [];
  for (const m of src.matchAll(re)) {
    out.push({
      slug: m.groups.id,
      title: m.groups.title,
      year: Number(m.groups.year),
      director: m.groups.director
    });
  }
  return out;
}

/* ---------------------------------------------------------------------------
   Scoring
   ------------------------------------------------------------------------- */
const normalise = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&/g, "and")
    .replace(/['’:,.!?"-]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function titleScore(needle, hay) {
  const a = normalise(needle);
  const b = normalise(hay);
  if (a === b) return 100;
  if (b.startsWith(a)) return 60;
  if (b.includes(a) || a.includes(b)) return 40;

  // Token overlap, for subtitles and reordered punctuation.
  const at = new Set(a.split(" "));
  const bt = b.split(" ");
  const shared = bt.filter((t) => at.has(t)).length;
  return Math.round((shared / Math.max(at.size, bt.length)) * 35);
}

function yearScore(want, got) {
  const y = Number(String(got || "").slice(0, 4));
  if (!y) return -40;
  if (y === want) return 30;
  if (Math.abs(y - want) <= 1) return 12;
  if (Math.abs(y - want) <= 3) return -10;
  return -35;
}

/** "Anthony & Joe Russo" vs TMDB's "Anthony Russo, Joe Russo" — loose overlap. */
const NAME_NOISE = new Set(["the", "a", "of", "and", "mr", "ms", "dr"]);

function directorOverlap(want, got) {
  if (!want || !got) return 0;
  const surnames = (s) =>
    s
      .split(/[,&]|\band\b/i)
      .map((p) => normalise(p).split(" ").pop())
      // "Bong Joon-ho" → "ho": a two-letter surname is legitimate here, so the
      // only things worth dropping are filler words.
      .filter((p) => p && p.length > 1 && !NAME_NOISE.has(p));
  const a = surnames(want);
  const b = surnames(got);
  if (!a.length || !b.length) return 0;
  return a.filter((s) => b.includes(s)).length / a.length;
}

/* ---------------------------------------------------------------------------
   Main
   ------------------------------------------------------------------------- */
const movies = readBundledMovies();

// --only=slug,slug re-checks a subset and merges into the existing map, so a
// single flaky request does not mean re-running the whole catalogue.
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const previous = (() => {
  if (!onlyArg) return null;
  try {
    return JSON.parse(readFileSync(join(HERE, "tmdb-id-map.json"), "utf8"));
  } catch {
    return null;
  }
})();
const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;
const targets = only ? movies.filter((m) => only.has(m.slug)) : movies;

console.log(`Resolving TMDB ids for ${targets.length} bundled movies…\n`);

const results = [];
let lowConfidence = 0;

for (const movie of targets) {
  let candidates;
  try {
    const data = await tmdb("/search/movie", { query: movie.title, include_adult: "false" });
    candidates = data.results || [];
  } catch (err) {
    console.error(`  ✗ ${movie.title}: ${err.message}`);
    results.push({ ...movie, tmdbId: null, confidence: "ERROR", note: err.message });
    continue;
  }

  if (!candidates.length) {
    console.error(`  ✗ ${movie.title}: no TMDB results`);
    results.push({ ...movie, tmdbId: null, confidence: "MISS", note: "no results" });
    continue;
  }

  // Score every plausible candidate on title + year.
  const ranked = candidates
    .map((c) => {
      const s = titleScore(movie.title, c.title) + yearScore(movie.year, c.release_date);
      return { candidate: c, score: s };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const tmdbMovie = best.candidate;

  // Confirm the director on the winner — the check that catches wrong remakes.
  let dirText = "";
  let dirOverlap = 0;
  try {
    const credits = await tmdb(`/movie/${tmdbMovie.id}/credits`);
    const director = (credits.crew || []).find((c) => c.job === "Director");
    dirText = director ? director.name : "";
    dirOverlap = directorOverlap(movie.director, dirText);
  } catch {
    /* credits are a bonus check; a failure here does not invalidate the match */
  }

  const titleOk = titleScore(movie.title, tmdbMovie.title) >= 100;
  const yearOk = Number(String(tmdbMovie.release_date).slice(0, 4)) === movie.year;
  const directorOk = dirOverlap >= 0.5;

  let confidence = "HIGH";
  if (!titleOk || !yearOk || !directorOk) confidence = "LOW";
  if (confidence === "LOW") lowConfidence++;

  const flag = confidence === "HIGH" ? "✓" : "!";
  console.log(
    `  ${flag} ${movie.title.padEnd(36)} → ${String(tmdbMovie.id).padEnd(8)} ` +
      `${tmdbMovie.title} (${String(tmdbMovie.release_date).slice(0, 4)}) ` +
      `[${confidence}] bundled director: ${movie.director} | tmdb: ${dirText || "—"}`
  );

  results.push({
    slug: movie.slug,
    title: movie.title,
    year: movie.year,
    director: movie.director,
    tmdbId: tmdbMovie.id,
    tmdbTitle: tmdbMovie.title,
    tmdbYear: String(tmdbMovie.release_date || "").slice(0, 4),
    tmdbDirector: dirText,
    confidence,
    note: confidence === "HIGH" ? "" : "confirm by hand"
  });

  // Be polite: stay well under TMDB's rate limit.
  await new Promise((r) => setTimeout(r, 130));
}

// Merge with any previous run when only a subset was checked, so the map always
// describes every bundled movie.
const merged = previous
  ? movies
      .map((m) => results.find((r) => r.slug === m.slug) || previous.movies.find((r) => r.slug === m.slug))
      .filter(Boolean)
  : results;

const unresolved = merged.filter((r) => !r.tmdbId || r.confidence !== "HIGH");
const payload = {
  generated: new Date().toISOString(),
  total: merged.length,
  highConfidence: merged.length - unresolved.length,
  lowConfidence: unresolved.length,
  movies: merged
};

console.log(
  `\n${merged.length - unresolved.length}/${merged.length} resolved with high confidence` +
    (unresolved.length ? `, ${unresolved.length} need review.` : ".")
);
if (unresolved.length) {
  console.log("Needs review: " + unresolved.map((r) => r.title).join(", "));
}

if (!REPORT_ONLY) {
  const out = join(HERE, "tmdb-id-map.json");
  writeFileSync(out, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${out}`);
}
