# CineReview Upgrade Plan — Revised

**Date:** 13 October 2026
**Status:** Awaiting approval
**Project:** CineReview
**Live website:** https://cinereview-sigma.vercel.app/

## 1. Goal

Improve CineReview while preserving the existing website and its working features.

The requested features are:

1. Login and signup with email/password and Google sign-in.
2. Logged-in users can rate movies from 1 to 10.
3. Logged-in users can write comments/reviews that are saved and shared with other visitors.
4. Automatically show new releases and upcoming movies using TMDB.
5. Let visitors browse movies by language, including Hindi and English.
6. Improve the existing UI and make it easy to use on mobile and desktop.

## 2. Current project details from the existing plan

- Static HTML, CSS, and JavaScript website hosted on Vercel.
- TMDB integration already exists in `js/api.js`.
- Existing pages include Home, Movies, Movie Details, Reviews, and About.
- Existing ratings/reviews use browser `localStorage`, so they are not shared between users.
- Google Analytics 4 is configured with Measurement ID `G-QFS2YBXQ0C`.
- Google Search Console verification, `sitemap.xml`, and `robots.txt` are already configured.
- The sitemap was submitted successfully in Search Console and Google reported 4 discovered pages.
- Supabase is the selected backend for authentication and shared user data.

Claude must inspect the current source before editing and preserve existing features.

## 3. What to learn from other movie websites

These are feature ideas inspired by public descriptions of established services, not a request to copy their branding or design.

- **Letterboxd:** Make rating and reviewing a movie easy to find. A future watchlist is a useful way for users to save films for later. Letterboxd also supports film lists and member profiles.
  Reference: https://letterboxd.com/welcome/
- **Rotten Tomatoes:** Clearly distinguish audience ratings from critic/editorial scores and make movie discovery easy.
  Reference: https://editorial.rottentomatoes.com/article/app/
- **General usability lesson:** Movie posters should be easy to scan, search and filters should be easy to find, and key actions should work well on mobile.

### Recommended improvements for CineReview

**Include in this upgrade**
- Clear navigation to Home, Movies, Reviews, About, and Login/Account.
- Search and simple filters for language and genre.
- Separate sections for Now Playing/New Releases and Upcoming Movies.
- A clear **User Rating /10** label, separate from any existing critic/editorial score.
- Readable movie details, rating controls, comments, loading states, and helpful empty/error messages.
- Responsive layout for phone and desktop.

**Leave for a later phase**
- Watchlist and watched list.
- User profiles and following other reviewers.
- Custom lists, social feed, recommendations, or AI discovery.
- Streaming availability filters.

Do not add these later-phase features now unless explicitly approved.

## 4. Backend and security

Use Supabase for authentication and shared ratings/comments.

- Authentication methods: email/password and Google sign-in.
- Use the Supabase browser SDK and the project URL plus **publishable/anon public key** only.
- Never expose a Supabase service-role key, database password, TMDB secret, or other private credential in frontend code.
- Add Row-Level Security (RLS) policies.
- Anyone may read public movie ratings/comments; only authenticated users may create them.
- Users may update or delete only their own ratings/comments.
- Validate rating scores as integers from 1 to 10.
- Set a sensible comment length limit and render user text safely to prevent script injection.
- A user should have one rating per movie; rating again updates their existing rating.
- Do not claim a feature is secure until the database policies are actually configured.

### Database records

Use a simple schema for:
- `profiles`: user ID, display name, optional avatar, created date.
- `ratings`: user ID, TMDB movie ID, score from 1–10, created/updated dates.
- `comments`: user ID, TMDB movie ID, comment text, created date.

Add unique constraints and foreign keys as appropriate. Keep schema changes in `supabase/schema.sql`.

## 5. Movie language filters

- Add language filters for Hindi and English, plus other languages available from TMDB.
- Use TMDB's original-language metadata where suitable.
- Clearly label the filter as **Original Language** if it uses TMDB's `original_language` field; do not imply it always means the available audio/dubbing language.
- Preserve existing search and genre filtering.
- Ensure changing a filter updates the visible movie list and that users can reset the filter.

## 6. New releases and upcoming movies

