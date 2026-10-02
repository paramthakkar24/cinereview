/* =============================================================================
   CineReview — smoke tests
   -----------------------------------------------------------------------------
   Zero-dependency checks that catch the regressions worth catching in a static
   site: broken markup, missing assets, undefined helpers, data/renderer drift.

   Run:  node tests/smoke.mjs
   Exits non-zero on failure, so it works in CI or as a pre-commit hook.
   ========================================================================== */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  ok   ${name}\n`);
  } catch (err) {
    failures.push({ name, err });
    process.stdout.write(`  FAIL ${name}\n         ${err.message}\n`);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

/* --- a minimal DOM shim, enough to load data.js and the app -------------- */
function loadScripts(files) {
  const store = new Map();
  const win = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k)
    },
    addEventListener() {},
    location: { search: "" }
  };
  win.window = win;
  win.CR = {};

  for (const file of files) {
    const source = read(file);
    new Function("window", "document", "localStorage", "CustomEvent", source)(
      win,
      undefined,
      win.localStorage,
      function CustomEvent(type, init) {
        this.type = type;
        this.detail = init && init.detail;
      }
    );
  }
  return win;
}

process.stdout.write("\nCineReview — smoke tests\n\n");

/* =============================================================================
   1. DATA
========================================================================= */
const data = loadScripts(["js/icons.js", "js/data.js"]);
const D = data.CR.data;

process.stdout.write("Data\n");

check("dataset loads and is not empty", () => {
  assert(D && Array.isArray(D.movies), "CR.data.movies missing");
  assert(D.movies.length >= 20, `expected 20+ movies, got ${D.movies.length}`);
});

check("every movie has the fields the renderers read", () => {
  const required = [
    "id", "title", "year", "runtime", "rated", "director", "cast",
    "genres", "tagline", "accent", "rating", "reviewCount", "criticScore",
    "overview", "pros", "cons", "review", "breakdown"
  ];
  D.movies.forEach((m) => {
    required.forEach((key) => {
      assert(m[key] !== undefined && m[key] !== null, `${m.id}: missing "${key}"`);
    });
    assert(Array.isArray(m.cast) && m.cast.length > 0, `${m.id}: cast is empty`);
    assert(Array.isArray(m.genres) && m.genres.length > 0, `${m.id}: genres empty`);
    assert(Array.isArray(m.pros) && m.pros.length > 0, `${m.id}: pros empty`);
    assert(Array.isArray(m.cons) && m.cons.length > 0, `${m.id}: cons empty`);
    assert(Array.isArray(m.review.body) && m.review.body.length >= 2, `${m.id}: review body too short`);
    assert(m.review.title, `${m.id}: review has no headline`);
    assert(m.review.quote, `${m.id}: review has no pull-quote`);
    /* The dataset contract is an ISO calendar date, "YYYY-MM-DD", and it has
       to be a string: CR.data.formatDate() splits it on "-", and allReviews()
       sorts on it lexically. A numeric timestamp would silently mis-sort the
       archive, so assert the shape rather than numeric-ness. */
    assert(
      typeof m.review.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(m.review.date),
      `${m.id}: review date "${m.review.date}" is not an ISO YYYY-MM-DD string`
    );
    const parsed = new Date(m.review.date + "T00:00:00Z");
    assert(
      !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === m.review.date,
      `${m.id}: review date "${m.review.date}" is not a real calendar date`
    );

  });
});

check("movie ids are unique and URL-safe", () => {
  const seen = new Set();
  D.movies.forEach((m) => {
    assert(/^[a-z0-9-]+$/.test(m.id), `id "${m.id}" is not URL-safe`);
    assert(!seen.has(m.id), `duplicate id "${m.id}"`);
    seen.add(m.id);
  });
});

check("scores, years and runtimes are in range", () => {
  D.movies.forEach((m) => {
    assert(m.rating > 0 && m.rating <= 10, `${m.id}: rating ${m.rating} out of range`);
    assert(m.year >= 1888 && m.year <= 2100, `${m.id}: implausible year ${m.year}`);
    assert(m.runtime >= 40 && m.runtime <= 400, `${m.id}: implausible runtime`);
    assert(m.criticScore >= 0 && m.criticScore <= 100, `${m.id}: criticScore out of range`);
  });
});

check("star breakdowns sum to reviewCount", () => {
  D.movies.forEach((m) => {
    const total = Object.values(m.breakdown).reduce((a, b) => a + b, 0);
    /* The fixture numbers are illustrative, so allow a tolerance rather than
       demanding exact arithmetic against a hand-written total. */
    const drift = Math.abs(total - m.reviewCount) / m.reviewCount;
    assert(drift < 0.01, `${m.id}: breakdown total ${total} vs reviewCount ${m.reviewCount}`);
  });
});

check("review authors index into the critics array", () => {
  D.movies.forEach((m) => {
    assert(
      Number.isInteger(m.review.author) && m.review.author >= 0 && m.review.author < D.critics.length,
      `${m.id}: review.author ${m.review.author} is out of range`
    );
  });
});

check("exactly one featured movie", () => {
  const featured = D.movies.filter((m) => m.isFeatured);
  assert(featured.length === 1, `expected 1 featured movie, found ${featured.length}`);
});

process.stdout.write("\nDerived helpers\n");

check("byId resolves and rejects correctly", () => {
  assert(D.byId("inception"), "byId failed on a known id");
  assert(D.byId("INCEPTION"), "byId should be case-insensitive");
  assert(D.byId("no-such-film") === null, "byId should return null for unknown ids");
  assert(D.byId(null) === null, "byId should tolerate null");
});

check("search matches title, director, cast and genre", () => {
  assert(D.search("nolan").length >= 3, "search by director failed");
  assert(D.search("dicaprio").length >= 1, "search by cast failed");
  assert(D.search("thriller").length >= 1, "search by genre failed");
  assert(D.search("").length === D.movies.length, "empty query should return everything");
  assert(D.search("zzzznope").length === 0, "nonsense query should return nothing");
});

check("related() excludes the movie itself and respects the limit", () => {
  D.movies.forEach((m) => {
    const list = D.related(m, 4);
    assert(list.length === 4, `${m.id}: expected 4 related, got ${list.length}`);
    assert(!list.some((x) => x.id === m.id), `${m.id}: related() included the movie itself`);
    list.forEach((r) => assert(r.id !== m.id, `${m.id}: related() repeated itself`));
  });
});

check("ranking helpers return the requested counts", () => {
  assert(D.topRated(6).length === 6, "topRated count mismatch");
  assert(D.trending(8).length === 8, "trending count mismatch");
  assert(D.justReleased(5).length === 5, "justReleased count mismatch");

  const top = D.topRated(10);
  for (let i = 1; i < top.length; i++) {
    assert(top[i - 1].rating >= top[i].rating, "topRated is not sorted descending");
  }
});

check("genreIndex and yearIndex are sorted and populated", () => {
  const genres = D.genreIndex();
  assert(genres.length > 5, "expected several genres");
  for (let i = 1; i < genres.length; i++) {
    assert(genres[i - 1].name.localeCompare(genres[i].name) < 0, "genres are not alphabetical");
  }
  const years = D.yearIndex();
  for (let i = 1; i < years.length; i++) {
    assert(years[i - 1] > years[i], "years are not newest-first");
  }
});

check("runtimeLabel and formatDate produce readable strings", () => {
  assert(D.runtimeLabel(148) === "2h 28m", `got "${D.runtimeLabel(148)}"`);
  assert(D.runtimeLabel(105) === "1h 45m", `got "${D.runtimeLabel(105)}"`);
  assert(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/.test(D.formatDate("2024-11-18")), "formatDate shape wrong");
});

check("allReviews is sorted newest-first", () => {
  const list = D.allReviews();
  assert(list.length === D.movies.length, "allReviews lost entries");
  for (let i = 1; i < list.length; i++) {
    assert(
      list[i - 1].review.date >= list[i].review.date,
      "allReviews is not newest-first"
    );
  }
});

/* =============================================================================
   2. ASSETS
========================================================================= */
process.stdout.write("\nAssets\n");

const pages = ["index.html", "movies.html", "movie-details.html", "reviews.html", "about.html"];

check("all five pages exist", () => {
  pages.forEach((p) => assert(existsSync(join(ROOT, p)), `missing ${p}`));
});

check("every movie has a generated poster and banner", () => {
  D.movies.forEach((m) => {
    /* localPosterFor, not posterFor. posterFor answers "what should a card
       show", which is TMDB key art now; these files are still generated and
       are still the offline fallback, so what matters here is that they exist. */
    assert(existsSync(join(ROOT, D.localPosterFor(m))), `missing poster for ${m.id}`);
    assert(existsSync(join(ROOT, D.localBannerFor(m))), `missing banner for ${m.id}`);
  });
});

check("generated artwork is well-formed and non-trivial", () => {
  D.movies.forEach((m) => {
    [D.localPosterFor(m), D.localBannerFor(m)].forEach((rel) => {
      const svg = read(rel);
      assert(svg.startsWith("<svg"), `${rel} does not start with <svg>`);
      assert(svg.trimEnd().endsWith("</svg>"), `${rel} is not closed`);
      assert(svg.length > 800, `${rel} looks empty (${svg.length} bytes)`);
      /* An unescaped ampersand is the classic breakage in generated SVG text. */
      const body = svg.replace(/&(amp|lt|gt|quot|#39);/g, "");
      assert(!body.includes("&"), `${rel} has a raw & that needs escaping`);
    });
  });
});

check("no orphan artwork (every file belongs to a movie)", () => {
  const ids = new Set(D.movies.map((m) => m.id));
  ["images/movie-posters", "images/banners"].forEach((dir) => {
    readdirSync(join(ROOT, dir))
      .filter((f) => f.endsWith(".svg"))
      .forEach((f) => {
        assert(ids.has(f.replace(/\.svg$/, "")), `${dir}/${f} has no matching movie`);
      });
  });
});

check("every page references its stylesheet and scripts", () => {
  pages.forEach((p) => {
    const html = read(p);
    assert(html.includes('href="css/style.css"'), `${p}: stylesheet not linked`);
    assert(html.includes('src="js/icons.js"'), `${p}: icons.js not loaded`);
    assert(html.includes('src="js/data.js"'), `${p}: data.js not loaded`);
    assert(html.includes('src="js/script.js"'), `${p}: script.js not loaded`);
  });
});

check("every page declares the shared nav and footer", () => {
  pages.forEach((p) => {
    const html = read(p);
    ['data-header', 'data-nav', 'data-search-toggle', 'class="footer"', 'id="main"'].forEach((token) => {
      assert(html.includes(token), `${p}: missing ${token}`);
    });
    ["Home", "Movies", "Reviews", "About"].forEach((label) => {
      assert(html.includes(`>${label}</a>`), `${p}: nav link "${label}" missing`);
    });
  });
});

check("pages declare the expected data-page hook", () => {
  const expected = {
    "index.html": "home",
    "movies.html": "movies",
    "movie-details.html": "details",
    "reviews.html": "reviews",
    "about.html": "about"
  };
  Object.entries(expected).forEach(([file, page]) => {
    const html = read(file);
    assert(html.includes(`data-page="${page}"`), `${file}: expected data-page="${page}"`);
  });
});

check("pages have a title and a meta description", () => {
  pages.forEach((p) => {
    const html = read(p);
    assert(/<title>[^<]{10,}<\/title>/.test(html), `${p}: missing or short <title>`);
    assert(/name="description" content="[^"]{40,}"/.test(html), `${p}: meta description missing or short`);
    assert(html.includes('name="viewport"'), `${p}: missing viewport meta`);
    assert(/<html lang="en"/.test(html), `${p}: missing lang attribute`);
  });
});

check("every page carries the mandatory TMDB attribution", () => {
  /* Requirement, not a nicety: TMDB's terms require this exact sentence on
     every page that uses their data. It was missing from all five footers. */
  const ATTRIBUTION =
    "This product uses the TMDB API but is not endorsed or certified by TMDB.";
  pages.forEach((p) => {
    const html = read(p);
    assert(html.includes(ATTRIBUTION), `${p}: missing the TMDB attribution`);
    /* It has to be in the footer, not tucked away in the body copy. */
    const footer = html.match(/<footer[\s\S]*?<\/footer>/);
    assert(footer, `${p}: no <footer>`);
    assert(footer[0].includes(ATTRIBUTION), `${p}: the attribution is not in the footer`);
  });
  /* And the class it is marked up with has to exist, or it renders unstyled.
     The stylesheet check below covers this too, but it is worth naming here
     because the attribution is a requirement rather than a design choice. */
  assert(/\.footer__note/.test(read("css/style.css")), ".footer__note is not styled");
});

check("the five navbars and footers have not drifted apart", () => {
  /* They are duplicated markup on purpose (see the plan, §8), so the only
     thing protecting them is this diff. Extract and compare. */
  const block = (html, tag) => {
    const m = html.match(new RegExp("<" + tag + "[\\s\\S]*?</" + tag + ">"));
    assert(m, "no <" + tag + "> found");
    return m[0].replace(/\r\n/g, "\n").trim();
  };

  const ref = read("index.html");
  ["header", "nav", "footer"].forEach((tag) => {
    const expected = block(ref, tag);
    pages.forEach((p) => {
      const actual = block(read(p), tag);
      assert(actual === expected, `${p}: its <${tag}> has drifted from index.html`);
    });
  });
});

check("every ARIA reference points at an id that exists", () => {
  pages.forEach((p) => {
    const html = read(p);
    const ids = new Set(Array.from(html.matchAll(/id="([^"]+)"/g), (m) => m[1]));

    /* aria-labelledby / describedby take a space-separated list. */
    Array.from(html.matchAll(/aria-(?:labelledby|controls|describedby)="([^"]+)"/g)).forEach((m) => {
      m[1].split(/\s+/).forEach((ref) => {
        assert(ids.has(ref), `${p}: ${m[0]} points at #${ref}, which does not exist`);
      });
    });

    /* Every label has a control to point at, or clicking it does nothing. */
    Array.from(html.matchAll(/<label[^>]*\bfor="([^"]+)"/g)).forEach((m) => {
      assert(ids.has(m[1]), `${p}: <label for="${m[1]}"> has no matching element`);
    });
  });
});

