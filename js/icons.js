/* =============================================================================
   CineReview — icon set
   -----------------------------------------------------------------------------
   Inline SVG strings rather than an icon font or sprite file:
     - No network request, no FOUT, no extra <link>.
     - stroke="currentColor" means every icon inherits its colour from CSS.

   All icons are 24x24 on a shared grid and use round caps/joins.
   ========================================================================== */

(function () {
  "use strict";

  /** Wraps a path in a 24x24 stroked <svg>. */
  function stroke(paths, extra) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (extra || "") +
      ">" +
      paths +
      "</svg>"
    );
  }

  /** Wraps a path in a 24x24 filled <svg> (used for the star). */
  function fill(paths) {
    return (
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + paths + "</svg>"
    );
  }

  const STAR = '<path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5 6.2 20.5l1.1-6.5L2.6 9.45l6.5-.95z"/>';

  const ICONS = {
    /* --- brand & navigation --- */
    clapper:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M2.4 5.2l1.9-.8 16 4-1.2 3.4-.6-.15L2.6 7.6z"/>' +
      '<path d="M3.6 8.9c0-.7.5-1.2 1.2-1.2h14.4c.7 0 1.2.5 1.2 1.2v10.5c0 .7-.5 1.2-1.2 1.2H4.8c-.7 0-1.2-.5-1.2-1.2z"/>' +
      "</svg>",
    menu: stroke('<path d="M3 6h18M3 12h18M3 18h18"/>'),
    close: stroke('<path d="M18 6L6 18M6 6l12 12"/>'),
    chevronLeft: stroke('<path d="M15 5l-7 7 7 7"/>'),
    chevronRight: stroke('<path d="M9 5l7 7-7 7"/>'),
    arrowRight: stroke('<path d="M4 12h15M13 6l6 6-6 6"/>'),
    arrowUpRight: stroke('<path d="M7 17L17 7M8 7h9v9"/>'),
    sun: stroke(
      '<circle cx="12" cy="12" r="4.2"/>' +
        '<path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/>'
    ),
    moon: stroke('<path d="M20.5 14.3A8.6 8.6 0 019.7 3.5a8.6 8.6 0 1010.8 10.8z"/>'),

    /* --- search & filters --- */
    search: stroke('<circle cx="11" cy="11" r="7"/><path d="M16.2 16.2L21 21"/>'),
    caret: stroke('<path d="M6 9l6 6 6-6"/>'),
    filter: stroke('<path d="M3 6h18M6 12h12M10 18h4"/>'),

    /* --- ratings --- */
    star: fill(STAR),
    starOutline: stroke(
      '<path d="M12 3.2l2.75 5.57 6.15.9-4.45 4.33 1.05 6.13L12 17.2l-5.5 2.93 1.05-6.13L3.1 9.67l6.15-.9z"/>'
    ),

    /* --- media --- */
    play: fill('<path d="M7.5 4.8v14.4c0 .8.9 1.3 1.6.9l11.3-7.2a1.05 1.05 0 000-1.8L9.1 3.9c-.7-.4-1.6.1-1.6.9z"/>'),
    bookmark:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M6 3.5h12a1 1 0 011 1v16.2a.6.6 0 01-.95.48L12 15.9l-6.05 5.28A.6.6 0 015 20.7V4.5a1 1 0 011-1z"/></svg>',
    bookmarkFill:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M6 3.5h12a1 1 0 011 1v16.2a.6.6 0 01-.95.48L12 15.9l-6.05 5.28A.6.6 0 015 20.7V4.5a1 1 0 011-1z"/></svg>',
    film: stroke(
      '<rect x="2.8" y="4.5" width="18.4" height="15" rx="2"/>' +
        '<path d="M7.5 4.5v15M16.5 4.5v15M2.8 9.2h4.7M2.8 14.8h4.7M16.5 9.2h4.7M16.5 14.8h4.7"/>'
    ),
    ticket: stroke(
      '<path d="M3 8.5V6.8A1.8 1.8 0 014.8 5h14.4A1.8 1.8 0 0121 6.8v1.7a3 3 0 000 5.9v1.8a1.8 1.8 0 01-1.8 1.8H4.8A1.8 1.8 0 013 16.2v-1.8a3 3 0 000-5.9z"/>' +
        '<path d="M14 5v14"/>'
    ),
    clock: stroke('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>'),
    calendar:
      stroke('<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>'),
    user: stroke('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0115 0"/>'),
    users: stroke(
      '<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20.5a6.5 6.5 0 0113 0"/><path d="M16.5 4.6a3.6 3.6 0 010 6.9M18 14.6a6.5 6.5 0 013.5 5.9"/>'
    ),
    director: stroke(
      '<circle cx="12" cy="7" r="3.4"/><path d="M4 20.8a8 8 0 0116 0"/><path d="M18.5 3.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z"/>'
    ),
    tag: stroke(
      '<path d="M3.5 11.6V4.8A1.3 1.3 0 014.8 3.5h6.8a1.3 1.3 0 01.92.38l8.1 8.1a1.3 1.3 0 010 1.84l-6.8 6.8a1.3 1.3 0 01-1.84 0l-8.1-8.1a1.3 1.3 0 01-.38-.92z"/>' +
        '<circle cx="7.8" cy="7.8" r="1.5"/>'
    ),
    quote: fill(
      '<path d="M9.5 5.5c-3.6 1.5-5.9 4.6-5.9 8.4 0 2.8 1.6 4.6 3.9 4.6 2 0 3.5-1.4 3.5-3.3 0-1.8-1.3-3.1-3-3.1-.3 0-.6 0-.8.1.4-1.9 1.9-3.6 3.8-4.6zM20.4 5.5c-3.6 1.5-5.9 4.6-5.9 8.4 0 2.8 1.6 4.6 3.9 4.6 2 0 3.5-1.4 3.5-3.3 0-1.8-1.3-3.1-3-3.1-.3 0-.6 0-.8.1.4-1.9 1.9-3.6 3.8-4.6z"/>'
    ),

    /* --- pros / cons --- */
    check: stroke('<circle cx="12" cy="12" r="9.2"/><path d="M8 12.3l2.7 2.7L16.2 9.5"/>'),
    cross: stroke('<circle cx="12" cy="12" r="9.2"/><path d="M9 9l6 6M15 9l-6 6"/>'),

    /* --- states --- */
    key: stroke(
      '<circle cx="8" cy="12" r="4.2"/>' +
        '<path d="M12.2 12H21M18.4 12v3.4M15.4 12v2.4"/>'
    ),

    /* --- contact & social --- */
    mail: stroke(
      '<rect x="2.8" y="5" width="18.4" height="14" rx="2"/>' +
        '<path d="M3.5 6.5l8.5 6 8.5-6"/>'
    ),
    phone: stroke(
      '<path d="M6.3 3.5h3l1.5 3.8-2 1.3a12.5 12.5 0 006.6 6.6l1.3-2 3.8 1.5v3a2 2 0 01-2.2 2A16.8 16.8 0 014.3 5.7a2 2 0 012-2.2z"/>'
    ),
    pin: stroke(
      '<path d="M12 21.5s7-5.9 7-11.1A7 7 0 005 10.4c0 5.2 7 11.1 7 11.1z"/><circle cx="12" cy="10.2" r="2.7"/>'
    ),
    x: fill(
      '<path d="M17.6 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.1h1.7L7.6 4.8H5.8z"/>'
    ),
    instagram: stroke(
      '<rect x="3.5" y="3.5" width="17" height="17" rx="4.6"/>' +
        '<circle cx="12" cy="12" r="3.9"/>' +
        '<circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" stroke="none"/>'
    ),
    facebook: fill(
      '<path d="M13.5 21.5v-8h2.7l.4-3.1h-3.1V8.4c0-.9.25-1.5 1.55-1.5h1.65V4.06A22 22 0 0014.3 3.9c-2.4 0-4 1.46-4 4.14V10.4H7.6v3.1h2.7v8z"/>'
    ),
    youtube: fill(
      '<path d="M21.6 8.2a2.5 2.5 0 00-1.76-1.77C18.25 6 12 6 12 6s-6.25 0-7.84.43A2.5 2.5 0 002.4 8.2 26 26 0 002 12a26 26 0 00.4 3.8 2.5 2.5 0 001.76 1.77C5.75 18 12 18 12 18s6.25 0 7.84-.43a2.5 2.5 0 001.76-1.77A26 26 0 0022 12a26 26 0 00-.4-3.8zM10 14.6V9.4l5.2 2.6z"/>'
    ),
    instagramFill: stroke(
      '<rect x="3.5" y="3.5" width="17" height="17" rx="4.6"/>' +
        '<circle cx="12" cy="12" r="3.9"/>' +
        '<circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" stroke="none"/>'
    ),
    link: stroke(
      '<path d="M10 13.6a4 4 0 005.66 0l3-3A4 4 0 1013 5l-1.7 1.7"/>' +
        '<path d="M14 10.4a4 4 0 00-5.66 0l-3 3A4 4 0 1011 19l1.7-1.7"/>'
    ),

    /* --- misc --- */
    heart:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 20.4l-1.4-1.27C5.4 14.3 2 11.2 2 7.5 2 4.5 4.4 2.1 7.4 2.1c1.7 0 3.35.8 4.6 2.1a6 6 0 014.6-2.1c3 0 5.4 2.4 5.4 5.4 0 3.7-3.4 6.8-8.6 11.6z"/></svg>',
    check_small: stroke('<path d="M4.5 12.5l5 5 10-11"/>'),
    info: stroke('<circle cx="12" cy="12" r="9.2"/><path d="M12 11v6M12 7.6v.2"/>'),
    sparkle: fill(
      '<path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z"/><path d="M18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/>'
    ),
    eye: stroke('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    edit: stroke('<path d="M15.5 4.5l4 4L8 20H4v-4z"/><path d="M13.5 6.5l4 4"/>'),
    book: stroke('<path d="M4 4.5h6a3 3 0 013 3v12a2.4 2.4 0 00-2.4-2.2H4z"/><path d="M20 4.5h-6a3 3 0 00-3 3v12a2.4 2.4 0 012.4-2.2H20z"/>'),
    inbox: stroke(
      '<path d="M3 13h4.5l1.5 3h6l1.5-3H21"/>' +
        '<path d="M5.3 5.3l-2.3 7.7v5a2 2 0 002 2h13.9a2 2 0 002-2v-5l-2.3-7.7a2 2 0 00-1.9-1.5H7.2a2 2 0 00-1.9 1.5z"/>'
    )
  };

  /* --- logo lockup, reused in the header and footer ----------------------- */
  ICONS.logoMark = ICONS.clapper;

  window.CR = window.CR || {};
  window.CR.icons = ICONS;

  /** Small helper: ICONS.checkout returns the markup for a named icon. */
  window.CR.icon = function (name, attrs) {
    const svg = ICONS[name];
    if (!svg) return "";
    if (!attrs) return svg;
    return svg.replace("<svg ", "<svg " + attrs + " ");
  };
})();
