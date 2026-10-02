/* =============================================================================
   CineReview — artwork generator
   -----------------------------------------------------------------------------
   Produces the local SVG artwork referenced by js/data.js:

     images/movie-posters/<id>.svg   2:3   (500 x 750)  used on movie cards
     images/banners/<id>.svg         16:9  (1600 x 900) used on the hero + details

   Why SVG rather than downloaded photography:
     - The site stays fully offline and ships with no licensing questions.
     - <defs>, gradients and filters are crisp at any size, so posters stay sharp
       on 4K displays and retina phones.
     - Regenerating after editing the dataset is a single command.

   Usage
     node tools/gen-posters.mjs            → writes/overwrites all files
     node tools/gen-posters.mjs --clean    → deletes generated files, then stops

   Every visual is derived deterministically from the movie id, so re-running the
   script produces byte-identical output and a movie never changes its look.
   ========================================================================== */

import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POSTER_DIR = join(ROOT, "images", "movie-posters");
const BANNER_DIR = join(ROOT, "images", "banners");

/* ---------------------------------------------------------------------------
   Deterministic pseudo-randomness
   A tiny string hash feeds a seeded PRNG (mulberry32). Same id → same art.
------------------------------------------------------------------------- */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------------------
   Palette
   Each movie's accent colour from js/data.js anchors a three-stop palette:
   a near-black base, a deep tinted mid-tone, and the bright accent.
------------------------------------------------------------------------- */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

/**
 * Blends two colours. Both arguments are accepted as "#rrggbb" or as an
 * {r,g,b} object, because mix() returns a hex string — passing one of its own
 * outputs straight back in used to silently produce "#NaNNaNNaN", which is how
 * 206 of the generated colours ended up invalid.
 */
function mix(a, b, t) {
  const from = typeof a === "string" ? hexToRgb(a) : a;
  const to = typeof b === "string" ? hexToRgb(b) : b;
  return rgbToHex({
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t
  });
}

function buildPalette(accentHex, rand) {
  const accent = hexToRgb(accentHex);
  const white = { r: 246, g: 246, b: 248 };
  /* The base has to read as an image at 216px on the Movies grid, not as a dark
     rectangle that looks like a missing file. So the tints are mixed much
     further towards the accent than they used to be: the old near-black base
     rendered at luminance ~15 against a page background of 8, which is why the
     posters read as "no image" until you opened a details page. */
  const deep = mix({ r: 26, g: 24, b: 34 }, accent, 0.42 + rand() * 0.14);
  const mid = mix({ r: 44, g: 41, b: 58 }, accent, 0.5 + rand() * 0.2);
  const glow = mix(accent, white, 0.34);
  return { accent: accentHex, deep, mid, glow, ink: mix(deep, { r: 0, g: 0, b: 0 }, 0.25) };
}

/* ---------------------------------------------------------------------------
   Shared SVG fragments
------------------------------------------------------------------------- */

/** Film grain + a slight vignette, reused by both formats. */
function texture(uid, p, strength) {
  return `
    <filter id="grain-${uid}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="${uid.length * 7 + 3}" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="${strength}"/></feComponentTransfer>
    </filter>
    <radialGradient id="vig-${uid}" cx="50%" cy="42%" r="78%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.38"/>
    </radialGradient>`;
}

function grainLayer(uid, w, h, opacity) {
  return `<rect width="${w}" height="${h}" filter="url(#grain-${uid})" opacity="${opacity}"/>`;
}

function vignette(uid, w, h, opacity) {
  return `<rect width="${w}" height="${h}" fill="url(#vig-${uid})" opacity="${opacity}"/>`;
}

