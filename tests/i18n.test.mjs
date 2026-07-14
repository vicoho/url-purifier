import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/js/i18n.js';

test('i18n exposes Chinese and English packs with matching keys', () => {
  const packs = globalThis.UrlPurifierI18n;
  assert.ok(packs);
  assert.deepEqual(Object.keys(packs['zh-CN']).sort(), Object.keys(packs.en).sort());
});

test('language defaults and storage key are declared in app source', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/js/app.js', import.meta.url), 'utf8');
  assert.match(source, /url_purifier_language/u);
  assert.match(source, /=== 'en' \? 'en' : 'zh-CN'/u);
});
