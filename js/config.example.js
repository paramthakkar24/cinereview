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

  pageSize: 20,
  fallbackPoster: "images/poster-placeholder.svg",
  fallbackBackdrop: "images/backdrop-placeholder.svg",

  storage: {
    ratings: "cr.ratings",
    reviews: "cr.user-reviews",
    apiKey: "cr.tmdbKey"
  }
};
