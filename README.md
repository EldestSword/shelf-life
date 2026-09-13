# Shelf Life: Lou's Library

A portrait-first mobile browser game made for Lou. It combines a merge board, visible library upgrades, properly researched cheese dishes and a focused daily word puzzle.

The launch build is a static web app. It has no accounts, adverts, purchases, analytics, remote image assets or energy timers. Progress is stored in the browser and can be exported as a JSON backup.

## What is in the game

- A 5 × 4 merge board with six subject collections and exact section-and-tier merging.
- Twelve recurring visitors with preferences and short story progression.
- Twenty-four cheese dishes assembled from two to seven separately represented, researched components.
- Sixteen library upgrades that alter the room and improve progression, including a bindery, catalogue and record-listening alcove.
- The Word Vault: one seven-letter target, six guesses, a 40-word familiar core pool, a 30-word challenge pool, 22,300 offline guesses, correct repeated-letter scoring, and definitions and usage notes after completion.
- A full progression economy: visitor funds buy book arrivals, pantry stock, recipe research, four new genres and sixteen visible room improvements.
- A four-step playable tutorial, three teal and sea-green room palettes, eight milestones, daily jobs without a streak penalty, offline caching and save import/export.
- Original cel-shaded vector artwork for Lou, visitors, objects and the library. Lou has a loose brown bun, tortoiseshell glasses, four expressions and a stylised likeness; the reference photograph is not stored in this repository.

There are no coffee mugs and no inspirational wall slogans. This is enforced partly by taste and partly by `npm run check`.

## Run it locally

You need Node.js 22 or newer.

```bash
npm run dev
```

Open `http://127.0.0.1:4173` on a computer or phone connected to the same development environment.

There is no dependency installation step for normal development. Browser testing needs the pinned Python dependencies above. The game uses browser JavaScript, CSS and SVG. Atkinson Hyperlegible and Fraunces are bundled locally under the SIL Open Font License.

## Test it

```bash
npm run check
npm test
```

For the real-browser smoke test, install Python 3, Playwright and Chromium, then run:

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium webkit
npm run test:browser
```

The browser suite runs Chromium and WebKit at 390 × 844 and 320 × 667. It checks document overflow and clipped content, traverses all four screens and their catalogue pages, performs tap and drag merges, assembles a seven-component dish, serves a visitor, buys all sixteen upgrades using a validated late-game fixture, solves and loses puzzles, downloads and reimports a save, tests two-tab synchronisation and reloads offline. Screenshots and test backups are written to the ignored `test-results/` directory. These are browser-emulated phone tests, not tests on physical phones.

## Deploy to Netlify

The repository already contains `netlify.toml`.

1. In Netlify, choose **Add new site** and **Import an existing project**.
2. Connect GitHub and select `EldestSword/shelf-life`.
3. Netlify should read the settings automatically:
   - build command: `npm run check && npm test`
   - publish directory: `public`
4. Deploy the site.

Future pushes to the connected branch can deploy automatically. A changed public release should also bump the cache name in `public/sw.js` so installed copies receive the new assets cleanly.

## Repository map

```text
public/
  index.html                 Application shell
  styles.css                 Fixed portrait layout and visual system
  manifest.webmanifest       Installable web-app metadata
  sw.js                      Offline cache
  assets/icon.svg            Teal vector app icon
  assets/fonts/              Local Atkinson and Fraunces web fonts
  data/words.js              Allowed guesses, active pools and definitions
  data/WORDLIST-LICENCE.txt  Word-list attribution
  src/content.js             Recipes, visitors, upgrades and milestones
  src/engine.js              Pure rules and progression
  src/storage.js             Local saves, validation and backups
  src/art.js                 Original inline SVG/cel-shaded artwork
  src/app.js                 Browser rendering and interactions
scripts/                     Local server, checks and packaging
 tests/                      Unit and mobile-browser smoke tests
docs/                        Design, architecture and content rules
AGENTS.md                    Instructions for Codex and future agents
netlify.toml                 Hosting and security headers
```

## Editing content safely

Recipes, visitors and upgrade copy live in `public/src/content.js`. The authored puzzle target pool and definitions live in `public/data/targets.json` and are compiled into the shipped `public/data/words.js`. See `docs/WORD_SOURCES.md` for dictionary provenance and rebuilding.

Do not casually change IDs in existing content. IDs are written into save files. Renaming one without a migration can invalidate existing progress.

Read `AGENTS.md` before asking Codex to modify the project. It includes non-negotiable layout, artwork, copy, research and save-compatibility rules.

## Packaging a clean ZIP

```bash
npm run package
```

This writes `shelf-life-repo.zip` beside the repository directory and excludes local development clutter.

## Licence

The game source and original artwork are currently unlicensed and remain private intellectual property despite the public repository. The derived English word list has its own attribution and licence in `public/data/WORDLIST-LICENCE.txt`.

## Completion and maintenance notes

The handover renderer and engine remain the foundation. The current progression adds subject-aware book cataloguing and staged multi-component dishes while migrating the original version-one save shape in place. Notable repairs include preserving the actual board during validation, validating puzzle completion records, displaying answer definitions, guarding cross-tab writes with Web Locks, and clearing undo before non-board progress can be reversed.

See [architecture](docs/ARCHITECTURE.md), [game design](docs/GAME_DESIGN.md), [cheese research](docs/CHEESE_SOURCES.md), [word provenance](docs/WORD_SOURCES.md) and [verification](docs/VERIFICATION.md).

Offline use needs one successful visit on HTTPS or localhost. This release has a finite target pool, so words can recur. The broader guess list contains some proper names and US variants; those do not become targets. Browsers without Web Locks retain best-effort stale-save detection. No live Netlify site is required for local play.
