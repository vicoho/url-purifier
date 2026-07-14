import { extractAndPurifyUrls, redactCredentials } from './purifier.js';

const MAX_HISTORY = 20;
const STORAGE_KEY = 'url_purifier_history';
const THEME_KEY = 'url_purifier_theme';
let currentResults = [];
let historyData = [];
let toastTimer;
let modalReturnFocus;

const $ = (id) => document.getElementById(id);
const inputText = $('inputText');
const charCount = $('charCount');
const purifyBtn = $('purifyBtn');
const resultsContainer = $('resultsContainer');
const historyContainer = $('historyContainer');
const toast = $('toast');
const modalOverlay = $('modalOverlay');
const modal = $('modal');
const modalTitle = $('modalTitle');
const modalBody = $('modalBody');
const modalFooter = $('modalFooter');
const themeToggle = $('themeToggle');

function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'text') node.textContent = value;
    else if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value);
  });
  node.append(...children.filter(Boolean));
  return node;
}

function icon(name) {
  const icons = { copy: '⧉', visit: '↗', trash: '⌫', view: '◉', close: '×' };
  return element('span', { text: icons[name] || '', 'aria-hidden': 'true' });
}

function setTheme(isDark) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
  themeToggle.title = themeToggle.getAttribute('aria-label');
  $('moonIcon').hidden = isDark;
  $('sunIcon').hidden = !isDark;
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
}

function switchTab(name, focus = false) {
  const results = name === 'results';
  ['results', 'history'].forEach((tab) => {
    const selected = tab === name;
    const button = $(`tab${tab[0].toUpperCase()}${tab.slice(1)}`);
    const panel = $(`content${tab[0].toUpperCase()}${tab.slice(1)}`);
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    panel.classList.toggle('active', selected);
    panel.hidden = !selected;
    if (selected && focus) button.focus();
  });
  if (!results) renderHistory();
}

function showToast(message, type = 'info') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function makeButton(label, action, payload, className = 'btn btn-secondary btn-sm') {
  return element('button', { type: 'button', className, text: label, dataset: { action, payload: String(payload ?? '') } });
}

function createLink(url, className = 'result-url', label = url) {
  return element('a', { href: url, target: '_blank', rel: 'noopener noreferrer', className, text: label });
}

function emptyState(title, description) {
  const state = element('div', { className: 'empty-state' });
  state.append(element('p', { text: title }));
  if (description) state.append(element('p', { className: 'empty-state-detail', text: description }));
  return state;
}

function resultStatus(result) {
  if (!result.changed) return '网址本身已有效';
  return result.confidence === 'low' || result.confidence === 'medium' ? '建议结果，请核对后访问' : '已清理污染字符';
}

function renderResults(results) {
  resultsContainer.replaceChildren();
  if (!results.length) {
    resultsContainer.append(emptyState('未检测到有效网址', '请确认内容中包含完整的 http:// 或 https:// 地址'));
    return;
  }
  const list = element('div', { className: 'result-list' });
  results.forEach((result) => {
    const card = element('article', { className: 'result-card' });
    card.append(
      element('p', { className: 'result-label', text: '原始候选 URL' }),
      element('p', { className: 'result-original', text: result.hasCredentials ? redactCredentials(result.original) : result.original }),
      element('p', { className: 'result-label', text: '净化后的 URL' }),
      createLink(result.purified),
      element('p', { className: `result-status ${result.warning ? 'has-warning' : ''}`, text: `${resultStatus(result)}${result.changed ? ` · 已修改约 ${result.changeCount} 个字符` : ''}` }),
    );
    if (result.warning) card.append(element('p', { className: 'result-warning', text: result.warning }));
    const actions = element('div', { className: 'result-actions' });
    actions.append(makeButton('复制', 'copy', result.purified), makeButton('访问', 'visit', result.purified));
    card.append(actions);
    list.append(card);
  });
  resultsContainer.append(list, makeButton('复制全部结果', 'copy-all', results.map((item) => item.purified).join('\n'), 'btn btn-secondary'));
}

