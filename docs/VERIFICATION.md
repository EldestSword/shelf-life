# Release verification — 14 September 2026

## Build and rules

- `npm run check`: passed. JavaScript syntax, stable IDs, 24 recipes spanning two to seven components, six book sections, 93 target definitions, 22,300 allowed guesses, both active target pools, local font files and licences, banned material, and absence of unintended remote runtime URLs.
- `npm test`: 33 tests passed. Coverage includes exact and rejected book merges, paid random and subject-specific arrivals, section purchases, recipe research, paid pantry stock, all 24 preparations in both assembly orders, mismatched and duplicate components, requests, rewards, sixteen upgrades, daily jobs, milestones, save migration and validation, export/import, corruption recovery, quota failures and stale writers. Starter and migrated requests are checked against the content currently available to buy.
- Duplicate-letter scoring includes explicit repeated-letter examples and 2,401 generated guess/target cases. Single-word wins, partial attempts, six-guess losses, deterministic daily selection, the 80/20 core/challenge split and retired dual-puzzle save migration are covered.
- The legal-action campaign reaches all sixteen upgrades, all 24 recipes and all six collections. It buys books and pantry stock, researches recipes, opens collections, merges, returns and serves; it does not assign funds or high-tier books directly.
- `npx --yes netlify-cli build --offline`: passed with Netlify CLI 36.4.8 using the production context and the checked-in `netlify.toml`.
- `npm run package`: passed. The final archive is checked for integrity after staging so it includes the new local fonts and active target-pool file.
- `git diff --check`: passed.

## Browser acceptance

`npm run test:browser` passed **1,064 assertions** across Chromium and WebKit at **320 × 667** and **390 × 844**. These are real browser engines with emulated phone viewports. The suite independently checks document dimensions, active-control bounds and selected content clipping on Play, Library, Word Vault and Journal. It also verifies that every starter request uses unlocked content and that tapping a requested dish opens the correct pantry stock action.

The runs cover the playable four-step tutorial, paid random and exact book orders, the 24-entry pantry, every recipe information and source tab, a complete seven-component preparation, six catalogue sections, twelve regulars, all milestone pages and all sixteen upgrades. They perform tap, drag and keyboard merges, undo, visitor service, daily and milestone claims, a single-word win and six-guess loss, practice replacement, settings, and palette changes. The bundled Atkinson and Fraunces fonts are loaded and checked in every browser/viewport combination.

Exported saves are downloaded, read from disk, reimported and compared with the complete pre-export state. Invalid imports leave progress untouched. Reloading preserves the current state, and competing actions from two tabs converge. The worker registers on first load, caches the complete shell including fonts, and reloads offline. Chromium is tested with browser networking disabled; WebKit is tested with the local server stopped because its Windows offline switch fails before service-worker dispatch.

The final isolated runs record no application console errors and no unintended remote runtime requests. Screenshots from each actual browser render are copied to `docs/screenshots/`; disposable output and save backups remain ignored under `test-results/`.

## Visual comparison

| Supplied reference | Final result |
|---|---|
| `01-play-screen.png` | Retains the dark library scene, paged visitor request, complete 5 × 4 board, compact action strip, muted gold detail and fixed navigation. Teal now leads the palette, section marks clarify books, and purchasing replaces unlimited free supply. |
| `02-screen-montage.png` | Retains the welcome, Library, keyboard-led Vault and paged Journal composition. The Vault now uses one large six-row board; the Journal and pantry cover 24 sourced preparations. |
| `03-library-v2.png` | Retains the room, chapter progress, single focused improvement card and page controls. The local Fraunces/Atkinson pairing creates a clearer hierarchy. |
| `04-library-v3.png` | Retains the compact room and four progression statistics. All sixteen purchases add visible objects, including the listening alcove, catalogue, bindery and periodicals gallery. |

Lou remains a smooth 160 × 200 cel-shaded SVG and is rendered at 144 × 180 CSS pixels in the 390 × 844 Library screen. Phone-size screenshots show her loose brown bun, tortoiseshell glasses, face, striped top, teal overshirt and four distinct expressions. The supplied photograph is neither shipped nor committed.

## Practical limits

The browser tests emulate phone viewports; they do not constitute testing on physical iPhone or Android hardware. Native home-screen installation has not been exercised. Offline play requires one successful initial HTTPS or localhost visit. The active word pool is finite, so words can recur. The broad guess dictionary deliberately accepts some proper names and US variants, while the target pools do not. Browsers without Web Locks retain best-effort stale-save detection. No live Netlify production deployment was performed.

## Commands run

- `npm run check`
- `npm test`
- `npm run test:browser`
- targeted Chromium and WebKit browser runs using `SHELF_TEST_ENGINES`
- `npx --yes netlify-cli build --offline`
- `npm run package`
- ZIP integrity and contents check
- `git diff --check`
