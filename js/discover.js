/* =============================================================================
   CineReview — discovery: new releases, upcoming, language browse (Phase 3)
   -----------------------------------------------------------------------------
   Additive and self-contained. It fills any of these containers when present,
   and does nothing when they are absent, so the existing pages are untouched:

     [data-discover="now-playing"]   grid of films in cinemas now
     [data-discover="upcoming"]      grid of films not yet released
     [data-discover="language"]      wrapper holding language chips + a grid:
         [data-lang-chips]           chip buttons are generated here
         [data-lang-grid]            results render here
         [data-lang-note]            status / empty / error line

   Movie cards, grids and icon hydration are reused from CR.app so everything
   matches the rest of the site. TMDB access is via window.CR.api. When no TMDB
   key is configured, each section shows a short, honest note instead of cards.
   ========================================================================== */
(function () {
  "use strict";

  var api = window.CR && window.CR.api;

  var LANGS = [
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "ta", label: "Tamil" },
    { code: "te", label: "Telugu" },
    { code: "ko", label: "Korean" },
    { code: "ja", label: "Japanese" },
    { code: "es", label: "Spanish" },
    { code: "fr", label: "French" }
  ];
  var DEFAULT_LANG = "en";
  var MAX = 12;

  function app() { return window.CR && window.CR.app; }

  function note(el, text) {
    if (el) el.innerHTML = '<p class="section__note">' + (app() ? app().esc(text) : text) + "</p>";
  }

  function grid(el, movies) {
    var a = app();
    if (!a) return;
    var list = (movies || []).slice(0, MAX);
    if (!list.length) { note(el, "Nothing to show here right now."); return; }
    el.innerHTML = a.cardGrid(list, { rail: true });
    a.refresh(el);
  }

  function skeleton(el, n) {
    var a = app();
    if (a && a.skeletonRow) { el.innerHTML = '<div class="grid grid--rail">' + a.skeletonRow(n || 6) + "</div>"; }
  }

  function notReady(el) {
    note(
      el,
      "Live TMDB data is not available yet — add a TMDB API key (js/config.js) to see new releases."
    );
  }

  /* --- now playing / upcoming ------------------------------------------- */
  function fillFeed(el, fetcher, label) {
    if (!el) return;
    if (!api || !api.ready()) { notReady(el); return; }
    skeleton(el, 6);
    fetcher(1)
      .then(function (r) { grid(el, r.movies); })
      .catch(function (err) {
        if (err && err.kind === "ABORT") return;
        note(el, "Could not load " + label + " from TMDB right now. Please try again later.");
      });
  }

  /* --- language browse --------------------------------------------------- */
  function initLanguage(wrap) {
    var chips = wrap.querySelector("[data-lang-chips]");
    var gridEl = wrap.querySelector("[data-lang-grid]");
    var noteEl = wrap.querySelector("[data-lang-note]");
    if (!chips || !gridEl) return;

    var current = DEFAULT_LANG;

    function paintChips() {
      chips.innerHTML = LANGS.map(function (l) {
        var on = l.code === current;
        return (
          '<button class="chip' + (on ? " is-active" : "") + '" type="button" ' +
          'data-lang-filter="' + l.code + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          (app() ? app().esc(l.label) : l.label) + "</button>"
        );
      }).join("");
    }

    function load() {
      if (!api || !api.ready()) { notReady(gridEl); if (noteEl) noteEl.textContent = ""; return; }
      var label = (LANGS.filter(function (l) { return l.code === current; })[0] || {}).label || current;
      if (noteEl) noteEl.textContent = "Original-language films in " + label + ", most popular first.";
      skeleton(gridEl, 6);
      api.discoverMovies({ language: current, sort: "popularity.desc" }, 1)
        .then(function (r) {
          if (!r.movies.length) {
            note(gridEl, "TMDB returned no " + label + " titles for this filter.");
            return;
          }
          grid(gridEl, r.movies);
        })
        .catch(function (err) {
          if (err && err.kind === "ABORT") return;
          note(gridEl, "Could not load " + label + " films from TMDB right now.");
        });
    }

    chips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-lang-filter]");
      if (!btn) return;
      current = btn.getAttribute("data-lang-filter");
      paintChips();
      load();
    });

    var reset = wrap.querySelector("[data-lang-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        current = DEFAULT_LANG;
        paintChips();
        load();
      });
    }

    paintChips();
    load();
  }

  /* Run cb the first time el nears the viewport, so TMDB calls don't all fire
     on initial load (keeps the page fast; the sections fill as you scroll). */
  function whenVisible(el, cb) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); cb(); }
      });
    }, { rootMargin: "300px 0px" });
    io.observe(el);
  }

  /* --- Movies page: Language filter in the Browse toolbar ---------------- */
  function initToolbarLanguage() {
    var chips = document.getElementById("filter-langs");
    var grid = document.getElementById("movies-lang-grid");
    var note = document.getElementById("movies-lang-note");
    if (!chips || !grid) return;

    // Local-library elements to hide while a TMDB language view is active.
    var localGrid = document.getElementById("movie-grid");
    var emptyState = document.getElementById("empty-state");
    var loadMore = document.getElementById("load-more-wrap");
    var countEl = document.getElementById("result-count");

    var items = [{ code: "all", label: "All" }].concat(LANGS);
    var current = "all";

    function paint() {
      chips.innerHTML = items.map(function (l) {
        var on = l.code === current;
        return (
          '<button class="chip' + (on ? " is-active" : "") + '" type="button" ' +
          'data-tlang="' + l.code + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          (app() ? app().esc(l.label) : l.label) + "</button>"
        );
      }).join("");
    }

    function toggle(el, show) {
      if (!el) return;
      if (show) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    }

    // Remember the local library view's state so we can restore it exactly when
    // the user picks "All" again, without fighting initMovies.
    var saved = null;
    function enterLangView() {
      if (!saved) {
        saved = {
          grid: localGrid ? localGrid.hasAttribute("hidden") : true,
          empty: emptyState ? emptyState.hasAttribute("hidden") : true,
          load: loadMore ? loadMore.hasAttribute("hidden") : true,
          count: countEl ? countEl.style.display : ""
        };
      }
      toggle(localGrid, false);
      toggle(emptyState, false);
      toggle(loadMore, false);
      if (countEl) countEl.style.display = "none";
    }
    function restoreLocalView() {
      toggle(localGrid, saved ? !saved.grid : true);
      toggle(emptyState, saved ? !saved.empty : false);
      toggle(loadMore, saved ? !saved.load : false);
      if (countEl) countEl.style.display = saved ? saved.count : "";
      saved = null;
    }

    function loadLang(code) {
      var label = (LANGS.filter(function (l) { return l.code === code; })[0] || {}).label || code;
      toggle(grid, true);
      if (note) { toggle(note, true); note.textContent = "Showing " + label + " films from TMDB, most popular first."; }
      skeleton(grid, 8);
      if (!api || !api.ready()) { notReady(grid); return; }
      api.discoverMovies({ language: code, sort: "popularity.desc" }, 1)
        .then(function (r) {
          var a = app();
          if (!r.movies.length) { grid.innerHTML = ""; if (note) note.textContent = "No " + label + " films found."; return; }
          grid.innerHTML = a.cardGrid(r.movies.slice(0, 20));
          a.refresh(grid);
        })
        .catch(function (err) {
          if (err && err.kind === "ABORT") return;
          grid.innerHTML = "";
          if (note) note.textContent = "Could not load " + label + " films right now.";
        });
    }

    chips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tlang]");
      if (!btn) return;
      current = btn.getAttribute("data-tlang");
      paint();
      if (current === "all") {
        toggle(grid, false);
        toggle(note, false);
        restoreLocalView();
      } else {
        enterLangView();
        loadLang(current);
      }
    });

    // Reset filters should also clear the language view.
    var reset = document.getElementById("filter-reset");
    if (reset) {
      reset.addEventListener("click", function () {
        if (current !== "all") {
          current = "all";
          paint();
          toggle(grid, false);
          toggle(note, false);
          restoreLocalView();
        }
      });
    }

    paint();
  }

  /* --- boot -------------------------------------------------------------- */
  function boot() {
    api = window.CR && window.CR.api; // may have loaded after this file was parsed
    var np = document.querySelector('[data-discover="now-playing"]');
    var up = document.querySelector('[data-discover="upcoming"]');
    var lang = document.querySelector('[data-discover="language"]');

    whenVisible(np, function () { if (np && api) fillFeed(np, api.getNowPlaying, "films in cinemas"); });
    whenVisible(up, function () { if (up && api) fillFeed(up, api.getUpcoming, "upcoming films"); });
    whenVisible(lang, function () { if (lang) initLanguage(lang); });
    initToolbarLanguage();
  }

  // Runs after script.js has published CR.app (this file is loaded last).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
