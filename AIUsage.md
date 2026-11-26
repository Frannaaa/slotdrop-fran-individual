# AI usage

| Date | Tool | What I asked for | What I kept or changed | How I checked it |
| --- | --- | --- | --- | --- |
| Nov 25, 2026 | ChatGPT Codex | Read the individual brief and finish a separate SlotDrop storefront | New React CDN application, separate MVVM files and individual folder/repository history; shared business data only | Compared the implementation and deliverables with the individual rubric; no group JS, CSS, routes or server copied |
| Nov 25, 2026 | ChatGPT Codex | Prepare the three database tables and RLS | Rebuildable SQL, eight reference workshops, anonymous product SELECT only | SQL checks and live verification status are recorded in docs/submission-status.md |
| Nov 25, 2026 | ChatGPT Codex | Implement states, filtering, detail and stock badge | Four states, query parameters, working Retry, one ViewModel-derived availability field | tools/check.mjs and browser verification; distinguish fixtures from live Supabase evidence |
| Nov 25, 2026 | ChatGPT Codex | Prepare documentation, prediction exercise and reflection | AI-assisted technical reflection and predictions, with predictions committed before execution | Exact outputs and mismatches in docs/predict-then-run.md; word limits checked; Fran must review for understanding |
| Nov 25, 2026 | ChatGPT Codex and Supabase | Create the separate free personal database in Fran's selected organization | Three tables, eight products, product-only anonymous SELECT, RLS on all tables, two foreign-key indexes; browser-safe local config ignored by Git | Live SQL confirmed 8/0/0 row counts, RLS and grants. The no-policy notices on closed order tables match the brief. REST/browser evidence remains separate. |
| Nov 26, 2026 | ChatGPT Codex and GitHub Actions | Finish the genuine DevTools evidence and release preparation | Automated actual headful Chrome against the personal Supabase database; retained unedited Network and Console screenshots plus capture provenance | Verified 8 live products, the HTTP 200 Laro response, the rendered blocked-request error, successful Retry, and no uncaught application exceptions; inspected both actual screenshots. These are runner captures, not Fran's desktop or personal recording. |

The reflection is an AI-assisted explanation of this implementation, not a
claim that the assistant observed Fran's personal learning experience.
Fran should edit it if a technical explanation does not reflect her own
understanding. No voice, video, first-person test experience or human review
has been invented. The required unedited recording must be Fran's own,
without AI narration or an AI-written script.
