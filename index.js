// Pearl Ledger · 珍珠账本  v3.0  — draggable float
(function () {
  'use strict';

  const STORAGE_KEY = 'pearl_ledger_v2';
  const POS_KEY     = 'pearl_ledger_pos';
  let currentType = 'expense';
  let panelOpen   = false;

  /* ─── Storage ─────────────────────────────────── */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function save(r) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }
  function uid()   { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function fmtDate(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  }

  /* ─── Build window ────────────────────────────── */
  function buildWindow() {
    const el = document.createElement('div');
    el.id = 'pl-win';
    el.innerHTML = `
      <div class="pl-titlebar" id="pl-titlebar">
        <div class="pl-title-block">
          <span class="pl-title-cn">珍珠账本</span>
          <span class="pl-title-en">Pearl Ledger</span>
        </div>
        <button class="pl-x" id="pl-x">✕</button>
      </div>

      <div class="pl-body">
        <div class="pl-summary">
          <div class="pl-si">
            <span class="pl-sl">收入<br>Income</span>
            <span class="pl-sv green" id="pl-inc">¥0</span>
          </div>
          <div class="pl-sep"></div>
          <div class="pl-si">
            <span class="pl-sl">支出<br>Expense</span>
            <span class="pl-sv red" id="pl-exp">¥0</span>
          </div>
          <div class="pl-sep"></div>
          <div class="pl-si">
            <span class="pl-sl">结余<br>Balance</span>
            <span class="pl-sv" id="pl-bal">¥0</span>
          </div>
        </div>

        <div class="pl-form">
          <div class="pl-tgl-row">
            <button class="pl-tgl active" id="pl-t-exp">支出 Expense</button>
            <button class="pl-tgl" id="pl-t-inc">收入 Income</button>
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

        <div class="pl-rec-hd">
          <span>明细 · Records</span>
          <span id="pl-cnt" class="pl-cnt-lbl">0 条</span>
        </div>
        <div class="pl-rec-list" id="pl-rec-list"></div>

        <div class="pl-foot">
          <button class="pl-share" id="pl-share">📤 发给爸爸看 · Share to Chat</button>
        </div>
      </div>`;
    return el;
  }

  /* ─── Render ──────────────────────────────────── */
  function render() {
    const records = load();
    const el = document.getElementById('pl-rec-list');
    if (!el) return;

    const inc = records.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp = records.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const bal = inc - exp;

    document.getElementById('pl-inc').textContent = `¥${inc.toFixed(2)}`;
    document.getElementById('pl-exp').textContent = `¥${exp.toFixed(2)}`;
    const bEl = document.getElementById('pl-bal');
    bEl.textContent = (bal<0?'-¥':'¥') + Math.abs(bal).toFixed(2);
    bEl.className = 'pl-sv ' + (bal>=0?'green':'red');
    document.getElementById('pl-cnt').textContent = `${records.length} 条`;

    if (!records.length) {
      el.innerHTML = `<div class="pl-empty">还没有记录呢 · No records yet</div>`;
      return;
    }
    const sorted = [...records].sort((a,b)=>b.date.localeCompare(a.date));
    el.innerHTML = sorted.map(r=>`
      <div class="pl-row ${r.type}">
        <div class="pl-rl">
          <span class="pl-tag ${r.type}">${r.type==='income'?'收入':'支出'}</span>
          <span class="pl-rmk">${r.note||'—'}</span>
        </div>
        <div class="pl-rr">
          <span class="pl-ra ${r.type}">${r.type==='income'?'+':'-'}¥${Number(r.amount).toFixed(2)}</span>
          <span class="pl-rd">${fmtDate(r.date)}</span>
          <button class="pl-del" data-id="${r.id}">×</button>
        </div>
      </div>`).join('');

    el.querySelectorAll('.pl-del').forEach(b=>{
      b.addEventListener('click',()=>{
        save(load().filter(r=>r.id!==b.dataset.id));
        render();
      });
    });
  }

  /* ─── Drag ────────────────────────────────────── */
  function makeDraggable(win) {
    const bar = document.getElementById('pl-titlebar');
    let ox=0, oy=0, sx=0, sy=0, dragging=false;

    function onStart(e) {
      if (e.target.closest('.pl-x')) return;
      dragging = true;
      const t = e.touches ? e.touches[0] : e;
      sx = t.clientX; sy = t.clientY;
      ox = win.offsetLeft; oy = win.offsetTop;
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - sx, dy = t.clientY - sy;
      const maxX = window.innerWidth  - win.offsetWidth;
      const maxY = window.innerHeight - win.offsetHeight;
      win.style.left = Math.max(0, Math.min(ox+dx, maxX)) + 'px';
      win.style.top  = Math.max(0, Math.min(oy+dy, maxY)) + 'px';
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      e.preventDefault();
    }
    function onEnd() {
      if (!dragging) return;
      dragging = false;
      localStorage.setItem(POS_KEY, JSON.stringify({ left: win.style.left, top: win.style.top }));
    }

    bar.addEventListener('mousedown',  onStart, { passive:false });
    bar.addEventListener('touchstart', onStart, { passive:false });
    document.addEventListener('mousemove',  onMove,  { passive:false });
    document.addEventListener('touchmove',  onMove,  { passive:false });
    document.addEventListener('mouseup',   onEnd);
    document.addEventListener('touchend',  onEnd);
  }

  function restorePos(win) {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY)||'null');
      if (p && p.left && p.top) {
        win.style.left   = p.left;
        win.style.top    = p.top;
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
      }
    } catch {}
  }

  /* ─── Open / Close ────────────────────────────── */
  function togglePanel() {
    const win = document.getElementById('pl-win');
    const btn = document.getElementById('pl-topbar-btn');
    if (!win) return;
    panelOpen = !panelOpen;
    win.classList.toggle('open', panelOpen);
    if (btn) btn.classList.toggle('pl-topbar-active', panelOpen);
    if (panelOpen) render();
  }
  function closePanel() {
    panelOpen = false;
    const win = document.getElementById('pl-win');
    const btn = document.getElementById('pl-topbar-btn');
    if (win) win.classList.remove('open');
    if (btn) btn.classList.remove('pl-topbar-active');
  }

  /* ─── Add record ──────────────────────────────── */
  function addRecord() {
    const ae = document.getElementById('pl-amt');
    const ne = document.getElementById('pl-note');
    const amt = parseFloat(ae.value);
    if (!amt || amt<=0) {
      ae.classList.add('pl-shake');
      setTimeout(()=>ae.classList.remove('pl-shake'),500);
      return;
    }
    const recs = load();
    recs.push({ id:uid(), type:currentType, amount:amt, note:ne.value.trim(), date:new Date().toISOString() });
    save(recs);
    ae.value = ''; ne.value = '';
    render();
    const ab = document.getElementById('pl-add');
    ab.textContent = '已记录 ✓';
    ab.classList.add('ok');
    setTimeout(()=>{ ab.textContent='记录 · Add'; ab.classList.remove('ok'); }, 1400);
  }

  /* ─── Share ───────────────────────────────────── */
  function share() {
    const records = load();
    if (!records.length) return;
    const inc = records.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp = records.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const lines = [...records].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)
      .map(r=>`${fmtDate(r.date)} ${r.type==='income'?'＋':'－'}¥${r.amount}${r.note?' · '+r.note:''}`).join('\n');
    const text = `【珍珠账本】\n收入 ¥${inc.toFixed(2)} · 支出 ¥${exp.toFixed(2)} · 结余 ¥${(inc-exp).toFixed(2)}\n\n最近记录：\n${lines}`;
    const ta = document.querySelector('#send_textarea');
    if (ta) { ta.value=text; ta.dispatchEvent(new Event('input',{bubbles:true})); }
    closePanel();
    setTimeout(()=>{ const s=document.querySelector('#send_but'); if(s) s.click(); },100);
  }

  /* ─── Inject top btn ──────────────────────────── */
  function injectTopBtn() {
    if (document.getElementById('pl-topbar-btn')) return;
    const targets = [
      '#top-settings-holder',
      '#extensionsMenuButton',
      '.right_menu_button:first-of-type',
      '#option_toggle_themes',
      '#options_button',
    ];
    let anchor = null;
    for (const s of targets) { anchor = document.querySelector(s); if(anchor) break; }
    const btn = document.createElement('div');
    btn.id = 'pl-topbar-btn';
    btn.className = 'pl-topbar-btn';
    btn.title = '珍珠账本 · Pearl Ledger';
    btn.innerHTML = `<i class="fa-solid fa-coins"></i>`;
    btn.addEventListener('click', togglePanel);
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(btn, anchor);
    } else {
      btn.classList.add('pl-float-trigger');
      document.body.appendChild(btn);
    }
  }

  /* ─── Mount ───────────────────────────────────── */
  function mount() {
    if (document.getElementById('pl-win')) return;
    const win = buildWindow();
    document.body.appendChild(win);
    restorePos(win);
    makeDraggable(win);

    document.getElementById('pl-x').addEventListener('click', closePanel);
    document.getElementById('pl-t-exp').addEventListener('click',()=>{
      currentType='expense';
      document.getElementById('pl-t-exp').classList.add('active');
      document.getElementById('pl-t-inc').classList.remove('active');
    });
    document.getElementById('pl-t-inc').addEventListener('click',()=>{
      currentType='income';
      document.getElementById('pl-t-inc').classList.add('active');
      document.getElementById('pl-t-exp').classList.remove('active');
    });
    document.getElementById('pl-add').addEventListener('click', addRecord);
    document.getElementById('pl-share').addEventListener('click', share);
  }

  function init() { mount(); injectTopBtn(); }

  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded',()=>{ setTimeout(init,600); setTimeout(init,2500); });
  } else {
    setTimeout(init,600);
    setTimeout(init,2500);
  }
})();