check("no id appears twice within a page", () => {
  pages.forEach((p) => {
    const seen = new Set();
    const dupes = new Set();
    Array.from(read(p).matchAll(/id="([^"]+)"/g)).forEach((m) => {
      if (seen.has(m[1])) dupes.add(m[1]);
      seen.add(m[1]);
    });
    assert(dupes.size === 0, `${p}: duplicate id(s): ${Array.from(dupes).join(", ")}`);
  });
});

check("all internal links point at files that exist", () => {
  pages.forEach((p) => {
    const html = read(p);
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map((m) => m[1]);
    hrefs
      .filter((h) => !h.startsWith("#") && !h.startsWith("http") && !h.startsWith("mailto:") && !h.startsWith("data:"))
      .forEach((h) => {
        const target = h.split("?")[0].split("#")[0];
        if (!target) return;
        assert(existsSync(join(ROOT, target)), `${p}: link to missing file "${target}"`);
      });
  });
});

check("movie-details links use slugs that exist", () => {
  const html = read("index.html") + read("movies.html") + read("reviews.html");
  const ids = new Set(D.movies.map((m) => m.id));
  Array.from(html.matchAll(/movie-details\.html\?id=([a-z0-9-]+)/g)).forEach((m) => {
    assert(ids.has(m[1]), `link references unknown movie id "${m[1]}"`);
  });
});

