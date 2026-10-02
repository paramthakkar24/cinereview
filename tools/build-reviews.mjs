/* =============================================================================
   CineReview — tools/build-reviews.mjs
   -----------------------------------------------------------------------------
   Builds js/reviews.js: OUR editorial text, keyed by TMDB movie id.

   The review prose lives in js/data.js today, next to the movie metadata. That
   is fine while the site is offline-first, but the moment real TMDB data drives
   the pages we need to join our words to a live movie, and TMDB knows movies by
   numeric id, not by our slug. This script does the join once and writes down a
   standalone review module that depends on nothing but itself.

   It reads the records by actually executing js/data.js inside a fake `window`,
   so the output cannot drift from the source through a mistyped regex.

   Usage:
     node tools/build-reviews.mjs

   Requires tools/tmdb-id-map.json (see tools/link-tmdb-ids.mjs).
   ========================================================================== */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* ---------------------------------------------------------------------------
   Load js/data.js by running it with a stub `window`.
   ------------------------------------------------------------------------- */
const windowStub = {};
const dataSource = readFileSync(join(ROOT, "js", "data.js"), "utf8");
// eslint-disable-next-line no-new-func
new Function("window", dataSource)(windowStub);

const CR = windowStub.CR;
if (!CR || !CR.data || !Array.isArray(CR.data.movies)) {
  console.error("Could not read CR.data.movies out of js/data.js");
  process.exit(1);
}

const idMap = JSON.parse(readFileSync(join(HERE, "tmdb-id-map.json"), "utf8"));
const tmdbBySlug = new Map(idMap.movies.map((m) => [m.slug, m]));

/* ---------------------------------------------------------------------------
   Compose the review records.
   ------------------------------------------------------------------------- */
const reviews = [];
const skipped = [];

for (const movie of CR.data.movies) {
  const link = tmdbBySlug.get(movie.id);
  if (!link || !link.tmdbId || link.confidence !== "HIGH") {
    skipped.push(`${movie.title} (${link ? link.confidence : "unmapped"})`);
    continue;
  }

  const critic = CR.data.criticFor(movie.review.author);

  reviews.push({
    tmdbId: link.tmdbId,
    slug: movie.id,
    headline: movie.review.title,
    body: movie.review.body.slice(),
    quote: movie.review.quote,
    critic: { name: critic.name, role: critic.role, initials: critic.initials },
    date: movie.review.date,
    score: movie.rating,
    pros: movie.pros.slice(),
    cons: movie.cons.slice(),
    breakdown: movie.breakdown
  });
}

if (skipped.length) {
  console.warn(`Skipped ${skipped.length} movie(s) without a confirmed TMDB id:\n  ${skipped.join("\n  ")}`);
}

/* ---------------------------------------------------------------------------
   Emit.
   ------------------------------------------------------------------------- */
const payload = {
  generated: new Date().toISOString(),
  count: reviews.length,
  critics: CR.data.critics
};

const file = `/* =============================================================================
   CineReview — our own review text
   -----------------------------------------------------------------------------
   GENERATED FILE — do not edit by hand.
   Rebuild with:  node tools/build-reviews.mjs
   Source prose:  js/data.js  (edited there, not here)
   TMDB ids:      tools/tmdb-id-map.json  (produced by tools/link-tmdb-ids.mjs)

   This module holds editorial only: headlines, body copy, pull quotes, pros and
   cons, and who wrote them. It is deliberately free of TMDB-sourced fields so
   the two concerns never get tangled. The only TMDB value here is the numeric
   movie id, used purely as the join key.

   A TMDB movie with no entry here is not an error. js/api.js reports it and the
   pages fall back to showing the TMDB synopsis instead of inventing a review.
   ========================================================================== */

(function () {
  "use strict";

  /** Critics who write for CineReview. */
  var CRITICS = ${JSON.stringify(payload.critics, null, 2).replace(/\n/g, "\n  ")};

  /** Keyed by TMDB movie id. ${payload.count} reviews. */
  var BY_ID = ${JSON.stringify(Object.fromEntries(reviews.map((r) => [r.tmdbId, r])), null, 2).replace(/\n/g, "\n  ")};

  /* --- lookups ------------------------------------------------------------ */

  /** Our review for a TMDB id, or null when the film has not been written up. */
  function forMovie(tmdbId) {
    if (tmdbId === undefined || tmdbId === null) return null;
    return BY_ID[String(tmdbId)] || null;
  }

  /** Our review for a bundled slug, used by the offline dataset. */
  function forSlug(slug) {
    for (var id in BY_ID) {
      if (BY_ID[id].slug === slug) return BY_ID[id];
    }
    return null;
  }

  /** Every review, newest first. */
  function list() {
    return Object.keys(BY_ID)
      .map(function (id) {
        return BY_ID[id];
      })
      .sort(function (a, b) {
        return a.date < b.date ? 1 : -1;
      });
  }

  /** The review behind the Home page hero. */
  function featured() {
    /* Reached through window rather than a bare CR identifier: an unqualified
       \`CR\` only resolves because a browser promotes window.CR to a global, which
       stops being true the moment this file is loaded in a worker, a test
       harness, or anything that is not a page. */
    var root = window.CR || {};
    var all = list();
    for (var i = 0; i < all.length; i++) {
      var slugMovie = root.data && root.data.byId(all[i].slug);
      if (slugMovie && slugMovie.isFeatured) return all[i];
    }
    return all[0] || null;
  }

  /** Reviews written by one critic. */
  function byCritic(name) {
    return list().filter(function (r) {
      return r.critic.name === name;
    });
  }

  /**
   * Text to show where a review is expected but missing. Never fabricates a
   * verdict — it says plainly that the review is not written yet.
   */
  function pending() {
    return {
      headline: "Full review in progress",
      pending: true,
      body: [],
      quote: "",
      pros: [],
      cons: []
    };
  }

  window.CR = window.CR || {};
  window.CR.reviews = {
    byId: BY_ID,
    critics: CRITICS,
    count: ${payload.count},
    forMovie: forMovie,
    forSlug: forSlug,
    list: list,
    featured: featured,
    byCritic: byCritic,
    pending: pending
  };
})();
`;

const out = join(ROOT, "js", "reviews.js");
writeFileSync(out, file);
console.log(`Wrote ${out} — ${reviews.length} reviews, ${new Set(reviews.map((r) => r.critic.name)).size} critics.`);
