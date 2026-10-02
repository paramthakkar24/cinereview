/* =============================================================================
   CineReview — application layer
   -----------------------------------------------------------------------------
   The single script every page loads. It owns four things:

     1. esc()            one HTML-escaping helper for the whole project
     2. chrome           theme, mobile nav, sticky header, rails, toasts,
                         navbar search, API-key status bar
     3. renderers        movie cards, review cards, hero, sections, and the
                         loading / empty / error states
     4. pages            one entry point per page, dispatched off <body data-page>

   Data comes from three places and never from anywhere else:
     js/data.js     the bundled catalogue — always present, used as fallback
     js/api.js      live TMDB, when a key is configured
     js/reviews.js  our own editorial text, keyed by TMDB movie id

   Design rule: no slot is ever left blank. Every section shows a skeleton, then
   live data, then the bundled catalogue. A missing key, a dead network or a
   rejected key degrades the page instead of breaking it.
   ========================================================================== */

(function () {
  "use strict";

  const CR = (window.CR = window.CR || {});
  const data = CR.data || {};
  const icons = CR.icons || {};
  const reviews = CR.reviews || null;
  const api = CR.api || null;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const icon = (name, attrs) => {
    const svg = icons[name];
    if (!svg) return "";
    return attrs ? svg.replace("<svg ", "<svg " + attrs + " ") : svg;
  };

  const page = document.body ? document.body.getAttribute("data-page") || "" : "";

  /* =========================================================================
     1. ESCAPING
     Every value that reaches innerHTML goes through esc(). TMDB titles and
     synopses contain & " < > freely, and our own copy contains em dashes and
     curly quotes, so this is not optional.
  ========================================================================== */
  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
  }

  /** Collapse whitespace, then escape — for synopses and taglines. */
  function escText(value) {
    return esc(String(value || "").replace(/\s+/g, " ").trim());
  }

  /**
   * Shorten to `max` characters. Whitespace is collapsed first, so the result is
   * always a single clean line and esc(truncate(x)) is a complete sanitiser —
   * one obvious way to put a synopsis in markup, rather than having to know
   * whether escText() or esc(truncate()) is the right one at each call site.
   */
  function truncate(value, max) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
  }

  /* =========================================================================
     2. STORAGE
     All keys are namespaced cr.* so nothing collides with another site on the
     same origin. Every access is guarded: localStorage throws outright on some
     file:// configurations and in private windows.
  ========================================================================== */
  const keys = {
    key: "cr.tmdbKey"
  };

  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  /* =========================================================================
     3. TOASTS
  ========================================================================== */
  let toastStack = null;

  function toast(message, iconName) {
    if (!toastStack) {
      toastStack = document.createElement("div");
      toastStack.className = "toast-stack";
      document.body.appendChild(toastStack);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<span class="toast__icon">' + icon(iconName || "check_small") + "</span>" +
      "<span>" + esc(message) + "</span>";
    toastStack.appendChild(el);
    window.setTimeout(() => {
      el.classList.add("toast--out");
      window.setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  /** Announce to assistive tech without moving focus. */
  function announce(message) {
    let region = $("#cr-live");
    if (!region) {
      region = document.createElement("div");
      region.id = "cr-live";
      region.className = "sr-only";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    region.textContent = message;
  }

  /* =========================================================================
     4. RECORD ADAPTER
     Movie records arrive from two shapes: the bundled catalogue (cast and
     genres as plain strings, artwork as local SVG paths) and TMDB (cast as
     objects with profile images, genres as {id,name}, artwork as CDN URLs).

     Everything downstream wants one shape, so movie() adapts either. It also
     attaches our own review when one exists, keeping `score` (our verdict)
     separate from `rating` (the source score) so a TMDB 8.4 is never shown as
     our opinion.
  ========================================================================== */
  const isLive = (movie) => Boolean(movie && movie.source === "tmdb");

  /** Our review, whichever id scheme the record uses. */
  function reviewFor(movie) {
    if (!reviews) return null;
    return isLive(movie) ? reviews.forMovie(movie.tmdbId) : reviews.forSlug(movie.slug || movie.id);
  }

  /**
   * The bundled catalogue record for this film, if we have one.
   *
   * This matters because the two sources are not substitutes. TMDB supplies the
   * things only a database can know — cast headshots, certification, runtime,
   * artwork. The bundled record supplies the things only an editor wrote — the
   * accent colour, the critic score, the ratings breakdown. A live record that
   * quietly replaced the bundled one would take all of that with it, so the
   * renderers read editorial fields from here rather than from whichever record
   * happens to be current.
   */
  function bundledFor(record, review) {
    if (!record || !data) return null;
    if (record.bundled) return record.bundled;
    if (!isLive(record)) return record;
    const slug = (review && review.slug) || record.slug;
    return slug ? data.byId(slug) : null;
  }

  /**
   * Adapt a record from either source into the one shape the renderers take.
   * Named adapt() rather than movie() so it is never shadowed by a local
   * variable called `movie` inside a renderer.
   */
  function adapt(record) {
    if (!record) return null;
    const live = isLive(record);

    const review = reviewFor(record);
    /* Editorial fields survive whichever source is current. */
    const ours = bundledFor(record, review);
    /* Live data wins where it exists; our own copy fills the gaps. */
    const pick = (field) => (record[field] != null && record[field] !== "" ? record[field] : ours && ours[field]);

    return {
      key: live ? "tmdb:" + record.tmdbId : "local:" + (record.slug || record.id),
      /* What goes in movie-details.html?id= */
      id: live ? String(record.tmdbId) : String(record.slug || record.id),
      /*
       * Identity for anything we store locally — a visitor's own
       * rating, their own review. It has to survive a source change, because the
       * same film arrives as a slug from the bundled catalogue and as a numeric
       * id from TMDB, and the details page swaps between the two while it is
       * open. The slug wins whenever we have one, because it is stable across
       * both sources; the numeric id is only the fallback for a film we have
       * never written about.
       */
      storeId: (review && review.slug) || String(record.tmdbId || record.slug || record.id),
      tmdbId: live ? record.tmdbId : review && review.tmdbId ? review.tmdbId : null,
      slug: record.slug || record.id || null,

      title: record.title || "Untitled",
      year: record.year || (ours && ours.year) || null,
      runtime: pick("runtime") || null,
      rated: pick("rated") || "",
      director: pick("director") || "",
      tagline: pick("tagline") || "",
      overview: pick("overview") || "",
      /* Per-film accent, used to tint the details banner. Bundled only. */
      accent: pick("accent") || "",
      /* ISO date when TMDB supplied one; the bundled catalogue has a year only. */
      releaseDate: record.release_date || (ours && ours.releaseDate) || "",
      /* Artwork is resolved once here rather than in each of the nine renderers, so
         Home, Movies, Reviews and Details cannot drift apart.

         Both sources are asked of `ours`, the bundled record: it now carries the
         TMDB poster_path (see data.js), so a bundled film gets the same real key
         art a live one gets. Previously data.posterFor() returned the generated
         title-artwork SVG for these records, which is why Movies and Reviews
         showed typographic placeholders where Home - fed by live TMDB lists -
         showed real posters.

         Chain: real TMDB art -> generated local SVG -> generic placeholder. The
         generated SVG stays in the chain because a film with no poster_path
         should still show something film-specific. */
      poster: resolveImage(
        live ? record.poster : null,
        data.posterFor(ours),
        fallbackPosterPath()
      ),
      backdrop: resolveImage(
        live ? record.backdrop : null,
        data.bannerFor(ours),
        fallbackBackdropPath()
      ),
      /* Kept on the adapted record so a renderer can chain to the next-best
         source when the URL it was given turns out to be dead. This is the
         generated SVG specifically, so a dead TMDB URL degrades to typographic
         art rather than to the generic placeholder. */
      posterLocal: data.localPosterFor(ours) || fallbackPosterPath(),
      backdropLocal: data.localBannerFor(ours) || fallbackBackdropPath(),
      rating: Number(record.rating) || 0,
      /* TMDB's vote count when live, our own tally otherwise. */
      reviewCount: Number(record.reviewCount) || Number(ours && ours.reviewCount) || 0,
      score: review && review.score ? Number(review.score) : null,
      genres: (record.genres || [])
        .map((g) => (typeof g === "string" ? g : g && g.name))
        .filter(Boolean),
      cast: (record.cast || []).map((c) =>
        typeof c === "string" ? { name: c, character: "", profile: "" } : c
      ),
      isNew: Boolean(record.isNew),
      isFeatured: Boolean(record.isFeatured),
      isTrending: Boolean(record.isTrending),
      /* The star distribution behind our score. Editorial, so it comes from our copy. */
      breakdown: (ours && ours.breakdown) || record.breakdown || null,
      criticScore: (ours && ours.criticScore) || record.criticScore || null,
      pros: (review && review.pros) || (ours && ours.pros) || [],
      cons: (review && review.cons) || (ours && ours.cons) || [],

      review: review ? reviewView(review) : null,
      source: live ? "tmdb" : "local",
      raw: record,
      /* The bundled record when one exists, whatever the current source is. */
      bundled: ours || null
    };
  }

  /** Normalise one of our review records into the shape renderers expect. */
  function reviewView(record) {
    if (!record) return null;
    return {
      title: record.headline || record.title || "",
      body: record.body || [],
      quote: record.quote || "",
      critic: record.critic || { name: "CineReview", role: "Editors", initials: "CR" },
      date: record.date || "",
      score: record.score || null,
      pros: record.pros || [],
      cons: record.cons || [],
      slug: record.slug || null,
      tmdbId: record.tmdbId || null
    };
  }

  function movies(records) {
    return (records || []).map(adapt).filter(Boolean);
  }

  /* =========================================================================
     5. SMALL COMPONENTS
  ========================================================================== */

  /** Star row. Glyphs are decorative; the score is what gets announced. */
  function stars(score10, label) {
    const score = Number(score10) || 0;
    const filled = Math.round((score / 10) * 5);
    let glyphs = "";
    for (let i = 0; i < 5; i++) {
      glyphs += '<span class="stars__glyph' + (i < filled ? "" : " stars__glyph--empty") + '"></span>';
    }
    return (
      '<span class="stars" role="img" aria-label="' +
      esc(label || score.toFixed(1) + " out of 10") +
      '">' + glyphs + "</span>"
    );
  }

  /**
   * Gold score pill. Prefers our editorial score when the film has been
   * reviewed and says in the tooltip which of the two it is showing.
   */
  function ratingPill(movieRecord) {
    const ours = movieRecord.score != null;
    const value = ours ? movieRecord.score : movieRecord.rating;
    const label = ours ? "CineReview score" : "TMDB score";
    const shown = value ? Number(value).toFixed(1) : "—";
    return '<span class="rating-pill" title="' + esc(label) + '">' + shown + "<small>/10</small></span>";
  }

  function badge(text, variant) {
    if (!text) return "";
    const cls = variant ? "badge badge--" + variant : "badge";
    return '<span class="' + cls + '">' + esc(text) + "</span>";
  }

  function initialsOf(name) {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }

  /* =========================================================================
     4a. IMAGE RESOLUTION

     Every <img> on every page goes through resolveImage(). It exists because
     three separate things can each leave a card with no artwork, and each one
     needs a different answer:

       1. A live TMDB record whose poster_path / backdrop_path is absent.
          api.js normalise() already substitutes a placeholder, but only when
          it produced the record - so adapt() must not assume it did.

       2. A record with no id at all. data.posterFor() used to interpolate it
          straight into a path, giving "images/movie-posters/undefined.svg",
          which is a 404. A 404 with an onerror handler still renders as a
          broken frame for the moment before the handler runs, and if the
          handler is missing it stays broken forever.

       3. A path that is syntactically fine but 404s anyway (a TMDB image
          deleted upstream, a local file renamed).

     The rule is one sentence: never hand an <img> a src that can be empty or
     known-bad. Prefer live TMDB artwork, then the bundled generated SVG, then
     the placeholder - and always attach the fallback chain as onerror, so a
     URL that was valid when we wrote it but is dead now still lands somewhere
     real instead of an empty block.

     Guards against a fallback that is itself broken: an onerror that fires a
     second time clears itself and reveals nothing rather than looping.
  ========================================================================== */

  var POSTER_PLACEHOLDER = "images/poster-placeholder.svg";
  var BACKDROP_PLACEHOLDER = "images/backdrop-placeholder.svg";

  function fallbackPosterPath() {
    return api && api.fallbackPoster ? api.fallbackPoster() : POSTER_PLACEHOLDER;
  }

  function fallbackBackdropPath() {
    return api && api.fallbackBackdrop ? api.fallbackBackdrop() : BACKDROP_PLACEHOLDER;
  }

  /**
   * Pick the best available artwork URL for a movie.
   *
   * `live` is the TMDB URL if there is one, `local` the generated SVG. Order
   * matters: TMDB artwork is the real key art, and the bundled SVG is the
   * deliberately art-directed fallback, which beats a generic "unavailable"
   * placeholder because it is still recognisably that film.
   */
  function resolveImage(live, local, fallback) {
    var last = fallback || POSTER_PLACEHOLDER;
    var candidates = [live, local, last];
    for (var i = 0; i < candidates.length; i++) {
      var value = candidates[i];
      /* Reject "", null, undefined and the literal string "undefined" - all of
         which a naive `||` chain lets through as a truthy-looking src. */
      if (typeof value !== "string") continue;
      var trimmed = value.trim();
      if (!trimmed || trimmed === "undefined" || trimmed === "null") continue;
      return trimmed;
    }
    return last;
  }

  /**
   * The onerror attribute for any artwork <img>.
   *
   * One hop: if there is a next-best URL, try it, and arm a second handler that
   * gives up cleanly. Guarding on crTried is what stops a placeholder that is
   * itself missing from looping forever - the classic way a "fallback" turns
   * into a reload loop.
   *
   * Single quotes only, throughout. This string is interpolated into a
   * double-quoted HTML attribute, so one stray " inside it closes the attribute
   * early and silently truncates the whole handler - the images then 404 with
   * no error handling at all, which is exactly the bug this is meant to fix.
   * The second hop is reassigned as a function rather than as a string, which
   * keeps it out of the attribute-quoting problem entirely.
   */
  function imageOnerror() {
    return (
      "this.onerror=null;var n=this.dataset.crNext;" +
      "if(n&&!this.dataset.crTried){this.dataset.crTried=1;" +
      "this.onerror=function(){this.removeAttribute('src');" +
      "this.classList.add('is-image-missing')};this.src=n}" +
      "else{this.removeAttribute('src');this.classList.add('is-image-missing')}"
    );
  }

  /**
   * Build an artwork <img>. Every image on every page comes through here, so
   * there is exactly one place that decides what happens when a load fails.
   */
  function artworkImg(options) {
    var o = options || {};
    var primary = resolveImage(o.src, o.local, o.fallback);
    var next = resolveImage(null, o.local, o.fallback);
    /* Only chain to a genuinely different URL; the last hop is handled by the
       give-up branch below. */
    var chainNext = next && next !== primary ? next : null;

    var attrs = [
      'src="' + esc(primary) + '"',
      o.alt != null ? 'alt="' + esc(o.alt) + '"' : 'alt=""',
      o.className ? 'class="' + esc(o.className) + '"' : "",
      o.width ? 'width="' + esc(o.width) + '"' : "",
      o.height ? 'height="' + esc(o.height) + '"' : "",
      o.loading ? 'loading="' + esc(o.loading) + '"' : "",
      o.decoding ? 'decoding="' + esc(o.decoding) + '"' : "",
      o.fetchpriority ? 'fetchpriority="' + esc(o.fetchpriority) + '"' : ""
    ];

    /* data-cr-next carries the next-best source for onerror to hop to; when it
       is empty there is nowhere left to go, so the handler gives up cleanly
       instead of leaving a broken frame. */
    if (o.onFail) {
      attrs.push("onerror=\"" + o.onFail + "\"");
    } else {
      attrs.push('data-cr-next="' + esc(chainNext || "") + '"');
      attrs.push('onerror="' + imageOnerror() + '"');
    }

    /* Arbitrary data-* hooks, escaped like everything else. */
    if (o.data) {
      Object.keys(o.data).forEach(function (key) {
        if (o.data[key] != null && o.data[key] !== "") {
          attrs.push("data-" + key + '="' + esc(o.data[key]) + '"');
        }
      });
    }

    return "<img " + attrs.filter(Boolean).join(" ") + ">";
  }

  function criticAvatar(critic) {
    if (!critic) return "";
    return '<span class="avatar" aria-hidden="true">' + esc(critic.initials || initialsOf(critic.name)) + "</span>";
  }

  function detailHref(movieRecord) {
    return "movie-details.html?id=" + encodeURIComponent(movieRecord.id);
  }

  /* =========================================================================
     6. RENDERERS
     Defined once, used by every page. A page composes these; it never
     hand-authors a card.
  ========================================================================== */

  /** Year · runtime · certificate · director, joined with the hero dot. */
  function metaList(movie, options) {
    const opts = options || {};
    const bits = [];
    if (movie.year) bits.push("<span>" + esc(movie.year) + "</span>");
    if (movie.runtime) bits.push("<span>" + esc(data.runtimeLabel(movie.runtime)) + "</span>");
    if (movie.rated) bits.push(badge(movie.rated, "cert"));
    if (opts.director && movie.director) bits.push("<span>" + esc(movie.director) + "</span>");
    if (opts.rating) bits.push(ratingPill(movie));
    return bits.filter(Boolean).join('<span class="hero__dot" aria-hidden="true"></span>');
  }

  /**
   * Movie card. `movie` is already adapted. Density comes from the options:
   * mini for the Home rails, rank for the numbered Top 10.
   */
  function card(movie, options) {
    const opts = options || {};
    const fallback = api ? api.fallbackPoster() : "images/poster-placeholder.svg";

    const classes = ["card"];
    if (opts.mini) classes.push("card--mini");
    if (opts.rank) classes.push("card--rank");

    const flags = [];
    if (movie.isNew) flags.push('<span class="card__flag card__flag--new">New</span>');
    if (opts.rank) flags.push('<span class="card__flag card__flag--top">No. ' + esc(opts.rank) + "</span>");

    const genres = movie.genres
      .slice(0, 2)
      .map((g) => '<span class="card__genre">' + esc(g) + "</span>")
      .join("");

    const sub = [];
    if (movie.year) sub.push("<span>" + esc(movie.year) + "</span>");
    if (movie.rated) sub.push(badge(movie.rated, "cert"));
    if (movie.director) sub.push("<span>" + esc(movie.director) + "</span>");

    return (
      '<article class="' + classes.join(" ") + '">' +
        '<div class="card__media">' +
          artworkImg({
            className: "card__poster",
            src: movie.poster,
            local: movie.posterLocal,
            fallback: fallback,
            width: 342,
            height: 513,
            loading: "lazy",
            decoding: "async"
          }) +
          (flags.length ? '<div class="card__flags">' + flags.join("") + "</div>" : "") +
          (opts.rank ? '<span class="card__rank" aria-hidden="true">' + esc(opts.rank) + "</span>" : "") +
        "</div>" +
        '<div class="card__body">' +
          '<h3 class="card__title">' +
            '<a class="card__link" href="' + esc(detailHref(movie)) + '">' +
              "<span>" + esc(movie.title) + "</span>" +
            "</a>" +
          "</h3>" +
          (sub.length ? '<div class="card__sub">' + sub.join("") + "</div>" : "") +
          (genres ? '<div class="card__genres">' + genres + "</div>" : "") +
          (opts.blurb === false
            ? ""
            /* The full synopsis, not a JS-truncated one. The stylesheet already
               clamps .card__blurb to a few lines with -webkit-line-clamp, so
               truncating here too would only add a mid-word ellipsis while
               costing the reader the rest of the text in Ctrl-F, in print and
               for anyone using a screen reader. */
            : '<p class="card__blurb">' + esc(movie.overview) + "</p>") +
          '<div class="card__foot">' +
            ratingPill(movie) +
            '<span class="card__action">Details' + icon("arrowRight") + "</span>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function cardGrid(records, options) {
    const opts = options || {};
    const list = movies(records);
    if (!list.length) return "";

    const classes = ["grid"];
    if (opts.wide) classes.push("grid--wide");
    if (opts.rail) classes.push("grid--rail");

    const body = list
      .map((m, i) => card(m, Object.assign({}, opts, { rank: opts.rank ? i + 1 : null })))
      .join("");

    return '<div class="' + classes.join(" ") + '">' + body + "</div>";
  }

  /**
   * Order adapted records by one of the Movies page's sort keys.
   *
   * The comparators read `score` before `rating`, because that is exactly what
   * ratingPill() shows — so a film is never filed under a score the card does
   * not display. Missing values sort last rather than as zero, otherwise a
   * live TMDB result with no runtime would top a "shortest first" list.
   */
  const SORTS = {
    rating: (a, b) => shownScore(b) - shownScore(a) || a.title.localeCompare(b.title),
    year: (a, b) => (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title),
    popular: (a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || a.title.localeCompare(b.title),
    title: (a, b) => a.title.localeCompare(b.title),
    runtime: (a, b) => (a.runtime || Infinity) - (b.runtime || Infinity) || a.title.localeCompare(b.title)
  };

  /** The number a card actually displays. */
  function shownScore(movie) {
    return Number(movie.score != null ? movie.score : movie.rating) || 0;
  }

  function sortMovies(list, key) {
    const by = SORTS[key] || SORTS.rating;
    return list.slice().sort(by);
  }

  /** Rail contents — the track element is supplied by the page markup. */
  function railCards(records, options) {
    return movies(records)
      .map((m) => card(m, Object.assign({ mini: true, blurb: false }, options || {})))
      .join("");
  }

  /** Hero for the featured film. */
  function hero(record) {
    const movie = record && record.key ? record : adapt(record);
    if (!movie) return "";

    const score = movie.score != null ? movie.score : movie.rating;
    const scoreLabel = movie.score != null ? "CineReview score" : "TMDB score";
    const fallback = api ? api.fallbackBackdrop() : "images/backdrop-placeholder.svg";

    const stats = [
      { value: score ? Number(score).toFixed(1) : "—", label: scoreLabel, gold: true },
      { value: movie.reviewCount ? movie.reviewCount.toLocaleString() : "—", label: "Ratings logged" },
      { value: movie.year || "—", label: "Release year" }
    ]
      .map(
        (s) =>
          '<div><div class="stat__value' + (s.gold ? " stat__value--gold" : "") + '">' +
          esc(s.value) +
          '</div><div class="stat__label">' +
          esc(s.label) +
          "</div></div>"
      )
      .join("");

    return (
      '<div class="hero__media">' +
        artworkImg({
          src: movie.backdrop,
          local: movie.backdropLocal,
          fallback: fallback,
          decoding: "async",
          fetchpriority: "high"
        }) +
      "</div>" +
      '<div class="hero__scrim" aria-hidden="true"></div>' +
      '<div class="wrap"><div class="hero__body">' +
        '<div class="hero__eyebrow"><span>Editor’s choice · This week’s featured review</span></div>' +
        '<h1 class="hero__title">' + esc(movie.title) + "</h1>" +
        (movie.tagline ? '<p class="hero__tagline">' + esc(movie.tagline) + "</p>" : "") +
        '<div class="hero__meta">' + metaList(movie, { rating: true }) + "</div>" +
        '<p class="hero__overview">' + esc(truncate(movie.overview, 320)) + "</p>" +
        '<div class="hero__cta">' +
          '<a class="btn btn--primary" href="' + esc(detailHref(movie)) + '">' +
            icon("book") + "Read the review</a>" +
          '<a class="btn btn--ghost" href="movies.html">Browse all movies</a>' +
        "</div>" +
        '<div class="hero__stats">' + stats + "</div>" +
      "</div></div>"
    );
  }

  /* --- the review card, shared by Home and the Reviews page --------------- */
  function reviewCard(review, record) {
    if (!review) return "";
    const movie = record ? adapt(record) : null;
    const href = movie ? detailHref(movie) : "#";
    const critic = review.critic;
    const fallback = api ? api.fallbackPoster() : "images/poster-placeholder.svg";

    const paragraphs = review.body || [];
    const summary = paragraphs.slice(0, 2).join(" ");
    const rest = paragraphs.slice(2);
    const collapsible = rest.length > 0;

    const film = movie
      ? '<a class="review-card__film" href="' + esc(href) + '">' +
          artworkImg({
            className: "review-card__poster",
            src: movie.poster,
            local: movie.posterLocal,
            fallback: fallback,
            width: 54,
            height: 81,
            loading: "lazy",
            decoding: "async"
          }) +
          '<div class="review-card__film-meta">' +
            '<div class="review-card__film-title">' + esc(movie.title) + "</div>" +
            '<div class="review-card__film-sub">' +
              (movie.year ? "<span>" + esc(movie.year) + "</span>" : "") +
              (movie.genres.length
                ? "<span>" + esc(movie.genres.slice(0, 2).join(" · ")) + "</span>"
                : "") +
            "</div>" +
          "</div>" +
        "</a>"
      : "";

    return (
      '<article class="review-card">' +
        '<div class="review-card__top">' +
          criticAvatar(critic) +
          '<div class="review-card__by">' +
            '<div class="review-card__name">' + esc(critic.name) + "</div>" +
            '<div class="review-card__role">' + esc(critic.role) + "</div>" +
          "</div>" +
          (review.score
            ? '<span class="rating-pill">' + Number(review.score).toFixed(1) + "<small>/10</small></span>"
            : "") +
        "</div>" +
        film +
        '<h3 class="review-card__title">' + esc(review.title) + "</h3>" +
        '<p class="review-card__summary">' + escText(summary) + "</p>" +
        (collapsible
          ? '<div class="review-card__more">' +
              rest.map((p) => "<p>" + esc(p) + "</p>").join("") +
            "</div>"
          : "") +
        (review.quote ? '<blockquote class="review-card__quote">' + esc(review.quote) + "</blockquote>" : "") +
        '<div class="review-card__foot">' +
          "<span>" + esc(data.formatDate(review.date)) + "</span>" +
          '<div class="review-card__actions">' +
            (collapsible
              ? '<button class="btn btn--sm btn--ghost js-read-more" type="button" aria-expanded="false">Read more</button>'
              : "") +
            '<a class="card__action" href="' + esc(href) + '">The film' + icon("arrowRight") + "</a>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /**
   * Our reviews paired with their bundled film record for artwork.
   * `bare: true` returns just the cards, for slots that are already a
   * .review-grid — nesting a grid inside a grid breaks the layout.
   */
  function reviewGrid(limit, options) {
    const opts = options || {};
    const all = reviews ? reviews.list() : [];
    const shown = all.slice(0, limit || 6);
    if (!shown.length) return "";

    const body = shown
      .map((review) => reviewCard(reviewView(review), data.byId(review.slug)))
      .join("");

    return opts.bare ? body : '<div class="review-grid">' + body + "</div>";
  }

  /* --- pros and cons ------------------------------------------------------ */
  function proConList(pros, cons) {
    const block = (items, variant, label, iconName) => {
      if (!items || !items.length) return "";
      return (
        '<div class="pc pc--' + variant + '">' +
          '<div class="pc__head">' +
            '<span class="pc__badge">' + icon(iconName) + "</span>" +
            "<span>" + esc(label) + "</span>" +
          "</div>" +
          '<ul class="pc__list">' +
            items.map((p) => '<li class="pc__item">' + esc(p) + "</li>").join("") +
          "</ul>" +
        "</div>"
      );
    };
    const body =
      block(pros, "pro", "What works", "check") + block(cons, "con", "What doesn’t", "cross");
    return body ? '<div class="proscons">' + body + "</div>" : "";
  }

  /* =========================================================================
     7. LOADING, EMPTY AND ERROR STATES
     Each failure gets its own wording and its own action, so a rate limit never
     reads like a missing key. This is the only place kind → copy lives.
  ========================================================================== */
  function skeletonCard() {
    return (
      '<div aria-hidden="true">' +
        '<div class="card" style="border:0;background:transparent">' +
          '<div class="card__media"><div class="skeleton skeleton--poster"></div></div>' +
          '<div class="card__body">' +
            '<div class="skeleton skeleton--line is-medium"></div>' +
            '<div class="skeleton skeleton--line is-short"></div>' +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function skeletonRow(count) {
    let out = "";
    for (let i = 0; i < (count || 6); i++) out += skeletonCard();
    return out;
  }

  function emptyState(options) {
    const o = options || {};
    return (
      '<div class="empty">' +
        '<div class="empty__icon">' + icon(o.icon || "search") + "</div>" +
        '<h3 class="empty__title">' + esc(o.title || "Nothing here yet") + "</h3>" +
        (o.text ? '<p class="empty__text">' + esc(o.text) + "</p>" : "") +
        (o.actionHref
          ? '<a class="btn btn--ghost btn--sm" href="' + esc(o.actionHref) + '">' +
            esc(o.actionText || "Back") + "</a>"
          : "") +
      "</div>"
    );
  }

  const ERROR_COPY = {
    NO_KEY: {
      icon: "key",
      title: "Add your TMDB API key",
      text: "CineReview is running on its bundled catalogue. Add a free key to load live data.",
      action: "Set key"
    },
    AUTH: {
      icon: "key",
      title: "That API key was rejected",
      text: "Check the key in js/config.js, then try again.",
      action: "Try again"
    },
    RATE_LIMIT: {
      icon: "clock",
      title: "Too many requests",
      text: "TMDB is rate limiting us. Give it a few seconds, then try again.",
      action: "Try again"
    },
    NOT_FOUND: {
      icon: "search",
      title: "We couldn’t find that title",
      text: "The link may point at a film TMDB no longer lists.",
      action: "Browse movies"
    },
    NETWORK: {
      icon: "info",
      title: "Can’t reach TMDB",
      text:
        "Check your connection. If you opened this file straight from disk, serve the " +
        "folder over http:// instead.",
      action: "Try again"
    },
    SERVER: { icon: "info", title: "TMDB had a problem", text: "This is on their side. Try again shortly.", action: "Try again" },
    EMPTY: { icon: "search", title: "Nothing matched", text: "Try a different search or clear the filters.", action: "Clear filters" }
  };

  function errorState(err, options) {
    const opts = options || {};
    const kind = (err && err.kind) || "UNKNOWN";
    const copy = ERROR_COPY[kind] || {
      icon: "info",
      title: "Something went wrong",
      text: (err && err.message) || "Unexpected error.",
      action: opts.retryHref ? null : "Try again"
    };

    const action = opts.retryHref
      ? '<a class="btn btn--ghost btn--sm" href="' + esc(opts.retryHref) + '">' +
        esc(copy.action || "Back") + "</a>"
      : copy.action
        ? '<button class="btn btn--ghost btn--sm js-retry" type="button"' +
          (kind === "NO_KEY" ? ' data-action="set-key"' : "") + ">" +
          esc(copy.action) + "</button>"
        : "";

    return (
      '<div class="empty" data-error-kind="' + esc(kind) + '">' +
        '<div class="empty__icon">' + icon(copy.icon || "info") + "</div>" +
        '<h3 class="empty__title">' + esc(copy.title) + "</h3>" +
        '<p class="empty__text">' + esc(copy.text) + "</p>" +
        action +
      "</div>"
    );
  }

  /* =========================================================================
     8. CHROME
  ========================================================================== */

  /* --- mobile nav -------------------------------------------------------- */
  function navElement() {
    return $("[data-nav], .nav");
  }

  function setNav(open) {
    const nav = navElement();
    if (!nav) return;
    nav.classList.toggle("is-open", open);

    const toggle = $("[data-nav-toggle], .js-nav-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = icon(open ? "close" : "menu");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
  }

  function initNav() {
    const toggle = $("[data-nav-toggle], .js-nav-toggle");
    if (!toggle) return;

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-nav-toggle], .js-nav-toggle")) {
        setNav(!navElement().classList.contains("is-open"));
        return;
      }
      if (navElement().classList.contains("is-open") && !event.target.closest("[data-nav], .nav")) {
        setNav(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navElement().classList.contains("is-open")) {
        setNav(false);
        toggle.focus();
      }
    });

    $$("[data-nav] .nav__link, .nav__link").forEach((link) =>
      link.addEventListener("click", () => setNav(false))
    );

    markCurrentNavLink();

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) setNav(false);
    });
  }

  /**
   * Marks the nav entry for the page you are on.
   *
   * The navbar is duplicated markup on all five pages, so it cannot hard-code
   * this: whichever link is current differs per page, and a diff between the
   * five copies is exactly the kind of drift that goes unnoticed. The links
   * already carry `data-nav-link`, matching the values on <body data-page>, so
   * the marking is derived rather than written into any of the copies.
   *
   * Movie Details is not in the nav — it is a page *within* the Movies
   * section, so that link is marked instead of inventing a fifth entry.
   */
  const NAV_OWNER = { details: "movies" };

  function markCurrentNavLink() {
    if (!page) return;
    const current = NAV_OWNER[page] || page;

    $$("[data-nav] .nav__link, .nav__link").forEach((link) => {
      if (link.getAttribute("data-nav-link") === current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  /* --- sticky header ----------------------------------------------------- */
  function initHeader() {
    const header = $("[data-header], .header");
    if (!header) return;

    let ticking = false;
    const update = () => {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* --- navbar search ------------------------------------------------------ */
  /**
   * The header search, present on every page. One input does two jobs: it offers
   * live suggestions out of the bundled catalogue as you type, and submitting
   * hands the term to movies.html, whose ?q= the Movies page already reads. Both
   * paths run the same CR.data.search(), so the chrome and the Movies page can
   * never disagree about what a query matches.
   */
  function initNavSearch() {
    const toggle = $("[data-search-toggle]");
    const panel = $("#nav-search");
    if (!toggle || !panel) return;

    const input = panel.querySelector("input");
    const list = panel.querySelector(".nav-search__results");
    const more = panel.querySelector(".nav-search__more");
    const isOpen = () => panel.classList.contains("is-open");

    /* How many titles to offer inline. The rest stay reachable through "see
       all", which keeps the panel short enough to sit under the header. */
    const MAX_HITS = 5;

    const clearHits = () => {
      if (list) {
        list.innerHTML = "";
        list.hidden = true;
      }
      if (more) more.hidden = true;
    };

    const showHits = (query) => {
      if (!list) return;
      const term = String(query || "").trim();
      if (!term) {
        clearHits();
        return;
      }

      const hits = typeof data.search === "function" ? data.search(term) : [];
      if (!hits.length) {
        list.innerHTML =
          '<li class="nav-search__empty" role="presentation">Nothing matches &ldquo;' +
          esc(term) +
          "&rdquo;.</li>";
        list.hidden = false;
        if (more) more.hidden = true;
        return;
      }

      list.innerHTML = hits
        .slice(0, MAX_HITS)
        .map(
          (movie) =>
            '<li class="nav-search__hit" role="option" aria-selected="false">' +
            '<a class="nav-search__hitlink" href="' +
            esc(detailHref(movie)) +
            '">' +
            artworkImg({
              className: "nav-search__thumb",
              /* Suggestions come straight off CR.data.search(), so the record is
                 the raw catalogue shape - it has no .poster, and asking for one
                 by property is what used to render these thumbs blank. */
              src: movie.poster,
              local: data.posterFor(movie),
              fallback: api ? api.fallbackPoster() : POSTER_PLACEHOLDER,
              width: 34,
              height: 51,
              loading: "lazy",
              decoding: "async"
            }) +
            '<span class="nav-search__hittext">' +
            '<span class="nav-search__hittitle">' +
            esc(movie.title) +
            "</span>" +
            '<span class="nav-search__hitmeta">' +
            esc(String(movie.year)) +
            " &middot; " +
            esc(movie.director) +
            "</span></span></a></li>"
        )
        .join("");
      list.hidden = false;

      /* Only offer the full list when the suggestions are genuinely truncated,
         so a narrow query does not get a pointless "see all 3 films" row. */
      if (more) {
        const rest = hits.length > MAX_HITS;
        more.hidden = !rest;
        if (rest) {
          more.querySelector("button").textContent =
            "See all " + hits.length + " films matching “" + term + "”";
        }
      }
    };

    const setSearch = (open) => {
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = icon(open ? "close" : "search");
      const label = open ? "Close search" : "Search movies";
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
      input.setAttribute("aria-expanded", String(open));
      if (!open) clearHits();
      /* The panel starts visibility:hidden, and browsers ignore focus() on a
         hidden element — so wait for the opening style to land first. */
      if (open && input) window.setTimeout(() => input.focus(), 60);
    };

    setSearch(false);

    /* stopPropagation matters here, and it is not defensive padding.
       setSearch() replaces the button's contents with `toggle.innerHTML = icon(...)`,
       which DETACHES the <svg>/<path> that was just clicked. This listener runs
       first and opens the panel; the document click-away listener below then runs
       as the same click bubbles, and tests `toggle.contains(event.target)` against
       that now-detached node. contains() is false for a removed node, so the
       handler read the click as "outside" and closed the panel again in the same
       tick - the icon appeared dead. Clicking the button's padding worked because
       event.target was the button itself, which is still inside it, which is why
       it only failed *sometimes*. A toggle's own click is never an outside click,
       so it should not reach that listener at all. */
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setSearch(!isOpen());
    });

    /* Live filtering. This is a plain array scan of the 28 bundled films, so it
       runs on every keystroke — a debounce would only add lag. */
    if (input) input.addEventListener("input", () => showHits(input.value));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setSearch(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!isOpen()) return;
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      setSearch(false);
    });

    panel.addEventListener("submit", (event) => {
      /* Submitting empty would just reload the unfiltered list. Keep the panel
         open and put the cursor back instead of navigating for nothing. */
      if (input && !input.value.trim()) {
        event.preventDefault();
        input.focus();
        return;
      }
      if (input) input.value = input.value.trim();
    });
  }

  /* --- scroll reveal ----------------------------------------------------- */
  let revealObserver = null;

  function initReveal() {
    if (revealObserver || !("IntersectionObserver" in window)) return;
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
  }

  function revealIn(root) {
    const nodes = $$("[data-reveal]:not(.is-in)", root || document);
    if (!revealObserver) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    nodes.forEach((node) => {
      if (node.hasAttribute("data-reveal-delay")) {
        node.style.transitionDelay = node.getAttribute("data-reveal-delay") + "ms";
      }
      revealObserver.observe(node);
    });
  }

  /* --- rails ------------------------------------------------------------- */
  /** Resolve a rail from either an id, or the control's own ancestor. */
  function railFor(source) {
    if (!source) return null;
    if (typeof source === "string") return $('[data-rail="' + source + '"]');
    return source.closest ? source.closest("[data-rail], .rail") : null;
  }

  /** The scrolling strip. Markup uses .rail__track; the attribute is a fallback. */
  function trackIn(rail) {
    return rail && rail.querySelector(".rail__track, [data-rail-track]");
  }

  function isTrack(node) {
    return Boolean(node && node.matches && node.matches(".rail__track, [data-rail-track]"));
  }

  function syncRail(rail) {
    const track = trackIn(rail);
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth - 2;
    const prev = $("[data-rail-prev]", rail);
    const next = $("[data-rail-next]", rail);
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  }

  function scrollRail(rail, direction) {
    const track = trackIn(rail);
    if (!track) return;
    const first = track.firstElementChild;
    const step = first ? first.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  function initRails() {
    document.addEventListener("click", (event) => {
      const prev = event.target.closest("[data-rail-prev]");
      const next = event.target.closest("[data-rail-next]");
      if (prev) {
        scrollRail(railFor(prev), -1);
        return;
      }
      if (next) scrollRail(railFor(next), 1);
    });

    document.addEventListener(
      "scroll",
      (event) => {
        if (!isTrack(event.target)) return;
        syncRail(railFor(event.target));
      },
      { passive: true, capture: true }
    );

    window.addEventListener("resize", () => $$("[data-rail], .rail").forEach(syncRail));
  }

  /* --- review "Read more" ------------------------------------------------ */
  function initReadMore() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".js-read-more, .js-readmore");
      if (!button) return;

      const card = button.closest(".review-card");
      if (!card) return;

      const open = card.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Show less" : "Read more";
    });
  }

  /* --- API key status bar ------------------------------------------------ */
  function keyConfigured() {
    if (!api) return false;
    try {
      if (window.localStorage.getItem(keys.key)) return true;
    } catch (_) {
      /* fall through to config */
    }
    const cfg = CR.config || {};
    return Boolean(cfg.apiKey || cfg.bearer);
  }

  function askForKey() {
    const entered = window.prompt(
      "Paste your TMDB API key (v3).\n\nIt is stored in this browser only, under localStorage, " +
        "and is sent nowhere except api.themoviedb.org.\n\nCancel to leave things as they are.",
      ""
    );
    if (entered === null) return;

    const value = String(entered).trim();
    if (!value) {
      toast("Key unchanged");
      return;
    }

    try {
      window.localStorage.setItem(keys.key, value);
    } catch (_) {
      /* api.setKey handles the guarded write for us */
    }
    if (api) api.setKey(value);
    toast("Key saved — reloading");
    window.setTimeout(() => window.location.reload(), 700);
  }

  function renderKeyBar() {
    const main = $("#main");
    if (!main || keyConfigured()) return;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem("cr.keybar.dismissed") === "1";
    } catch (_) {
      /* ignore */
    }
    if (dismissed) return;

    const bar = document.createElement("div");
    bar.className = "wrap section--tight";
    bar.style.paddingBlock = "1rem 0";
    bar.innerHTML =
      '<div class="empty" style="padding:1.1rem 1.25rem;gap:0.6rem">' +
        '<p class="empty__text" style="display:flex;align-items:center;gap:0.6rem;margin:0">' +
          icon("key") +
          "<span><strong>Showing the bundled catalogue.</strong> Add a free TMDB key to load " +
          "live titles, ratings and cast.</span>" +
        "</p>" +
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap">' +
          '<button class="btn btn--sm btn--primary js-retry" type="button" data-action="set-key">Set key</button>' +
          '<button class="btn btn--sm btn--ghost" type="button" data-dismiss-key>Not now</button>' +
        "</div>" +
      "</div>";

    main.insertBefore(bar, main.firstChild);

    bar.addEventListener("click", (event) => {
      if (!event.target.closest("[data-dismiss-key]")) return;
      bar.remove();
      try {
        window.localStorage.setItem("cr.keybar.dismissed", "1");
      } catch (_) {
        /* ignore */
      }
    });
  }

  /* --- error recovery ---------------------------------------------------- */
  function initRecovery() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".js-retry");
      if (!button) return;
      if (button.getAttribute("data-action") === "set-key") {
        askForKey();
        return;
      }
      // Re-run whatever the page last attempted; pages listen for this.
      document.dispatchEvent(new CustomEvent("cr:retry"));
    });
  }

  /* =========================================================================
     9. DOM HELPERS
  ========================================================================== */
  function mount(target, html) {
    const el = typeof target === "string" ? $(target) : target;
    if (!el) return null;
    el.innerHTML = html;
    revealIn(el);
    return el;
  }

  function refresh(root) {
    revealIn(root);
    $$("[data-rail], .rail").forEach(syncRail);
  }

  /* =========================================================================
     10. PAGES
     One entry point per page, dispatched off <body data-page>.
  ========================================================================== */
  const pages = {};

  /* --- Home -------------------------------------------------------------- */
  /**
   * Fills the slots the Home markup declares: #hero, #scoreboard,
   * #rail-trending, #home-reviews, #rail-latest, #rail-top.
   */
  async function pageHome() {
    const heroSlot = $("#hero");
    const trending = $("#rail-trending");
    const latest = $("#rail-latest");
    const top = $("#rail-top");
    const reviewSlot = $("#home-reviews");

    const featured = reviews ? reviews.featured() : null;
    const featuredId = featured && featured.tmdbId;

    /* Skeletons first, so nothing jumps when real data lands. */
    if (trending) trending.innerHTML = skeletonRow(6);
    if (latest) latest.innerHTML = skeletonRow(6);
    if (top) top.innerHTML = skeletonRow(5);
    renderScoreboard();

    /* Latest reviews are ours, so they never wait on the network. */
    if (reviewSlot) {
      reviewSlot.innerHTML = reviewGrid(6, { bare: true });
    }

    const live = Boolean(api && api.ready());

    if (!live) {
      /* Same fallback the rails below use: the bundled catalogue. Handing the
         hero a null left the biggest block on the page blank whenever there
         was no key, which is exactly the state a first-time visitor is in. */
      renderHero(data.featured());
      fillRail(trending, data.trending(12));
      fillRail(latest, data.justReleased(12));
      fillRail(top, data.topRated(10), { rank: true });
      refresh(document);
      return;
    }

    /* Hero: our editorial pick, rendered with real TMDB artwork and metadata. */
    try {
      if (featuredId) renderHero(await api.getMovieDetail(featuredId));
      else throw new api.ApiError("NO_KEY", "No featured review available.");
    } catch (err) {
      if (err.kind !== "ABORT") {
        renderHero(data.featured());
        if (err.kind !== "NO_KEY" && heroSlot) {
          console.warn("[CineReview] hero:", err.kind, err.message);
        }
      }
    }

    /* Each rail is independent: one failing endpoint must not blank the page. */
    const jobs = [
      api.getPopular(1).then((r) => fillRail(trending, r.movies)).catch((err) => {
        fillRail(trending, data.trending(12));
        warn("trending", err);
      }),
      api.getNowPlaying(1).then((r) => fillRail(latest, r.movies)).catch((err) => {
        fillRail(latest, data.justReleased(12));
        warn("latest", err);
      }),
      api.getTopRated(1).then((r) => fillRail(top, r.movies, { rank: true })).catch((err) => {
        fillRail(top, data.topRated(10), { rank: true });
        warn("top", err);
      })
    ];

    await Promise.all(jobs);
    refresh(document);
  }

  /** Library statistics. Always available, because they come from the dataset. */
  function renderScoreboard() {
    const slot = $("#scoreboard");
    if (!slot || !data.movies.length) return;

    const list = data.movies;
    const avg = list.reduce((sum, m) => sum + m.rating, 0) / list.length;
    const best = data.topRated(1)[0];
    const totalRatings = list.reduce((sum, m) => sum + (m.reviewCount || 0), 0);

    const tiers = (data.scoreTiers || []).map((tier) => {
      const inTier = list.filter((m) => m.rating >= tier.min && m.rating <= tier.max).length;
      const pct = Math.round((inTier / list.length) * 100);
      return (
        '<div class="score-row score-row--tier">' +
          '<div class="score-row__label"><span>' + esc(tier.label) + "</span>" +
            '<span class="score-row__value">' + inTier + "</span></div>" +
          '<div class="score-row__bar"><div class="score-row__fill" style="width:' + pct + '%"></div></div>' +
        "</div>"
      );
    });

    slot.innerHTML =
      '<div class="scoreboard__head">' +
        '<span class="section__kicker">The library</span>' +
        '<h3 class="scoreboard__title">' + list.length + " films, reviewed properly</h3>" +
      "</div>" +
      '<div class="scoreboard__avg">' +
        '<span class="stat__value stat__value--gold">' + avg.toFixed(1) + "</span>" +
        '<span class="stat__label">Average score</span>' +
      "</div>" +
      '<div class="scoreboard__rows">' + tiers.join("") + "</div>" +
      '<div class="scoreboard__foot">' +
        (best
          ? "<span>Highest rated: " + esc(best.title) + " (" + esc(best.rating) + ")</span>"
          : "") +
        "<span>" + totalRatings.toLocaleString() + " ratings logged</span>" +
      "</div>";
  }

  function renderHero(record) {
    const slot = $("#hero");
    if (!slot) return;
    slot.innerHTML = hero(record);
  }

  function fillRail(track, records, options) {
    if (!track) return;
    const body = railCards(records, options);
    track.innerHTML = body || '<p class="section__note">Nothing to show here yet.</p>';
    syncRail(railFor(track));
  }

  function warn(section, err) {
    if (!err || err.kind === "NO_KEY" || err.kind === "ABORT") return;
    console.warn("[CineReview] " + section + ":", err.kind, err.message);
  }

  pages.home = pageHome;

  /* =========================================================================
     11. MOVIE DETAILS PAGE
     --------------------------------------------------------------------------
     ?id= accepts both id schemes, because both are already in circulation: a
     numeric TMDB id from every live card, and one of our slugs from the
     bundled catalogue.

     The page paints from whichever source answers first. For our own 28 that
     means the bundled record renders immediately and TMDB's richer detail
     (cast, certification, recommendations) replaces it a moment later, so the
     page is never blank and never blocks on the network. For a film outside
     the library there is nothing local to show, so it is one request with a
     distinct error state behind it.

     Our review is never overwritten by live data: reviews.forMovie(tmdbId) is
     looked up for every record, live or bundled, which is what keeps a TMDB
     8.4 from being presented as our opinion.
     ========================================================================= */

  /** Resolve ?id= into whichever records we can find for it. */
  function readDetailsId() {
    let raw = "";
    try {
      raw = String(new URLSearchParams(window.location.search || "").get("id") || "").trim();
    } catch (_) {
      raw = "";
    }

    const bundled = data.byId(raw);
    const numeric = /^\d+$/.test(raw) ? raw : "";
    const review = bundled && reviews ? reviews.forSlug(bundled.id) : null;

    return {
      raw: raw,
      bundled: bundled,
      /* A slug resolves through the editorial map, which carries the TMDB id. */
      tmdbId: numeric || (review && review.tmdbId ? String(review.tmdbId) : "")
    };
  }

  function detailFallbackPoster() {
    return api ? api.fallbackPoster() : "images/poster-placeholder.svg";
  }

  function detailFallbackBackdrop() {
    return api ? api.fallbackBackdrop() : "images/backdrop-placeholder.svg";
  }

  /** The score panel: one big number, then the star distribution behind it. */
  function detailScorePanel(movie) {
    const ours = movie.score != null;
    const score = ours ? movie.score : movie.rating;
    if (!score) return "";

    const label = ours ? "CineReview score" : "TMDB score";
    const breakdown = movie.breakdown;
    const total = breakdown
      ? Object.keys(breakdown).reduce((sum, k) => sum + Number(breakdown[k] || 0), 0)
      : 0;

    const rows = breakdown
      ? [5, 4, 3, 2, 1]
          .map((star) => {
            const n = Number(breakdown[star] || 0);
            const pct = total ? Math.round((n / total) * 100) : 0;
            return (
              '<div class="score-row">' +
                '<div class="score-row__label">' +
                  "<span>" + star + (star === 1 ? " star" : " stars") + "</span>" +
                  '<span class="score-row__value">' + n.toLocaleString() + "</span>" +
                "</div>" +
                '<div class="score-row__bar"><div class="score-row__fill" style="width:' + pct + '%"></div></div>' +
              "</div>"
            );
          })
          .join("")
      : "";

    const votes = [];
    if (movie.reviewCount) votes.push(movie.reviewCount.toLocaleString() + " ratings logged");
    if (ours && movie.rating) votes.push("TMDB scores it " + movie.rating.toFixed(1));

    return (
      '<div class="score-panel">' +
        '<div class="score-panel__ring" style="--pct:' + Math.round((score / 10) * 100) + '">' +
          '<div class="score-panel__score">' +
            "<strong>" + Number(score).toFixed(1) + "</strong>" +
            "<span>out of 10</span>" +
          "</div>" +
        "</div>" +
        '<div class="score-panel__body">' +
          '<h2 class="score-panel__title">' + esc(label) + "</h2>" +
          '<p class="score-panel__votes">' +
            esc(votes.join(" · ") || (ours ? "Our verdict on the film." : "Scored by TMDB.")) +
          "</p>" +
          (rows ? '<div class="score-panel__rows">' + rows + "</div>" : "") +
        "</div>" +
      "</div>"
    );
  }

  /** Our review, in full, attributed. */
  function detailReviewBlock(review) {
    if (!review) return "";

    return (
      '<section class="detail__section">' +
        '<div class="review-block">' +
          '<div class="review-block__head">' +
            criticAvatar(review.critic) +
            '<div class="review-block__by">' +
              '<p class="review-block__name">' + esc(review.critic.name) + "</p>" +
              '<p class="review-block__role">' + esc(review.critic.role) + "</p>" +
            "</div>" +
            '<span class="rating-pill" title="CineReview score">' +
              Number(review.score).toFixed(1) + "<small>/10</small></span>" +
          "</div>" +
          '<h2 class="review-block__title">' + esc(review.title) + "</h2>" +
          '<div class="review-block__body">' +
            (review.body || []).map((p) => "<p>" + esc(p) + "</p>").join("") +
          "</div>" +
          (review.quote
            ? "<blockquote>" + esc(review.quote) + "</blockquote>"
            : "") +
          '<div class="review-block__foot">' +
            "<span>Reviewed " + esc(data.formatDate(review.date)) + "</span>" +
            '<span>CineReview</span>' +
          "</div>" +
        "</div>" +
      "</section>"
    );
  }

  /** Facts table. Only shows what we actually know for this record. */
  function detailFacts(movie) {
    const raw = movie.raw || {};
    const rows = [];

    const add = (label, value) => {
      if (value !== null && value !== undefined && value !== "") rows.push([label, value]);
    };

    add("Director", movie.director);
    add("Release", movie.releaseDate || movie.year);
    add("Runtime", movie.runtime ? data.runtimeLabel(movie.runtime) : null);
    add("Certificate", movie.rated);
    add("Genres", movie.genres.join(", ") || null);
    add("CineReview score", movie.score != null ? Number(movie.score).toFixed(1) : null);
    add("TMDB score", movie.rating ? Number(movie.rating).toFixed(1) : null);
    add("Critic score", raw.criticScore != null ? raw.criticScore + " / 100" : null);

    if (movie.tmdbId) {
      rows.push([
        "TMDB id",
        '<a href="https://www.themoviedb.org/movie/' + encodeURIComponent(movie.tmdbId) +
          '" target="_blank" rel="noopener noreferrer">' + esc(movie.tmdbId) + "</a>"
      ]);
    }

    if (!rows.length) return "";

    return (
      '<section class="detail__section">' +
        '<div class="facts">' +
          rows
            .map(
              (r) =>
                '<div class="fact">' +
                  '<p class="fact__label">' + esc(r[0]) + "</p>" +
                  '<p class="fact__value">' + (r[0] === "TMDB id" ? r[1] : esc(r[1])) + "</p>" +
                "</div>"
            )
            .join("") +
        "</div>" +
      "</section>"
    );
  }

  /** Cast strip, with initials for anyone TMDB has no headshot for. */
  function detailCast(movie) {
    const cast = (movie.cast || []).slice(0, 12);
    if (!cast.length) return "";

    return (
      '<section class="detail__section">' +
        '<h2 class="section__title section__title--sm">Cast</h2>' +
        '<ul class="cast">' +
          cast
            .map(
              (person) =>
                '<li class="cast__item">' +
                  (person.profile
                    ? /* A TMDB profile URL can 404: the person left the public
                         database, or the path was reissued. The initials circle
                         is already this component's no-photo state, so a dead
                         URL is swapped for it rather than left as a broken
                         frame - a poster placeholder in a 40px round frame
                         would look wrong as well as broken. */
                      artworkImg({
                        className: "cast__photo",
                        src: person.profile,
                        loading: "lazy",
                        decoding: "async",
                        onFail:
                          "this.onerror=null;var s=document.createElement('span');" +
                          "s.className='cast__photo';s.setAttribute('aria-hidden','true');" +
                          "s.textContent=this.dataset.initials||'';this.replaceWith(s)",
                        data: { initials: initialsOf(person.name) }
                      }) +
                      '<span class="sr-only">' + esc(person.name) + "</span>"
                    : '<span class="cast__photo" aria-hidden="true">' +
                      esc(initialsOf(person.name)) + "</span>") +
                  '<p class="cast__name">' + esc(person.name) + "</p>" +
                  (person.character
                    ? '<p class="cast__role">' + esc(person.character) + "</p>"
                    : "") +
                "</li>"
            )
            .join("") +
        "</ul>" +
      "</section>"
    );
  }

  /**
   * Related titles. For a film we have reviewed, the honest recommendation set is
   * the rest of our own library, scored on shared genre, director and cast by
   * data.related(). For anything else, TMDB's own recommendations are all there
   * is — and the heading says so rather than implying we chose them.
   */
  function detailRelated(movie) {
    let records = [];
    let kicker = "You might also like";
    let note = "Picked from our library by shared genre, director and cast.";

    /* Keyed on whether we have reviewed the film, not on which source is
       current: a reviewed film always gets our own library, even after the live
       swap, because every card there leads to something we actually wrote. */
    if (movie.review && movie.bundled) {
      records = data.related(movie.bundled, 8);
    } else {
      const raw = movie.raw || {};
      records = (raw.recommendations || []).concat(raw.similar || []);
      kicker = "Recommended by TMDB";
      note = "Films TMDB suggests alongside this one. We have not reviewed them.";
    }

    if (!records.length) return "";

    /* TMDB will happily recommend a film we have already reviewed. Drop those
       rather than showing a bare TMDB card for something the library above can
       link to properly. */
    const seen = {};
    records = records.filter((record) => {
      const adapted = adapt(record);
      if (!adapted) return false;
      const id = adapted.storeId;
      if (seen[id]) return false;
      seen[id] = true;
      return true;
    }).slice(0, 8);

    return (
      '<section class="detail__section">' +
        '<div class="section__head">' +
          "<div>" +
            '<span class="section__kicker">' + esc(kicker) + "</span>" +
            '<h2 class="section__title">Related movies</h2>' +
            '<p class="section__note">' + esc(note) + "</p>" +
          "</div>" +
          '<a class="section__link" href="movies.html">See all movies</a>' +
        "</div>" +
        '<div class="rail" data-rail>' +
          '<div class="rail__track">' + railCards(records) + "</div>" +
          '<div class="rail__nav">' +
            '<button class="rail__btn" type="button" data-rail-prev aria-label="Scroll left">' +
              icon("chevronLeft") + "</button>" +
            '<button class="rail__btn" type="button" data-rail-next aria-label="Scroll right">' +
              icon("chevronRight") + "</button>" +
          "</div>" +
        "</div>" +
      "</section>"
    );
  }

  

  /**
   * Genre chips that link into the Movies page filter.
   *
   * TMDB names genres its own way — "Science Fiction", not our "Sci-Fi" — and a
   * chip carrying a name the filter does not recognise is a dead link that lands
   * on an empty grid. So a genre is only linked when the library actually has
   * one by that name, matched either directly or through api.GENRE_ALIASES;
   * anything else is shown as plain text rather than as a link that goes nowhere.
   */
  function detailGenreChips(movie) {
    const known = new Set((data.genreIndex() || []).map((g) => g.name));

    return movie.genres
      .map((genre) => {
        const ours = known.has(genre)
          ? genre
          : Object.keys(api && api.GENRE_ALIASES ? api.GENRE_ALIASES : {}).find(
              (alias) => api.GENRE_ALIASES[alias] === genre
            ) || "";

        return ours
          ? '<a class="chip" href="movies.html?genre=' + encodeURIComponent(ours) + '">' +
              esc(ours) + "</a>"
          : '<span class="chip chip--static">' + esc(genre) + "</span>";
      })
      .join("");
  }

  /** Everything above, in page order. */
  function detailMarkup(movie) {
    const review = movie.review;
    const poster = detailFallbackPoster();
    const backdrop = detailFallbackBackdrop();

    const meta = [];
    if (movie.year) meta.push("<span>" + esc(movie.year) + "</span>");
    if (movie.runtime) meta.push("<span>" + esc(data.runtimeLabel(movie.runtime)) + "</span>");
    if (movie.rated) meta.push(badge(movie.rated, "cert"));
    if (movie.director) meta.push("<span>" + esc(movie.director) + "</span>");

    const unreviewed =
      '<section class="detail__section prose">' +
        "<h2>Our verdict</h2>" +
        "<p>We have not reviewed this film yet. Everything else on this page comes from TMDB. " +
        'Tell us what you thought — <a href="movies.html">browse what we have covered</a>.</p>' +
      "</section>";

    return (
      '<nav class="crumbs" aria-label="Breadcrumb">' +
        '<a href="index.html">Home</a><span aria-hidden="true">/</span>' +
        '<a href="movies.html">Movies</a><span aria-hidden="true">/</span>' +
        "<span>" + esc(movie.title) + "</span>" +
      "</nav>" +

      '<div class="detail__banner"' +
        (movie.accent ? ' style="--film-accent:' + esc(movie.accent) + '"' : "") + ">" +
        artworkImg({
          src: movie.backdrop,
          local: movie.backdropLocal,
          fallback: backdrop,
          decoding: "async",
          fetchpriority: "high"
        }) +
      "</div>" +
      '<div class="detail__scrim" aria-hidden="true"></div>' +

      '<div class="detail__layout">' +
        "<div>" +
          '<div class="detail__poster">' +
            artworkImg({
              src: movie.poster,
              local: movie.posterLocal,
              fallback: poster,
              alt: "Poster for " + movie.title,
              width: 300,
              height: 450,
              decoding: "async"
            }) +
          "</div>" +
          '<div class="detail__side">' +
            detailFacts(movie) +
          "</div>" +
        "</div>" +

        "<div>" +
          "<h1 class='detail__title'>" + esc(movie.title) + "</h1>" +
          (movie.tagline ? '<p class="detail__tagline">' + esc(movie.tagline) + "</p>" : "") +
          (meta.length ? '<div class="detail__meta">' + meta.join("") + "</div>" : "") +
          (movie.genres.length
            ? '<div class="detail__genres">' + detailGenreChips(movie) + "</div>"
            : "") +

          detailScorePanel(movie) +

          '<section class="detail__section prose">' +
            "<h2>Overview</h2>" +
            "<p>" + esc(movie.overview || "TMDB has not published a synopsis for this title.") + "</p>" +
          "</section>" +

          (review ? detailReviewBlock(review) : unreviewed) +
          (movie.pros.length || movie.cons.length ? detailProsCons(movie) : "") +
          detailCast(movie) +
          detailRelated(movie) +
        "</div>" +
      "</div>"
    );
  }

  function detailProsCons(movie) {
    const block = proConList(movie.pros, movie.cons);
    if (!block) return "";
    return '<section class="detail__section">' + block + "</section>";
  }

  /** Mount a complete detail page. */
  function renderDetail(record) {
    const slot = $("#detail-root");
    if (!slot) return null;

    const movie = record && record.key ? record : adapt(record);
    if (!movie) return null;

    document.title = movie.title + " — CineReview";
    slot.innerHTML = '<div class="wrap">' + detailMarkup(movie) + "</div>";
    refresh(slot);
    return movie;
  }

  /** A missing, malformed or unknown id. Never a blank page. */
  function renderDetailMissing(reason, hint) {
    const slot = $("#detail-root");
    if (!slot) return;

    document.title = "Movie not found — CineReview";
    slot.innerHTML =
      '<div class="wrap">' +
        '<div class="page-error">' +
          '<span class="page-error__code">404</span>' +
          '<h1 class="page-head__title">We could not find that film</h1>' +
          '<p class="muted">' + esc(reason) + "</p>" +
          (hint ? '<p class="section__note">' + esc(hint) + "</p>" : "") +
          '<div class="form__actions">' +
            '<a class="btn btn--primary" href="movies.html">Browse all movies</a>' +
            '<a class="btn btn--ghost" href="index.html">Back home</a>' +
          "</div>" +
        "</div>" +
      "</div>";
  }

  /**
   * Swap in the richer live record for a film we already painted from the
   * bundled catalogue: real poster and backdrop, certification, cast headshots.
   *
   * This re-renders rather than patching three nodes, because the live record
   * also changes what the page is allowed to say — cast, runtime, certification
   * — and a partial patch would leave the page internally inconsistent. The
   * review itself is re-attached by adapt() from the same TMDB id, so nothing
   * editorial is lost, and scroll position is carried across.
   */
  function enrichDetail(live) {
    const y = window.scrollY;
    const movie = renderDetail(live);
    if (movie) window.scrollTo(0, y);
    return movie;
  }

  async function pageDetails() {
    const slot = $("#detail-root");
    if (!slot) return;

    const target = readDetailsId();

    /* No id at all: say so plainly rather than silently loading the hero. */
    if (!target.raw) {
      renderDetailMissing(
        "That link did not include a film to show.",
        "Every card on the site links to movie-details.html?id=… — try browsing the library instead."
      );
      return;
    }

    /* Our own film: paint from the bundled record straight away. */
    if (target.bundled) renderDetail(target.bundled);

    const live = Boolean(api && api.ready() && target.tmdbId);

    /* A film outside the library has nothing local to show, so wait for TMDB. */
    if (!live) {
      if (!target.bundled) {
        renderDetailMissing(
          "We have no record of “" + target.raw + "” in our library.",
          api && !api.ready()
            ? "Add a TMDB API key and this page will load any film TMDB knows about."
            : "It may have been listed under a different title or year."
        );
      }
      return;
    }

    if (!target.bundled) {
      slot.innerHTML =
        '<div class="wrap"><div class="stack">' +
        '<div class="detail__layout"><div>' +
        '<div class="detail__poster"><div class="skeleton skeleton--poster"></div></div>' +
        "</div><div>" +
        '<div class="skeleton skeleton--line is-medium"></div>' +
        '<div class="skeleton skeleton--line"></div>' +
        '<div class="skeleton skeleton--line is-short"></div>' +
        "</div></div></div>";
    }

    try {
      const detail = await api.getMovieDetail(target.tmdbId);

      /* Guard against a slow response landing after the visitor has moved on. */
      if (!document.body.contains(slot)) return;

      if (target.bundled) enrichDetail(detail);
      else renderDetail(detail);
    } catch (err) {
      if (err.kind === "ABORT") return;

      if (target.bundled) {
        /* The bundled film is on screen and correct; only the extras are lost,
           and saying so is better than replacing a good page with an error. */
        warn("details", err);
        toast("Live details unavailable — showing the bundled record", "info");
        return;
      }

      slot.innerHTML =
        '<div class="wrap">' +
          errorState(err, { retryHref: err.kind === "NOT_FOUND" ? "movies.html" : null }) +
        "</div>";
    }
  }

  pages.details = pageDetails;

  /* --- pages still to be built in later phases ---------------------------- */
  /* Each is a real entry point so the dispatch below is wired for all five
     pages from day one; the bodies arrive in the Reviews / About phases. */

  /* =========================================================================
     12. MOVIES PAGE
     --------------------------------------------------------------------------
     The catalogue is searched and filtered locally over the bundled dataset,
     not paged from TMDB. Three reasons, in order of weight:

       1. Our reviews are the product. A grid of 20 TMDB titles with no
          CineReview score on any of them is a worse page than 12 films we
          have actually written about.
       2. Every filter here — score tiers, runtime, our own sort keys — has no
          TMDB equivalent. /discover/movie cannot filter by "our score tier",
          so a server-side grid would silently drop the controls the markup
          already declares.
       3. Latency. Local filtering is instant and works offline; a remote
          search round-trips on every keystroke.

     Where TMDB earns its place on this page is the query itself: when a search
     matches little or nothing in our library, we ask TMDB too and label those
     results as coming from TMDB rather than pretending we reviewed them.
     Filter state lives in the URL, so a filtered grid is linkable and the
     Back button works.
     ========================================================================= */

  const moviesState = {
    q: "",
    genres: [],        // our genre names, not ids
    tier: "",          // a SCORE_TIERS id, "" for no tier filter
    year: "",          // "" for every year
    sort: "rating",
    limit: 12,         // how many are rendered; "Load more" raises it
    remote: [],        // TMDB results appended when the library comes up thin
    remoteNote: ""
  };

  /**
   * The single filter predicate for the library.
   *
   * The query is searched first (so "nolan" matches the director) and the
   * facet filters then narrow that result, so "Sci-Fi" narrows to the genre.
   * Genres are ANDed: choosing Drama and Thriller means films that are both,
   * which is what people expect from stacked chips.
   */
  function passesFilters(movie) {
    const s = moviesState;

    if (s.year && String(movie.year) !== String(s.year)) return false;
    if (s.genres.length && !s.genres.every((g) => movie.genres.indexOf(g) !== -1)) return false;

    if (s.tier) {
      const band = (data.scoreTiers || []).find((t) => t.id === String(s.tier));
      if (band && (movie.rating < band.min || movie.rating > band.max)) return false;
    }
    return true;
  }

  /** Library records matching the current query and filters. */
  function libraryMatches() {
    return (moviesState.q ? data.search(moviesState.q) : data.movies).filter(passesFilters);
  }

  /** Everything the grid should show right now, sorted, ready to render. */
  function currentResults() {
    const s = moviesState;
    const local = sortMovies(movies(libraryMatches()), s.sort).slice(0, s.limit);
    if (!s.remote.length) return local;
    /* Top up with TMDB results only once the library itself runs out, so the
       reviewed films always occupy the first page. */
    const room = s.limit - local.length;
    return room > 0 ? local.concat(sortMovies(s.remote, s.sort).slice(0, room)) : local;
  }

  function totalMatchCount() {
    return libraryMatches().length + moviesState.remote.length;
  }

  /** Filter chips, built once from the dataset so they can never drift from it. */
  function paintFilters() {
    const genreSlot = $("#filter-genres");
    if (genreSlot && !genreSlot.childElementCount) {
      genreSlot.innerHTML = data
        .genreIndex()
        .map(
          (g) =>
            '<button class="filter-chip" type="button" data-genre="' + esc(g.name) + '" aria-pressed="false">' +
            esc(g.name) +
            '<span class="chip__count">' + g.count + "</span>" +
            "</button>"
        )
        .join("");
    }

    const tierSlot = $("#filter-tiers");
    if (tierSlot && !tierSlot.childElementCount) {
      tierSlot.innerHTML = (data.scoreTiers || [])
        .map((tier) => {
          const count = data.movies.filter((m) => m.rating >= tier.min && m.rating <= tier.max).length;
          return (
            '<button class="filter-chip" type="button" data-tier="' + esc(tier.id) + '" ' +
            'aria-pressed="false" title="' + esc(tier.hint) + '">' +
            esc(tier.label) +
            '<span class="chip__count">' + count + "</span>" +
            "</button>"
          );
        })
        .join("");
    }

    const yearSlot = $("#filter-year");
    if (yearSlot && !yearSlot.childElementCount) {
      yearSlot.innerHTML =
        '<option value="">Any year</option>' +
        data
          .yearIndex()
          .map((y) => '<option value="' + esc(y) + '">' + esc(y) + "</option>")
          .join("");
    }
  }

  /** Reflect state on the controls, so URL and UI can never disagree. */
  function syncControls() {
    const s = moviesState;
    const search = $("#search");
    if (search && search.value !== s.q) search.value = s.q;
    if (search) search.parentElement.classList.toggle("search--filled", Boolean(s.q));

    const sort = $("#sort");
    if (sort && sort.value !== s.sort) sort.value = s.sort;

    const year = $("#filter-year");
    if (year && String(year.value) !== String(s.year)) year.value = s.year;

    $$("#filter-genres [data-genre]").forEach((chip) =>
      chip.setAttribute("aria-pressed", String(s.genres.indexOf(chip.getAttribute("data-genre")) !== -1))
    );
    $$("#filter-tiers [data-tier]").forEach((chip) =>
      chip.setAttribute("aria-pressed", String(chip.getAttribute("data-tier") === s.tier))
    );

    paintActiveFilters();
  }

  /** The dismissible summary of everything currently narrowing the grid. */
  function paintActiveFilters() {
    const slot = $("#active-filters");
    if (!slot) return;
    const s = moviesState;

    const chips = [];
    if (s.q) chips.push({ key: "q", label: "“" + s.q + "”" });
    s.genres.forEach((g) => chips.push({ key: "g:" + g, label: g }));
    if (s.tier) {
      const band = (data.scoreTiers || []).find((t) => t.id === String(s.tier));
      if (band) chips.push({ key: "tier", label: band.label });
    }
    if (s.year) chips.push({ key: "year", label: s.year });

    if (!chips.length) {
      slot.style.display = "none";
      slot.innerHTML = "";
      return;
    }

    slot.style.display = "flex";
    slot.innerHTML = chips
      .map(
        (chip) =>
          '<span class="active-filter">' + esc(chip.label) +
          '<button type="button" data-drop="' + esc(chip.key) + '" ' +
          'aria-label="Remove the ' + esc(chip.label) + ' filter">&times;</button>' +
          "</span>"
      )
      .join("");
  }

  /** Serialize the filters into the query string, skipping the defaults. */
  function moviesQuery() {
    const s = moviesState;
    const params = [];
    if (s.q) params.push("q=" + encodeURIComponent(s.q));
    if (s.genres.length) params.push("genre=" + encodeURIComponent(s.genres.join(",")));
    if (s.tier) params.push("tier=" + encodeURIComponent(s.tier));
    if (s.year) params.push("year=" + encodeURIComponent(s.year));
    if (s.sort !== "rating") params.push("sort=" + encodeURIComponent(s.sort));
    return params.join("&");
  }

  function readMoviesUrl() {
    const s = moviesState;
    s.q = "";
    s.genres = [];
    s.tier = "";
    s.year = "";
    s.sort = "rating";

    const params = new URLSearchParams(window.location.search || "");
    s.q = (params.get("q") || "").trim();

    /* Only accept genres the dataset actually has, so a hand-edited URL cannot
       filter the whole grid away with a typo. */
    const known = new Set(data.genreIndex().map((g) => g.name));
    (params.get("genre") || "")
      .split(",")
      .map((g) => g.trim())
      .filter((g) => known.has(g))
      .forEach((g) => s.genres.push(g));

    const tier = params.get("tier");
    if (tier && (data.scoreTiers || []).some((t) => t.id === String(tier))) s.tier = String(tier);

    const year = params.get("year");
    if (year && data.yearIndex().indexOf(Number(year)) !== -1) s.year = String(year);

    const sort = params.get("sort");
    if (sort && SORTS[sort]) s.sort = sort;
  }

  /**
   * Writes a query string onto the current path, keeping the hash. Shared by
   * every page that keeps filter state in the URL, so history handling is
   * written once and behaves the same on all of them.
   */
  function pushUrl(query, replace) {
    const url = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
    try {
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    } catch (_) {
      /* file:// can refuse history writes; the page still works without them */
    }
  }

  /** Push the filters into the address bar without adding history noise. */
  function writeMoviesUrl(replace) {
    pushUrl(moviesQuery(), replace);
  }

  /**
   * A one-line summary of what the library actually contains, so the static
   * page copy never has to claim a number that can go stale.
   */
  function paintMoviesSummary() {
    const slot = $("#movies-summary");
    if (!slot) return;
    const list = data.movies;
    if (!list.length) {
      slot.textContent = "";
      return;
    }
    const avg = list.reduce((sum, m) => sum + m.rating, 0) / list.length;
    slot.textContent =
      list.length + " films reviewed · " +
      (data.genreIndex().length) + " genres · " +
      "from " + data.yearIndex()[data.yearIndex().length - 1] + " to " + data.yearIndex()[0] +
      " · average score " + avg.toFixed(1);
  }

  function renderMovies() {
    const grid = $("#movie-grid");
    const empty = $("#empty-state");
    const more = $("#load-more-wrap");
    const count = $("#result-count");
    if (!grid) return;

    const list = currentResults();
    const total = totalMatchCount();

    grid.innerHTML = list.length
      ? list.map((m) => card(m)).join("")
      : "";
    if (grid.classList.contains("grid")) grid.classList.toggle("is-empty", !list.length);

    if (empty) empty.hidden = list.length > 0;
    if (more) more.hidden = list.length === 0 || list.length >= total;

    if (count) {
      const noun = total === 1 ? "film" : "films";
      count.innerHTML = total
        ? "<strong>" + total + "</strong> " + noun +
          (moviesState.q ? " for “" + esc(moviesState.q) + "”" : "") +
          /* Saying "28 films" while 12 are on screen would be a lie the reader
             can check; say which is which. */
          (list.length < total ? " — showing " + list.length : "")
        : "No " + noun + " match" + (moviesState.q ? " “" + esc(moviesState.q) + "”" : "");
    }

    if (moviesState.remoteNote) {
      const note = document.createElement("span");
      note.className = "result-count__note";
      note.textContent = moviesState.remoteNote;
      if (count) count.appendChild(note);
    }

    refresh(grid);
    announce(total + (total === 1 ? " film found" : " films found"));
  }

  /**
   * When a query finds almost nothing in the library, ask TMDB as well and
   * append what it has — clearly labelled, because we have not reviewed those.
   */
  /**
   * When a query finds almost nothing in the library, ask TMDB as well and
   * append what it has — clearly labelled, because we have not reviewed those.
   *
   * The dedupe is the fiddly part: a live TMDB record identifies itself by its
   * TMDB id, while a bundled one identifies itself by slug, so comparing the
   * two directly would let Inception appear twice. The editorial map is what
   * bridges them — reviews.forMovie(tmdbId) is the join the whole project uses.
   */
  async function supplementFromTmdb() {
    const s = moviesState;
    s.remote = [];
    s.remoteNote = "";
    if (!s.q || !api || !api.ready()) return;

    if (libraryMatches().length >= 3) return;

    try {
      const result = await api.searchMovies(s.q, 1);

      /* The dedupe is against the WHOLE library, not just this query's matches:
         searching for a director's name often returns films we have reviewed but
         which the text search did not match, and showing the same film twice —
         once with our review, once without — is the exact bug this avoids. */
      const seenSlugs = new Set(data.movies.map((m) => m.id));
      const seenTmdb = new Set();
      data.movies.forEach((m) => {
        const review = reviews ? reviews.forSlug(m.id) : null;
        if (review && review.tmdbId) seenTmdb.add(String(review.tmdbId));
      });

      const extra = movies(result.movies).filter((m) => {
        if (seenSlugs.has(m.id) || seenTmdb.has(String(m.tmdbId))) return false;
        seenTmdb.add(String(m.tmdbId));
        return true;
      });

      if (!extra.length) return;

      /* TMDB gives no runtime or director in a search result, so a "shortest
         first" sort would be meaningless here; fall back to score. */
      s.remote = sortMovies(extra, s.sort === "runtime" ? "rating" : s.sort).slice(0, 6);
      s.remoteNote =
        "Plus " + s.remote.length + " from TMDB, which we have not reviewed yet.";
    } catch (err) {
      warn("movies search", err);
    }
  }

  function resetMovies() {
    const s = moviesState;
    s.q = "";
    s.genres = [];
    s.tier = "";
    s.year = "";
    s.limit = 12;
    s.remote = [];
    s.remoteNote = "";
  }

  async function pageMovies() {
    const grid = $("#movie-grid");
    paintFilters();
    paintMoviesSummary();
    readMoviesUrl();
    syncControls();

    if (grid) grid.innerHTML = skeletonRow(12);

    renderMovies();
    await supplementFromTmdb();
    renderMovies();
  }

  /** Wired once, at boot, so filters keep working across every re-render. */
  function initMovies() {
    paintFilters();
    if ($("#search") === null) return;

    /* A short debounce: filtering 28 films is instant, but the TMDB fallback
       above is not, and it should not fire once per keystroke. */
    let typing = null;
    $("#search").addEventListener("input", (event) => {
      const value = event.target.value;
      event.target.parentElement.classList.toggle("search--filled", Boolean(value));
      moviesState.limit = 12;
      window.clearTimeout(typing);
      typing = window.setTimeout(() => {
        moviesState.q = value.trim();
        moviesState.remote = [];
        writeMoviesUrl(true);
        paintActiveFilters();
        renderMovies();
        supplementFromTmdb().then(renderMovies);
      }, 260);
    });

    $("#search").addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      window.clearTimeout(typing);
      moviesState.q = event.target.value.trim();
      writeMoviesUrl(true);
      renderMovies();
      supplementFromTmdb().then(renderMovies);
    });

    const clear = $("#search-clear");
    if (clear) {
      clear.addEventListener("click", () => {
        window.clearTimeout(typing);
        const input = $("#search");
        input.value = "";
        input.parentElement.classList.remove("search--filled");
        input.focus();
        moviesState.q = "";
        moviesState.remote = [];
        moviesState.limit = 12;
        writeMoviesUrl(true);
        renderMovies();
      });
    }

    /* "/" jumps to the search box, and Escape leaves it again. */
    document.addEventListener("keydown", (event) => {
      const typingElsewhere =
        event.target.matches("input, textarea, select") || event.target.isContentEditable;
      if (event.key === "/" && !typingElsewhere && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        $("#search").focus();
        $("#search").select();
        return;
      }
      if (event.key === "Escape" && event.target === $("#search")) {
        event.target.blur();
      }
    });

    $("#sort").addEventListener("change", (event) => {
      moviesState.sort = event.target.value;
      moviesState.limit = 12;
      writeMoviesUrl();
      renderMovies();
    });

    $("#filter-year").addEventListener("change", (event) => {
      moviesState.year = event.target.value;
      moviesState.limit = 12;
      writeMoviesUrl();
      renderMovies();
    });

    $("#filter-genres").addEventListener("click", (event) => {
      const chip = event.target.closest("[data-genre]");
      if (!chip) return;
      const name = chip.getAttribute("data-genre");
      const at = moviesState.genres.indexOf(name);
      if (at === -1) moviesState.genres.push(name);
      else moviesState.genres.splice(at, 1);
      moviesState.limit = 12;
      syncControls();
      writeMoviesUrl();
      renderMovies();
    });

    $("#filter-tiers").addEventListener("click", (event) => {
      const chip = event.target.closest("[data-tier]");
      if (!chip) return;
      const id = chip.getAttribute("data-tier");
      moviesState.tier = moviesState.tier === id ? "" : id;
      moviesState.limit = 12;
      syncControls();
      writeMoviesUrl();
      renderMovies();
    });

    /* One dismiss control per active filter, rather than a reset-all only. */
    $("#active-filters").addEventListener("click", (event) => {
      const button = event.target.closest("[data-drop]");
      if (!button) return;
      const key = button.getAttribute("data-drop");
      if (key === "q") {
        $("#search").value = "";
        $("#search").parentElement.classList.remove("search--filled");
        moviesState.q = "";
        moviesState.remote = [];
      } else if (key === "tier") moviesState.tier = "";
      else if (key === "year") moviesState.year = "";
      else if (key.indexOf("g:") === 0) {
        const at = moviesState.genres.indexOf(key.slice(2));
        if (at !== -1) moviesState.genres.splice(at, 1);
      }
      moviesState.limit = 12;
      syncControls();
      writeMoviesUrl();
      renderMovies();
    });

    $("#filter-reset").addEventListener("click", () => {
      resetMovies();
      syncControls();
      writeMoviesUrl();
      renderMovies();
    });

    $("#load-more").addEventListener("click", () => {
      moviesState.limit += 12;
      renderMovies();
    });

    /* Back and forward move through filter history. */
    window.addEventListener("popstate", () => {
      readMoviesUrl();
      moviesState.limit = 12;
      moviesState.remote = [];
      syncControls();
      renderMovies();
    });
  }

  pages.movies = pageMovies;

  /* =========================================================================
     13. REVIEWS PAGE
     --------------------------------------------------------------------------
     Every card here is our own copy, so this page renders synchronously from
     js/reviews.js and never waits on the network. TMDB is not consulted at
     all, which is deliberate: the archive is our editorial, and a review with
     a TMDB title beside it would imply we had reviewed a film we have not.

     The filters narrow our reviews, not the catalogue, so they read from the
     review records directly — genre via the bundled film, the score band via
     our own score rather than TMDB's, and the reviewer from the byline. As on
     the Movies page the state lives in the URL, so a filtered archive is
     linkable and the Back button walks filter history.
     ========================================================================= */

  const reviewsState = {
    genre: "",
    tier: "",
    critic: ""
  };

  /** Our reviews joined to the bundled film each one is about. */
  function reviewEntries() {
    if (!reviews) return [];
    return reviews.list().map((review) => ({
      review: review,
      movie: data.byId(review.slug)
    }));
  }

  /**
   * The single predicate for the archive.
   *
   * A review with no bundled film cannot satisfy a genre filter — we have no
   * genre to test against — so it drops out rather than being shown as though
   * it had been checked and passed.
   */
  function passesReviewFilters(entry) {
    const s = reviewsState;

    if (s.critic && entry.review.critic.name !== s.critic) return false;

    if (s.genre) {
      if (!entry.movie || entry.movie.genres.indexOf(s.genre) === -1) return false;
    }

    if (s.tier) {
      const band = (data.scoreTiers || []).find((t) => t.id === s.tier);
      /* Our score is the one the archive is sorted and filtered by. TMDB's
         number lives on the film record and is a different quantity entirely. */
      const score = Number(entry.review.score);
      if (band && (score < band.min || score > band.max)) return false;
    }
    return true;
  }

  function matchingReviews() {
    return reviewEntries().filter(passesReviewFilters);
  }

  /** The option lists, built once from the data so they cannot drift from it. */
  function paintReviewControls() {
    const all = reviewEntries();

    const genreSlot = $("#review-genre");
    if (genreSlot) {
      genreSlot.innerHTML =
        '<option value="">Every genre</option>' +
        data
          .genreIndex()
          .map(
            (g) =>
              '<option value="' + esc(g.name) + '">' + esc(g.name) + "</option>"
          )
          .join("");
    }

    const tierSlot = $("#review-tier");
    if (tierSlot) {
      tierSlot.innerHTML =
        '<option value="">Any score</option>' +
        (data.scoreTiers || [])
          .map((tier) => {
            /* Counts are computed against the whole archive, not the current
               selection, so they stay stable as the reader narrows down. */
            const count = all.filter((entry) => {
              const score = Number(entry.review.score);
              return score >= tier.min && score <= tier.max;
            }).length;
            return (
              '<option value="' + esc(tier.id) + '">' +
              esc(tier.label) + " · " + count +
              "</option>"
            );
          })
          .join("");
    }

    const criticSlot = $("#review-critic");
    if (criticSlot) {
      const names = [];
      all.forEach((entry) => {
        const critic = entry.review.critic;
        if (critic && names.indexOf(critic.name) === -1) names.push(critic.name);
      });
      criticSlot.innerHTML =
        '<option value="">Every reviewer</option>' +
        names
          .map((name) => '<option value="' + esc(name) + '">' + esc(name) + "</option>")
          .join("");
    }
  }

  function syncReviewControls() {
    const s = reviewsState;
    [["#review-genre", s.genre], ["#review-tier", s.tier], ["#review-critic", s.critic]]
      .forEach((pair) => {
        const slot = $(pair[0]);
        /* Assigning a value the <select> does not offer silently blanks it in
           some browsers and leaves the stale one in others, so only write a
           value that is actually present. */
        if (slot && pair[1] && slot.value !== pair[1]) slot.value = pair[1];
        else if (slot) slot.value = pair[1] || "";
      });
  }

  function reviewsQuery() {
    const s = reviewsState;
    const params = [];
    if (s.genre) params.push("genre=" + encodeURIComponent(s.genre));
    if (s.tier) params.push("tier=" + encodeURIComponent(s.tier));
    if (s.critic) params.push("critic=" + encodeURIComponent(s.critic));
    return params.join("&");
  }

  function writeReviewsUrl(replace) {
    pushUrl(reviewsQuery(), replace);
  }

  function readReviewsUrl() {
    const s = reviewsState;
    s.genre = "";
    s.tier = "";
    s.critic = "";

    const params = new URLSearchParams(window.location.search || "");

    /* Only accept values the dataset actually has, so a hand-edited URL cannot
       filter the whole archive away with a typo. Same rule as the Movies page. */
    const genre = params.get("genre");
    if (genre && data.genreIndex().some((g) => g.name === genre)) s.genre = genre;

    const tier = params.get("tier");
    if (tier && (data.scoreTiers || []).some((t) => t.id === tier)) s.tier = tier;

    const critic = params.get("critic");
    if (critic && reviewEntries().some((e) => e.review.critic.name === critic)) s.critic = critic;
  }

  /**
   * The large editor's-pick panel. `.review-feature` is already on the slot in
   * the markup, so this returns only the two children the grid lays out.
   */
  function reviewFeature(review, record) {
    if (!review) return "";
    const movie = record ? adapt(record) : null;
    const href = movie ? detailHref(movie) : "#";
    const fallback = api ? api.fallbackPoster() : "images/poster-placeholder.svg";
    const critic = review.critic;
    const score = Number(review.score);
    const lede = (review.body || []).slice(0, 2).join(" ");

    return (
      '<div class="review-feature__media">' +
        artworkImg({
          src: movie ? movie.poster : null,
          local: movie ? movie.posterLocal : null,
          fallback: fallback,
          decoding: "async"
        }) +
      "</div>" +
      '<div class="review-feature__body">' +
        '<div class="review-feature__head">' +
          criticAvatar(critic) +
          '<div class="review-card__by">' +
            '<div class="review-card__name">' + esc(critic.name) + "</div>" +
            '<div class="review-card__role">' + esc(critic.role) + "</div>" +
          "</div>" +
          stars(score, "CineReview score " + score.toFixed(1) + " out of 10") +
          '<span class="rating-pill" title="CineReview score">' +
            score.toFixed(1) + "<small>/10</small></span>" +
        "</div>" +
        '<h3 class="review-feature__title">' + esc(review.title) + "</h3>" +
        '<a class="review-feature__film" href="' + esc(href) + '">' +
          esc(movie ? movie.title : "The film") +
          (movie && movie.year ? " · " + esc(movie.year) : "") +
        "</a>" +
        '<p>' + escText(lede) + "</p>" +
        (review.quote ? "<blockquote>" + esc(review.quote) + "</blockquote>" : "") +
        '<div class="review-feature__cta">' +
          '<a class="btn btn--primary" href="' + esc(href) + '">' +
            icon("book") + "Read the full review</a>" +
          /* Not a dead end: the archive filters by writer, so this is a real
             action that narrows it to everything else by this critic. */
          '<a class="btn btn--ghost" href="reviews.html?critic=' +
            encodeURIComponent(critic.name) + '">' +
            "More by " + esc(critic.name.split(" ")[0]) + "</a>" +
        "</div>" +
      "</div>"
    );
  }

  /** "Latest reviews" unfiltered; "Animation reviews" when one genre is chosen. */
  function reviewArchiveTitle() {
    const s = reviewsState;
    if (s.genre) return s.genre + " reviews";
    if (s.critic) return "Reviews by " + s.critic.split(" ")[0];
    if (s.tier) {
      const band = (data.scoreTiers || []).find((t) => t.id === s.tier);
      if (band) return band.label + " reviews";
    }
    return "Latest reviews";
  }

  function paintReviewCount(shown, total) {
    const slot = $("#review-count");
    if (!slot) return;
    const noun = total === 1 ? "review" : "reviews";
    slot.innerHTML =
      "<strong>" + total + "</strong> " + noun +
      (total !== shown ? " — showing " + shown : "");

    /* The heading has to move with the filters. "Latest reviews" above a grid
       of eight animation reviews would be describing a page that is not there. */
    const title = $("#all-reviews-title");
    if (title) title.textContent = reviewArchiveTitle();
  }

  function renderReviews() {
    const slot = $("#reviews-latest");
    if (!slot) return;

    const entries = matchingReviews();
    const total = reviews ? reviews.count : 0;

    slot.innerHTML = entries.length
      ? entries.map((entry) => reviewCard(reviewView(entry.review), entry.movie)).join("")
      : emptyState({
          icon: "filter",
          title: "No reviews match those filters",
          text: "Try a different genre, score band or reviewer.",
          actionHref: "reviews.html",
          actionText: "Clear filters"
        });

    paintReviewCount(entries.length, total);
    refresh(slot);
    announce(entries.length + (entries.length === 1 ? " review found" : " reviews found"));
  }

  function resetReviews() {
    reviewsState.genre = "";
    reviewsState.tier = "";
    reviewsState.critic = "";
  }

  /** Wired once, at boot, so the filters keep working across every re-render. */
  function initReviews() {
    if (!$("#review-genre")) return;
    paintReviewControls();
    readReviewsUrl();
    syncReviewControls();

    [["#review-genre", "genre"], ["#review-tier", "tier"], ["#review-critic", "critic"]]
      .forEach((pair) => {
        const slot = $(pair[0]);
        if (!slot) return;
        slot.addEventListener("change", () => {
          reviewsState[pair[1]] = slot.value;
          writeReviewsUrl();
          renderReviews();
        });
      });

    const reset = $("#review-reset");
    if (reset) {
      reset.addEventListener("click", () => {
        resetReviews();
        syncReviewControls();
        writeReviewsUrl();
        renderReviews();
      });
    }

    window.addEventListener("popstate", () => {
      readReviewsUrl();
      syncReviewControls();
      renderReviews();
    });
  }

  function pageReviews() {
    const featured = $("#reviews-featured");
    if (featured && reviews) {
      const top = reviews.featured();
      featured.innerHTML = reviewFeature(reviewView(top), top && data.byId(top.slug));
    }

    renderReviews();
    refresh(document);
  }

  pages.reviews = pageReviews;

  /* =========================================================================
     14. ABOUT PAGE
     --------------------------------------------------------------------------
     Static copy throughout; only the numbers and the bylines are generated, so
     the page cannot quote a figure that has drifted out of the dataset.

     The contact form is the one genuinely interactive part. There is no server
     behind this site, so rather than pretending a message was delivered, a
     valid submission is handed to the visitor's own mail client. The page says
     so above the form; the handler must not then claim otherwise.
     ========================================================================= */

  /** The critics who have actually written something, with their counts. */
  function criticsWithCounts() {
    const counts = new Map();
    if (reviews) {
      reviews.list().forEach((review) => {
        const name = review.critic && review.critic.name;
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      });
    }

    /* Ordered by how much each has actually written, so the busiest writer
       leads — and a critic with no reviews is dropped rather than shown as a
       contributor to a site they have not written for. */
    return (data.critics || [])
      .filter((critic) => counts.get(critic.name))
      .map((critic) => Object.assign({}, critic, { count: counts.get(critic.name) }))
      .sort((a, b) => b.count - a.count);
  }

  function paintAboutPeople() {
    const slot = $("#about-people");
    const people = criticsWithCounts();
    if (!slot || !people.length) return;

    slot.innerHTML = people
      .map(
        (critic) =>
          '<div class="person">' +
            '<span class="avatar">' + esc(critic.initials || initialsOf(critic.name)) + "</span>" +
            "<div>" +
              '<p class="person__name">' + esc(critic.name) + "</p>" +
              '<p class="person__role">' + esc(critic.role) + "</p>" +
              /* A count the reader can check, and a link that lands on the
                 reviews it refers to. */
              '<a class="person__link" href="reviews.html?critic=' +
                encodeURIComponent(critic.name) + '">' +
                critic.count + (critic.count === 1 ? " review" : " reviews") +
              "</a>" +
            "</div>" +
          "</div>"
      )
      .join("");
  }

  function paintAboutStats() {
    const slot = $("#about-stats");
    if (!slot || !data.movies.length) return;

    const ratings = data.movies.reduce((sum, m) => sum + (m.reviewCount || 0), 0);
    const average = data.movies.reduce((sum, m) => sum + m.rating, 0) / data.movies.length;
    const years = data.yearIndex();

    const cells = [
      { value: String(data.movies.length), label: "Films reviewed" },
      { value: String(criticsWithCounts().length), label: "Writers" },
      { value: ratings.toLocaleString(), label: "Ratings logged" },
      { value: average.toFixed(1), label: "Average score" },
      { value: String(years.length ? years[years.length - 1] + "–" + years[0] : "—"), label: "Years covered" }
    ];

    slot.innerHTML = cells
      .map(
        (c) =>
          '<div class="stat-band__cell">' +
            '<span class="stat-band__value">' + esc(c.value) + "</span>" +
            '<span class="stat-band__label">' + esc(c.label) + "</span>" +
          "</div>"
      )
      .join("");
  }

  /* --- the contact form --------------------------------------------------- */

  /** Deliberately permissive: enough to catch a typo, not to judge an address. */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const CONTACT_ADDRESS = "hello@cinereview.example";

  /**
   * Builds the mailto: the form hands off to. Split out from the submit handler
   * so it can be checked on its own — the address, the subject taken from the
   * opening line, and the body all have to come out right.
   */
  function contactMailto(name, email, message) {
    const opening = String(message).split(/[.!?\n]/)[0].trim().slice(0, 60);
    return (
      "mailto:" + CONTACT_ADDRESS +
      "?subject=" + encodeURIComponent("CineReview — " + (opening || "Message")) +
      "&body=" + encodeURIComponent(
        name + " (" + email + ") wrote:\n\n" + message +
          "\n\n— Sent from the CineReview contact form"
      )
    );
  }

  const CONTACT_RULES = {
    name: function (value) {
      if (!value) return "Tell us who you are.";
      if (value.length < 2) return "That looks too short to be a name.";
      return "";
    },
    email: function (value) {
      if (!value) return "We need an address to reply to.";
      if (!EMAIL_PATTERN.test(value)) return "That address is missing an @ or a domain.";
      return "";
    },
    message: function (value) {
      if (!value) return "The message is empty.";
      if (value.length < 10) return "A little more detail would help us answer.";
      return "";
    }
  };

  /** Paint one field's error and mark its input for assistive tech. */
  function paintFieldError(name, message) {
    const input = $("#contact-" + name);
    const slot = $("#contact-" + name + "-error");
    if (slot) slot.textContent = message;
    if (input) {
      input.setAttribute("aria-invalid", message ? "true" : "false");
      input.classList.toggle("is-invalid", Boolean(message));
    }
  }

  function initContactForm() {
    const form = $("#contact-form");
    if (!form || form.getAttribute("data-contact-bound")) return;
    form.setAttribute("data-contact-bound", "1");

    /* Clear a field's complaint as soon as the visitor starts fixing it, so
       the form stops nagging before it has been resubmitted. */
    Object.keys(CONTACT_RULES).forEach((name) => {
      const input = $("#contact-" + name);
      if (input) input.addEventListener("input", () => paintFieldError(name, ""));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let firstBad = null;
      Object.keys(CONTACT_RULES).forEach((name) => {
        const input = $("#contact-" + name);
        const message = CONTACT_RULES[name](input ? input.value.trim() : "");
        paintFieldError(name, message);
        if (message && !firstBad) firstBad = input;
      });

      const status = $("#contact-status");
      if (firstBad) {
        if (status) status.textContent = "Check the highlighted fields.";
        firstBad.focus();
        return;
      }

      const name = $("#contact-name").value.trim();
      const email = $("#contact-email").value.trim();
      const message = $("#contact-message").value.trim();

      /* No backend to post to. Hand the message to the visitor's own mail
         client rather than showing a success message for nothing. */
      window.location.href = contactMailto(name, email, message);
      if (status) status.textContent = "Opening your email client…";
      announce("Opening your email client with your message");
    });
  }

  function pageAbout() {
    paintAboutStats();
    paintAboutPeople();
    initContactForm();
    refresh(document);
  }

  pages.about = pageAbout;

  /* =========================================================================
     15. BOOT
  ========================================================================== */
  function start() {
    /* The markup ships class="no-js" so the stylesheet can hide controls that
       only work with JavaScript (.no-js .js-only). Reaching here means JS ran,
       so the class has to come off — otherwise any element later marked
       js-only stays invisible forever, with nothing on screen to explain why. */
    document.documentElement.classList.remove("no-js");

    initNav();
    initNavSearch();
    initHeader();
    initReveal();
    initRails();
    initReadMore();
    initRecovery();
    initMovies();
    initReviews();
    renderKeyBar();
    refresh(document);

    /* The page is chosen by <body data-page="…">; every page has a module. */
    if (page === "home" && pages.home) pages.home();
    if (page === "movies" && pages.movies) pages.movies();
    if (page === "details" && pages.details) pages.details();
    if (page === "reviews" && pages.reviews) pages.reviews();
    if (page === "about" && pages.about) pages.about();

    /* A "Try again" in any error state re-runs the current page. */
    document.addEventListener("cr:retry", () => {
      if (page === "home" && pages.home) pages.home();
      if (page === "movies" && pages.movies) pages.movies();
      if (page === "details" && pages.details) pages.details();
    });
  }

  /* Expose the shared layer so later phases and page modules can reuse it
     without re-declaring any of this. */
  CR.app = {
    esc: esc,
    escText: escText,
    truncate: truncate,
    icon: icon,
    adapt: adapt,
    movies: movies,
    reviewView: reviewView,
    reviewFor: reviewFor,
    reviewGrid: reviewGrid,
    reviewCard: reviewCard,
    detailHref: detailHref,
    stars: stars,
    ratingPill: ratingPill,
    badge: badge,
    card: card,
    cardGrid: cardGrid,
    railCards: railCards,
    sortMovies: sortMovies,
    shownScore: shownScore,
    hero: hero,
    proConList: proConList,
    skeletonRow: skeletonRow,
    skeletonCard: skeletonCard,
    emptyState: emptyState,
    errorState: errorState,
    ERROR_COPY: ERROR_COPY,
    contactMailto: contactMailto,
    mount: mount,
    refresh: refresh,
    revealIn: revealIn,
    toast: toast,
    announce: announce,
    askForKey: askForKey,
    keyConfigured: keyConfigured,
    keys: keys,
    read: read,
    write: write,
    pages: pages,
    page: page
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
