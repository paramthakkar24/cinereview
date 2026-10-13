/* =============================================================================
   CineReview — local configuration
   -----------------------------------------------------------------------------
   This file is gitignored. It is the ONLY place a TMDB API key is written down.

   Copy js/config.example.js to js/config.js and paste your v3 key, or leave it
   blank and let the site ask for a key at runtime (see js/config.js notes in
   README.md). The key is read from localStorage first, so you can also set one
   without editing any file.
   ========================================================================== */

window.CR = window.CR || {};

window.CR.config = {
  /* --- TMDB ----------------------------------------------------------------
     apiKey    v3 "API Key (v3 auth)" from https://www.themoviedb.org/settings/api
     bearer    optional v4 "API Read Access Token"; if set it is used instead of
               apiKey via the Authorization header.
     language  ISO 639-1 code sent with every request.
     region    ISO 3166-1-1 for release-date certification lookups.
     imageBase TMDB's CDN. Images are sized by swapping the size segment.
  ------------------------------------------------------------------------- */
  /* Left blank on purpose: the TMDB key lives in a Vercel env var (TMDB_API_KEY)
     that the proxy (api/tmdb.js) uses server-side, so it never ships to the
     browser or the repo. For local dev, set TMDB_API_KEY before `node
     tools/serve.mjs`, or paste a key via the on-page key bar. */
  apiKey: "",
  bearer: "",
  language: "en-US",
  region: "US",
  imageBase: "https://image.tmdb.org/t/p",

  /* Route TMDB calls through our own proxy so they work on networks that block
     api.themoviedb.org directly (see api/tmdb.js). Set to "" to call TMDB
     directly instead. */
  apiProxy: "/api/tmdb",

  /* --- Supabase (auth + shared ratings/comments) ---------------------------
     Paste from Supabase → Settings → API. Both values are browser-safe
     (public anon key); NEVER put the service_role key or DB password here. */
  supabaseUrl: "https://dzaiunjvfqacwcsknaao.supabase.co",
  supabaseAnonKey: "sb_publishable_wZZfnucdxgMgOS4lQqy8Fg__SwKDva5",

  /* --- Behaviour ---------------------------------------------------------- */
  pageSize: 20,
  fallbackPoster: "images/poster-placeholder.svg",
  fallbackBackdrop: "images/backdrop-placeholder.svg",

  /* --- Storage keys (namespaced so we never collide with anything else) --- */
  storage: {
    ratings: "cr.ratings",
    reviews: "cr.user-reviews",
    apiKey: "cr.tmdbKey"
  }
};
