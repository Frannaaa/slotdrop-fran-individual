# Individual Finals submission status

Checked November 25, 2026. This is the solo React/Supabase assignment,
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

## Still required before this is submission-ready

| Item | Current state / next action |
| --- | --- |
| Live browser behavior | Nine real REST checks passed through the connected browser: catalog, filters, empty search, known and unknown Detail ids, featured rows, and both protected order tables. See `live-checks.json`. The automated local terminal could not connect; genuine local app screenshots remain pending. |
| `docs/network-list.png` | Pending real personal-database request in DevTools, including query, 200 and JSON Response. No placeholder image was created. |
| `docs/console-error.png` | Pending a genuine Console + rendered error screenshot after deliberately blocking the real request. No placeholder image was created. |
| Own GitHub repo | Created: `Frannaaa/slotdrop-fran-individual`. Prepared source is being published to main; the submission tag remains pending the required screenshots. |
| `ia-b-v1.0` tag | Not created yet. It must include the completed evidence. After reviewing and committing everything, `tools/publish.ps1` validates the required files and pushes main plus the tag without a force push. |
| Personal recording | Fran must make the required unedited recording in her own voice, without AI, at most 90 seconds. Setup and evidence steps are in recording-checklist.md; no AI narration script is supplied. |
| Reflection and Canvas | Fran should confirm the technical reflection matches her understanding, then submit the repo and recording on Canvas. |

The brief gives December 1, 2026 at 11:59 PM. Wake the free database before
grading. There is no deployment requirement for this assignment.
