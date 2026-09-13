# Release verification — 13 September 2026

## Build and rules

- `npm run check`: passed. JavaScript syntax, stable IDs, ten recipes spanning two to seven components, six book sections, 49 target definitions, 22,298 allowed guesses, banned material and absence of unintended remote runtime URLs.
- `npm test`: 30 tests passed. Exact section-and-tier book merges, rejected cross-section merges, complete multi-component preparation in both orders, mismatched and duplicate ingredient rejection, capacity recovery, requests, reward arithmetic, sixteen upgrades, seeded donations, daily jobs, milestones, version-one migration, save preservation and rejection, export/import, corruption recovery, quota failure and stale writers.
- Duplicate-letter scoring includes explicit examples and 2,401 generated guess/target cases checking multiplicity and exact-position invariants.
- The legal-action campaign test reaches all sixteen upgrades and discovers all ten preparations with its fixed seed. It uses chosen-section donations, actual merges, two-to-seven-component pantry deliveries, returns, service and purchases; it never assigns funds or high-tier books directly.
- `npx --yes netlify-cli build --offline`: passed using the repository’s `netlify.toml`, production context and configured build command. This is a local Netlify build, not a published deployment.
- `npm run package`: passed. The resulting ZIP was opened and checked for archive integrity, application/test files and exclusion of test results and the original photograph.
- `git diff --check`: passed.

## Browser acceptance

`npm run test:browser` passed **866 assertions** in the final combined run. Chromium and WebKit were exercised at **320 × 667** and **390 × 844** using Playwright 1.62.0 on Windows. The suite checks document dimensions, button bounds and content clipping independently; hidden overflow alone cannot satisfy it.

The runs cover all four main screens, ten recipe entries and their ingredient/source tabs, six catalogue sections, twelve visitor entries, milestone pages and all sixteen upgrade cards. They perform tap, drag and keyboard merges, undo, subject-chosen acquisitions, a complete seven-component Welsh rarebit preparation, visitor service, pantry deliveries, palette changes, daily and milestone claims, word wins and losses, practice replacement, settings and backup flows. Full upgrade coverage uses an explicitly imported late-game fixture; the rules campaign above separately proves economic reachability.

Exported downloads are read from disk, imported through the file picker and compared with the full original state. Reloading preserves that state. Invalid imports leave it untouched. Two tabs issue competing actions and converge on identical progress.

The worker registers on first load and caches all twelve shell entries. Chromium is reloaded with browser networking disabled. WebKit is reloaded while the actual local server is stopped, then traverses all four screens from cache. WebKit’s `set_offline` switch returned an internal browser error in this environment before worker handling; a real server outage provides the working offline test instead. Playwright documents limitations to its service-worker tooling in [the official guide](https://playwright.dev/docs/service-workers).

The isolated acceptance runs record no application console errors and no remote runtime requests. An additional Chromium browser check exercised destructive reset, raw corrupt-save export, previous-save recovery, recovery without a backup, and confirmed high-tier return followed by undo.

Screenshots are generated from actual browser renders and compared with the supplied references, which remain outside the repository. The repeatable suite writes the screenshot set and assertion report to the ignored `test-results/` directory.

## Visual comparison

| Supplied reference | Result |
|---|---|
| `01-play-screen.png` | Retained dark library scene, paged request above a complete 5 × 4 board, muted gold outlines, compact action strip, two delivery controls and fixed navigation. Teal now leads the palette; books show subject marks and partial dishes show component progress. |
| `02-screen-montage.png` | Retained welcome, Library, two side-by-side nine-row word grids with on-screen keyboard, and the paged Journal. Added a six-section Book Catalogue, multi-component preparation views and source-backed ingredient information. |
| `03-library-v2.png` | Retained the room, chapter progress, single upgrade card and page controls; reduced unused space. |
| `04-library-v3.png` | Retained compact room/upgrade hierarchy and four progression statistics. The room is furnished from the start, and all sixteen purchases add visible objects including a turntable, catalogue, bindery and periodicals gallery. |

The coarse reference Lou was deliberately not copied. The replacement is a smooth cel-shaded SVG with a 160 × 200 viewBox, rendered at 144 × 180 CSS pixels in the 390 × 844 Library screen and 76 × 95 in Play. Actual phone-size renders show her layered brown hair, loose bun, amber-flecked tortoiseshell frames, striped top, teal overshirt and four distinct expressions. Her celebration changes the full pose, not just the mouth. Paint IDs are scoped per instance, and the hidden-screen regression found during visual QA is fixed. The photograph is neither shipped nor committed.

## Practical limits

These are real browser engines with emulated phone viewports, not physical iPhone or Android device tests. Native home-screen installation has not been tested. Offline play needs one successful initial visit. Target pairs can recur within the finite 49-word pool. The broad guess dictionary accepts some proper names and US variants; targets are separately curated. Older browsers without Web Locks have best-effort stale-write detection. No live Netlify deployment was performed.

## Commands used

Development and preparation: `npm run dev`; `python -m pip install playwright`; `python -m playwright install chromium`; `python -m playwright install webkit`; `python scripts/build-words.py <local-cmudict.dict>`.

Verification: `npm run check`; `npm test`; `npm run test:browser`; a targeted WebKit run using `SHELF_TEST_ENGINES=webkit`; `npx --yes netlify-cli build --offline`; `npm run package`; `git diff --check`. Local Python/Node inspection scripts additionally checked screenshot rendering, ZIP contents, Netlify TOML, recovery controls and the offline test harness. Early failed checks were corrected before the final acceptance run.

Repository operations: `git switch -c codex/complete-shelf-life`, logical `git add` / `git commit` steps and `git push -u origin codex/complete-shelf-life`. Pull-request creation uses the authenticated GitHub connector.