/* ---------------------------------------------------------------------------
   MOTIFS
   Each returns SVG markup drawn inside the art box, using the palette.
   Kept deliberately graphic — silhouettes, light and geometry rather than
   illustration, so the poster reads well behind body copy.
------------------------------------------------------------------------- */
const MOTIFS = {
  /* Concentric rings — sonnet / hypnosis / orbit */
  rings(p, r, w, h) {
    const cx = w * (0.5 + (r() - 0.5) * 0.2);
    const cy = h * 0.42;
    const max = Math.max(w, h) * 0.62;
    let out = "";
    for (let i = 1; i <= 13; i++) {
      const rad = (max / 13) * i;
      out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}"
        fill="none" stroke="${p.glow}" stroke-width="${(1.6 - i * 0.07).toFixed(2)}"
        opacity="${(0.5 - i * 0.03).toFixed(2)}"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="${(max / 13).toFixed(1)}" fill="${p.glow}" opacity="0.9"/>`;
    out += horizon(p, w, h, 0.72);
    return out;
  },

  /* Projector beams from the bottom — cinema, spectacle, the house */
  beams(p, r, w, h) {
    const cx = w * (0.5 + (r() - 0.5) * 0.1);
    let out = "";
    for (let i = 0; i < 7; i++) {
      const spread = (r() - 0.5) * 0.9;
      const wTop = 6 + r() * 26;
      out += `<path d="M ${cx} ${h * 1.05} L ${cx + spread * w - wTop} ${-h * 0.1}
        L ${cx + spread * w + wTop} ${-h * 0.1} Z"
        fill="${p.glow}" opacity="${(0.06 + r() * 0.1).toFixed(3)}"/>`;
    }
    out += `<ellipse cx="${cx}" cy="${h * 0.14}" rx="${w * 0.5}" ry="${h * 0.13}"
      fill="${p.glow}" opacity="0.22" filter="url(#soft-${MOTIFS._uid})"/>`;
    return out;
  },

  /* Retro sun with horizontal slits — seventies, horizon, title card */
  sun(p, r, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.52;
    const rad = Math.min(w, h) * 0.34;
    let out = `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${p.glow}" opacity="0.92"/>`;
    for (let i = 0; i < 7; i++) {
      const y = cy + rad * 0.18 + i * rad * 0.13;
      const gap = (rad * 2.6) / (i + 2.6);
      out += `<rect x="${cx - gap / 2}" y="${y.toFixed(1)}" width="${gap.toFixed(1)}"
        height="${(rad * 0.055).toFixed(1)}" fill="${p.deep}" opacity="0.92"/>`;
    }
    out += horizon(p, w, h, 0.78);
    return out;
  },

  /* Perspective grid — synthwave, digital, the future */
  grid(p, r, w, h) {
    const hz = h * 0.48;
    let out = `<rect x="0" y="${hz}" width="${w}" height="${h - hz}" fill="${p.ink}" opacity="0.55"/>`;
    out += `<line x1="0" y1="${hz}" x2="${w}" y2="${hz}" stroke="${p.glow}" stroke-width="2" opacity="0.8"/>`;
    for (let i = 1; i <= 15; i++) {
      const x = (w / 15) * i;
      out += `<line x1="${w / 2}" y1="${hz}" x2="${x.toFixed(1)}" y2="${h}"
        stroke="${p.glow}" stroke-width="1" opacity="0.3"/>`;
    }
    for (let i = 1; i <= 9; i++) {
      const t = i / 9;
      const y = hz + Math.pow(t, 2.3) * (h - hz);
      out += `<line x1="0" y1="${y.toFixed(1)}" x2="${w}" y2="${y.toFixed(1)}"
        stroke="${p.glow}" stroke-width="${(0.8 + t).toFixed(1)}" opacity="${(0.16 + t * 0.34).toFixed(2)}"/>`;
    }
    return out;
  },

  /* Mountain silhouettes — the road, the frontier, the journey */
  peaks(p, r, w, h) {
    let out = "";
    for (let layer = 0; layer < 4; layer++) {
      const t = layer / 3;
      const baseY = h * (0.5 + t * 0.13);
      let d = `M -10 ${h + 10} L -10 ${baseY.toFixed(1)}`;
      const steps = 9;
      for (let i = 0; i <= steps; i++) {
        const x = (w / steps) * i;
        const jitter = Math.sin(i * 1.7 + layer * 2.1 + r() * 0.4) * h * 0.055 * (1 - t * 0.5);
        const y = baseY + jitter;
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      d += ` L ${w + 10} ${h + 10} Z`;
      out += `<path d="${d}" fill="${mix(p.mid, p.ink, t)}" opacity="${(0.9 - t * 0.12).toFixed(2)}"/>`;
    }
    return out;
  },

  /* Spotlight cones — stage, interrogation, interrogation light */
  spots(p, r, w, h) {
    let out = "";
    for (let i = 0; i < 4; i++) {
      const cx = w * (0.16 + r() * 0.68);
      const sw = w * (0.1 + r() * 0.12);
      out += `<path d="M ${cx} -10 L ${cx - sw} ${h * 1.05} L ${cx + sw} ${h * 1.05} Z"
        fill="${p.glow}" opacity="${(0.07 + r() * 0.09).toFixed(3)}"/>`;
    }
    out += `<rect x="0" y="0" width="${w}" height="${h * 0.1}" fill="${p.ink}" opacity="0.7"/>`;
    return out;
  },

  /* Sine waves — sound, score, rhythm */
  waves(p, r, w, h) {
    let out = "";
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const y = h * (0.16 + t * 0.72);
      const amp = h * (0.05 + r() * 0.07);
      const freq = 1.1 + r() * 2.2;
      let d = `M -10 ${y.toFixed(1)}`;
      for (let x = 0; x <= w + 10; x += w / 22) {
        d += ` L ${x.toFixed(1)} ${(y + Math.sin((x / w) * Math.PI * 2 * freq + i) * amp).toFixed(1)}`;
      }
      out += `<path d="${d}" fill="none" stroke="${p.glow}"
        stroke-width="${(2.4 - t * 1.6).toFixed(1)}" opacity="${(0.55 - t * 0.38).toFixed(2)}"/>`;
    }
    return out;
  },

  /* Radial burst — impact, arrival, the moment before */
  burst(p, r, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.4;
    let out = "";
    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28;
      const len = Math.max(w, h) * (0.6 + r() * 0.5);
      out += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * len).toFixed(1)}"
        y2="${(cy + Math.sin(a) * len).toFixed(1)}" stroke="${p.glow}"
        stroke-width="${(0.8 + r() * 2.4).toFixed(1)}" opacity="${(0.08 + r() * 0.3).toFixed(2)}"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.16}" fill="${p.glow}" opacity="0.85"/>`;
    return out;
  },

  /* Stacked film frames — cinema itself, the archive, celluloid */
  frames(p, r, w, h) {
    let out = "";
    const fw = w * 0.68;
    const fh = fw * 0.6;
    for (let i = 0; i < 5; i++) {
      const y = h * (0.14 + i * 0.14);
      const rot = (r() - 0.5) * 7;
      out += `<g transform="rotate(${rot.toFixed(2)} ${(w / 2).toFixed(1)} ${(y + fh / 2).toFixed(1)})">
        <rect x="${((w - fw) / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}"
          fill="none" stroke="${p.glow}" stroke-width="2" opacity="${(0.5 - i * 0.07).toFixed(2)}"/>
      </g>`;
    }
    out += `<circle cx="${w * 0.5}" cy="${h * 0.74}" r="${Math.min(w, h) * 0.15}" fill="${p.glow}" opacity="0.55"/>`;
    return out;
  },

  /* Vertical light bars — interrogation, jail, the institution */
  bars(p, r, w, h) {
    let out = "";
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const x = (w / n) * i;
      out += `<rect x="${(x - 5).toFixed(1)}" y="0" width="10" height="${h}" fill="${p.ink}" opacity="0.68"/>`;
    }
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) {
        const x = (w / n) * i;
        out += `<rect x="${x.toFixed(1)}" y="${(h * 0.42).toFixed(1)}" width="${(w / n).toFixed(1)}"
          height="${(h * 0.58).toFixed(1)}" fill="${p.glow}" opacity="${(0.04 + r() * 0.08).toFixed(3)}"/>`;
      }
    }
    return out;
  },

  /* Wide diagonal chevrons — motion, chase, momentum */
  chevrons(p, r, w, h) {
    let out = "";
    const band = h * 0.115;
    for (let i = 0; i < 14; i++) {
      const y = -h * 0.1 + i * band;
      const off = (i % 2 === 0 ? 0 : w * 0.5);
      out += `<path d="M ${off} ${y} L ${off + w * 0.5} ${y} L ${off + w * 0.5 - band * 0.75} ${y + band}
        L ${off - band * 0.75} ${y + band} Z"
        fill="${p.glow}" opacity="${i % 2 === 0 ? 0.14 + r() * 0.12 : 0.03}"/>`;
    }
    return out;
  },

  /* Overlapping circles — ensemble, many lives, collision */
  orbs(p, r, w, h) {
    let out = "";
    for (let i = 0; i < 9; i++) {
      const cx = w * r();
      const cy = h * r();
      const rad = Math.min(w, h) * (0.1 + r() * 0.24);
      out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}"
        fill="${p.glow}" opacity="${(0.06 + r() * 0.12).toFixed(3)}"/>`;
    }
    return out;
  },

  /* A single hard-edged diagonal — the minimalist, architectural one */
  slash(p, r, w, h) {
    const tilt = -34 - r() * 22;
    return `<g transform="rotate(${tilt.toFixed(1)} ${(w / 2).toFixed(1)} ${(h / 2).toFixed(1)})">
      <rect x="${-w}" y="${(h * 0.42).toFixed(1)}" width="${w * 3}" height="${(h * 0.1).toFixed(1)}"
        fill="${p.glow}" opacity="0.55"/>
      <rect x="${-w}" y="${(h * 0.56).toFixed(1)}" width="${w * 3}" height="${(h * 0.035).toFixed(1)}"
        fill="${p.glow}" opacity="0.3"/>
      <rect x="${-w}" y="${(h * 0.66).toFixed(1)}" width="${w * 3}" height="${(h * 0.012).toFixed(1)}"
        fill="${p.glow}" opacity="0.18"/>
    </g>`;
  },

  /* Ripple rings from a single point — water, signal, wavefront */
  ripple(p, r, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.55;
    let out = "";
    for (let i = 1; i <= 16; i++) {
      const rad = (Math.max(w, h) / 16) * i;
      out += `<ellipse cx="${cx}" cy="${cy}" rx="${rad.toFixed(1)}" ry="${(rad * 0.36).toFixed(1)}"
        fill="none" stroke="${p.glow}" stroke-width="${(1.8 - i * 0.09).toFixed(2)}"
        opacity="${(0.45 - i * 0.026).toFixed(2)}"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.06}" fill="${p.glow}" opacity="0.9"/>`;
    return out;
  },

  /* Interlocking solid shapes — the graphic, poster-as-poster one */
  shapes(p, r, w, h) {
    let out = "";
    const kinds = [
      () => `<rect x="${(w * r() * 0.4).toFixed(1)}" y="${(h * r() * 0.4).toFixed(1)}" width="${w * 0.4}" height="${h * 0.34}" fill="${p.glow}" opacity="0.5" transform="rotate(${(r() * 40 - 20).toFixed(1)} ${w * 0.4} ${h * 0.4})"/>`,
      () => `<circle cx="${w * (0.25 + r() * 0.5)}" cy="${h * (0.25 + r() * 0.5)}" r="${Math.min(w, h) * (0.14 + r() * 0.16)}" fill="${p.glow}" opacity="0.42"/>`,
      () => `<path d="M ${(w * r() * 0.5).toFixed(1)} ${(h * (0.3 + r() * 0.4)).toFixed(1)} L ${(w * (0.5 + r() * 0.5)).toFixed(1)} ${(h * r() * 0.4).toFixed(1)} L ${(w * (0.3 + r() * 0.6)).toFixed(1)} ${(h * (0.6 + r() * 0.4)).toFixed(1)} Z" fill="${p.glow}" opacity="0.34"/>`,
      () => `<rect x="${(w * r() * 0.5).toFixed(1)}" y="${(h * r() * 0.5).toFixed(1)}" width="${w * 0.62}" height="${h * 0.02}" fill="${p.glow}" opacity="0.55" transform="rotate(${(-40 + r() * 80).toFixed(1)} ${w * 0.5} ${h * 0.5})"/>`
    ];
    for (let i = 0; i < 5; i++) out += kinds[Math.floor(r() * kinds.length)]();
    return out;
  }
};

