// Pearl Ledger · 珍珠账本  v2.0
(function () {
  'use strict';

  const STORAGE_KEY = 'pearl_ledger_v2';
  let currentType = 'expense';
  let panelOpen = false;

  /* ─── Storage ─────────────────────────────────────────── */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function save(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /* ─── Date helper ─────────────────────────────────────── */
  function fmtDate(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  }

  /* ─── Build panel HTML ────────────────────────────────── */
  function buildPanel() {
    const el = document.createElement('div');
    el.id = 'pl-panel';
    el.innerHTML = `
      <div class="pl-panel-inner">
        <div class="pl-header">
          <div class="pl-title-block">
            <span class="pl-title-cn">珍珠账本</span>
            <span class="pl-title-en">Pearl Ledger</span>
          </div>
          <button class="pl-close-btn" id="pl-close-btn" title="关闭">✕</button>
        </div>

        <div class="pl-summary">
          <div class="pl-sum-item">
            <span class="pl-sum-label">收入<br>Income</span>
            <span class="pl-sum-val green" id="pl-inc">¥0</span>
          </div>
          <div class="pl-sum-sep"></div>
          <div class="pl-sum-item">
            <span class="pl-sum-label">支出<br>Expense</span>
            <span class="pl-sum-val red" id="pl-exp">¥0</span>
          </div>
          <div class="pl-sum-sep"></div>
          <div class="pl-sum-item">
            <span class="pl-sum-label">结余<br>Balance</span>
            <span class="pl-sum-val" id="pl-bal">¥0</span>
          </div>
        </div>

        <div class="pl-form-section">
          <div class="pl-toggle-row">
            <button class="pl-toggle active" id="pl-t-exp" data-t="expense">支出 Expense</button>
            <button class="pl-toggle" id="pl-t-inc" data-t="income">收入 Income</button>
          </div>
          <div class="pl-field">
            <label class="pl-lbl">金额 Amount</label>
            <div class="pl-amt-row">
              <span class="pl-yen">¥</span>
              <input id="pl-amt" class="pl-inp" type="number" min="0" step="0.01" placeholder="0.00">
            </div>
          </div>
          <div class="pl-field">
            <label class="pl-lbl">备注 Note</label>
            <input id="pl-note" class="pl-inp pl-inp-full" type="text" placeholder="买了什么 / 赚了什么…" maxlength="60">
          </div>
          <button class="pl-add" id="pl-add">记录 · Add</button>
        </div>

        <div class="pl-records-header">
          <span>明细 · Records</span>
          <span id="pl-count" class="pl-count-label">0 条</span>
        </div>
        <div class="pl-records" id="pl-records"></div>

        <div class="pl-footer">
          <button class="pl-share" id="pl-share">📤 发给爸爸看 · Share to Chat</button>
        </div>
      </div>`;
    return el;
  }

  /* ─── Render records ──────────────────────────────────── */
  function renderRecords() {
    const records = load();
    const recEl = document.getElementById('pl-records');
    const cntEl = document.getElementById('pl-count');
    if (!recEl) return;

    const inc = records.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp = records.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const bal = inc - exp;

    document.getElementById('pl-inc').textContent = `¥${inc.toFixed(2)}`;
    document.getElementById('pl-exp').textContent = `¥${exp.toFixed(2)}`;
    const balEl = document.getElementById('pl-bal');
    balEl.textContent = (bal < 0 ? '-¥' : '¥') + Math.abs(bal).toFixed(2);
    balEl.className = 'pl-sum-val ' + (bal >= 0 ? 'green' : 'red');

    cntEl.textContent = `${records.length} 条`;

    if (!records.length) {
      recEl.innerHTML = `<div class="pl-empty">还没有记录呢 · No records yet</div>`;
      return;
    }

    const sorted = [...records].sort((a,b) => b.date.localeCompare(a.date));
    recEl.innerHTML = sorted.map(r => `
      <div class="pl-row ${r.type}">
        <div class="pl-row-left">
          <span class="pl-tag ${r.type}">${r.type==='income'?'收入':'支出'}</span>
          <span class="pl-remark">${r.note||'—'}</span>
        </div>
        <div class="pl-row-right">
          <span class="pl-ramount ${r.type}">${r.type==='income'?'+':'-'}¥${Number(r.amount).toFixed(2)}</span>
          <span class="pl-rdate">${fmtDate(r.date)}</span>
          <button class="pl-del" data-id="${r.id}">×</button>
        </div>
      </div>`).join('');

    recEl.querySelectorAll('.pl-del').forEach(btn => {
      btn.addEventListener('click', () => {
        save(load().filter(r => r.id !== btn.dataset.id));
        renderRecords();
      });
    });
  }

  /* ─── Toggle panel ────────────────────────────────────── */
  function togglePanel() {
    const panel = document.getElementById('pl-panel');
    const btn   = document.getElementById('pl-topbar-btn');
    if (!panel) return;
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    if (btn) btn.classList.toggle('pl-topbar-active', panelOpen);
    if (panelOpen) renderRecords();
  }

  function closePanel() {
    panelOpen = false;
    const panel = document.getElementById('pl-panel');
    const btn   = document.getElementById('pl-topbar-btn');
    if (panel) panel.classList.remove('open');
    if (btn)   btn.classList.remove('pl-topbar-active');
  }

  /* ─── Add record ──────────────────────────────────────── */
  function addRecord() {
    const amtEl  = document.getElementById('pl-amt');
    const noteEl = document.getElementById('pl-note');
    const amt    = parseFloat(amtEl.value);
    if (!amt || amt <= 0) {
      amtEl.classList.add('pl-shake');
      setTimeout(() => amtEl.classList.remove('pl-shake'), 500);
      return;
    }
    const records = load();
    records.push({ id: uid(), type: currentType, amount: amt, note: noteEl.value.trim(), date: new Date().toISOString() });
    save(records);
    amtEl.value = '';
    noteEl.value = '';
    renderRecords();
    const addBtn = document.getElementById('pl-add');
    addBtn.textContent = '已记录 ✓';
    addBtn.classList.add('pl-add-ok');
    setTimeout(() => { addBtn.textContent = '记录 · Add'; addBtn.classList.remove('pl-add-ok'); }, 1400);
  }

  /* ─── Share to chat ───────────────────────────────────── */
  function shareToChat() {
    const records = load();
    if (!records.length) return;
    const inc = records.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp = records.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const recent = [...records].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)
      .map(r => `${fmtDate(r.date)} ${r.type==='income'?'＋':'－'}¥${r.amount} ${r.note||''}`)
      .join('\n');
    const text = `【珍珠账本】\n收入 ¥${inc.toFixed(2)} · 支出 ¥${exp.toFixed(2)} · 结余 ¥${(inc-exp).toFixed(2)}\n\n最近记录：\n${recent}`;
    const ta = document.querySelector('#send_textarea');
    if (ta) { ta.value = text; ta.dispatchEvent(new Event('input',{bubbles:true})); }
    closePanel();
    setTimeout(() => { const s = document.querySelector('#send_but'); if(s) s.click(); }, 100);
  }

  /* ─── Inject top bar button ───────────────────────────── */
  function injectTopBtn() {
    if (document.getElementById('pl-topbar-btn')) return;

    const targets = [
      '#send_form > div:first-child',
      '#top-settings-holder',
      '#extensionsMenuButton',
      '.right_menu_button:first-of-type',
      '#option_toggle_themes',
      '#options_button',
    ];
    let anchor = null;
    for (const sel of targets) {
      anchor = document.querySelector(sel);
      if (anchor) break;
    }

    const btn = document.createElement('div');
    btn.id = 'pl-topbar-btn';
    btn.className = 'pl-topbar-btn';
    btn.setAttribute('title', '珍珠账本 · Pearl Ledger');
    btn.innerHTML = `<i class="fa-solid fa-coins"></i>`;
    btn.addEventListener('click', togglePanel);

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(btn, anchor);
    } else {
      // Fallback: fixed floating trigger button
      btn.classList.add('pl-floating-trigger');
      document.body.appendChild(btn);
    }
  }

  /* ─── Mount panel to body ─────────────────────────────── */
  function mountPanel() {
    if (document.getElementById('pl-panel')) return;
    const panel = buildPanel();
    document.body.appendChild(panel);

    document.getElementById('pl-close-btn').addEventListener('click', closePanel);
    document.getElementById('pl-t-exp').addEventListener('click', () => {
      currentType = 'expense';
      document.getElementById('pl-t-exp').classList.add('active');
      document.getElementById('pl-t-inc').classList.remove('active');
    });
    document.getElementById('pl-t-inc').addEventListener('click', () => {
      currentType = 'income';
      document.getElementById('pl-t-inc').classList.add('active');
      document.getElementById('pl-t-exp').classList.remove('active');
    });
    document.getElementById('pl-add').addEventListener('click', addRecord);
    document.getElementById('pl-share').addEventListener('click', shareToChat);
  }

  /* ─── Init ────────────────────────────────────────────── */
  function init() {
    mountPanel();
    injectTopBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 500);
      setTimeout(init, 2000);
      setTimeout(init, 4000);
    });
  } else {
    setTimeout(init, 500);
    setTimeout(init, 2000);
    setTimeout(init, 4000);
  }
})();
