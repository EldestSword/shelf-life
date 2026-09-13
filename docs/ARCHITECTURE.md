# Architecture

The recovered `app.js` and `engine.js` are the foundation. The first implementation commit restores them verbatim. Later commits complete their globals and repair concrete faults rather than replace the renderer.

## Runtime

`index.html` loads content, words, engine, storage, art and app in that order using deferred classic scripts. There is no bundler or framework. The app renders four sections, using event delegation and native buttons. A native dialog provides modal focus trapping. Only the visible screen is rendered on demand. The first-run coach overlays the real controls and advances from successful engine actions, so it cannot claim a step was completed when the underlying action failed.

`content.js` is the immutable editorial catalogue. It defines six book sections, component-level recipes, twelve visitors and sixteen room upgrades. `engine.js` exposes deterministic section-and-tier merging, staged recipe assembly, request, purchasing, unlock, reward, upgrade, daily-job and puzzle functions. Randomness uses the recovered seeded generator. Daily puzzle selection hashes the local calendar date with the fixed `ShelfLife.daily.v2.` prefix. It chooses a single word from the bundled core or challenge pool with a deterministic 80/20 weighting.

`art.js` draws original cel-shaded SVG. Lou uses a 160 × 200 viewBox with curved silhouettes, layered hair and skin shading, tortoiseshell frames, a striped top, teal overshirt and separate idle, pleased, unimpressed and celebratory faces. Paint identifiers are scoped per render so hidden screens cannot break gradients. The room is a layered SVG with one visible addition per upgrade. Books retain section colours and marks; 35 ingredient kinds use distinct drawings and partial dishes show their assembly progress.

## Saves

The version-1 game state is wrapped as `{format:"shelf-life", revision, state}`. Local storage key: `shelf-life.save.v1`. The richer system remains backward compatible: books without sections become Fiction, old cheese/preparation pairs become the first two authentic recipe components, old theme names map to the teal set, and eight-person visit arrays are padded to twelve. The preceding valid write is kept at `.previous`. Exported files use the same envelope. Import shows a summary and requires the in-game confirmation before replacing state. Saves are limited to 250,000 UTF-8 bytes.

Validation copies only recognised fields. It checks bounds, item types, stable content identifiers, array dimensions, requests, puzzle targets, allowed guesses and puzzle completion consistency. A recovered bug which checked but discarded the saved board is fixed and covered by a regression test. This is data validation, not an anti-cheat service: a player controls their local game and can edit plausible progress.

All meaningful interactions save. Whole-state undo is deliberately invalidated by navigation and non-board rewards to prevent undo from duplicating funds or erasing puzzle progress. Indexed tile actions support touch selection, mouse/pointer drag and keyboard activation. Arrow keys move focus across the board.

Web Locks serialise mutations across tabs on supported browsers. Under the lock, the newest stored state is read before applying the action. A storage event synchronises idle tabs. Revision/raw-value comparison also rejects stale writers. Browsers without Web Locks have best-effort conflict detection, not a transactional database. Storage or quota failures leave play available and surface the export option; corrupt saves enter recovery without automatic overwrite.

## Offline and updates

The service worker caches a complete versioned shell on installation, including the three locally bundled web-font files and their licences. It serves that shell coherently from cache, including the dictionary and attribution. Activation deletes older Shelf Life caches only. Updates wait until the player selects Save & reload in Settings. Offline use requires a successful initial visit on HTTPS or localhost. Recipe references open only after an explicit link activation.

## Verification and deployment

The static checker validates syntax, stable IDs, editorial metadata, banned material, shell assets and remote runtime isolation. Node tests exercise actual rules and storage failure cases. The Python Playwright suite starts an isolated static server on port 4178 and tests Chromium and WebKit at both required phone sizes. It creates ignored screenshots and save fixtures in `test-results/`.

Netlify publishes `public/` after `npm run check && npm test`, using Node 22. The development server uses the same Content Security Policy as `netlify.toml`. No secrets, runtime API or server-side functions are required. The browser acceptance suite runs separately in GitHub Actions.