/* =============================================================================
   3. STYLESHEET
========================================================================= */
process.stdout.write("\nStylesheet\n");

const css = read("css/style.css");

check("braces balance in the stylesheet", () => {
  const open = (css.match(/\{/g) || []).length;
  const close = (css.match(/\}/g) || []).length;
  assert(open === close, `${open} opening braces vs ${close} closing braces`);
});

check("defines the palette tokens the brief asked for", () => {
  ["--bg:", "--accent:", "--gold:", "--text:", "--text-2:"].forEach((token) => {
    assert(css.includes(token), `missing token ${token}`);
  });
});

check("has responsive breakpoints for desktop, tablet and mobile", () => {
  assert(css.includes("max-width: 1180px"), "no laptop breakpoint");
  assert(css.includes("max-width: 980px"), "no small-laptop breakpoint");
  assert(css.includes("max-width: 760px"), "no tablet breakpoint");
  assert(css.includes("max-width: 560px"), "no mobile breakpoint");
});

check("respects reduced-motion and print preferences", () => {
  assert(css.includes("prefers-reduced-motion"), "no reduced-motion block");
  assert(css.includes("@media print"), "no print styles");
});

/* The site is dark-only by decision. A light theme creeping back in would mean
   the palette has to be maintained twice, and the header would grow a toggle
   that only has one state to be in. */
