# Working on Shelf Life

Preserve the recovered vanilla renderer in `public/src/app.js` and rules in `engine.js`. Do not replace the game with a framework starter. Read README.md and the relevant docs before editing.

- Keep Play, Library, Word Vault and Journal within 320 × 667 and 390 × 844 portrait viewports. Check content clipping as well as document overflow. Modals can scroll internally. Preserve dynamic viewport units, safe areas and fixed navigation.
- Keep charcoal, dark green, cream and muted gold. Lou has a loose brown bun, tortoiseshell glasses and an expressive face. Use carefully shaded 16-bit pixel clusters: full-body logical size 64 × 80, integer display scaling and crisp edges. Do not simplify to an enlarged tiny icon. Keep the original photograph out of this repository.
- No drink vessels, sentimental plaques, inspirational slogans, remote runtime assets, accounts, analytics, adverts, purchases, energy systems or waiting gates. British, specific, dry copy; occasional adult profanity is allowed without abuse.
- Book merging requires an exact tier. Cheese merging requires one cheese and its own preparation component. Preserve the 20-cell board, free deliveries, return, swap and undo.
- Preserve all identifiers listed in `tests/content-ids.json`. Save-schema changes require a migration or an explicit compatible decision. Validate imported data; never silently overwrite unreadable saves.
- Preserve the two seven-letter answers and nine shared guesses. Add target words only with a definition and a usage note. The broad allowed list and hard target pool serve different purposes.
- Research cheese content before altering it. Document the exact preparation and links in `docs/CHEESE_SOURCES.md`. Do not infer milk blends, protected status or origin from a dish’s name.
- Run `npm run check`, `npm test` and `npm run test:browser` for changes to rules, saves, assets or layout. Inspect the screenshots. Do not claim device testing when only emulators were used.
- Bump the service-worker cache version whenever public assets change. Cache all new runtime assets. Preserve the explicit save-and-reload update flow.
- Keep changes scoped, commit logically, and never commit test backups or local browser profiles. External provenance links are user-initiated and never fetched by the game.
