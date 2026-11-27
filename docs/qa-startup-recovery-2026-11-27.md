# Startup recovery sweep

The Windows launcher and all 20 existing code checks pass. Real anonymous REST checks confirm 8 products, narrowed search, known/unknown detail and refusal of both order tables. Supabase reports ACTIVE_HEALTHY and no health lints; RLS remains enabled with only product SELECT exposed.

## Reproduced bug

When the required CDN runtime scripts fail, the previous page remains on "Loading SlotDrop. Please wait." with no recovery action. The local test environment produced ERR_NETWORK_ACCESS_DENIED for all three runtime URLs; this is an environment restriction, not evidence that the database failed or that unpkg was down globally.

StartupView.js now renders a readable error and Reload for failed scripts/bootstrap or a 20-second startup timeout. Once the normal React screen mounts, startup monitoring stops so API errors retain their own Retry behavior. The model, ViewModel calculation, schema, seed and existing required screenshots are unchanged.

Local recovery checks passed under the blocked-network condition. Normal Home/Browse/Detail navigation, search, empty/error/retry, mobile layout and isolated startup faults are covered by the new CI browser runner. Its product responses are explicit fixtures; no live database write or personal recording is involved. The CI result must be inspected before claiming those normal browser checks passed.

The existing release tag is not moved by this fix. Confirm whether it was submitted before selecting a final release reference.
