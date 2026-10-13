/* =============================================================================
   CineReview — watchlist (save films to watch later)
   -----------------------------------------------------------------------------
   Two jobs, both no-ops unless their markup is present:
     * On a movie page ([data-watch-zone]): an Add / Remove toggle button.
     * On watchlist.html ([data-watchlist]): the signed-in user's saved films.

   Rows live in Supabase (private per user via RLS). Each row stores the title,
   poster and year so the watchlist page renders without re-calling TMDB.
   ========================================================================== */
(function () {
  "use strict";

  function auth() { return window.CR && window.CR.auth; }
  function sb() { return auth() ? auth().getClient() : null; }
  function app() { return window.CR && window.CR.app; }

  function esc(s) {
    if (app() && app().esc) return app().esc(s);
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function movieId() {
    try {
      var v = new URLSearchParams(window.location.search).get("id");
      return v ? String(v).trim() : "";
    } catch (e) { return ""; }
  }

  /* ----------------------------------------------------------------------- */
  /* Data                                                                    */
  /* ----------------------------------------------------------------------- */
  function inList(id) {
    var c = sb(); if (!c) return Promise.resolve(null);
    return c.from("watchlist").select("id").eq("movie_id", id).maybeSingle()
      .then(function (r) { return r.error ? null : r.data; });
  }
  function addItem(item) {
    var u = auth().currentUser();
    return sb().from("watchlist").insert({
      user_id: u.id, movie_id: item.movie_id, title: item.title, poster: item.poster, year: item.year
    });
  }
  function removeByMovie(id) { return sb().from("watchlist").delete().eq("movie_id", id); }
  function removeByRow(rowId) { return sb().from("watchlist").delete().eq("id", rowId); }
  function listAll() {
    return sb().from("watchlist").select("*").order("created_at", { ascending: false })
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }

  /* ----------------------------------------------------------------------- */
  /* Detail-page button                                                      */
  /* ----------------------------------------------------------------------- */
  function readMeta(id) {
    var titleEl = document.querySelector(".detail__title");
    var title = (titleEl && titleEl.textContent.trim()) ||
      document.title.replace(/\s*—\s*CineReview\s*$/, "").trim() || "Untitled";
    var img = document.querySelector(".detail__poster img");
    var poster = img ? (img.currentSrc || img.src || "") : "";
    var year = null;
    var meta = document.querySelector(".detail__meta span");
    if (meta) { var n = parseInt(meta.textContent, 10); if (!isNaN(n)) year = n; }
    return { movie_id: id, title: title, poster: poster, year: year };
  }

  function toast(msg, kind) { if (app() && app().toast) app().toast(msg, kind || "info"); }

  function renderButton(zone, id) {
    function paint(state) {
      // state: "out" | "in" | "guest"
      if (state === "guest") {
        zone.innerHTML =
          '<div class="watch-cta"><a class="btn btn--ghost btn--sm" href="login.html">＋ Add to Watchlist</a>' +
          '<span class="watch-cta__hint">Log in to save films</span></div>';
        return;
      }
      var isIn = state === "in";
      zone.innerHTML =
        '<div class="watch-cta"><button class="btn ' + (isIn ? "btn--ghost" : "btn--primary") +
        ' btn--sm" type="button" data-watch-toggle>' +
        (isIn ? "✓ In Watchlist" : "＋ Add to Watchlist") + "</button></div>";
      var btn = zone.querySelector("[data-watch-toggle]");
      btn.addEventListener("click", function () {
        btn.disabled = true;
        if (isIn) {
          removeByMovie(id).then(function (r) {
            btn.disabled = false;
            if (r.error) { toast("Could not update watchlist.", "error"); return; }
            toast("Removed from watchlist.", "info"); paint("out");
          });
        } else {
          addItem(readMeta(id)).then(function (r) {
            btn.disabled = false;
            if (r.error) { toast("Could not add to watchlist.", "error"); return; }
            toast("Added to your watchlist.", "success"); paint("in");
          });
        }
      });
    }

    function refresh() {
      if (!auth().isConfigured()) { zone.innerHTML = ""; return; }
      if (!auth().isSignedIn()) { paint("guest"); return; }
      inList(id).then(function (row) { paint(row ? "in" : "out"); });
    }

    refresh();
    if (auth() && auth().onChange) auth().onChange(refresh);
  }

  /* ----------------------------------------------------------------------- */
  /* Watchlist page                                                          */
  /* ----------------------------------------------------------------------- */
  function cardFor(row) {
    var id = esc(row.movie_id);
    var href = "movie-details.html?id=" + encodeURIComponent(row.movie_id);
    var poster = row.poster
      ? '<img class="card__poster" src="' + esc(row.poster) + '" alt="' + esc(row.title) + '" loading="lazy">'
      : '<span class="card__poster" aria-hidden="true"></span>';
    return (
      '<article class="card">' +
        '<div class="card__media"><a href="' + href + '">' + poster + "</a></div>" +
        '<div class="card__body">' +
          '<h3 class="card__title"><a href="' + href + '">' + esc(row.title) + "</a></h3>" +
          (row.year ? '<div class="card__sub"><span>' + esc(row.year) + "</span></div>" : "") +
          '<button class="btn btn--ghost btn--sm wl-remove" type="button" data-remove="' + esc(row.id) + '">Remove</button>' +
        "</div>" +
      "</article>"
    );
  }

  function renderPage(root) {
    function show(html) { root.innerHTML = html; }

    function draw() {
      if (!auth().isConfigured()) {
        show('<p class="section__note">Watchlist needs the backend configured (see Phase 0).</p>');
        return;
      }
      if (!auth().isSignedIn()) {
        show(
          '<div class="wl-empty"><p class="section__note">Log in to see your watchlist.</p>' +
          '<div class="form__actions"><a class="btn btn--primary" href="login.html">Log in</a>' +
          '<a class="btn btn--ghost" href="signup.html">Sign up</a></div></div>'
        );
        return;
      }
      show('<p class="section__note">Loading your watchlist…</p>');
      listAll().then(function (rows) {
        if (!rows.length) {
          show(
            '<div class="wl-empty"><p class="section__note">Your watchlist is empty.</p>' +
            '<a class="btn btn--primary" href="movies.html">Browse movies</a></div>'
          );
          return;
        }
        show('<div class="grid">' + rows.map(cardFor).join("") + "</div>");
        if (app() && app().refresh) app().refresh(root);
        root.querySelectorAll("[data-remove]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            btn.disabled = true;
            removeByRow(btn.getAttribute("data-remove")).then(function (r) {
              if (r.error) { btn.disabled = false; toast("Could not remove.", "error"); return; }
              draw();
            });
          });
        });
      }).catch(function () {
        show('<p class="section__note">Could not load your watchlist. Please refresh.</p>');
      });
    }

    draw();
    if (auth() && auth().onChange) auth().onChange(draw);
  }

  /* ----------------------------------------------------------------------- */
  /* Boot                                                                    */
  /* ----------------------------------------------------------------------- */
  function boot() {
    var zone = document.querySelector("[data-watch-zone]");
    var id = movieId();
    if (zone && id) renderButton(zone, id);

    var page = document.querySelector("[data-watchlist]");
    if (page) renderPage(page);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
