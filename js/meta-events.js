/* =============================================================================
   CineReview — Meta Pixel standard events (ViewContent + Search)
   -----------------------------------------------------------------------------
   Reuses the Meta Pixel base code already initialised in each page's <head>
   (Pixel id 2329625834273998). This file adds NOTHING to the init and does not
   touch PageView or Google Analytics — it only sends two standard events:

     * ViewContent — once when a real movie detail page is shown.
     * Search      — when a meaningful movie search is made.

   The site is a static multi-page app: each movie view is a full page load of
   movie-details.html?id=<id>, so there is no SPA soft-navigation to dedupe
   across. We still guard against the detail page's internal re-render (bundled
   -> live TMDB swap) firing ViewContent twice.

   No personal data is sent — only the TMDB id, movie title and genres.
   ========================================================================== */
(function () {
  "use strict";

  function hasFbq() { return typeof window.fbq === "function"; }
  function track(event, params) {
    if (!hasFbq()) return;
    window.fbq("track", event, params || {});
  }

  var page = document.body ? document.body.getAttribute("data-page") || "" : "";

  /* --- ViewContent: a real movie detail view -------------------------------
     Fire once, only when the detail actually rendered a title (a missing/404
     page shows .page-error instead, so it never fires there). */
  if (page === "details") {
    var id = "";
    try { id = String(new URLSearchParams(window.location.search).get("id") || "").trim(); } catch (e) {}

    if (id) {
      var fired = false;
      var fire = function () {
        if (fired) return;
        var titleEl = document.querySelector(".detail__title");
        if (!titleEl) return; // not a real movie view yet (still loading, or 404)
        fired = true;
        var genres = Array.prototype.map
          .call(document.querySelectorAll(".detail__genres .chip, .detail__genres .chip--static"),
                function (c) { return c.textContent.trim(); })
          .filter(Boolean);
        var params = {
          content_type: "product",
          content_ids: [id],
          content_name: titleEl.textContent.trim()
        };
        if (genres.length) params.content_category = genres.join(", ");
        track("ViewContent", params);
      };

      if (document.querySelector(".detail__title")) {
        fire();
      } else {
        var root = document.getElementById("detail-root");
        if (root && "MutationObserver" in window) {
          var obs = new MutationObserver(function () {
            fire();
            if (fired) obs.disconnect();
          });
          obs.observe(root, { childList: true, subtree: true });
          window.setTimeout(function () { try { obs.disconnect(); } catch (e) {} }, 15000);
        } else {
          var tries = 0;
          var iv = window.setInterval(function () {
            fire();
            if (fired || ++tries > 40) window.clearInterval(iv);
          }, 300);
        }
      }
    }
  }

  /* --- Search: a meaningful movie search ----------------------------------
     Deduped (same query won't refire) and gated to >= 2 chars, so keystrokes,
     empty queries and repeats don't send events. Covers both the nav-search
     form (which lands on movies.html?q=) and the in-page #search box. */
  if (page === "movies") {
    var lastTracked = "";
    var trackSearch = function (raw) {
      var q = String(raw || "").trim();
      if (q.length < 2) return;
      var key = q.toLowerCase();
      if (key === lastTracked) return;
      lastTracked = key;
      track("Search", { search_string: q });
    };

    // From the URL on load (nav-search submission, or a shared/bookmarked query).
    try { trackSearch(new URLSearchParams(window.location.search).get("q") || ""); } catch (e) {}

    // In-page search box: fire on a settled query (long debounce) and on Enter.
    var input = document.getElementById("search");
    if (input) {
      var timer = null;
      input.addEventListener("input", function () {
        var v = input.value;
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { trackSearch(v); }, 1200);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { window.clearTimeout(timer); trackSearch(input.value); }
      });
    }
  }
})();