check("there is exactly one theme: dark", () => {
  assert(!css.includes('[data-theme="light"]'), "light theme overrides are still present");
  pages.forEach((p) => {
    const html = read(p);
    assert(!html.includes("data-theme-toggle"), `${p}: theme toggle button is still in the markup`);
    assert(!html.includes('data-theme="'), `${p}: page still sets a theme attribute`);
    assert(!html.includes("cr.theme"), `${p}: page still reads the stored theme`);
  });
  const app = read("js/script.js");
  assert(!/data-theme/.test(app), "script.js still branches on data-theme");
  assert(!app.includes("initTheme"), "script.js still calls initTheme");
});

check("keyframe animations referenced by the HTML are defined", () => {
  const used = new Set(
    Array.from(read("index.html").matchAll(/animation:\s*([a-zA-Z][\w-]*)/g)).map((m) => m[1])
  );
  used.forEach((name) => {
    assert(css.includes(`@keyframes ${name}`), `@keyframes ${name} is used but not defined`);
  });
});

/* A typo'd class name is invisible: the markup renders, it is just unstyled and
   silently falls back to browser defaults. Nothing else in this suite would catch
   it, so every class the renderers emit is checked against the stylesheet.
   js-* classes are behaviour hooks and are deliberately unstyled, as are the
   partial tokens left over from string concatenation such as "pc pc--" + variant. */
check("every class the renderers emit is styled", () => {
  const defined = new Set(Array.from(css.matchAll(/\.([a-zA-Z][\w-]*)/g), (m) => m[1]));
  const appSrc = read("js/script.js");

  /* Classes that exist only to be found in the DOM and never to be styled.
     Listed explicitly, so an unexplained one cannot slip through:
       js-*        behaviour hooks for the delegated listeners in script.js
       social__icon  an empty span that exists to hold an injected <svg>; the
                     icon itself is sized by `.social svg`, so the wrapper has
                     no visual rules of its own to define. */
  const HOOKS = /^(js-|social__icon$)/;

  /* Only well-formed class-name runs are collected. Deliberately strict, because
     the renderers build markup by concatenation ("card card--" + variant), and a
     looser pattern picks up the surrounding operators as if they were classes. */
  const CLASS_RUN = /class="([a-zA-Z][a-zA-Z0-9_-]*(?: [a-zA-Z][a-zA-Z0-9_-]*)*)"/g;

  const missing = new Set();
  pages.forEach((p) => {
    // Static markup and generated markup, so both are covered.
    [read(p), appSrc].forEach((src) => {
      Array.from(src.matchAll(CLASS_RUN)).forEach((m) => {
        m[1].split(" ").forEach((cls) => {
          if (HOOKS.test(cls)) return;
          if (!defined.has(cls)) missing.add(cls);
        });
      });
    });
  });

  assert(
    missing.size === 0,
    `rendered but not styled: ${Array.from(missing).sort().join(", ")}`
  );
});

