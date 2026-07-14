import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/js/purifier.js';
const { extractAndPurifyUrls, extractUrlCandidates, normalizeInput, purifyUrlCandidate, validatePurifiedUrl } = globalThis.UrlPurifier;

const urls = (input) => extractAndPurifyUrls(input).map((item) => item.purified);

test('normalizes full-width protocol and invisible characters', () => {
  assert.equal(normalizeInput('ｈｔｔｐｓ：／／exa\u200bmple.com'), 'https://example.com');
  assert.deepEqual(urls('ｈｔｔｐｓ：／／example.com'), ['https://example.com/']);
  assert.deepEqual(urls('https://exa\u200bmple.com'), ['https://example.com/']);
});

test('repairs hostname-only pollution without touching URL suffixes', () => {
  assert.deepEqual(urls('https://exa😊mple.com/path'), ['https://example.com/path']);
  assert.deepEqual(urls('https://exa mple.com'), ['https://example.com/']);
  assert.deepEqual(urls('https://exa...mple.com/a..b?q=x..y#z..q'), ['https://exa.mple.com/a..b?q=x..y#z..q']);
});

test('extracts individual URLs on one line and deduplicates', () => {
  assert.deepEqual(urls('请访问 https://a.com 和 https://b.com/path'), ['https://a.com/', 'https://b.com/path']);
  assert.deepEqual(urls('https://a.com, https://b.com https://a.com'), ['https://a.com/', 'https://b.com/']);
  assert.deepEqual(extractUrlCandidates('https://a.comhttps://b.com'), ['https://a.com', 'https://b.com']);
});

test('preserves legal unicode, encoded content, credentials, ports and parentheses', () => {
  assert.deepEqual(urls('前缀 https://example.com/中文路径?关键词=测试#片段 后缀'), ['https://example.com/中文路径?关键词=测试#片段']);
  assert.deepEqual(urls('https://例子.测试/路径'), ['https://例子.测试/路径']);
  assert.deepEqual(urls('https://example.com/wiki/Test_(example)'), ['https://example.com/wiki/Test_(example)']);
  assert.deepEqual(urls('https://user:password@example.com:8443/a%20b?q=a%2Bb'), ['https://user:password@example.com:8443/a%20b?q=a%2Bb']);
  assert.equal(purifyUrlCandidate('https://user:password@example.com').hasCredentials, true);
});

test('trims clear trailing explanation punctuation but not valid path punctuation', () => {
  assert.deepEqual(urls('https://example.com（请复制到浏览器）'), ['https://example.com/']);
  assert.deepEqual(urls('https://example.com/path。后续文字'), ['https://example.com/path']);
  assert.deepEqual(urls('https://example.com/path...'), ['https://example.com/path']);
});

test('rejects malformed or concatenated values even if URL parsing is permissive', () => {
  assert.equal(validatePurifiedUrl('https://a.comhttps://b.com'), false);
  assert.equal(validatePurifiedUrl('https://./'), false);
  assert.deepEqual(urls('没有网址'), []);
  assert.deepEqual(urls(''), []);
});

test('keeps a valid original URL unchanged', () => {
  const result = purifyUrlCandidate('https://example.com/a..b?q=x..y#ok');
  assert.equal(result.changed, false);
  assert.equal(result.changeCount, 0);
  assert.equal(result.purified, 'https://example.com/a..b?q=x..y#ok');
});
