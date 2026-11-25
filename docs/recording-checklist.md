# Evidence and your own recording

The brief requires an unedited recording, your voice, no AI, at most 90
seconds. Use your own explanation. This is a setup checklist, not a narration
script. Do not use the group project's longer demo recording.

## Prepare

1. Finish the live database checks in `submission-status.md` first.
2. Open this individual folder in VS Code. Run `start.ps1` in its terminal.
3. Open `http://localhost:3000/?screen=browse` in the browser. Verify that
   products came from your own Supabase project, not a local test fixture.
4. Enable Do Not Disturb, close unrelated tabs and keep private files off
   screen. Test your microphone in your recorder. Record your screen and
   natural voice, without narration tools or later cuts.
5. Keep VS Code and browser visible. Do not read an AI-written script.
   Use the four actions listed in the assignment as your own checklist.

## The four actions required by the brief

- Load Browse and identify the file making the request.
- Point to the availability badge and identify where it is computed.
- Open a file you did not plan to explain and identify its layer.
- Break the call live and show the rendered error state.

For the last action, use DevTools request blocking on
`*rest/v1/products*`, then press Search in the already loaded page.
This breaks the API read without changing the database or configuration.
Unblock requests and press Retry afterwards to check recovery. Do not
block all network traffic before the CDN runtimes have loaded.

## Save the two genuine DevTools screenshots

These must come from the real personal database. Local fixture tests and
their preview images do not satisfy this evidence requirement.

1. `docs/network-list.png`: open DevTools > Network, filter Fetch/XHR,
   search for `Laro`, select the products request. Make the query string,
   HTTP 200 and JSON Response pane readable. Capture DevTools with the
   rendered Browse screen where possible. Do not show private credentials.
2. `docs/console-error.png`: enable the request block above, press Search,
   then open Console while the rendered error panel and Retry button are
   visible. Expected blocked-network messages can be present; an uncaught
   JavaScript error with a blank screen does not count. Capture both in one
   screenshot. Disable blocking and confirm Retry succeeds.

## Reach the other states on demand

- Ready: clear filters with the database active.
- Loading: set Network throttling to Slow 3G, then press Search.
- Empty on Browse: search `no-such-workshop-fran`; the request should be
  HTTP 200 with `[]`, and the screen should repeat that phrase.
- Empty on Detail: open `?screen=detail&id=999999`; HTTP 200 with `[]`
  becomes a readable not-found screen. Missing or malformed ids also show
  that screen without issuing an invalid database request.
- Home empty: in DevTools, a temporary local response override of the
  featured request to `[]` exercises it without deleting database rows.
  Remove the override afterwards. This is a UI exercise, not live evidence.

Check 375px width in Device Toolbar. Search, Reset, Retry, navigation and
the sold-out workshop's View workshop link must all work. A sold-out item
can be inspected; no button pretends to reserve a seat in this read stage.

## Before Canvas

Wake your Supabase project. Add the two screenshots and your own recording,
review the reflection, run the checks, commit, then tag the final `main`
commit `ia-b-v1.0`. The tag must include the screenshots. Submit the repo
link and recording through Canvas yourself after checking their contents.
