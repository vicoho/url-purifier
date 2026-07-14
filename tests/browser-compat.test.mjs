import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../src/js/purifier.js';

test('browser scripts remain file:// compatible and ordered', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const i18n = html.indexOf('src/js/i18n.js');
  const purifier = html.indexOf('src/js/purifier.js');
  const app = html.indexOf('src/js/app.js');
  assert.equal(html.includes('type="module"'), false);
  assert.ok(i18n >= 0 && i18n < purifier && purifier < app);
  const appSource = await readFile(new URL('../src/js/app.js', import.meta.url), 'utf8');
  assert.equal(/^import /mu.test(appSource), false);
  const purifierSource = await readFile(new URL('../src/js/purifier.js', import.meta.url), 'utf8');
  assert.equal(/^export /mu.test(purifierSource), false);
});

test('purifier global API exposes the complete public surface', () => {
  assert.ok(globalThis.UrlPurifier);
  for (const key of ['normalizeInput', 'extractUrlCandidates', 'purifyUrlCandidate', 'validatePurifiedUrl', 'extractAndPurifyUrls', 'redactCredentials']) assert.equal(typeof globalThis.UrlPurifier[key], 'function');
});

test('page markup defaults to the History tab', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="tabHistory"[^>]*aria-selected="true"/u);
});
