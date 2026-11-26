# Individual Finals submission status

Checked November 26, 2026. This is the solo React/Supabase assignment,
separate from the group Final and its hold/checkout upgrade.

## Completed locally

| Requirement | Evidence |
| --- | --- |
| Fresh Home, Browse and Detail | React 18.3.1 and Babel 7.28.4 CDN runtimes; no npm, build step or copied group application code |
| Separate layers | Model handles REST; ViewModel hooks own state/actions and the one availability field; View renders |
| Query narrowing | Name search and category are actual REST query parameters |
| Four states | All three screens have loading, empty/not-found, error with Retry, and ready states |
| Eight distinct products | SQL includes business-specific names, peso reference prices, one sold-out allocation and low stock |
| Three-table schema and RLS | Blank-database rebuild tested in disposable PostgreSQL; only anonymous product SELECT is granted |
| Phone layout | Actual browser component checks at 375px; no horizontal overflow and main controls at least 44px high |
| Predictions | Predictions committed before execution; exact outputs recorded; no mismatches |
| Required written files | README under 600 words, six-question technical reflection under 400 words, AIUsage.md |
| Local start | Windows launcher successfully served the individual module over HTTP and stopped its own test server |
| Local Git | Fresh `main` history; `config.js` ignored; group repo untouched |
| Own Supabase project | Created on the free tier in Singapore: `slotdrop-fran-individual`, under Fran's selected organization. The real tables contain 8 products and 0 orders/items; live SQL checks confirm all RLS flags and the product-only anonymous SELECT grant. |
| Local database configuration | Ignored `config.js` now has the personal Project URL and modern publishable key. No secret key was requested or used. |

Validation: **20/20 code checks, 19/19 disposable PostgreSQL checks,
20/20 browser component checks**. Browser tests used the actual React
runtime and source modules with controlled fetch responses. They are not
end-to-end live Supabase proof. Their internal previews are not the two
required DevTools screenshots. The local HTTP launch was checked separately.

## Live evidence and release

| Item | Current state / next action |
| --- | --- |
| Live browser behavior | Nine real REST checks passed previously: catalog, filters, empty search, known and unknown Detail ids, featured rows, and both protected order tables. See `live-checks.json`. A fresh headful Chrome run loaded all 8 products, searched Laro with HTTP 200 and 2 actual rows, deliberately blocked the real REST request, displayed the error and Retry control, then unblocked it and verified recovery with no uncaught application exceptions. See `capture-devtools.json`. |
| `docs/network-list.png` | Genuine Chrome DevTools Network view of the personal Supabase request, with its Laro query, HTTP 200 status and JSON response. |
| `docs/console-error.png` | Genuine Chrome Console beside the rendered connection-error panel and Retry button after request blocking. |
| Own GitHub repo | `Frannaaa/slotdrop-fran-individual`; the final code and evidence belong on `main`. The group repository is separate. |
| Release reference | `ia-b-v1.0` must identify the complete code-and-evidence commit. The personal recording is submitted separately. |

The two unedited screenshots were captured from actual Chrome and its
built-in DevTools on a GitHub-hosted Linux runner, using the real personal
database. They are not captures of Fran's own Windows desktop. The capture
helper and Python dependencies run outside the application; the storefront
still has no build step or npm dependencies. Failed diagnostic images and
the temporary capture workflow are not part of the submission tree.

## Remaining personal submission steps

| Item | Current state / next action |
| --- | --- |
| Personal recording | Fran must make the required unedited recording in her own voice, without AI, at most 90 seconds. Setup and evidence steps are in recording-checklist.md; no AI narration script is supplied. |
| Reflection and Canvas | Fran should confirm the technical reflection matches her understanding, then submit the repo and recording on Canvas. |

The brief gives December 1, 2026 at 11:59 PM. Wake the free database before
grading. There is no deployment requirement for this assignment.