function validHistoryEntry(value) {
  return value && typeof value.id === 'string' && Number.isFinite(value.timestamp) && Array.isArray(value.results);
}

function loadHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    historyData = Array.isArray(data) ? data.map((entry) => {
      if (validHistoryEntry(entry)) return entry;
      if (entry && Array.isArray(entry.urls) && Number.isFinite(entry.timestamp)) {
        return { id: String(entry.id || entry.timestamp), timestamp: entry.timestamp, results: entry.urls.map((purified) => ({ purified, original: purified, changed: false, changeCount: 0, warning: '', confidence: 'high', hasCredentials: false })) };
      }
      return null;
    }).filter(Boolean).slice(0, MAX_HISTORY) : [];
  } catch { historyData = []; }
  renderHistory();
}

function saveHistory() { localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData)); }

function historySafeResult(result) {
  const copy = { ...result };
  if (copy.hasCredentials) {
    copy.original = redactCredentials(copy.original);
    copy.purified = redactCredentials(copy.purified);
  }
  return copy;
}

function addHistory(results) {
  historyData.unshift({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`, timestamp: Date.now(), results: results.map(historySafeResult) });
  historyData = historyData.slice(0, MAX_HISTORY);
  saveHistory();
  renderHistory();
}

function formatTime(timestamp) { return new Date(timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

function renderHistory() {
  historyContainer.replaceChildren();
  if (!historyData.length) { historyContainer.append(emptyState('暂无历史记录，快去净化第一个网址吧')); return; }
  const list = element('div', { className: 'history-list' });
  historyData.forEach((entry) => {
    const card = element('article', { className: 'history-item' });
    const header = element('div', { className: 'history-header' }, [element('span', { className: 'history-time', text: formatTime(entry.timestamp) }), element('span', { className: 'history-count', text: `${entry.results.length} 个 URL` })]);
    const urls = element('div', { className: 'history-urls' });
    entry.results.forEach((result) => urls.append(createLink(result.purified, 'history-url-link')));
    const actions = element('div', { className: 'history-actions' });
    actions.append(makeButton('查看详情', 'history-detail', entry.id), makeButton('删除', 'history-delete', entry.id));
    card.append(header, urls, actions); list.append(card);
  });
  historyContainer.append(list, makeButton('清空全部历史记录', 'history-clear', '', 'btn btn-secondary'));
}

function setModal(title, body, actions, trigger) {
  modalReturnFocus = trigger || document.activeElement;
  modalTitle.textContent = title;
  modalBody.replaceChildren(...body);
  modalFooter.replaceChildren(...actions);
  modalOverlay.classList.add('active');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => modal.querySelector('button, a, [tabindex]:not([tabindex="-1"])')?.focus());
}

function closeModal() {
  if (!modalOverlay.classList.contains('active')) return;
  modalOverlay.classList.remove('active'); document.body.classList.remove('modal-open');
  modalReturnFocus?.focus?.();
}

function showHistoryDetail(id, trigger) {
  const entry = historyData.find((item) => item.id === id); if (!entry) return;
  const urls = element('div', { className: 'modal-text' });
  entry.results.forEach((result) => urls.append(createLink(result.purified, 'history-url-link')));
  setModal('历史记录详情', [element('p', { className: 'modal-section-label', text: `处理时间：${formatTime(entry.timestamp)}` }), urls], [makeButton('关闭', 'modal-close', ''), makeButton('复制全部 URL', 'copy-all', entry.results.map((r) => r.purified).join('\n'), 'btn btn-primary')], trigger);
}

function showHelp(type, trigger) {
  const content = {
    help: ['使用说明', '粘贴包含完整 http:// 或 https:// 地址的文本，点击净化后可复制或主动访问结果。'],
    faq: ['常见问题', '处理完全在浏览器本地完成。严重污染的网址属于启发式结果，访问前请人工核对。'],
    about: ['关于', '网址净化工具使用原生 HTML、CSS 与 JavaScript 实现，不加载第三方字体或统计服务。'],
  }[type];
  setModal(content[0], [element('p', { className: 'modal-text', text: content[1] })], [makeButton('关闭', 'modal-close', '')], trigger);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); } catch {
    const helper = element('textarea', { 'aria-hidden': 'true' }); helper.value = text; document.body.append(helper); helper.select();
    const copied = document.execCommand('copy'); helper.remove(); if (!copied) throw new Error('copy failed');
  }
  showToast('已复制到剪贴板', 'success');
}

function purify() {
  const text = inputText.value;
  if (!text.trim()) { showToast('请先粘贴包含网址的文本', 'warning'); return; }
  purifyBtn.disabled = true;
  try {
    currentResults = extractAndPurifyUrls(text);
    renderResults(currentResults);
    if (currentResults.length) { addHistory(currentResults); showToast(`已处理 ${currentResults.length} 个网址`, 'success'); }
    else showToast('未检测到有效网址', 'warning');
    switchTab('results');
  } catch (error) {
    currentResults = []; renderResults([]); switchTab('results'); showToast('处理失败，请检查输入内容', 'error'); console.error(error);
  } finally { purifyBtn.disabled = false; }
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]'); if (!target) return;
  const { action, payload } = target.dataset;
  if (action === 'copy' || action === 'copy-all') copyText(payload).catch(() => showToast('复制失败，请手动复制', 'error'));
  if (action === 'visit') window.open(payload, '_blank', 'noopener,noreferrer');
  if (action === 'history-detail') showHistoryDetail(payload, target);
  if (action === 'history-delete') { historyData = historyData.filter((item) => item.id !== payload); saveHistory(); renderHistory(); showToast('已删除记录', 'success'); }
  if (action === 'history-clear') setModal('确认清空', [element('p', { className: 'modal-text', text: '确定要清空所有历史记录吗？此操作不可恢复。' })], [makeButton('取消', 'modal-close', ''), makeButton('确认清空', 'history-clear-confirm', '', 'btn btn-primary')], target);
  if (action === 'history-clear-confirm') { historyData = []; saveHistory(); renderHistory(); switchTab('history'); closeModal(); showToast('历史记录已清空', 'success'); }
  if (action === 'modal-close') closeModal();
  if (action.startsWith('help-')) showHelp(action.slice(5), target);
});

purifyBtn.addEventListener('click', purify);
$('clearInputBtn').addEventListener('click', () => { inputText.value = ''; charCount.textContent = '已输入 0 字符'; inputText.focus(); });
themeToggle.addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'dark'));
inputText.addEventListener('input', () => { charCount.textContent = `已输入 ${inputText.value.length} 字符`; });
inputText.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); purify(); } });
document.querySelector('.tabs').addEventListener('keydown', (event) => {
  const tabs = ['results', 'history']; const index = tabs.findIndex((name) => $(`tab${name[0].toUpperCase()}${name.slice(1)}`) === document.activeElement);
  if (index < 0) return; let next;
  if (event.key === 'Home') next = 0; else if (event.key === 'End') next = 1; else if (event.key === 'ArrowLeft') next = (index + 1) % 2; else if (event.key === 'ArrowRight') next = (index + 1) % 2; else return;
  event.preventDefault(); switchTab(tabs[next], true);
});
document.querySelector('.tabs').addEventListener('click', (event) => { const tab = event.target.closest('[role="tab"]'); if (tab) switchTab(tab.dataset.tab); });
modalOverlay.addEventListener('click', (event) => { if (event.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (event) => {
  if (!modalOverlay.classList.contains('active')) return;
  if (event.key === 'Escape') { closeModal(); return; }
  if (event.key === 'Tab') { const focusable = [...modal.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])')].filter((node) => !node.disabled); const first = focusable[0]; const last = focusable.at(-1); if (!first) return; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
});

initTheme();
loadHistory();
switchTab('history');
