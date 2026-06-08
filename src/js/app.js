/**
 * URL Purifier - Main Application
 * 网址净化工具 - 主程序
 */

// ===== State =====
let currentResults = [];
let historyData = [];
let currentModalUrls = [];
const MAX_HISTORY = 20;
const STORAGE_KEY = 'url_purifier_history';
const THEME_KEY = 'url_purifier_theme';

// ===== DOM Elements =====
const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
const purifyBtn = document.getElementById('purifyBtn');
const tabResults = document.getElementById('tabResults');
const tabHistory = document.getElementById('tabHistory');
const contentResults = document.getElementById('contentResults');
const contentHistory = document.getElementById('contentHistory');
const resultsContainer = document.getElementById('resultsContainer');
const historyContainer = document.getElementById('historyContainer');
const themeToggle = document.getElementById('themeToggle');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');
const toast = document.getElementById('toast');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');

// ===== Theme =====
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setTheme(isDark);
}

function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    moonIcon.style.display = isDark ? 'none' : 'block';
    sunIcon.style.display = isDark ? 'block' : 'none';
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(!isDark);
});

// ===== URL Purification Logic =====
function purifyURL(dirty) {
    let url = dirty;
    
    // Remove emoji (various Unicode emoji ranges)
    url = url.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{2B50}-\u{2B55}]/gu, '');
    
    // Remove CJK characters (Chinese, Japanese, Korean)
    url = url.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff]/gu, '');
    
    // Remove full-width punctuation
    url = url.replace(/[\uff00-\uffef]/g, '');
    
    // Remove whitespace (spaces, tabs, newlines)
    url = url.replace(/\s+/g, '');
    
    // Remove common polluting punctuation that shouldn't be in URLs
    url = url.replace(/[（）【】「」『』〔〕〖〗《》〈〉""''"'\u3000-\u303f]/g, '');
    
    // Remove trailing punctuation
    url = url.replace(/[.,;:!?]+$/, '');
    
    // Remove repeated dots (but keep single dots for domains)
    url = url.replace(/\.{2,}/g, '.');
    
    return url;
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function extractURLsAggressive(text) {
    const results = [];
    const seen = new Set();
    
    // Capture generously after http(s):// so polluted URLs with spaces, CJK text,
    // emoji, or full-width notes can still be purified before validation.
    const pattern = /https?:\/\/[^\n\r<>]+/gi;
    let m;
    while ((m = pattern.exec(text)) !== null) {
        const rawMatch = m[0];
        const purified = purifyURL(rawMatch);
        if (isValidURL(purified) && !seen.has(purified)) {
            seen.add(purified);
            results.push({ original: rawMatch, purified: purified });
        }
    }
    
    return results;
}

// ===== History =====
function loadHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            historyData = JSON.parse(data);
        }
    } catch (e) {
        historyData = [];
    }
    renderHistory();
}

function saveHistory() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData));
    } catch (e) {
        console.warn('Failed to save history:', e);
    }
}

function addHistory(originalText, urls) {
    const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        timestamp: Date.now(),
        originalText: originalText,
        urls: urls
    };
    
    historyData.unshift(entry);
    if (historyData.length > MAX_HISTORY) {
        historyData = historyData.slice(0, MAX_HISTORY);
    }
    
    saveHistory();
    renderHistory();
}

function deleteHistoryItem(id) {
    historyData = historyData.filter(h => h.id !== id);
    saveHistory();
    renderHistory();
    showToast('已删除记录');
}

