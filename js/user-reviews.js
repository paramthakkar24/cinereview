/* =============================================================================
   CineReview — user ratings & comments (Phase 2)
   -----------------------------------------------------------------------------
   Mounts into [data-user-zone] on the movie details page. Provides:
     * a shared "User score /10" (average + vote count) — distinct from the
       editorial/critic score rendered elsewhere on the page;
     * a 1–10 rating control for the signed-in user (one rating per movie,
       re-rating updates it, and they can clear it);
     * a shared comment list (all visitors can read) with a post box for
       signed-in users, who can delete their own comments.

   Data lives in Supabase (window.CR.sb), protected by the Row-Level Security
   policies in supabase/schema.sql. The movie is keyed by the ?id= value in the
   URL, which is the same identifier every card on the site links to.

   Graceful states:
     * backend not configured  → a short note pointing at Phase 0 setup;
     * signed out              → scores/comments still READ; posting prompts login;
     * errors                  → inline, non-destructive messages.
   ========================================================================== */
(function () {
  "use strict";

  var MAX_COMMENT = 2000;

  function app() { return window.CR && window.CR.app; }
  function auth() { return window.CR && window.CR.auth; }
  function sb() { return auth() ? auth().getClient() : null; }

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

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (e) { return ""; }
  }

  var zone, id;

  /* ----------------------------------------------------------------------- */
  /* Data                                                                    */
  /* ----------------------------------------------------------------------- */
  async function fetchRatings() {
    var c = sb(); if (!c) return { list: [], mine: null };
    var res = await c.from("ratings").select("id, user_id, score").eq("movie_id", id);
    if (res.error) throw res.error;
    var list = res.data || [];
    var uid = auth().currentUser() ? auth().currentUser().id : null;
    var mine = uid ? (list.filter(function (r) { return r.user_id === uid; })[0] || null) : null;
    return { list: list, mine: mine };
  }

  async function fetchComments() {
    var c = sb(); if (!c) return [];
    var res = await c
      .from("comments")
      .select("id, body, created_at, user_id, profiles(username)")
      .eq("movie_id", id)
      .order("created_at", { ascending: false });
    if (res.error) throw res.error;
    return res.data || [];
  }

  async function saveRating(score) {
    var c = sb(); var u = auth().currentUser();
    return c.from("ratings").upsert(
      { user_id: u.id, movie_id: id, score: score },
      { onConflict: "user_id,movie_id" }
    );
  }

  async function clearRating(ratingId) {
    return sb().from("ratings").delete().eq("id", ratingId);
  }

  async function postComment(body) {
    var u = auth().currentUser();
    return sb().from("comments").insert({ user_id: u.id, movie_id: id, body: body });
  }

  async function deleteComment(commentId) {
    return sb().from("comments").delete().eq("id", commentId);
  }

  /* ----------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ----------------------------------------------------------------------- */
  function average(list) {
    if (!list.length) return null;
    var sum = list.reduce(function (a, r) { return a + (Number(r.score) || 0); }, 0);
    return Math.round((sum / list.length) * 10) / 10;
  }

  function scoreHeader(ratings) {
    var avg = average(ratings.list);
    var count = ratings.list.length;
    return (
      '<div class="uscore">' +
        '<div class="uscore__badge">' +
          '<span class="uscore__num">' + (avg != null ? esc(avg.toFixed(1)) : "—") + "</span>" +
          '<span class="uscore__max">/10</span>' +
        "</div>" +
        '<div class="uscore__meta">' +
          '<span class="uscore__label">User score</span>' +
          '<span class="uscore__count">' +
            (count ? esc(count.toLocaleString()) + (count === 1 ? " rating" : " ratings") : "No ratings yet") +
          "</span>" +
          '<span class="uscore__hint">Readers’ average — separate from the CineReview editorial score above.</span>' +
        "</div>" +
      "</div>"
    );
  }

  function ratingControl(ratings) {
    var signedIn = auth().isSignedIn();
    var mine = ratings.mine ? Number(ratings.mine.score) : 0;

    var buttons = "";
    for (var n = 1; n <= 10; n++) {
      var on = signedIn && n <= mine;
      buttons +=
        '<button class="urate__dot' + (on ? " is-on" : "") + '" type="button" ' +
        'data-score="' + n + '" ' + (signedIn ? "" : "disabled ") +
        'aria-label="Rate ' + n + ' out of 10"' + (mine === n ? ' aria-pressed="true"' : "") + ">" +
        n + "</button>";
    }

    var head = signedIn
      ? (mine ? "Your rating: <strong>" + esc(mine) + "/10</strong>" : "Rate this film")
      : "Rate this film";

    var foot = signedIn
      ? (mine ? '<button class="btn btn--ghost btn--sm" type="button" data-rate-clear>Clear my rating</button>' : "")
      : '<p class="urate__gate"><a href="login.html">Log in</a> or <a href="signup.html">sign up</a> to rate this film.</p>';

    return (
      '<div class="urate" data-urate>' +
        '<p class="urate__head">' + head + "</p>" +
        '<div class="urate__dots" role="group" aria-label="Your rating out of 10">' + buttons + "</div>" +
        '<div class="urate__foot">' + foot + "</div>" +
      "</div>"
    );
  }

  function commentItem(c) {
    var uid = auth().currentUser() ? auth().currentUser().id : null;
    var who = (c.profiles && c.profiles.username) || "Member";
    var own = uid && c.user_id === uid;
    return (
      '<li class="ucomment">' +
        '<div class="ucomment__head">' +
          '<span class="ucomment__who">' + esc(who) + "</span>" +
          '<span class="ucomment__when">' + esc(fmtDate(c.created_at)) + "</span>" +
        "</div>" +
        '<p class="ucomment__body">' + esc(c.body) + "</p>" +
        (own ? '<button class="ucomment__del" type="button" data-del="' + esc(c.id) + '">Delete</button>' : "") +
      "</li>"
    );
  }

  function commentSection(comments) {
    var signedIn = auth().isSignedIn();
    var form = signedIn
      ? ('<form class="ucomment-form" data-comment-form>' +
           '<label class="sr-only" for="ucomment-body">Your comment</label>' +
           '<textarea id="ucomment-body" class="ucomment-form__input" maxlength="' + MAX_COMMENT + '" ' +
             'rows="3" placeholder="Share what you thought of this film…" required></textarea>' +
           '<div class="ucomment-form__foot">' +
             '<span class="ucomment-form__count" data-count>0 / ' + MAX_COMMENT + "</span>" +
             '<button class="btn btn--primary btn--sm" type="submit">Post comment</button>' +
           "</div>" +
           '<p class="ucomment-form__msg" data-form-msg hidden></p>' +
         "</form>")
      : ('<p class="urate__gate"><a href="login.html">Log in</a> or <a href="signup.html">sign up</a> ' +
         "to leave a comment.</p>");

    var list = comments.length
      ? '<ul class="ucomment-list" data-comment-list>' + comments.map(commentItem).join("") + "</ul>"
      : '<p class="section__note" data-comment-list>No comments yet. Be the first to share your thoughts.</p>';

    return (
      '<h2 class="uzone__subtitle">Comments ' +
        '<span class="uzone__badge">' + comments.length + "</span></h2>" +
      form + list
    );
  }

  function shell(inner) {
    return (
      '<section class="uzone" aria-labelledby="uzone-title">' +
        '<div class="wrap">' +
          '<h2 class="uzone__title" id="uzone-title">Ratings &amp; comments</h2>' +
          inner +
        "</div>" +
      "</section>"
    );
  }

  function renderUnconfigured() {
    zone.innerHTML = shell(
      '<p class="section__note">User ratings and comments are not switched on yet. ' +
      "They activate once the Supabase backend is configured (see " +
      '<code>CineReview_Upgrade_Plan_Revised.md</code>, Phase 0).</p>'
    );
    zone.removeAttribute("hidden");
  }

  async function render() {
    if (!zone || !id) return;

    if (!auth().isConfigured()) { renderUnconfigured(); return; }

    zone.removeAttribute("hidden");
    zone.innerHTML = shell('<p class="section__note">Loading ratings and comments…</p>');

    var ratings, comments;
    try {
      var r = await Promise.all([fetchRatings(), fetchComments()]);
      ratings = r[0]; comments = r[1];
    } catch (err) {
      zone.innerHTML = shell(
        '<p class="section__note">Could not load ratings and comments right now. Please refresh to try again.</p>'
      );
      return;
    }

    zone.innerHTML = shell(
      '<div class="uzone__score">' + scoreHeader(ratings) + ratingControl(ratings) + "</div>" +
      '<div class="uzone__comments">' + commentSection(comments) + "</div>"
    );

    wire(ratings);
  }

  /* ----------------------------------------------------------------------- */
  /* Events                                                                  */
  /* ----------------------------------------------------------------------- */
  function toast(msg, kind) {
    if (app() && app().toast) app().toast(msg, kind || "info");
  }

  function wire(ratings) {
    var dots = zone.querySelector("[data-urate]");
    if (dots) {
      dots.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-score]");
        var clr = e.target.closest("[data-rate-clear]");
        if (btn && !btn.disabled) {
          var score = Number(btn.getAttribute("data-score"));
          saveRating(score).then(function (res) {
            if (res.error) { toast("Could not save your rating.", "error"); return; }
            toast("Saved your rating: " + score + "/10", "success");
            render();
          });
        } else if (clr) {
          if (!ratings.mine) return;
          clearRating(ratings.mine.id).then(function (res) {
            if (res.error) { toast("Could not clear your rating.", "error"); return; }
            toast("Rating cleared.", "info");
            render();
          });
        }
      });
    }

    var form = zone.querySelector("[data-comment-form]");
    if (form) {
      var input = form.querySelector(".ucomment-form__input");
      var count = form.querySelector("[data-count]");
      var msg = form.querySelector("[data-form-msg]");
      if (input && count) {
        var sync = function () { count.textContent = input.value.length + " / " + MAX_COMMENT; };
        input.addEventListener("input", sync); sync();
      }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var body = (input.value || "").trim();
        if (!body) return;
        if (msg) { msg.hidden = true; }
        var submit = form.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        postComment(body).then(function (res) {
          if (submit) submit.disabled = false;
          if (res.error) {
            if (msg) { msg.hidden = false; msg.textContent = "Could not post your comment. Please try again."; }
            return;
          }
          input.value = "";
          render();
        });
      });
    }

    var list = zone.querySelector("[data-comment-list]");
    if (list) {
      list.addEventListener("click", function (e) {
        var del = e.target.closest("[data-del]");
        if (!del) return;
        var cid = del.getAttribute("data-del");
        deleteComment(cid).then(function (res) {
          if (res.error) { toast("Could not delete the comment.", "error"); return; }
          render();
        });
      });
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Boot                                                                    */
  /* ----------------------------------------------------------------------- */
  function boot() {
    zone = document.querySelector("[data-user-zone]");
    id = movieId();
    if (!zone) return;
    if (!id) { return; } // detail page with no id renders its own 404

    render();
    // Re-render whenever auth state changes (login/logout in this tab).
    if (auth() && auth().onChange) auth().onChange(function () { render(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