/* =============================================================================
   4. APPLICATION SCRIPT
========================================================================= */
process.stdout.write("\nApplication script\n");

const app = read("js/script.js");

/**
 * The source of one named function, from its declaration to the brace that
 * closes it. Lets a check assert about one function's body instead of the
 * whole file, where an unrelated match would satisfy it.
 */
function functionBody(source, name) {
  const start = source.indexOf("function " + name + "(");
  if (start === -1) throw new Error(`no function ${name}() in js/script.js`);
  return braceBlock(source, "function " + name);
}

/** The braced block that begins at the first `{` after `marker`. */
function braceBlock(source, marker) {
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`no "${marker}" in js/script.js`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(open, i + 1);
  }
  throw new Error(`unbalanced braces after "${marker}"`);
}

check("parses without syntax errors", () => {
  new Function("window", "document", app); // throws on a syntax error
});

check("every icon referenced in markup exists in the icon set", () => {
  const I = data.CR.icons;
  const html = pages.map(read).join("\n");
  const jsFiles = app + read("js/icons.js");

  /* Icons are looked up as I.<name> or I["<name>"] in script.js, and rendered
     as data-* attributes that a tiny inline snippet resolves by name. */
  Array.from(jsFiles.matchAll(/\bI\.([a-zA-Z][\w]*)/g)).forEach((m) => {
    assert(I[m[1]], `script.js uses I.${m[1]} which is not defined`);
  });

  Array.from(html.matchAll(/data-(?:social|contact-icon)="([a-z-]+)"/g)).forEach((m) => {
    assert(I[m[1]], `markup references unknown icon "${m[1]}"`);
  });
});

check("every slot the Movies markup declares is filled by script.js", () => {
  const html = read("movies.html");
  const slots = Array.from(html.matchAll(/id="(movie-grid|search|search-clear|sort|filter-genres|filter-year|filter-tiers|filter-reset|active-filters|result-count|empty-state|load-more-wrap|load-more)"/g)).map(
    (m) => m[1]
  );
  assert(slots.length === 13, `expected 13 Movies slots in the markup, found ${slots.length}`);
  slots.forEach((id) => {
    assert(app.includes('"#' + id + '"'), `script.js never references #${id}`);
  });
});

check("the Details page fills its slot and accepts both id schemes", () => {
  assert(app.includes('"#detail-root"'), "script.js never references #detail-root");
  /* ?id= has to resolve a TMDB id and one of our own slugs; a page that only
     understood one of them would blank on half the links in circulation. */
  assert(/readDetailsId/.test(app), "expected readDetailsId() to resolve ?id=");
  assert(app.includes("/^\\d+$/"), "readDetailsId() does not recognise a numeric TMDB id");
  assert(app.includes("reviews.forSlug"), "readDetailsId() does not resolve our own slugs");
  /* A film we have reviewed must never be shown as TMDB's rating. */
  assert(app.includes("CineReview score"), "the details page does not label our own score");
  assert(app.includes("TMDB score"), "the details page never names TMDB's score separately");
});

