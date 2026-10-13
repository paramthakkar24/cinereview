/* =============================================================================
   CineReview — configuration template
   -----------------------------------------------------------------------------
   Copy this file to js/config.js and fill in your own TMDB key:

     copy js\config.example.js js\config.js

   Then paste the value of "API Key (v3 auth)" from
   https://www.themoviedb.org/settings/api into CR.config.apiKey.

   js/config.js is listed in .gitignore, so your key is never committed.
   ========================================================================== */

window.CR = window.CR || {};

window.CR.config = {
  /* v3 API key, or a v4 read access token in `bearer` if you prefer that. */
  apiKey: "",
  bearer: "",

  language: "en-US",
  region: "US",
  imageBase: "https://image.tmdb.org/t/p",

  /* Route TMDB calls through our own serverless proxy (api/tmdb.js) so they work
     on networks that block api.themoviedb.org directly. Use "" to call TMDB
     directly. */
  apiProxy: "/api/tmdb",

  /* --- Supabase (auth + shared ratings/comments) ---------------------------
     From your Supabase project → Settings → API:
       supabaseUrl      the "Project URL" (https://xxxx.supabase.co)
       supabaseAnonKey  the "anon public" (a.k.a. publishable) key.
     Both are safe to ship in the browser; data is protected by Row-Level
     Security. NEVER put the service_role key or DB password here.
  ------------------------------------------------------------------------- */
  supabaseUrl: "",
  supabaseAnonKey: "",

  pageSize: 20,
  fallbackPoster: "images/poster-placeholder.svg",
  fallbackBackdrop: "images/backdrop-placeholder.svg",

  storage: {
    ratings: "cr.ratings",
    reviews: "cr.user-reviews",
    apiKey: "cr.tmdbKey"
  }
};