/** A dark ground plane with a bright horizon line. */
function horizon(p, w, h, opacity) {
  const y = h * 0.72;
  return `
    <rect x="0" y="${y}" width="${w}" height="${h - y}" fill="${p.ink}" opacity="${opacity}"/>
    <line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${p.glow}" stroke-width="2" opacity="0.75"/>`;
}

const MOTIF_NAMES = Object.keys(MOTIFS).filter((k) => k !== "_uid");

/* ---------------------------------------------------------------------------
   TITLE MEASUREMENT
   The lockup has to be measured, not counted. Earlier passes sized the title
   from `line.length * size * 0.58`, which badly understates a bold serif set in
   caps — Georgia Bold's M is 1.00em and W is 1.08em, so "REDEMPTION" is ~7.7em,
   not the ~5.8em the estimate assumed, and long words ran off the right edge of
   the 500px canvas. This table is Georgia Bold advance widths in em units, so
   wrapping happens on real widths.
------------------------------------------------------------------------- */
const GLYPH_EM = {
  A: 0.78, B: 0.75, C: 0.76, D: 0.83, E: 0.73, F: 0.68, G: 0.84, H: 0.87,
  I: 0.39, J: 0.55, K: 0.8, L: 0.68, M: 1.0, N: 0.88, O: 0.85, P: 0.72,
  Q: 0.85, R: 0.79, S: 0.7, T: 0.74, U: 0.85, V: 0.78, W: 1.08, X: 0.79,
  Y: 0.75, Z: 0.7,
  "0": 0.58, "1": 0.58, "2": 0.58, "3": 0.58, "4": 0.58, "5": 0.58,
  "6": 0.58, "7": 0.58, "8": 0.58, "9": 0.58,
  " ": 0.3, "-": 0.4, "–": 0.5, "'": 0.26, "’": 0.26, '"': 0.4, ".": 0.32,
  ",": 0.32, ":": 0.35, ";": 0.35, "!": 0.36, "?": 0.6, "&": 0.85, "/": 0.4,
  "+": 0.72, "(": 0.42, ")": 0.42
};
const GLYPH_EM_FALLBACK = 0.74;
const TITLE_TRACKING = -1.4;

