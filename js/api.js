/* =============================================================================
   CineReview — TMDB client
   -----------------------------------------------------------------------------
   The only module in the project that talks to The Movie Database. Nothing else
   knows what a TMDB payload looks like; every other file receives the flat shape
   produced by normalise() and can therefore also render the bundled dataset.

   Responsibilities, and deliberately nothing more:
     - build and sign requests
     - timeout + abort + retry
     - an in-memory response cache
     - turn failures into a small named taxonomy the UI can render distinctly
     - flatten TMDB's nested payloads

   Credentials. The key is read from localStorage first, then js/config.js, and
   is only ever sent to api.themoviedb.org. It is never written into markup,
   never appended to a URL the user can see, and never logged. A v4 read access
   token is preferred where available because it is read-only by construction.

   Error kinds, so callers can react instead of guessing:
     NO_KEY      no API key configured
     AUTH        401 / invalid key
     RATE_LIMIT  429
     NOT_FOUND   404
     NETWORK     connection failed, offline, or blocked on file://
     SERVER      5xx
     ABORT       superseded by a newer request
     UNKNOWN     anything else
   ========================================================================== */

(function () {
  "use strict";

  const BASE = "https://api.themoviedb.org/3";
  const CDN = "https://image.tmdb.org/t/p";

  /* Cache lifetimes, in ms. Long enough to keep a page of browsing snappy,
     short enough that a new release shows up without a hard refresh. */
  const TTL = { list: 5 * 60 * 1000, detail: 30 * 60 * 1000 };

  const TIMEOUT = 25000;

  /* Default floor for /discover/movie. Measured, not guessed: sorting by
     vote_average with no floor returns films with a single review and a
     perfect 10.0. 300 votes is about where that stops dominating the first
     page. Pass minVotes to override it deliberately. */
  const MIN_VOTES = 300;

  /** Error type carrying a `kind` the UI branches on. */
  class ApiError extends Error {
    constructor(kind, message, detail) {
      super(message || kind);
      this.name = "ApiError";
      this.kind = kind;
      this.detail = detail || null;
    }
  }

  /* -------------------------------------------------------------------------
     Configuration
  ------------------------------------------------------------------------- */
  function settings() {
    return (window.CR && window.CR.config) || {};
  }

  function storageKey() {
    const s = settings();
    return (s.storage && s.storage.apiKey) || "cr.tmdbKey";
  }

  /** Stored key, or null. Wrapped because localStorage throws on file:// in some browsers. */
  function storedKey() {
    try {
      return window.localStorage.getItem(storageKey()) || null;
    } catch (_) {
      return null;
    }
  }

  function storeKey(key) {
    try {
      if (key) window.localStorage.setItem(storageKey(), key);
      else window.localStorage.removeItem(storageKey());
      cache.clear();
      return true;
    } catch (_) {
      return false;
    }
  }

  /** The key in use, or "" when none. Never logged, never rendered. */
  function key() {
    return storedKey() || settings().apiKey || "";
  }

  function bearer() {
    return settings().bearer || "";
  }

  /** True when there is something to sign requests with. */
  function ready() {
    return Boolean(key() || bearer());
  }

  /* -------------------------------------------------------------------------
     Low-level request
  ------------------------------------------------------------------------- */
  const cache = new Map();

  function cacheKey(path, params) {
    const stable = Object.keys(params || {})
      .sort()
      .map((k) => k + "=" + params[k])
      .join("&");
    return path + (stable ? "?" + stable : "");
  }

  async function request(path, params, options) {
    const opts = options || {};
    const cfg = settings();

    if (!ready()) {
      throw new ApiError(
        "NO_KEY",
        "No TMDB API key configured.",
        "Add a key to js/config.js, or set one from the toolbar."
      );
    }

    const url = new URL(BASE + path);
    url.searchParams.set("language", cfg.language || "en-US");
    if (cfg.region) url.searchParams.set("region", cfg.region);
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("include_video", "false");

    const headers = { accept: "application/json" };
    const token = bearer();
    if (token) {
      headers.Authorization = "Bearer " + token;
    } else {
      url.searchParams.set("api_key", key());
    }

    Object.entries(params || {}).forEach(([name, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, value);
    });

    const cacheable = opts.cache !== false && !opts.signal;
    const ck = cacheKey(path, params);
    if (cacheable) {
      const hit = cache.get(ck);
      if (hit && hit.expires > Date.now()) return hit.value;
    }

    // One controller merges the caller's abort with our timeout, so a page that
    // navigates away mid-flight never leaves a socket open.
    const controller = new AbortController();
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, TIMEOUT);

    const onAbort = () => controller.abort();
    if (opts.signal) {
      if (opts.signal.aborted) {
        window.clearTimeout(timer);
        throw new ApiError("ABORT", "Request superseded.");
      }
      opts.signal.addEventListener("abort", onAbort, { once: true });
    }

    let response;
    try {
      response = await fetch(url.toString(), {
        headers,
        signal: controller.signal,
        // file:// gives the page an opaque origin; omitting credentials keeps
        // TMDB's wildcard CORS response usable.
        mode: "cors",
        credentials: "omit"
      });
    } catch (err) {
      if (timedOut) throw new ApiError("NETWORK", "TMDB did not respond in time.");
      if (opts.signal && opts.signal.aborted) throw new ApiError("ABORT", "Request superseded.");
      // A bare TypeError here is the classic symptom of being offline or of
      // file:// blocking the request, so the message points at both.
      throw new ApiError(
        "NETWORK",
        "Could not reach TMDB. Check your connection, or serve the folder over http:// " +
          "if you opened the page directly from disk.",
        String(err && err.message)
      );
    } finally {
      window.clearTimeout(timer);
      if (opts.signal) opts.signal.removeEventListener("abort", onAbort);
    }

    if (!response.ok) {
      let detail = null;
      try {
        detail = (await response.json()).status_message || null;
      } catch (_) {
        /* body was not JSON; the status alone is enough to classify it */
      }

      if (response.status === 401 || response.status === 403) {
        throw new ApiError("AUTH", "The TMDB API key was rejected.", detail);
      }
      if (response.status === 404) {
        throw new ApiError("NOT_FOUND", "TMDB has no record of that title.", detail);
      }
      if (response.status === 429) {
        throw new ApiError("RATE_LIMIT", "TMDB rate limit reached. Try again shortly.", detail);
      }
      throw new ApiError("SERVER", "TMDB returned " + response.status + ".", detail);
    }

    const data = await response.json();
    if (cacheable) cache.set(ck, { value: data, expires: Date.now() + (opts.ttl || TTL.list) });
    return data;
  }

  /* -------------------------------------------------------------------------
     Images
  ------------------------------------------------------------------------- */
  const POSTER_SIZES = { small: "w185", medium: "w342", large: "w500", original: "original" };
  const BACKDROP_SIZES = { small: "w780", medium: "w1280", large: "w1920", original: "original" };

  function imageUrl(path, kind, size) {
    if (!path) return "";
    const table = kind === "backdrop" ? BACKDROP_SIZES : POSTER_SIZES;
    return CDN + "/" + (table[size] || table.medium) + path;
  }

  function fallbackPoster() {
    return settings().fallbackPoster || "images/poster-placeholder.svg";
  }

  function fallbackBackdrop() {
    return settings().fallbackBackdrop || "images/backdrop-placeholder.svg";
  }

  /* -------------------------------------------------------------------------
     Normalisation
     The output shape is deliberately close to a js/data.js record so the shared
     renderers can treat live and bundled movies the same way.
  ------------------------------------------------------------------------- */
  function yearOf(releaseDate) {
    const year = Number(String(releaseDate || "").slice(0, 4));
    return Number.isFinite(year) && year > 1800 ? year : null;
  }

  function clean(text) {
    return String(text || "").trim();
  }

  function normalise(raw) {
    const posterPath = raw.poster_path || raw.still_path || "";
    const backdropPath = raw.backdrop_path || raw.backdrop || "";

    const genres = (raw.genres || [])
      .filter(Boolean)
      .map((g) => (typeof g === "string" ? { id: null, name: g } : { id: g.id, name: g.name }));

    const runtime = Number(raw.runtime) || null;

    return {
      tmdbId: Number(raw.id) || null,
      slug: null,
      title: clean(raw.title) || clean(raw.name) || "Untitled",
      year: yearOf(raw.release_date || raw.first_air_date),
      release_date: clean(raw.release_date || raw.first_air_date),
      runtime: runtime,
      rated: "",
      director: "",
      cast: [],
      genres: genres,
      tagline: clean(raw.tagline),
      overview: clean(raw.overview),
      poster: posterPath ? imageUrl(posterPath, "poster", "medium") : fallbackPoster(),
      backdrop: backdropPath ? imageUrl(backdropPath, "backdrop", "large") : fallbackBackdrop(),
      posterPath: posterPath,
      backdropPath: backdropPath,
      rating: Number(raw.vote_average) || 0,
      reviewCount: Number(raw.vote_count) || 0,
      criticScore: null,
      isFeatured: false,
      isTrending: false,
      isNew: false,
      source: "tmdb"
    };
  }

  /**
   * Full detail for one movie. Credits, recommendations and similar titles come
   * back in the same response so the details page needs a single round trip.
   */
  function normaliseDetail(raw) {
    const movie = normalise(raw);

    const credits = raw.credits || {};
    const crew = credits.crew || [];
    const director = crew.find((c) => c.job === "Director");

    movie.director = director ? director.name : "";
    movie.cast = (credits.cast || []).slice(0, 12).map((c) => ({
      name: c.name,
      character: c.character || "",
      profile: c.profile_path ? imageUrl(c.profile_path, "poster", "small") : ""
    }));

    movie.recommendations = (raw.recommendations && raw.recommendations.results || [])
      .filter((m) => m.poster_path)
      .map(normalise);
    movie.similar = (raw.similar && raw.similar.results || [])
      .filter((m) => m.poster_path)
      .map(normalise);

    // US certification, when TMDB has one for this release.
    const releases =
      (raw.release_dates && raw.release_dates.results) ||
      [];
    const us = releases.find((r) => r.iso_3166_1 === "US") || releases[0];
    movie.rated = us ? us.certification || "" : "";

    const status = Number(raw.status) || 0;
    movie.isNew = Boolean(movie.year && movie.year >= new Date().getFullYear() - 1);

    return movie;
  }

  /* -------------------------------------------------------------------------
     Endpoints
  ------------------------------------------------------------------------- */
  async function getTrending(page, options) {
    const data = await request("/trending/movie/week", { page: page || 1 }, options);
    return { movies: data.results.map(normalise), page: data.page, totalPages: data.total_pages, total: data.total_results };
  }

  async function getPopular(page, options) {
    const data = await request("/movie/popular", { page: page || 1 }, options);
    return { movies: data.results.map(normalise), page: data.page, totalPages: data.total_pages, total: data.total_results };
  }

  async function getTopRated(page, options) {
    const data = await request("/movie/top_rated", { page: page || 1 }, options);
    return { movies: data.results.map(normalise), page: data.page, totalPages: data.total_pages, total: data.total_results };
  }

  async function getNowPlaying(page, options) {
    const data = await request("/movie/now_playing", { page: page || 1 }, options);
    return { movies: data.results.map(normalise), page: data.page, totalPages: data.total_pages, total: data.total_results };
  }

  async function searchMovies(query, page, options) {
    const data = await request(
      "/search/movie",
      { query: query, page: page || 1, include_adult: "false" },
      options
    );
    return { movies: data.results.map(normalise), page: data.page, totalPages: data.total_pages, total: data.total_results };
  }

  /**
   * Filtered browse, for films outside our own library — the details page uses
   * it for "more like this" so it can widen the net past the 28 we have written
   * about.
   *
   * Two measured properties of /discover/movie are relied on here:
   *   - vote_average.gte and vote_average.lte are both honoured, so a score
   *     range is a real server-side filter and not a client-side illusion that
   *     only looks like it worked on one page.
   *   - `with_runtime` matches an exact minute count, so the runtime sort is
   *     applied by the caller rather than sent here.
   */
  async function discoverMovies(filters, page, options) {
    const f = filters || {};
    const data = await request(
      "/discover/movie",
      {
        page: page || 1,
        with_genres: f.genre || undefined,
        primary_release_year: f.year || undefined,
        "with_release_date.gte": f.yearFrom || undefined,
        "with_release_date.lte": f.yearTo || undefined,
        sort_by: f.sort || "popularity.desc",
        "vote_average.gte": f.voteMin || undefined,
        "vote_average.lte": f.voteMax || undefined,
        "vote_count.gte": f.minVotes || MIN_VOTES,
        with_runtime: f.runtime || undefined
      },
      options
    );
    return { movies: data.results.map(normalise), page: data.page, totalPages: data.total_pages, total: data.total_results };
  }

  async function getGenres(options) {
    const data = await request("/genre/movie/list", {}, options);
    return (data.genres || []).map((g) => ({ id: g.id, name: g.name }));
  }

  /**
   * The bundled catalogue and TMDB do not use the same genre names — ours says
   * "Sci-Fi", TMDB says "Science Fiction". This is the whole of the translation,
   * held in one place so no caller has to guess. Names not listed fall through
   * to a case-insensitive exact match against TMDB's own list, which covers
   * anything TMDB renamed later.
   */
  const GENRE_ALIASES = {
    "Sci-Fi": "Science Fiction",
    "Biography": "History",
    "Musical": "Music"
  };

  /** TMDB's genre id for one of our genre names, or null if TMDB has no such genre. */
  function genreId(name, list) {
    if (!name) return null;
    const wanted = GENRE_ALIASES[name] || name;
    const table = list && list.length ? list : [];
    const hit =
      table.find((g) => g.name === wanted) ||
      table.find((g) => g.name.toLowerCase() === String(wanted).toLowerCase());
    return hit ? hit.id : null;
  }

  async function getMovieDetail(id, options) {
    const opts = Object.assign({}, options, { cache: true, ttl: TTL.detail });
    const data = await request(
      "/movie/" + encodeURIComponent(id),
      { append_to_response: "credits,recommendations,similar,release_dates" },
      opts
    );
    return normaliseDetail(data);
  }

  async function getRecommendations(id, options) {
    const data = await request("/movie/" + encodeURIComponent(id) + "/recommendations", {}, options);
    return (data.results || []).filter((m) => m.poster_path).map(normalise);
  }

  /* -------------------------------------------------------------------------
     Public surface
  ------------------------------------------------------------------------- */
  window.CR = window.CR || {};
  window.CR.api = {
    ApiError: ApiError,
    BASE: BASE,

    // configuration
    ready: ready,
    hasKey: ready,
    key: key,
    setKey: storeKey,

    // transport
    request: request,
    clearCache: function () {
      cache.clear();
    },
    cacheSize: function () {
      return cache.size;
    },

    // images
    imageUrl: imageUrl,
    fallbackPoster: fallbackPoster,
    fallbackBackdrop: fallbackBackdrop,

    // data
    normalise: normalise,
    normaliseDetail: normaliseDetail,
    getTrending: getTrending,
    getPopular: getPopular,
    getTopRated: getTopRated,
    getNowPlaying: getNowPlaying,
    searchMovies: searchMovies,
    discoverMovies: discoverMovies,
    getGenres: getGenres,
    genreId: genreId,
    GENRE_ALIASES: GENRE_ALIASES,
    getMovieDetail: getMovieDetail,
    getRecommendations: getRecommendations
  };
})();
