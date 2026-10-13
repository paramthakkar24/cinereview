/* =============================================================================
   CineReview — authentication (Phase 1)
   -----------------------------------------------------------------------------
   Thin wrapper around Supabase Auth. Exposes window.CR.auth and renders the
   header account control ([data-account]) on every page.

   Design notes
   ------------
   * Degrades gracefully. If config has no supabaseUrl / supabaseAnonKey, or the
     Supabase SDK failed to load, the site keeps working: the account control
     shows a disabled "Sign in" that explains setup is pending, and nothing
     throws. This lets the whole build run locally before the backend exists.
   * Single client. Created once and shared as window.CR.sb so ratings/comments
     reuse the same session.
   * Session is persisted by the SDK (localStorage) and restored on load. We
     also subscribe to onAuthStateChange so every tab/page reflects login state.
   ========================================================================== */
(function () {
  "use strict";

  window.CR = window.CR || {};

  var cfg = (window.CR.config && window.CR.config) || {};
  var listeners = [];
  var state = { ready: false, configured: false, user: null, profile: null };

  /* ----------------------------------------------------------------------- */
  /* Client bootstrap                                                        */
  /* ----------------------------------------------------------------------- */
  function sdk() {
    // The UMD build exposes a global `supabase` with createClient.
    return window.supabase && typeof window.supabase.createClient === "function"
      ? window.supabase
      : null;
  }

  function configured() {
    return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && sdk());
  }

  var client = null;
  function getClient() {
    if (client) return client;
    if (!configured()) return null;
    client = sdk().createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.CR.sb = client;
    return client;
  }

  /* ----------------------------------------------------------------------- */
  /* State plumbing                                                          */
  /* ----------------------------------------------------------------------- */
  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) { /* a bad listener must not break others */ }
    });
    renderAccount();
  }

  function onChange(fn) {
    listeners.push(fn);
    if (state.ready) { try { fn(state); } catch (e) {} }
    return function () {
      listeners = listeners.filter(function (f) { return f !== fn; });
    };
  }

  async function loadProfile(user) {
    if (!user) return null;
    var c = getClient();
    if (!c) return null;
    try {
      var res = await c.from("profiles").select("id, username, avatar_url").eq("id", user.id).maybeSingle();
      if (res.error) return null;
      return res.data || null;
    } catch (e) {
      return null;
    }
  }

  async function refresh() {
    var c = getClient();
    if (!c) { state.ready = true; state.configured = false; emit(); return; }
    state.configured = true;
    try {
      var res = await c.auth.getUser();
      state.user = (res && res.data && res.data.user) || null;
    } catch (e) {
      state.user = null;
    }
    state.profile = state.user ? await loadProfile(state.user) : null;
    state.ready = true;
    emit();
  }

  /* ----------------------------------------------------------------------- */
  /* Public actions                                                          */
  /* ----------------------------------------------------------------------- */
  function need() {
    var c = getClient();
    if (!c) {
      return {
        error: {
          message:
            "Accounts are not set up yet. Add your Supabase project URL and anon key " +
            "to js/config.js (see CineReview_Upgrade_Plan_Revised.md, Phase 0)."
        }
      };
    }
    return { client: c };
  }

  async function signUp(email, password, username) {
    var g = need(); if (g.error) return g;
    var redirect = window.location.origin + "/login.html";
    var res = await g.client.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { username: (username || "").trim() },
        emailRedirectTo: redirect
      }
    });
    if (!res.error) await refresh();
    return res;
  }

  async function signIn(email, password) {
    var g = need(); if (g.error) return g;
    var res = await g.client.auth.signInWithPassword({ email: email, password: password });
    if (!res.error) await refresh();
    return res;
  }

  async function signInWithGoogle() {
    var g = need(); if (g.error) return g;
    return g.client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/" }
    });
  }

  async function signOut() {
    var c = getClient();
    if (c) { try { await c.auth.signOut(); } catch (e) {} }
    state.user = null; state.profile = null;
    emit();
  }

  function currentUser() { return state.user; }
  function isSignedIn() { return Boolean(state.user); }
  function displayName() {
    if (state.profile && state.profile.username) return state.profile.username;
    if (state.user) {
      var m = state.user.user_metadata || {};
      return m.username || m.full_name || m.name || (state.user.email || "").split("@")[0] || "Account";
    }
    return "Account";
  }

  /* ----------------------------------------------------------------------- */
  /* Header account control                                                  */
  /* ----------------------------------------------------------------------- */
  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function renderAccount() {
    var slots = document.querySelectorAll("[data-account]");
    if (!slots.length) return;

    var html;
    if (!state.ready) {
      html = '<span class="account__pending" aria-hidden="true"></span>';
    } else if (!state.configured) {
      html =
        '<a class="btn btn--ghost btn--sm" href="login.html" title="Account setup pending">Sign in</a>';
    } else if (state.user) {
      var name = displayName();
      html =
        '<div class="account__menu" data-account-menu>' +
          '<button class="account__btn" type="button" data-account-toggle aria-expanded="false" aria-haspopup="true">' +
            '<span class="account__avatar" aria-hidden="true">' + esc(initials(name)) + "</span>" +
            '<span class="account__name">' + esc(name) + "</span>" +
          "</button>" +
          '<div class="account__dropdown" data-account-dropdown hidden>' +
            '<p class="account__hello">Signed in as<br><strong>' + esc(name) + "</strong></p>" +
            '<button class="account__item" type="button" data-account-signout>Log out</button>' +
          "</div>" +
        "</div>";
    } else {
      html =
        '<a class="btn btn--ghost btn--sm account__login" href="login.html">Log in</a>' +
        '<a class="btn btn--primary btn--sm account__signup" href="signup.html">Sign up</a>';
    }

    slots.forEach(function (slot) {
      slot.innerHTML = html;
      wire(slot);
    });
  }

  function wire(slot) {
    var toggle = slot.querySelector("[data-account-toggle]");
    var dropdown = slot.querySelector("[data-account-dropdown]");
    var out = slot.querySelector("[data-account-signout]");
    if (toggle && dropdown) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = dropdown.hasAttribute("hidden");
        if (open) { dropdown.removeAttribute("hidden"); toggle.setAttribute("aria-expanded", "true"); }
        else { dropdown.setAttribute("hidden", ""); toggle.setAttribute("aria-expanded", "false"); }
      });
      document.addEventListener("click", function () {
        if (!dropdown.hasAttribute("hidden")) {
          dropdown.setAttribute("hidden", "");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
    if (out) {
      out.addEventListener("click", function () {
        signOut().then(function () {
          // Leave the user where they are, just reflect the new state.
          if (document.body.getAttribute("data-page") === "account") {
            window.location.href = "index.html";
          }
        });
      });
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Boot                                                                    */
  /* ----------------------------------------------------------------------- */
  window.CR.auth = {
    onChange: onChange,
    refresh: refresh,
    signUp: signUp,
    signIn: signIn,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    currentUser: currentUser,
    isSignedIn: isSignedIn,
    displayName: displayName,
    isConfigured: configured,
    getClient: getClient,
    state: function () { return state; }
  };

  function boot() {
    renderAccount(); // paints the pending/placeholder state immediately
    var c = getClient();
    if (c) {
      c.auth.onAuthStateChange(function () { refresh(); });
    }
    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