/** Rendered width of an all-caps run at `size`, letter-spacing included. */
function titleWidth(text, size) {
  let em = 0;
  for (const ch of text) em += GLYPH_EM[ch] !== undefined ? GLYPH_EM[ch] : GLYPH_EM_FALLBACK;
  return em * size + TITLE_TRACKING * text.length;
}

/** Greedy wrap to `maxWidth` at `size`. Never splits a word. */
function wrapTitle(words, size, maxWidth) {
  const out = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? line + " " + word : word;
    if (line && titleWidth(test.toUpperCase(), size) > maxWidth) {
      out.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) out.push(line);
  return out;
}

/* ---------------------------------------------------------------------------
   POSTER — 500 x 750, carries the title lockup
------------------------------------------------------------------------- */
function buildPoster(movie) {
  const uid = movie.id;
  const rand = rng(hash(uid));
  const p = buildPalette(movie.accent, rand);
  const motifName = MOTIF_NAMES[hash(uid + "motif") % MOTIF_NAMES.length];
  MOTIFS._uid = uid;

  const W = 500;
  const H = 750;

  /* Title layout: pick the largest size at which the whole title, wrapped on
     real glyph widths, still clears both side margins. Walking down from a
     generous ceiling keeps short titles punchy while guaranteeing that a long
     one ("The Shawshank Redemption") shrinks instead of running off the edge. */
  const TITLE_X = 46;
  /* 12px of slack inside the margin. The glyph table is an approximation, and
     a line that ends flush with the margin reads as clipped even when it is
     not, which is exactly the complaint this pass is fixing. */
  const TITLE_MAX = W - TITLE_X * 2 - 12;
  const words = movie.title.split(" ");
  const upper = movie.title.toUpperCase();

  let fontSize = 0;
  let lines = [];
  for (let size = 68; size >= 26; size -= 1) {
    const wrapped = wrapTitle(words, size, TITLE_MAX);
    const fits = wrapped.every((line) => titleWidth(line.toUpperCase(), size) <= TITLE_MAX);
    if (fits) {
      fontSize = size;
      lines = wrapped;
      break;
    }
  }
  /* A single word too wide for the box even at the floor: break it by character
     rather than let it bleed past the margin. */
  if (!fontSize) {
    fontSize = 26;
    lines = [];
    let line = "";
    for (const ch of upper) {
      if (titleWidth(line + ch, fontSize) > TITLE_MAX && line) {
        lines.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
    if (line) lines.push(line);
  }

  const lineHeight = fontSize * 1.06;
  const blockTop = H - 128 - (lines.length - 1) * lineHeight;
  const titleMarkup = lines
    .map(
      (line, i) =>
        `<text x="${TITLE_X}" y="${(blockTop + i * lineHeight).toFixed(1)}"
          font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize.toFixed(0)}" font-weight="700"
          fill="#ffffff" letter-spacing="-1.4">${escapeXml(line.toUpperCase())}</text>`
    )
    .join("\n      ");

  /* A hairline rule + year, the way a poster credits block would sit. */
  const ruleY = blockTop - fontSize * 0.42;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(movie.title)} poster">
  <title>${escapeXml(movie.title)} (${movie.year})</title>
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${p.mid}"/>
      <stop offset="60%" stop-color="${p.deep}"/>
      <stop offset="100%" stop-color="${p.ink}"/>
    </linearGradient>
    <filter id="soft-${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${W * 0.05}"/>
    </filter>
    ${texture(uid, p, 0.28)}
    <linearGradient id="fade-${uid}" x1="0" y1="0.35" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="62%" stop-color="#000" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.8"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg-${uid})"/>
  <g>${MOTIFS[motifName](p, rand, W, H)}</g>
  <rect width="${W}" height="${H}" fill="url(#fade-${uid})"/>
  ${vignette(uid, W, H, 0.55)}
  ${grainLayer(uid, W, H, 0.4)}

  <line x1="46" y1="${ruleY.toFixed(1)}" x2="${W - 46}" y2="${ruleY.toFixed(1)}"
    stroke="#ffffff" stroke-width="1" opacity="0.32"/>
  <text x="46" y="${(blockTop + lines.length * lineHeight + 12).toFixed(1)}"
    font-family="Helvetica, Arial, sans-serif" font-size="21" font-weight="600"
    fill="#ffffff" opacity="0.82" letter-spacing="5">${movie.year}</text>
  <text x="${W - 46}" y="${(blockTop + lines.length * lineHeight + 12).toFixed(1)}"
    text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="18"
    fill="#ffffff" opacity="0.55" letter-spacing="3">${escapeXml(movie.rating.toFixed(1))}</text>

  ${titleMarkup}
</svg>
`;
}

/* ---------------------------------------------------------------------------
   BANNER — 1600 x 900, deliberately text-free.
   The hero and details page lay their own headline over it, so the art stays
   reusable across pages and needs no per-page variants.
------------------------------------------------------------------------- */
function buildBanner(movie) {
  const uid = movie.id + "-bn";
  const rand = rng(hash(movie.id + "banner"));
  const p = buildPalette(movie.accent, rand);
  const motifName = MOTIF_NAMES[(hash(movie.id + "motif") + 5) % MOTIF_NAMES.length];
  MOTIFS._uid = uid;

  const W = 1600;
  const H = 900;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(movie.title)} backdrop">
  <title>${escapeXml(movie.title)} — banner</title>
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="${p.mid}"/>
      <stop offset="55%" stop-color="${p.deep}"/>
      <stop offset="100%" stop-color="${p.ink}"/>
    </linearGradient>
    <filter id="soft-${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${W * 0.04}"/>
    </filter>
    ${texture(uid, p, 0.22)}
    <linearGradient id="side-${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${p.ink}" stop-opacity="0.92"/>
      <stop offset="52%" stop-color="${p.ink}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${p.ink}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="halo-${uid}" cx="72%" cy="46%" r="46%">
      <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg-${uid})"/>
  <rect width="${W}" height="${H}" fill="url(#halo-${uid})"/>
  <g>${MOTIFS[motifName](p, rand, W, H)}</g>
  <rect width="${W}" height="${H}" fill="url(#side-${uid})"/>
  ${vignette(uid, W, H, 0.8)}
  ${grainLayer(uid, W, H, 0.42)}
</svg>
`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------------------------------------------------------------------------
   Movie list — read straight out of js/data.js so there is one source of truth.
   The data file is a browser IIFE, so we evaluate it in a throwaway sandbox
   with a fake `window`, then pull the array back out.
------------------------------------------------------------------------- */
function loadMovies() {
  const dataFile = join(ROOT, "js", "data.js");
  const source = readFileSync(dataFile, "utf8");
  const sandbox = { window: {} };
  // The data file is a browser IIFE that assigns to `window`. Running it here
  // with a fake window keeps js/data.js the single source of truth for titles,
  // ids and accent colours — no duplicated list to maintain in this script.
  new Function("window", source)(sandbox.window);
  const list = sandbox.window.CR && sandbox.window.CR.data && sandbox.window.CR.data.movies;
  if (!Array.isArray(list)) {
    throw new Error("Could not read CR.data.movies from js/data.js — check that the data file parses.");
  }
  return list;
}

/* ---------------------------------------------------------------------------
   MAIN
------------------------------------------------------------------------- */
const cleanOnly = process.argv.includes("--clean");

if (cleanOnly) {
  [POSTER_DIR, BANNER_DIR].forEach((dir) => {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  });
  console.log("Removed images/movie-posters/ and images/banners/");
  process.exit(0);
}

const movies = loadMovies();
[POSTER_DIR, BANNER_DIR].forEach((dir) => mkdirSync(dir, { recursive: true }));

let posters = 0;
let banners = 0;

movies.forEach((movie) => {
  writeFileSync(join(POSTER_DIR, `${movie.id}.svg`), buildPoster(movie), "utf8");
  writeFileSync(join(BANNER_DIR, `${movie.id}.svg`), buildBanner(movie), "utf8");
  posters++;
  banners++;
});

console.log(`Generated ${posters} posters  -> images/movie-posters/`);
console.log(`Generated ${banners} banners  -> images/banners/`);
console.log(`\nRe-run after editing js/data.js:\n  node tools/gen-posters.mjs`);
