/* =============================================================================
   CineReview — Google Analytics 4
   -----------------------------------------------------------------------------
   The ONLY analytics code in the project. Loaded once in the <head> of every
   page, before the app scripts, so the automatic page_view fires as early as
   GA recommends.

   What it does:
     1. Loads the official gtag.js tag for Measurement ID G-QFS2YBXQ0C, exactly
        once per page (a guard stops a stray second include from sending a
        duplicate page_view).
     2. Lets GA send its single automatic page_view per page load. This is a
        plain multi-page site — every navigation is a full document load — so
        there is no SPA history to double-count.
     3. Adds two custom events built on the site's existing behaviour:
          movie_card_click  — any link that opens movie-details.html
          movie_search      — a search submitted or typed in either search box

   Privacy:
     No personal or sensitive data is collected. Events carry only a movie id,
     a movie title and the search term the visitor typed — the same public
     catalogue strings already visible on the page. We never read the TMDB key,
     localStorage, form fields, or anything that could identify a person.

   Design rule: this file only ever READS the DOM and calls gtag(). It never
   calls preventDefault/stopPropagation and never mutates existing elements, so
   it cannot interfere with navigation, search, filtering or any other feature.
   ========================================================================== */
(function () {
  "use strict";

  var MEASUREMENT_ID = "G-QFS2YBXQ0C";

  /* ---------------------------------------------------------------------------
     1. Load the official GA4 tag — once.
     The guard makes this safe even if the <script> tag is somehow included
     twice on a page: the loader and the single config() call run only the
     first time, so there is never a duplicate page_view.
  --------------------------------------------------------------------------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  /* Expose gtag so the whole site shares one queue. */
  window.gtag = window.gtag || gtag;

  if (!window.__cineReviewGaLoaded) {
    window.__cineReviewGaLoaded = true;

    var loader = document.createElement("script");
    loader.async = true;
    loader.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
    (document.head || document.documentElement).appendChild(loader);

    gtag("js", new Date());
    /* A single config() call = a single automatic page_view for this load. */
    gtag("config", MEASUREMENT_ID);
  }

  /* A thin wrapper so a missing/blocked gtag never throws into the page. */
  function track(eventName, params) {
    try {
      window.gtag("event", eventName, params || {});
    } catch (_) {
      /* Analytics must never break the site. */
    }
  }

  /* ---------------------------------------------------------------------------
     2. Custom events — wired after the DOM is ready, with delegated, passive
        listeners on document so they keep working across the app's re-renders.
  --------------------------------------------------------------------------- */
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  /* Pull the ?id= out of a movie-details.html link, if present. */
  function movieIdFromHref(href) {
    try {
      var url = new URL(href, window.location.href);
      return url.searchParams.get("id") || "";
    } catch (_) {
      return "";
    }
  }

  /* Best-effort, human-readable title for whichever card was clicked. Covers
     the main grid/rail cards, the navbar search suggestions and the review-card
     film links — all of which point at movie-details.html but label the title
     with their own class. Falls back to the link's own text. */
  function titleFor(link) {
    var el = link.querySelector(
      ".card__title, .nav-search__hittitle, .review-card__film-title"
    );
    if (!el) {
      var card = link.closest(".card, .review-card");
      if (card) el = card.querySelector(".card__title, .review-card__film-title");
    }
    var text = (el ? el.textContent : link.textContent) || "";
    return text.replace(/\s+/g, " ").trim().slice(0, 100);
  }

  function initCardClicks() {
    document.addEventListener(
      "click",
      function (event) {
        var link = event.target.closest(
          'a[href*="movie-details.html"]'
        );
        if (!link) return;

        var id = movieIdFromHref(link.getAttribute("href") || "");
        track("movie_card_click", {
          movie_id: id,
          movie_title: titleFor(link),
          source: window.location.pathname.split("/").pop() || "index.html"
        });
      },
      /* Passive + bubbling: we only read, never cancel, so navigation and the
         app's own click handlers are completely unaffected. */
      { passive: true, capture: false }
    );
  }

  /* --- search -------------------------------------------------------------- */
  /* We report a search in two situations, de-duplicated so a single search is
     not counted twice:
       • the visitor submits the navbar search form, and
       • the visitor pauses after typing in either search box.
     Only terms of 2+ characters count, and the same term is never sent twice
     in a row, which keeps per-keystroke noise out of the reports. */
  var lastTerm = "";

  function reportSearch(rawTerm, method) {
    var term = String(rawTerm || "").replace(/\s+/g, " ").trim();
    if (term.length < 2) return;
    if (term === lastTerm) return;
    lastTerm = term;
    track("movie_search", {
      search_term: term.slice(0, 120),
      method: method || "type"
    });
  }

  function initSearch() {
    /* Submit of the header search form (present on every page). */
    var navForm = document.getElementById("nav-search");
    if (navForm) {
      navForm.addEventListener(
        "submit",
        function () {
          var input = navForm.querySelector("input[type='search'], input");
          if (input) reportSearch(input.value, "submit");
        },
        { passive: true }
      );
    }

    /* Debounced typing in either search box. A separate, additive listener —
       it does not touch the app's own input handlers. */
    var debounce;
    function onType(event) {
      var value = event.target.value;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(function () {
        reportSearch(value, "type");
      }, 700);
    }

    var movieSearch = document.getElementById("search");
    if (movieSearch) movieSearch.addEventListener("input", onType, { passive: true });

    var navInput = document.getElementById("nav-search-input");
    if (navInput) navInput.addEventListener("input", onType, { passive: true });
  }

  ready(function () {
    initCardClicks();
    initSearch();
  });
})();