function clearAllHistory() {
    historyData = [];
    saveHistory();
    renderHistory();
    closeModal();
    showToast('历史记录已清空');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleString('zh-CN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ===== Rendering =====
function renderResults(results) {
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>未检测到网址，请检查输入内容</p>
            </div>
        `;
        return;
    }
    
    const html = results.map((r, i) => {
        const safeUrlArg = jsStringAttr(r.purified);
        return `
        <div class="result-card" style="animation: fadeIn 0.3s ease ${i * 0.05}s both">
            <a href="${escapeHtml(r.purified)}" target="_blank" rel="noopener noreferrer" class="result-url">
                ${escapeHtml(r.purified)}
            </a>
            <div class="result-actions">
                <button class="btn btn-secondary btn-sm" onclick="copyText(${safeUrlArg})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    复制
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.open(${safeUrlArg}, '_blank', 'noopener,noreferrer')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    访问
                </button>
            </div>
        </div>
    `}).join('');
    
    const allUrls = results.map(r => r.purified).join('\n');
    
    resultsContainer.innerHTML = `
        <div class="result-list">
            ${html}
        </div>
        <div style="text-align: center; margin-top: 16px;">
            <button class="btn btn-secondary" onclick="copyText(${jsStringAttr(allUrls)})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                复制全部结果
            </button>
        </div>
    `;
}

function renderHistory() {
    if (!historyData || historyData.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <p>暂无历史记录，快去净化第一个网址吧</p>
            </div>
        `;
        return;
    }
    
    const html = historyData.map((h, i) => {
        const urlsHtml = h.urls.map(u => `
            <a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer" class="history-url-link" title="${escapeHtml(u)}">
                ${escapeHtml(u)}
            </a>
        `).join('');
        
        return `
        <div class="history-item" style="animation: fadeIn 0.3s ease ${i * 0.04}s both">
            <div class="history-header">
                <span class="history-time">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${formatTime(h.timestamp)}
                </span>
                <span class="history-count">${h.urls.length} 个URL</span>
            </div>
            <div class="history-urls">
                ${urlsHtml}
            </div>
            <div class="history-actions">
                <button class="btn btn-secondary btn-sm" onclick="showHistoryDetail('${h.id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    查看详情
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteHistoryItem('${h.id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    删除
                </button>
            </div>
        </div>
    `}).join('');
    
    historyContainer.innerHTML = `
        <div class="history-list">
            ${html}
        </div>
        <div style="text-align: center; margin-top: 16px;">
            <button class="btn btn-secondary" onclick="confirmClearHistory()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                清空全部历史记录
            </button>
        </div>
    `;
}

// ===== Tab Switching =====
function switchTab(tabName) {
    if (tabName === 'results') {
        tabResults.classList.add('active');
        tabHistory.classList.remove('active');
        contentResults.classList.add('active');
        contentHistory.classList.remove('active');
    } else {
        tabHistory.classList.add('active');
        tabResults.classList.remove('active');
        contentHistory.classList.add('active');
        contentResults.classList.remove('active');
        renderHistory();
    }
}

tabResults.addEventListener('click', () => switchTab('results'));
tabHistory.addEventListener('click', () => switchTab('history'));

// ===== Actions =====
function purify() {
    const text = inputText.value;
    if (!text.trim()) {
        showToast('请输入包含网址的文本');
        return;
    }
    
    purifyBtn.disabled = true;
    purifyBtn.innerHTML = '<div class="spinner"></div> 净化中...';
    
    setTimeout(() => {
        const results = extractURLsAggressive(text);
        
        // Deduplicate
        const seen = new Set();
        const unique = [];
        for (const r of results) {
            if (!seen.has(r.purified)) {
                seen.add(r.purified);
                unique.push(r);
            }
        }
        
        currentResults = unique;
        renderResults(unique);
        
        if (unique.length > 0) {
            addHistory(text, unique.map(r => r.purified));
            showToast(`成功净化 ${unique.length} 个网址`);
        } else {
            showToast('未检测到有效网址');
        }
        
        switchTab('results');
        
        purifyBtn.disabled = false;
        purifyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
            一键净化
        `;
    }, 300);
}

purifyBtn.addEventListener('click', purify);

// Allow Ctrl+Enter to purify
inputText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        purify();
    }
});

inputText.addEventListener('input', () => {
    charCount.textContent = `已输入 ${inputText.value.length} 字符`;
});

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板');
    }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('已复制到剪贴板');
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function jsStringAttr(text) {
    return JSON.stringify(text).replace(/"/g, '&quot;');
}

// ===== History Detail Modal =====
function showHistoryDetail(id) {
    const item = historyData.find(h => h.id === id);
    if (!item) return;
    
    // Store URLs for the copy all button
    currentModalUrls = item.urls;
    
    modalTitle.textContent = '历史记录详情';
    modalBody.innerHTML = `
        <div class="modal-section">
            <div class="modal-section-label">处理时间</div>
            <div class="modal-text">${new Date(item.timestamp).toLocaleString('zh-CN')}</div>
        </div>
        <div class="modal-section">
            <div class="modal-section-label">原始文本</div>
            <div class="modal-text modal-text-copyable" onclick="copyModalText(this)" title="点击复制">
                ${escapeHtml(item.originalText)}
                <span class="copy-hint">点击复制</span>
            </div>
        </div>
        <div class="modal-section">
            <div class="modal-section-label">净化结果 (${item.urls.length} 个)</div>
            <div class="modal-text" style="font-family: var(--font-mono); font-size: 13px;">
                ${item.urls.map(u => `<div style="margin-bottom: 4px;">• <a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer" style="color: var(--link);">${escapeHtml(u)}</a></div>`).join('')}
            </div>
        </div>
    `;
    modalFooter.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
        <button class="btn btn-primary" onclick="copyAllModalUrls()">复制全部URL</button>
    `;
    modalOverlay.classList.add('active');
}

function copyAllModalUrls() {
    if (currentModalUrls.length > 0) {
        copyText(currentModalUrls.join('\n'));
        closeModal();
    }
}

function copyModalText(element) {
    const text = element.childNodes[0].textContent.trim();
    copyText(text);
    const hint = element.querySelector('.copy-hint');
    if (hint) {
        hint.textContent = '✓ 已复制';
        hint.style.color = 'var(--success)';
        setTimeout(() => {
            hint.textContent = '点击复制';
            hint.style.color = '';
        }, 2000);
    }
}

function confirmClearHistory() {
    modalTitle.textContent = '确认清空';
    modalBody.innerHTML = `
        <p style="color: var(--text-secondary); font-size: 14px;">
            确定要清空所有历史记录吗？此操作不可恢复。
        </p>
    `;
    modalFooter.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="clearAllHistory()" style="background: var(--error);">确认清空</button>
    `;
    modalOverlay.classList.add('active');
}

// ===== Modal =====
function showModal(type) {
    const content = {
        help: {
            title: '使用说明',
            body: `
                <div class="modal-section">
                    <div class="modal-section-label">基本用法</div>
                    <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">
                        1. 在输入框中粘贴包含被污染网址的文本<br>
                        2. 点击「一键净化」按钮<br>
                        3. 查看净化后的网址，可直接复制或访问
                    </p>
                </div>
                <div class="modal-section">
                    <div class="modal-section-label">支持的污染类型</div>
                    <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">
                        • 表情符号穿插（如 😊）<br>
                        • 空格、换行穿插<br>
                        • 中文字符穿插<br>
                        • 多余标点符号<br>
                        • 提示性文字包裹
                    </p>
                </div>
                <div class="modal-section">
                    <div class="modal-section-label">快捷键</div>
                    <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">
                        Ctrl + Enter：快速触发净化
                    </p>
                </div>
            `
        },
        faq: {
            title: '常见问题',
            body: `
                <div class="modal-section">
                    <div class="modal-section-label">数据安全吗？</div>
                    <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">
                        完全安全。所有处理都在您的浏览器本地完成，不会上传任何数据到服务器。
                    </p>
                </div>
                <div class="modal-section">
                    <div class="modal-section-label">历史记录存储在哪里？</div>
                    <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">
                        历史记录保存在浏览器的 localStorage 中，最多保留20条。清除浏览器数据会同时清除历史记录。
                    </p>
                </div>
                <div class="modal-section">
                    <div class="modal-section-label">支持哪些网址格式？</div>
                    <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">
                        目前支持 http:// 和 https:// 开头的网址。
                    </p>
                </div>
            `
        },
        about: {
            title: '关于',
            body: `
                <div class="modal-section">
                    <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">
                        网址净化工具是一款帮助用户快速还原被污染网址的轻量级工具。<br><br>
                        在社交媒体和论坛中，网址常常被穿插各种字符以规避屏蔽，手动清理非常麻烦。本工具可以自动识别并净化这些网址，让您的浏览体验更加顺畅。
                    </p>
                </div>
                <div class="modal-section">
                    <div class="modal-section-label">技术特点</div>
                    <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">
                        • 纯前端实现，零服务器交互<br>
                        • 本地存储历史记录<br>
                        • 支持深色/浅色主题切换<br>
                        • 响应式设计，适配各种设备
                    </p>
                </div>
            `
        }
    };
    
    const c = content[type];
    modalTitle.textContent = c.title;
    modalBody.innerHTML = c.body;
    modalFooter.innerHTML = `<button class="btn btn-secondary" onclick="closeModal()">关闭</button>`;
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ===== Init =====
initTheme();
loadHistory();
