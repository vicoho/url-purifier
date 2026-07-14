(function (global) {
'use strict';

/**
 * Pure URL extraction and repair helpers.  This module deliberately keeps
 * pathname, query string and fragment conservative: hostname is the only
 * component where aggressive repair is attempted.
 */
const INVISIBLE = /[\u200B\u200C\u200D\u2060\uFEFF]/gu;
const FORMAT = /\p{Cf}/gu;
const EMOJI_OR_SYMBOL = /[\p{Extended_Pictographic}\uFE0F]/gu;
const CJK = /[\u3400-\u9FFF\uF900-\uFAFF]/u;
const ASCII_LABEL = /^[a-z0-9-]+$/i;
const TRAILING_PUNCTUATION = /[，,。；;、.!！?？：:]+$/u;

function normalizeInput(input) {
  return String(input ?? '').normalize('NFKC').replace(INVISIBLE, '');
}

function isProtocolAt(text, index) {
  return /^https?:\/\//i.test(text.slice(index));
}

function isWhitespace(char) {
  return /\s/u.test(char);
}

function canContinueHostAfterSpace(text, index) {
  const next = text.slice(index).match(/^\s*([A-Za-z0-9.-])/u);
  return Boolean(next);
}

/** Extract broad candidates, without allowing one candidate to consume another. */
function extractUrlCandidates(input) {
  const text = normalizeInput(input);
  const candidates = [];
  for (let start = 0; start < text.length; start += 1) {
    if (!isProtocolAt(text, start)) continue;
    let end = start + (text.slice(start).match(/^https?:\/\//i)[0].length);
    let inAuthority = true;
    let parentheses = 0;
    for (; end < text.length; end += 1) {
      const char = text[end];
      if (end > start && isProtocolAt(text, end)) break;
      if (/['"<>\r\n\t]/u.test(char) || /[,;，；、。]/u.test(char)) break;
      if (isWhitespace(char)) {
        if (inAuthority && canContinueHostAfterSpace(text, end)) continue;
        break;
      }
      if (char === '（' || char === '）' || char === '【' || char === '】') break;
      if (char === '(') {
        // NFKC turns explanatory full-width parentheses into ASCII. Parentheses
        // are legal in a path, but not in an authority.
        if (inAuthority) break;
        parentheses += 1;
      }
      if (char === ')') {
        if (parentheses === 0) break;
        parentheses -= 1;
      }
      if (inAuthority && /[/?#]/u.test(char)) inAuthority = false;
    }
    const candidate = text.slice(start, end).replace(TRAILING_PUNCTUATION, '');
    if (candidate) candidates.push(candidate);
    start = Math.max(start, end - 1);
  }
  return candidates;
}

function splitUrl(candidate) {
  const match = candidate.match(/^(https?:\/\/)([^/?#]*)([\s\S]*)$/i);
  return match ? { protocol: match[1].toLowerCase(), authority: match[2], suffix: match[3] } : null;
}

function cleanHostname(hostname) {
  let value = hostname.replace(INVISIBLE, '').replace(FORMAT, '').replace(/\s+/gu, '');
  value = value.replace(EMOJI_OR_SYMBOL, '').replace(/^[.\-]+|[.\-]+$/gu, '');
  value = value.replace(/\.{2,}/gu, '.');
  const labels = value.split('.').filter(Boolean).map((label) => {
    if (!CJK.test(label)) return label;
    const withoutCjk = label.replace(/[\u3400-\u9FFF\uF900-\uFAFF]/gu, '');
    // Only repair a CJK insertion in an otherwise ordinary ASCII label.
    return ASCII_LABEL.test(withoutCjk) && /[A-Za-z]/u.test(withoutCjk) ? withoutCjk : label;
  });
  return labels.join('.');
}

function splitAuthority(authority) {
  const at = authority.lastIndexOf('@');
  const userinfo = at >= 0 ? authority.slice(0, at + 1) : '';
  const hostPort = at >= 0 ? authority.slice(at + 1) : authority;
  if (hostPort.startsWith('[')) {
    const closing = hostPort.indexOf(']');
    return { userinfo, hostname: hostPort.slice(0, closing + 1), port: hostPort.slice(closing + 1) };
  }
  const portMatch = hostPort.match(/^(.+?)(:\d+)?$/u);
  return { userinfo, hostname: portMatch?.[1] ?? '', port: portMatch?.[2] ?? '' };
}

function credentialsPresent(authority) {
  return authority.includes('@');
}

function validatePurifiedUrl(value) {
  if (typeof value !== 'string' || /https?:\/\/.*https?:\/\//iu.test(value)) return false;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.hostname === '.') return false;
    if (url.hostname.includes('..') || /(^|\.)($|\.)/u.test(url.hostname)) return false;
    return !/https?$/iu.test(url.hostname) && !/https?:\/\//iu.test(`${url.hostname}${url.pathname}`);
  } catch {
    return false;
  }
}

function purifyUrlCandidate(original) {
  const normalized = normalizeInput(original);
  const parts = splitUrl(normalized);
  if (!parts) return null;
  const { userinfo, hostname, port } = splitAuthority(parts.authority);
  const cleanedHostname = cleanHostname(hostname);
  const suffix = parts.suffix.replace(INVISIBLE, '').replace(FORMAT, '').replace(TRAILING_PUNCTUATION, '');
  const purified = `${parts.protocol}${userinfo}${cleanedHostname}${port}${suffix || '/'}`;
  if (!validatePurifiedUrl(purified)) return null;
  const changed = purified !== normalized;
  const changeCount = changed ? Math.max(1, Math.abs(normalized.length - purified.length)) : 0;
  const hasCredentials = credentialsPresent(parts.authority);
  const confidence = changed && (changeCount > 4 || CJK.test(hostname)) ? 'medium' : 'high';
  return {
    original: normalized,
    purified,
    changed,
    changeCount,
    warning: hasCredentials ? '链接含有账号或密码；历史记录会隐藏凭据。' : confidence === 'medium' ? '建议结果，请核对后访问' : '',
    confidence,
    hasCredentials,
  };
}

function extractAndPurifyUrls(input) {
  const seen = new Set();
  return extractUrlCandidates(input).map(purifyUrlCandidate).filter((item) => {
    if (!item || seen.has(item.purified)) return false;
    seen.add(item.purified);
    return true;
  });
}

function redactCredentials(value) {
  try {
    const url = new URL(value);
    if (!url.username && !url.password) return value;
    url.username = url.username ? '***' : '';
    url.password = url.password ? '***' : '';
    return url.toString();
  } catch {
    return value;
  }
}

global.UrlPurifier = Object.freeze({
  normalizeInput,
  extractUrlCandidates,
  purifyUrlCandidate,
  validatePurifiedUrl,
  extractAndPurifyUrls,
  redactCredentials,
});
})(globalThis);
