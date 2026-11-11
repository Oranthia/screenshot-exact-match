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
- Progress (national/regional %, explored/completed) is computed only in `src/lib/progress.ts` from DB rows; never hardcode counts. Why: catalog grows via ISTAT import.
- User data (visits, media) is read/written from the browser Supabase client under RLS; geo tables are public read-only. Why: simple, per-user isolation enforced in DB.
- Media files live in the private `visit-media` bucket under `<user_id>/<istat>/…`; DB stores only the path. Why: storage RLS keys on the first folder.
- ISTAT codes are text (leading zeros kept). Full catalog is loaded via `scripts/import-istat.ts`, which also flips `catalog_meta.is_complete`.
- Render all municipal coats through the shared Crest component, with transition-only unlock animation and failed-image fallback; why: list and detail states must stay consistent without duplicating assets.
- Bulk coat associations are validated by `src/lib/coat-import.ts` and applied as data updates matching ISTAT codes, only to empty URLs; why: protect existing artwork and user visits.
- Optimistically patch the shared visits query cache and restore it on save failure; why: every mounted list and detail must reflect the same visit state immediately.
- Paginate complete geo, visit and media reads with a unique ordering tie-breaker; why: Data API caps responses at 1000 rows and repeated names or timestamps must not cause skipped rows.
- Clear private visits and media query caches on sign-out; why: signed media URLs must not linger in the next session's cache.
