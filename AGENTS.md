<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Progress (national/regional %, explored/completed) is computed only in `src/lib/progress.ts` from available DB rows; never hardcode counts. Why: the catalog can expand without changing screens.
- User data (visits, media) is read/written from the browser Supabase client under RLS; geo tables are public read-only. Why: simple, per-user isolation enforced in DB.
- Media files live in the private `visit-media` bucket under `<user_id>/<istat>/…`; DB stores only the path. Why: storage RLS keys on the first folder.
- Municipalities have a stable internal UUID and an optional official ISTAT text code; the legacy `istat_code` key remains immutable for existing visit and storage references and new city keys use `city:<slug>`. Why: adding official codes later must not detach memories.
- Initial city selection and source provenance live in `scripts/data/initial-cities.json`; initialization is applied through data tools, never on page load. Why: deterministic seeding must not create duplicate cities or overwrite visits.
- Render all municipal coats through the shared Crest component, with transition-only unlock animation and failed-image fallback; why: list and detail states must stay consistent without duplicating assets.
- Bulk coat associations are validated by `src/lib/coat-import.ts` and applied as data updates matching ISTAT codes, only to empty URLs; why: protect existing artwork and user visits.
- Optimistically patch the shared visits query cache and restore it on save failure; why: every mounted list and detail must reflect the same visit state immediately.
- Paginate complete geo, visit and media reads with a unique ordering tie-breaker; why: Data API caps responses at 1000 rows and repeated names or timestamps must not cause skipped rows.
- Clear private visits and media query caches on sign-out; why: signed media URLs must not linger in the next session's cache.
- Share primary navigation across the root mobile shell and desktop header; keep new personal pages under the existing protected layout. Why: preserve the existing home and session gate without rebuilding pages.
- Derive diary entries from the shared visits cache and load photo previews only for the visible page, under the existing private media cache prefix. Why: visit toggles stay immediate and media remains owner-scoped and cleared on logout.
- Keep region display ordering in the browser-safe region-order helper without changing progress calculations. Why: presentation ranking must not affect visit totals.
- Store the optional display name through the existing auth user's metadata and keep logout in Profile. Why: personal presentation needs no new tables or authentication flow.
- Diary date sorting uses the supplied visit date, otherwise the existing updated_at timestamp only for ordering, with a city-key tie-breaker; never display a fallback as a visit date. Why: the current schema has no visit creation timestamp and missing dates must not be invented.
- Award badges only through protected database functions/triggers; keep badge_rules thresholds in parity with the browser-safe badge catalog. Why: clients cannot invent achievements, historical awards survive corrections, and graphics remain replaceable.
- Use one identity-scoped badges query and root observer; invalidate after successful visit/media changes and clear on logout. Why: avoid repeated evaluations and keep collection/showcase consistent.
- Save the whole featured-badge order atomically through the owner-scoped database function. Why: enforce three unique earned badges without partial replacement or cross-user writes.
- Preserve exact showcase positions through the protected slot function, swapping an already featured selection atomically. Why: empty slots must not collapse or duplicate badges.
- Store a unique photo-only cover flag per owner/city on media; select the earliest remaining photo when no cover exists. Why: deletions need no visit changes or public storage.
- Share DiaryCover for diary and recent-city images, refresh signed URLs before expiry and retry image failures once per photo. Why: avoid blank covers and retry loops while preserving private caches.
