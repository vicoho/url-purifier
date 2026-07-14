# URL Purifier repository guidance

- Keep this a dependency-free static site. Do not add a framework, bundler, or browser runtime dependency.
- The browser must work both from `file://` and an HTTP server. Keep `index.html` script order as `i18n.js`, `purifier.js`, then `app.js`; do not add browser ES module `import`/`export`.
- Keep URL logic in `src/js/purifier.js`, DOM/state in `src/js/app.js`, and all user-facing Chinese/English strings in `src/js/i18n.js`. Use the existing translation helper for dynamic UI text.
- Preserve the fixed initial History tab, local-only URL history, safe localStorage access, and credential redaction.
- Google Fonts are intentional presentation-only network requests; URL input and purification must never be sent to a server.
- Before committing, run `node --check src/js/i18n.js`, `node --check src/js/purifier.js`, `node --check src/js/app.js`, and `npm test`.
- Keep the Pages workflow: test before deploy and upload only `index.html`, `src/`, and `.nojekyll`. Pages activation is a repository setting, not proof that frontend code has deployed.
