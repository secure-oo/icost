// Pearl Ledger · 珍珠账本
// SillyTavern Extension

(function () {
  'use strict';

  const STORAGE_KEY = 'pearl_ledger_records';
  const EXT_NAME = '珍珠账本';

  // ── Load & Save ──────────────────────────────────────────
  function loadRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ── Format helpers ───────────────────────────────────────
  function formatDate(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function buildSummary(records) {
    if (!records.length) return '【珍珠账本】暂无记录 · No records yet.';
    const income = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const balance = income - expense;
    const recent = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const lines = recent.map(r => {
      const sign = r.type === 'income' ? '＋' : '－';
      const label = r.type === 'income' ? '收入' : '支出';
      return `${formatDate(r.date)} ${sign}¥${r.amount} [${label}]${r.note ? ' · ' + r.note : ''}`;
    });
    return `【珍珠账本 · Pearl Ledger】\n收入 Income: ¥${income}\n支出 Expense: ¥${expense}\n结余 Balance: ¥${balance}\n\n最近记录 Recent:\n${lines.join('\n')}`;
  }

  // ── Modal HTML ───────────────────────────────────────────
  function buildModalHTML() {
    return `
<div id="pl-overlay" class="pl-overlay">
  <div class="pl-modal">
    <div class="pl-header">
      <div class="pl-title-block">
        <span class="pl-title-cn">珍珠账本</span>
        <span class="pl-title-en">Pearl Ledger</span>
      </div>
      <button class="pl-close" id="pl-close">✕</button>
    </div>

    <div class="pl-summary-bar" id="pl-summary-bar">
      <div class="pl-sum-item">
        <span class="pl-sum-label">收入 Income</span>
        <span class="pl-sum-val income" id="pl-total-income">¥0</span>
      </div>
      <div class="pl-sum-divider"></div>
      <div class="pl-sum-item">
        <span class="pl-sum-label">支出 Expense</span>
        <span class="pl-sum-val expense" id="pl-total-expense">¥0</span>
      </div>
      <div class="pl-sum-divider"></div>
      <div class="pl-sum-item">
        <span class="pl-sum-label">结余 Balance</span>
        <span class="pl-sum-val balance" id="pl-balance">¥0</span>
      </div>
    </div>

    <div class="pl-form">
      <div class="pl-type-toggle">
        <button class="pl-type-btn active" id="pl-btn-expense" data-type="expense">支出 Expense</button>
        <button class="pl-type-btn" id="pl-btn-income" data-type="income">收入 Income</button>
      </div>
      <div class="pl-inputs">
        <div class="pl-input-group">
          <label class="pl-label">金额 Amount</label>
          <div class="pl-amount-wrap">
            <span class="pl-currency">¥</span>
            <input class="pl-input" id="pl-amount" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>
        </div>
        <div class="pl-input-group">
          <label class="pl-label">备注 Note</label>
          <input class="pl-input" id="pl-note" type="text" placeholder="买了什么 / 赚了什么…" maxlength="50" />
        </div>
      </div>
      <button class="pl-add-btn" id="pl-add-btn">记录 · Add</button>
    </div>

    <div class="pl-list-header">
      <span>明细 · Records</span>
      <span class="pl-list-count" id="pl-list-count">0 条</span>
    </div>
    <div class="pl-list" id="pl-list"></div>

    <div class="pl-footer">
      <button class="pl-send-btn" id="pl-send-btn">📤 发给爸爸看 · Share to Chat</button>
    </div>
  </div>
</div>`;
  }

  // ── Render list ──────────────────────────────────────────
  function renderList() {
    const records = loadRecords();
    const listEl = document.getElementById('pl-list');
    const countEl = document.getElementById('pl-list-count');
    if (!listEl) return;

    countEl.textContent = `${records.length} 条`;

    const income = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    document.getElementById('pl-total-income').textContent = `¥${income.toFixed(2)}`;
    document.getElementById('pl-total-expense').textContent = `¥${expense.toFixed(2)}`;
    const bal = income - expense;
    const balEl = document.getElementById('pl-balance');
    balEl.textContent = `¥${bal.toFixed(2)}`;
    balEl.className = 'pl-sum-val balance ' + (bal >= 0 ? 'pos' : 'neg');

    if (!records.length) {
      listEl.innerHTML = `<div class="pl-empty">还没有记录呢 · No records yet</div>`;
      return;
    }

    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    listEl.innerHTML = sorted.map(r => `
      <div class="pl-record ${r.type}" data-id="${r.id}">
        <div class="pl-rec-left">
          <span class="pl-rec-tag ${r.type}">${r.type === 'income' ? '收入' : '支出'}</span>
          <span class="pl-rec-note">${r.note || '—'}</span>
        </div>
        <div class="pl-rec-right">
          <span class="pl-rec-amount ${r.type}">${r.type === 'income' ? '+' : '-'}¥${Number(r.amount).toFixed(2)}</span>
          <span class="pl-rec-date">${formatDate(r.date)}</span>
          <button class="pl-del-btn" data-id="${r.id}" title="删除">×</button>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.pl-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const updated = loadRecords().filter(r => r.id !== id);
        saveRecords(updated);
        renderList();
      });
    });
  }

  // ── Open / Close modal ───────────────────────────────────
  let currentType = 'expense';

  function openModal() {
    if (document.getElementById('pl-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', buildModalHTML());
    renderList();

    document.getElementById('pl-close').addEventListener('click', closeModal);
    document.getElementById('pl-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'pl-overlay') closeModal();
    });

    // Type toggle
    document.getElementById('pl-btn-expense').addEventListener('click', () => setType('expense'));
    document.getElementById('pl-btn-income').addEventListener('click', () => setType('income'));

    // Add record
    document.getElementById('pl-add-btn').addEventListener('click', addRecord);

    // Send to chat
    document.getElementById('pl-send-btn').addEventListener('click', sendToChat);

    // Animate in
    requestAnimationFrame(() => {
      document.getElementById('pl-overlay').classList.add('visible');
    });
  }

  function closeModal() {
    const overlay = document.getElementById('pl-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  function setType(type) {
    currentType = type;
    document.querySelectorAll('.pl-type-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`pl-btn-${type}`).classList.add('active');
  }

  function addRecord() {
    const amountEl = document.getElementById('pl-amount');
    const noteEl = document.getElementById('pl-note');
    const amount = parseFloat(amountEl.value);
    if (!amount || amount <= 0) {
      amountEl.classList.add('shake');
      setTimeout(() => amountEl.classList.remove('shake'), 500);
      return;
    }
    const records = loadRecords();
    records.push({
      id: genId(),
      type: currentType,
      amount: amount,
      note: noteEl.value.trim(),
      date: new Date().toISOString()
    });
    saveRecords(records);
    amountEl.value = '';
    noteEl.value = '';
    renderList();

    const btn = document.getElementById('pl-add-btn');
    btn.textContent = '已记录 ✓';
    btn.classList.add('success');
    setTimeout(() => {
      btn.textContent = '记录 · Add';
      btn.classList.remove('success');
    }, 1200);
  }

  function sendToChat() {
    const records = loadRecords();
    const summary = buildSummary(records);
    const textarea = document.querySelector('#send_textarea');
    if (!textarea) return;
    textarea.value = summary;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    const sendBtn = document.querySelector('#send_but');
    if (sendBtn) sendBtn.click();
    closeModal();
  }

  // ── Inject entry button ──────────────────────────────────
  function injectButton() {
    if (document.getElementById('pl-open-btn')) return;

    // Try to find extensions panel area
    const target = document.querySelector('#extensionsMenuButton') || document.querySelector('#top-settings-holder');
    if (!target) return;

    const btn = document.createElement('div');
    btn.id = 'pl-open-btn';
    btn.className = 'pl-top-btn';
    btn.title = '珍珠账本 · Pearl Ledger';
    btn.innerHTML = `<span class="pl-top-icon">₿</span>`;
    btn.addEventListener('click', openModal);

    target.parentNode.insertBefore(btn, target);
  }

  // Also add to extensions settings panel
  function injectExtPanel() {
    const panel = document.querySelector('#extensions_settings');
    if (!panel || document.getElementById('pl-ext-panel')) return;

    const div = document.createElement('div');
    div.id = 'pl-ext-panel';
    div.innerHTML = `
      <div class="pl-ext-entry">
        <span class="pl-ext-name">珍珠账本 · Pearl Ledger</span>
        <button class="pl-ext-open-btn" id="pl-ext-open-btn">打开 · Open</button>
      </div>`;
    panel.prepend(div);
    document.getElementById('pl-ext-open-btn').addEventListener('click', openModal);
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    injectButton();
    injectExtPanel();
    // Retry in case DOM isn't ready
    setTimeout(() => {
      injectButton();
      injectExtPanel();
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
