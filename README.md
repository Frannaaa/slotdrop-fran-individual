# SlotDrop: individual storefront

Francine Young de Asis | ITMGT 45.03 Individual Finals

Find pottery and painting workshops in Metro Manila. This solo catalog uses
the SlotDrop group business and reference data, with a fresh React application
and a separate database. No group application code is included.

## Run locally

1. Create your own free Supabase project. Enable its Data API if necessary.
2. In the SQL Editor, run `db/schema.sql`, then `db/seed.sql`. The seed can
   be run again without duplicating or overwriting existing products.
3. Copy `config.example.js` to `config.js`. Set its two exported values
   using your Project URL and **publishable key**. A legacy anon key also
   works. Never put a secret or service role key in this application.
4. Serve this folder over HTTP using VS Code Live Server, or run
   `python -m http.server 3000 --bind 127.0.0.1` from this folder.
   Windows users can run `powershell -ExecutionPolicy Bypass -File .\start.ps1`.
5. Open `http://localhost:3000`. Do not double-click the HTML file.

Internet is needed for the three pinned CDN runtimes and your database.
No build step, npm installation or deployment is needed. `config.js` is
ignored by Git and must be supplied locally on another machine.

## Screens and layers

- Home: a value proposition, up to three in-stock featured workshops, Browse link.
- Browse: database-backed search and category filters, including empty results.
- Detail: one database row by id, including a readable not-found screen.
- `CatalogModel.js`: configuration and read-only Supabase REST requests.
- `CatalogViewModel.js`: catalog hook, request states, filters and actions.
- `DetailViewModel.js`: detail hook and missing-id handling.
- `Catalog.js`: React View, navigation and HTML rendering.
- `StartupView.js`: readable startup failure and Reload if a required script fails.

Exactly one product field is derived: `availability`. The ViewModels obtain
it from `availabilityLabel(stock)`; neither SQL nor JSX calculates it.

## Tables and security

`products` has eight workshops, peso prices, a zero-stock row and low-stock
rows. `orders` and `order_items` exist for the next stage and remain empty.
RLS is enabled on all three. Only `products` has an anonymous SELECT policy
and grant. Browser roles cannot write products or access order tables.

## Evidence and limitations

`docs/submission-status.md` distinguishes completed local checks from live
database and recording evidence. `docs/recording-checklist.md` explains how
to capture the required DevTools screenshots and reach all four states.
Optional code checks: `node tools/check.mjs`; no packages are installed.

Studio names, photos and reference prices come from the shared business
data, credited in `docs/catalog-data.md`. Seats are classroom allocations,
not live studio inventory. This stage cannot book, pay or save an order,
unlike the group GC2 build. Free Supabase projects may pause; wake yours
before grading. Keep both SQL files current.

Submit your own repository's `main`, tagged `ia-b-v1.0`, and your own
unedited recording on Canvas. AI assistance is disclosed in `AIUsage.md`.
