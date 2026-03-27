// iCost · 珍珠账本  v4.0
// Entry: Extensions panel submenu (never touches top bar DOM)
// Window: draggable fixed float, internal scroll

(function () {
  'use strict';

  const STORAGE_KEY = 'icost_records_v1';
  const POS_KEY     = 'icost_pos_v1';
  let currentType   = 'expense';
  let winVisible    = false;

  /* ── storage ──────────────────────────────────────────── */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function save(r) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }
  function uid()   { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function fmt(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  }

  /* ── build float window ───────────────────────────────── */
  function buildWin() {
    const w = document.createElement('div');
    w.id = 'ic-win';
    w.setAttribute('role', 'dialog');
    w.innerHTML = `
      <div id="ic-bar">
        <div class="ic-titles">
          <span class="ic-cn">iCost</span>
          <span class="ic-en">珍珠账本</span>
        </div>
        <button id="ic-x" title="关闭">✕</button>
      </div>

      <div id="ic-scroll">
        <div class="ic-summary">
          <div class="ic-sitem">
            <span class="ic-slabel">收入 Income</span>
            <span class="ic-sval ic-green" id="ic-inc">¥0</span>
          </div>
          <div class="ic-sdiv"></div>
          <div class="ic-sitem">
            <span class="ic-slabel">支出 Expense</span>
            <span class="ic-sval ic-red" id="ic-exp">¥0</span>
          </div>
          <div class="ic-sdiv"></div>
          <div class="ic-sitem">
            <span class="ic-slabel">结余 Balance</span>
            <span class="ic-sval" id="ic-bal">¥0</span>
          </div>
        </div>

        <div class="ic-form">
          <div class="ic-trow">
            <button class="ic-tb ic-tb-exp active" id="ic-tb-exp">支出 Expense</button>
            <button class="ic-tb ic-tb-inc" id="ic-tb-inc">收入 Income</button>
          </div>
          <div class="ic-field">
            <label class="ic-lbl">金额 Amount</label>
            <div class="ic-arow">
              <span class="ic-yen">¥</span>
              <input id="ic-amt" class="ic-inp ic-ainp" type="number" min="0" step="0.01" placeholder="0.00">
            </div>
          </div>
          <div class="ic-field">
            <label class="ic-lbl">备注 Note</label>
            <input id="ic-note" class="ic-inp ic-ninp" type="text" placeholder="买了什么 / 赚了什么…" maxlength="60">
          </div>
          <button class="ic-addbtn" id="ic-addbtn">记录 · Add</button>
        </div>

        <div class="ic-rechd">
          <span>明细 · Records</span>
          <span class="ic-cnt" id="ic-cnt">0 条</span>
        </div>
        <div id="ic-list"></div>

        <div class="ic-foot">
          <button class="ic-share" id="ic-share">📤 发给爸爸看 · Share to Chat</button>
        </div>
      </div>`;
    return w;
  }

  /* ── render ───────────────────────────────────────────── */
  function render() {
    const recs = load();
    const list = document.getElementById('ic-list');
    if (!list) return;

    const inc = recs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount, 0);
    const exp = recs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount, 0);
    const bal = inc - exp;

    document.getElementById('ic-inc').textContent = `¥${inc.toFixed(2)}`;
    document.getElementById('ic-exp').textContent = `¥${exp.toFixed(2)}`;
    const bel = document.getElementById('ic-bal');
    bel.textContent = (bal < 0 ? '-¥' : '¥') + Math.abs(bal).toFixed(2);
    bel.className = 'ic-sval ' + (bal >= 0 ? 'ic-green' : 'ic-red');
    document.getElementById('ic-cnt').textContent = `${recs.length} 条`;

    if (!recs.length) {
      list.innerHTML = `<p class="ic-empty">还没有记录 · No records yet</p>`;
      return;
    }
    list.innerHTML = [...recs]
      .sort((a,b) => b.date.localeCompare(a.date))
      .map(r => `
        <div class="ic-row ic-row-${r.type}">
          <div class="ic-rl">
            <span class="ic-tag ic-tag-${r.type}">${r.type==='income'?'收入':'支出'}</span>
            <span class="ic-rmk">${r.note || '—'}</span>
          </div>
          <div class="ic-rr">
            <span class="ic-ra ic-${r.type}">${r.type==='income'?'+':'-'}¥${Number(r.amount).toFixed(2)}</span>
            <span class="ic-rd">${fmt(r.date)}</span>
            <button class="ic-del" data-id="${r.id}" title="删除">×</button>
          </div>
        </div>`).join('');

    list.querySelectorAll('.ic-del').forEach(b => {
      b.addEventListener('click', () => {
        save(load().filter(r => r.id !== b.dataset.id));
        render();
      });
    });
  }

  /* ── drag ─────────────────────────────────────────────── */
  function enableDrag(win) {
    const bar = document.getElementById('ic-bar');
    let dragging = false, ox = 0, oy = 0, sx = 0, sy = 0;

    function start(e) {
      if (e.target.closest('#ic-x')) return;
      dragging = true;
      const t = e.touches ? e.touches[0] : e;
      sx = t.clientX; sy = t.clientY;
      ox = win.offsetLeft; oy = win.offsetTop;
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      const t = e.touches ? e.touches[0] : e;
      const nx = Math.max(0, Math.min(ox + t.clientX - sx, window.innerWidth  - win.offsetWidth));
      const ny = Math.max(0, Math.min(oy + t.clientY - sy, window.innerHeight - win.offsetHeight));
      win.style.left   = nx + 'px';
      win.style.top    = ny + 'px';
      win.style.right  = 'auto';
      win.style.bottom = 'auto';
      e.preventDefault();
    }
    function end() {
      if (!dragging) return;
      dragging = false;
      try { localStorage.setItem(POS_KEY, JSON.stringify({ l: win.style.left, t: win.style.top })); } catch {}
    }

    bar.addEventListener('mousedown',  start, { passive: false });
    bar.addEventListener('touchstart', start, { passive: false });
    document.addEventListener('mousemove',  move, { passive: false });
    document.addEventListener('touchmove',  move, { passive: false });
    document.addEventListener('mouseup',   end);
    document.addEventListener('touchend',  end);
  }

  function restorePos(win) {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (p && p.l && p.t) {
        win.style.left   = p.l;
        win.style.top    = p.t;
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
      }
    } catch {}
  }

  /* ── open / close window ──────────────────────────────── */
  function openWin() {
    const w = document.getElementById('ic-win');
    if (!w) return;
    winVisible = true;
    w.style.display = 'flex';
    // micro delay so display:flex takes effect before opacity
    requestAnimationFrame(() => w.classList.add('ic-visible'));
    render();
    // update panel button label
    const lb = document.getElementById('ic-panel-toggle');
    if (lb) lb.textContent = '关闭 · Close';
  }
  function closeWin() {
    const w = document.getElementById('ic-win');
    if (!w) return;
    winVisible = false;
    w.classList.remove('ic-visible');
    w.addEventListener('transitionend', () => { if (!winVisible) w.style.display = 'none'; }, { once: true });
    const lb = document.getElementById('ic-panel-toggle');
    if (lb) lb.textContent = '打开 · Open';
  }
  function toggleWin() {
    winVisible ? closeWin() : openWin();
  }

  /* ── add record ───────────────────────────────────────── */
  function addRecord() {
    const ae = document.getElementById('ic-amt');
    const ne = document.getElementById('ic-note');
    const amt = parseFloat(ae.value);
    if (!amt || amt <= 0) {
      ae.classList.add('ic-shake');
      setTimeout(() => ae.classList.remove('ic-shake'), 500);
      return;
    }
    const recs = load();
    recs.push({ id: uid(), type: currentType, amount: amt, note: ne.value.trim(), date: new Date().toISOString() });
    save(recs);
    ae.value = ''; ne.value = '';
    render();
    const btn = document.getElementById('ic-addbtn');
    btn.textContent = '已记录 ✓';
    btn.classList.add('ic-addbtn-ok');
    setTimeout(() => { btn.textContent = '记录 · Add'; btn.classList.remove('ic-addbtn-ok'); }, 1500);
  }

  /* ── share to chat ────────────────────────────────────── */
  function share() {
    const recs = load();
    if (!recs.length) return;
    const inc = recs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount, 0);
    const exp = recs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount, 0);
    const lines = [...recs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)
      .map(r => `${fmt(r.date)} ${r.type==='income'?'＋':'－'}¥${r.amount}${r.note?' · '+r.note:''}`).join('\n');
    const msg = `【iCost 账单】\n收入 ¥${inc.toFixed(2)} · 支出 ¥${exp.toFixed(2)} · 结余 ¥${(inc-exp).toFixed(2)}\n\n最近记录：\n${lines}`;
    const ta = document.querySelector('#send_textarea');
    if (ta) { ta.value = msg; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    closeWin();
    setTimeout(() => { const s = document.querySelector('#send_but'); if (s) s.click(); }, 120);
  }

  /* ── inject into extensions settings panel ────────────── */
  // This is the standard ST way — adds a row inside #extensions_settings
  // which is the drawer that opens from the Extensions (puzzle) icon.
  function injectPanel() {
    if (document.getElementById('ic-ext-section')) return;
    const target = document.getElementById('extensions_settings');
    if (!target) return;

    const section = document.createElement('div');
    section.id = 'ic-ext-section';
    section.className = 'ic-ext-section';
    section.innerHTML = `
      <div class="ic-ext-row">
        <div class="ic-ext-info">
          <span class="ic-ext-name">iCost</span>
          <span class="ic-ext-sub">珍珠账本 · 收支记录</span>
        </div>
        <button class="ic-ext-btn" id="ic-panel-toggle">打开 · Open</button>
      </div>`;
    // Prepend so it appears at the top of the extensions list
    target.prepend(section);
    document.getElementById('ic-panel-toggle').addEventListener('click', toggleWin);
  }

  /* ── mount float window ───────────────────────────────── */
  function mountWin() {
    if (document.getElementById('ic-win')) return;
    const w = buildWin();
    document.body.appendChild(w);
    restorePos(w);
    enableDrag(w);

    document.getElementById('ic-x').addEventListener('click', closeWin);

    document.getElementById('ic-tb-exp').addEventListener('click', () => {
      currentType = 'expense';
      document.getElementById('ic-tb-exp').className = 'ic-tb ic-tb-exp active';
      document.getElementById('ic-tb-inc').className = 'ic-tb ic-tb-inc';
    });
    document.getElementById('ic-tb-inc').addEventListener('click', () => {
      currentType = 'income';
      document.getElementById('ic-tb-inc').className = 'ic-tb ic-tb-inc active';
      document.getElementById('ic-tb-exp').className = 'ic-tb ic-tb-exp';
    });

    document.getElementById('ic-addbtn').addEventListener('click', addRecord);
    document.getElementById('ic-share').addEventListener('click', share);
  }

  /* ── init ─────────────────────────────────────────────── */
  function init() {
    mountWin();
    injectPanel();
  }

  // ST loads async, retry a few times
  const delays = [800, 2000, 4000];
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => delays.forEach(d => setTimeout(init, d)));
  } else {
    delays.forEach(d => setTimeout(init, d));
  }
})();