check("the Details page keeps editorial fields when live data replaces the record", () => {
  /* TMDB cannot know our accent colour, critic score, star breakdown or pros and
     cons, so a live record that overrode the bundled one would silently drop
     them. The adapter is where that has to be defended. */
  assert(/function bundledFor/.test(app), "no bundledFor() to recover editorial fields");
  /* Either read straight off ours, or through the pick() helper that falls back
     to it when the live record has nothing. */
  ["breakdown", "criticScore", "accent"].forEach((field) => {
    assert(
      new RegExp("\\(ours && ours\\." + field + "\\)|pick\\([\"']" + field + "[\"']\\)").test(app),
      `adapt() does not fall back to our own ${field} when a live record lacks it`
    );
  });
  assert(/pick\s*=\s*\(/.test(app) || app.includes("function pick("), "adapt() has no pick() helper for source precedence");
  /* Local storage keys must not change when the source does. */
  assert(/storeId:/.test(app), "no stable storeId for localStorage keys");
});

check("genre links only point at filters the Movies page accepts", () => {
  assert(app.includes("detailGenreChips"), "no genre chip helper on the details page");
  assert(app.includes("chip--static"), "unfilterable genres should render as plain text");
  assert(css.includes(".chip--static"), ".chip--static is not styled");
});

check("the Movies page reads and writes its filters in the URL", () => {
  ["readMoviesUrl", "writeMoviesUrl", "moviesQuery"].forEach((fn) => {
    assert(app.includes(fn), `expected ${fn}() in script.js`);
  });
  /* Every key the footer links use must be one the page understands. */
  const html = read("movies.html");
  Array.from(html.matchAll(/movies\.html\?([a-z]+)=/g)).forEach((m) => {
    assert(app.includes('get("' + m[1] + '")'), `movies.html links ?${m[1]}= but script.js never reads it`);
  });
});

check("every slot the Reviews markup declares is filled by script.js", () => {
  const html = read("reviews.html");
  /* The two heading ids are excluded on purpose: they exist to be the target
     of aria-labelledby, not to be filled. They are checked below instead. */
  const slots = Array.from(
    html.matchAll(/id="(reviews-featured|reviews-latest|review-count|review-genre|review-tier|review-critic|review-reset)"/g)
  ).map((m) => m[1]);
  assert(slots.length === 7, `expected 7 Reviews slots in the markup, found ${slots.length}`);
  slots.forEach((id) => {
    assert(app.includes('"#' + id + '"'), `script.js never references #${id}`);
  });

  /* A heading that names nothing, or a section labelled by an id that is not
     its heading, is a screen-reader dead end. */
  ["featured-title", "all-reviews-title"].forEach((id) => {
    assert(html.includes(`aria-labelledby="${id}"`), `no section is labelled by #${id}`);
    assert(new RegExp(`<h2[^>]*id="${id}"`).test(html), `#${id} is not an <h2>`);
  });
  assert(
    /all-reviews-title/.test(app),
    "the archive heading is never updated, so it cannot reflect a filtered view"
  );
});

check("the Reviews page reads and writes its filters in the URL", () => {
  ["readReviewsUrl", "writeReviewsUrl", "reviewsQuery"].forEach((fn) => {
    assert(app.includes(fn), `expected ${fn}() in script.js`);
  });
  /* Every key the page's own links use must be one it understands — an
     unsupported key would silently render the unfiltered archive. */
  Array.from(read("reviews.html").matchAll(/reviews\.html\?([a-z]+)=/g)).forEach((m) => {
    assert(app.includes('get("' + m[1] + '")'), `reviews.html links ?${m[1]}= but script.js never reads it`);
  });
  Array.from(app.matchAll(/reviews\.html\?([a-z]+)=/g)).forEach((m) => {
    assert(app.includes('get("' + m[1] + '")'), `script.js links reviews.html?${m[1]}= but never reads it`);
  });
});

check("the Reviews archive filters on our score, not TMDB's", () => {
  assert(/function passesReviewFilters/.test(app), "no filter predicate for the archive");
  /* The tier filter has to read review.score. Reading the film's TMDB rating
     would put reviews in the wrong bands and disagree with the pill on the same
     card, which shows our number. */
  const body = functionBody(app, "passesReviewFilters");
  assert(/entry\.review\.score/.test(body), "the archive does not filter on our own score");
  assert(!/\.rating\b/.test(body), "the archive filters on a TMDB rating instead of our score");
  /* A review with no bundled film cannot satisfy a genre filter, so it has to
     drop out rather than appear as though it had been checked. */
  assert(/!entry\.movie/.test(body), "an unknown film would pass the genre filter unchecked");
});

check("every slot the About markup declares is filled by script.js", () => {
  const html = read("about.html");
  const slots = Array.from(
    html.matchAll(/id="(about-stats|about-people|contact-form|contact-name|contact-email|contact-message|contact-status)"/g)
  ).map((m) => m[1]);
  assert(slots.length === 7, `expected 7 About slots in the markup, found ${slots.length}`);
  slots.forEach((id) => {
    assert(app.includes('"#' + id + '"'), `script.js never references #${id}`);
  });
  /* #mission is a link target from the footer, not a slot, but it still has to
     exist or those links land nowhere. */
  ['href="about.html#mission"', 'href="about.html#contact"'].forEach((needle) => {
    assert(read("index.html").includes(needle), `index.html is missing ${needle}`);
  });
});

check("the contact form never claims a message was sent", () => {
  /* There is no backend. A handler that reported success would be lying, and a
     handler that silently did nothing would look broken. The href is built by
     contactMailto(), so both have to be looked at. */
  const submit = functionBody(app, "initContactForm");
  assert(/contactMailto\(/.test(submit), "submitting the form does not build a message to hand off");
  const mail = functionBody(app, "contactMailto");
  assert(/"mailto:"|'mailto:'|`mailto:`/.test(mail), "contactMailto() does not produce a mailto: href");
  assert(/subject=/.test(mail) && /body=/.test(mail), "the mailto carries no subject or body");
  assert(
    !/thank|received|we'll be in touch|sent your/i.test(submit + mail),
    "the form promises a delivery it cannot make"
  );
  /* And the page has to admit it before the visitor types anything. */
  assert(read("about.html").includes('id="contact-note"'), "about.html does not explain the form's behaviour");
});

check("the contact form validates every field it collects", () => {
  /* Rules are an object literal, so their keys are the field names. */
  const rules = braceBlock(app, "const CONTACT_RULES");
  ["name:", "email:", "message:"].forEach((field) => {
    assert(rules.includes("\n    " + field), `CONTACT_RULES has no rule for ${field.replace(":", "")}`);
  });
  /* Each input needs an error slot wired by aria-describedby, or the message is
     invisible to anyone not looking at the right pixel. */
  const html = read("about.html");
  ["name", "email", "message"].forEach((field) => {
    assert(html.includes(`aria-describedby="contact-${field}-error"`), `#contact-${field} has no described-by error slot`);
    assert(html.includes(`id="contact-${field}-error"`), `no error element for #contact-${field}`);
  });
});

check("no page hands a slot a literal null", () => {
  /* renderHero(null) left the largest block on Home blank whenever there was
     no API key — the exact state a first-time visitor starts in. The rails
     beside it fell back to the bundled catalogue; the hero did not. Every
     render*() call site has to be given something to render. */
  Array.from(app.matchAll(/\brender[A-Z]\w*\(\s*null\s*\)/g)).forEach((m) => {
    assert(false, `script.js calls ${m[0].replace(/\s+/g, " ")}, leaving that slot empty`);
  });
});

check("the current nav link is derived, not hard-coded in the markup", () => {
  /* The navbar is duplicated across five pages, so which link is current
     differs per page. A diff between the copies is the only thing that would
     catch a hard-coded one, so it has to stay absent. */
  pages.forEach((p) => {
    assert(
      !read(p).includes('aria-current="page"'),
      `${p}: aria-current is hard-coded in the markup; it must come from data-nav-link`
    );
  });
  assert(/data-nav-link/.test(app), "script.js does not use the data-nav-link hook");
});

check("the pages clear their own no-js class", () => {
  /* Every page ships class="no-js" so .no-js .js-only can hide controls that
     need JavaScript. If nothing removes it, the first element ever marked
     js-only stays invisible with nothing on screen to explain why. */
  pages.forEach((p) => {
    assert(read(p).includes('class="no-js"'), `${p}: expected class="no-js" in the markup`);
  });
  assert(
    /classList\.remove\(\s*"no-js"\s*\)/.test(app),
    "script.js never removes the no-js class, so .no-js .js-only rules stay on forever"
  );
});

check("every page hook has a module behind it", () => {
  const hooks = Array.from(read("index.html").matchAll(/data-page="(\w+)"/g)).map((m) => m[1]);
  const others = ["movies", "details", "reviews", "about"];
  [...new Set([...hooks, ...others])].forEach((hook) => {
    assert(app.includes(`page === "${hook}"`), `no module wired for data-page="${hook}"`);
  });
});

check("wires up every interactive control the markup declares", () => {
  ["data-header", "data-nav", "data-nav-toggle", "data-search-toggle", "data-rail", "js-read-more"].forEach(
    (token) => {
      assert(app.includes(token), `script.js never handles "${token}"`);
    }
  );
});

check("stores user data under namespaced localStorage keys", () => {
  const keys = Array.from(app.matchAll(/"(cr\.[a-z.]+)"/g)).map((m) => m[1]);
  assert(keys.length >= 2, "expected namespaced cr.* storage keys");
  keys.forEach((k) => assert(k.startsWith("cr."), `key "${k}" is not namespaced`));
});

check("escapes all interpolated data in generated markup", () => {
  assert(app.includes("function esc("), "no escaping helper");
  /* Every template that interpolates a movie or review field must go through
     esc(). Spot-check the riskiest interpolations. */
  ["esc(movie.title)", "esc(movie.overview)", "esc(review.title)", "esc(critic.name)", "esc(movie.director)"].forEach(
    (needle) => {
      assert(app.includes(needle), `expected escaped interpolation: ${needle}`);
    }
  );
});

/* =============================================================================
   5. DATA / RENDERER AGREEMENT
========================================================================= */
process.stdout.write("\nData and renderers\n");

check("localPosterFor and localBannerFor match the generated filenames", () => {
  D.movies.forEach((m) => {
    assert(D.localPosterFor(m).endsWith(`${m.id}.svg`), `localPosterFor mismatch for ${m.id}`);
    assert(D.localBannerFor(m).endsWith(`${m.id}.svg`), `localBannerFor mismatch for ${m.id}`);
    assert(D.localPosterFor(m).includes("images/movie-posters/"), "poster path is wrong");
    assert(D.localBannerFor(m).includes("images/banners/"), "banner path is wrong");
  });
});

check("posterFor and bannerFor prefer real TMDB artwork over the generated SVG", () => {
  D.movies.forEach((m) => {
    /* A card must show the actual poster, not the typographic title art that
       tools/gen-posters.mjs draws. The generated SVG stays reachable only as
       the fallback, which is what localPosterFor is for. */
    const poster = D.posterFor(m);
    if (m.posterPath) {
      assert(poster.startsWith("https://image.tmdb.org/t/p/"), `${m.id} poster is not TMDB art: ${poster}`);
      assert(poster.endsWith(m.posterPath), `${m.id} poster lost its TMDB path: ${poster}`);
    } else {
      assert(poster === D.localPosterFor(m), `${m.id} has no poster_path, so it must fall back to the SVG`);
    }
    const banner = D.bannerFor(m);
    if (m.backdropPath) {
      assert(banner.startsWith("https://image.tmdb.org/t/p/"), `${m.id} backdrop is not TMDB art: ${banner}`);
    } else {
      assert(banner === D.localBannerFor(m), `${m.id} has no backdrop_path, so it must fall back to the SVG`);
    }
  });
});

/* -----------------------------------------------------------------------------
   A record with no usable id must not become "images/.../undefined.svg". That
   string is a 404, and the reason a card can end up blank: the onerror handler
   that was supposed to save it either fires late or was never attached.
----------------------------------------------------------------------------- */
check("the asset helpers refuse to invent a path from a missing id", () => {
  [undefined, null, {}, { title: "No id" }, { id: "" }, { id: null }].forEach((bad) => {
    assert(D.posterFor(bad) === "", `posterFor(${JSON.stringify(bad)}) should be "", got ${D.posterFor(bad)}`);
    assert(D.bannerFor(bad) === "", `bannerFor(${JSON.stringify(bad)}) should be "", got ${D.bannerFor(bad)}`);
  });
});

check("no generated markup can contain a /undefined.svg image path", () => {
  /* The whole family of bugs this guards is the same shape: a value that is
     undefined reaches a template literal and comes out looking like a path.
     Comments are stripped first - the resolver's own doc comment has to be able
     to name the string it exists to prevent. */
  const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert(!/undefined\.svg/.test(code("js/script.js")), "script.js still builds undefined.svg paths");
  assert(!/undefined\.svg/.test(code("js/data.js")), "data.js still builds undefined.svg paths");
});

/* -----------------------------------------------------------------------------
   Every <img> must go through artworkImg(). A hand-written tag is the thing that
   broke: it duplicated the fallback rules inline, and the copies drifted - one
   cleared src and left a blank block, another had no handler at all. One helper
   means one place to get it right, but only if nothing routes around it.
----------------------------------------------------------------------------- */
check("no renderer hand-writes an <img> outside artworkImg()", () => {
  const src = read("js/script.js");
  /* artworkImg() builds its tag with "<img " + attrs, so the helper's own line
     is the only legitimate hit. Comments are stripped first: the prose in the
     resolver section talks about <img> a lot and is not a violation. */
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const hits = Array.from(code.matchAll(/<img\b/g));
  assert(hits.length === 1, `expected exactly one <img> literal (inside artworkImg), found ${hits.length}`);
});

check("the image fallback handler survives HTML attribute quoting", () => {
  /* The subtle one: the handler is interpolated into a double-quoted attribute,
     so a single stray " inside it closes the attribute early and silently
     truncates the handler. The images then 404 with no error handling at all -
     the exact failure the helper exists to prevent. */
  const src = read("js/script.js");
  const body = /function imageOnerror\(\)\s*\{[\s\S]*?\n  \}/.exec(src);
  assert(body, "imageOnerror() not found");
  const handler = body[0].replace(/^\s*\/\/.*$/gm, "");
  /* Everything the runtime needs must be written with single quotes. */
  assert(!/onerror="/.test(handler), "imageOnerror() nests double quotes inside a double-quoted attribute");
  assert(handler.includes("classList.add('is-image-missing')"), "the give-up branch is missing");
  assert(handler.includes("crNext"), "the handler does not read the next-best source");
  assert(handler.includes("crTried"), "the handler has no hop guard, so it could loop");
});

check("toFiveStars stays within the 0–5 range", () => {
  D.movies.forEach((m) => {
    const five = D.toFiveStars(m.rating);
    assert(five >= 0 && five <= 5, `${m.id}: toFiveStars returned ${five}`);
    assert(Number.isInteger(five * 2), `${m.id}: toFiveStars returned a quarter star`);
  });
});

check("criticFor wraps safely for any author index", () => {
  assert(D.criticFor(0).name, "criticFor(0) failed");
  assert(D.criticFor(999).name, "criticFor should wrap rather than return undefined");
  assert(D.criticFor(-1).name, "criticFor should handle negative indices");
});

check("search terms are tokenised, so order does not matter", () => {
  const a = D.search("dark knight").map((m) => m.id).sort();
  const b = D.search("knight dark").map((m) => m.id).sort();
  assert(JSON.stringify(a) === JSON.stringify(b), "search is order-sensitive");
});

/* =============================================================================
   RESULT
========================================================================= */
const total = passed + failures.length;
process.stdout.write("\n" + "-".repeat(58) + "\n");
if (failures.length) {
  process.stdout.write(`FAILED  ${failures.length} of ${total} checks\n\n`);
  failures.forEach((f) => {
    process.stdout.write(`  ${f.name}\n    ${f.err.message}\n\n`);
  });
  process.exit(1);
}
process.stdout.write(`PASSED  all ${total} checks\n`);
process.stdout.write("-".repeat(58) + "\n\n");