Use the existing TMDB integration rather than manually maintaining movie lists.

- Add a **Now Playing / New Releases** section using the relevant TMDB feed.
- Add an **Upcoming Movies** section using TMDB upcoming data.
- Refresh data through the existing API layer when the page loads, using existing caching where available.
- Clearly distinguish movies currently playing from movies that have not yet been released.
- Reuse existing movie-card components and detail-page links.
- Handle loading, empty, and API-error states.
- Do not promise that every newly announced film appears immediately; availability depends on TMDB data and region/API behavior.

## 7. Phased implementation

Work one phase at a time. Claude must stop at the end of each phase and wait for approval before moving on.

### Phase 0 — Supabase setup (user-assisted)

1. Create a Supabase project.
2. Claude prepares `supabase/schema.sql`.
3. Run the schema in the Supabase SQL Editor.
4. Configure email authentication.
5. Configure Google OAuth only when the required Google OAuth credentials and redirect URLs are ready.
6. Provide the Supabase project URL and public anon/publishable key to the local project configuration.

### Phase 1 — Authentication

- Add signup, login, logout, session persistence, and account UI.
- Add email/password and Google sign-in.
- Ask for a display name during signup.
- Make login state clear across the existing pages.
- Keep the current website design and existing navigation.

### Phase 2 — Shared ratings and comments

- Add a 1–10 user rating on the movie detail page.
- Add comments and a shared comment list.
- Show average user score and vote count separately from critic/editorial scores.
- Allow users to edit or delete their own rating/comment.
- Prompt logged-out visitors to log in when they try to post.
- Preserve existing movie IDs and avoid duplicate ratings.

### Phase 3 — Languages and movie discovery

- Add Hindi, English, and other available original-language filters.
- Add Now Playing/New Releases and Upcoming Movies sections.
- Use existing TMDB helpers where possible and add only the necessary API function(s).
- Preserve current search, genres, movie cards, and detail links.

### Phase 4 — UI polish

- Improve consistency of spacing, typography, buttons, cards, forms, and account controls.
- Make all new features responsive.
- Include accessible labels, keyboard focus, and readable contrast.
- Keep the existing visual identity; do not rebuild the entire site.

## 8. Preserve these existing features

Do not remove or break:
- Existing pages, routes, movie details, TMDB integration, search, and current filters.
- Google Analytics 4 and its existing implementation.
- Google Search Console verification file.
- `sitemap.xml` and `robots.txt`.
- Vercel deployment configuration.
- Existing TMDB configuration and its secret-handling approach.

Do not edit analytics or Search Console files unless a required change is identified and approved.

## 9. Simple implementation rules for Claude

1. Start by inspecting the relevant files for the current phase.
2. Make only the changes needed for that phase.
3. Do not perform unrelated refactors or redesigns.
4. Do not commit, push, or deploy unless explicitly asked.
5. Do not invent credentials, claim successful setup without evidence, or expose secrets.
6. At the end of each phase, report briefly:
   - What changed.
   - Which files changed.
   - Any manual setup still needed.
   - Whether the phase is ready for review.
7. Stop and wait for approval before starting the next phase.

## 10. Approval decisions

The following choices are recommended based on the requested features:

1. **Login UI:** Dedicated login/signup pages with a consistent header account menu.
2. **Display name:** Ask users for a display name at signup.
3. **Comment moderation:** Allow logged-in users to post, with length limits and owner controls; add moderation later if needed.
4. **Rating display:** Keep critic/editorial scores separate from **User Rating /10**.
5. **Language:** Start with Hindi and English filters, and include other languages available from TMDB.
6. **New movies:** Show Now Playing/New Releases and Upcoming Movies as separate sections.

## 11. Definition of done

The upgrade is complete when:
- Users can create accounts and log in using configured methods.
- Logged-in users can submit ratings and comments that are shared across visitors.
- Users cannot edit or delete another user's content.
- Hindi/English language filtering works.
- New Releases and Upcoming Movies are populated from TMDB.
- Existing pages and Google Analytics/Search Console setup remain intact.
- The work has been reviewed phase by phase and no unapproved commit or deployment has occurred.
