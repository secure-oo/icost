// iCost · 珍珠账本  v5.0
(function () {
  'use strict';

  const REC_KEY  = 'icost_records_v1';
  const POS_KEY  = 'icost_pos_v1';
  const COL_KEY  = 'icost_collapsed_v1';
  let curType    = 'expense';
  let winVisible = false;

  /* ── storage ──────────────────────────────────── */
  function load()    { try { return JSON.parse(localStorage.getItem(REC_KEY) || '[]'); } catch { return []; } }
  function save(r)   { localStorage.setItem(REC_KEY, JSON.stringify(r)); }
  function uid()     { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function fmt(iso)  { const d = new Date(iso); return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`; }

  function getCollapsed() { try { return JSON.parse(localStorage.getItem(COL_KEY) || '{}'); } catch { return {}; } }
  function setCollapsed(k, v) { const c = getCollapsed(); c[k] = v; localStorage.setItem(COL_KEY, JSON.stringify(c)); }

  /* ── build window ─────────────────────────────── */
  function buildWin() {
    const w = document.createElement('div');
    w.id = 'ic-win';
    w.innerHTML = `
      <!-- title bar / capsule -->
      <div id="ic-bar" title="点击折叠 · Click to collapse">
        <div class="ic-titles">
          <span class="ic-cn">iCost</span>
          <span class="ic-en">珍珠账本</span>
        </div>
        <div class="ic-bar-right">
          <span class="ic-collapse-hint" id="ic-collapse-hint">▾</span>
          <button id="ic-x" title="关闭">✕</button>
        </div>
      </div>

      <!-- collapsible body -->
      <div id="ic-body">
        <!-- summary -->
        <div class="ic-summary">
          <div class="ic-sitem">
            <span class="ic-slabel">收入<br>Income</span>
            <span class="ic-sval ic-green" id="ic-inc">¥0</span>
          </div>
          <div class="ic-sdiv"></div>
          <div class="ic-sitem">
            <span class="ic-slabel">支出<br>Expense</span>
            <span class="ic-sval ic-red" id="ic-exp">¥0</span>
          </div>
          <div class="ic-sdiv"></div>
          <div class="ic-sitem">
            <span class="ic-slabel">结余<br>Balance</span>
            <span class="ic-sval" id="ic-bal">¥0</span>
          </div>
        </div>

        <!-- form -->
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
            <input id="ic-note" class="ic-ninp" type="text" placeholder="买了什么 / 赚了什么…" maxlength="60">
          </div>
          <button class="ic-addbtn" id="ic-addbtn">记录 · Add</button>
        </div>

        <!-- records section header (collapsible) -->
        <div class="ic-rechd" id="ic-rechd" title="点击折叠明细 · Click to collapse">
          <span>明细 · Records <span class="ic-cnt" id="ic-cnt">0 条</span></span>
          <span class="ic-rec-arrow" id="ic-rec-arrow">▾</span>
        </div>
        <div id="ic-list-wrap">
          <div id="ic-list"></div>
        </div>

        <!-- share footer -->
        <div class="ic-foot">
          <div class="ic-share-note-wrap">
            <input id="ic-share-note" class="ic-share-note" type="text" placeholder="加一句话给爸爸（可选）…" maxlength="100">
          </div>
          <button class="ic-share" id="ic-share">📤 发给爸爸看 · Share to Chat</button>
        </div>
      </div>`;
    return w;
  }

  /* ── render records ───────────────────────────── */
  function render() {
    const recs = load();
    const list = document.getElementById('ic-list');
    if (!list) return;

    const inc = recs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp = recs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const bal = inc - exp;

    document.getElementById('ic-inc').textContent = `¥${inc.toFixed(2)}`;
    document.getElementById('ic-exp').textContent = `¥${exp.toFixed(2)}`;
    const bel = document.getElementById('ic-bal');
    bel.textContent = (bal<0?'-¥':'¥') + Math.abs(bal).toFixed(2);
    bel.className = 'ic-sval ' + (bal>=0?'ic-green':'ic-red');
    document.getElementById('ic-cnt').textContent = `${recs.length} 条`;

    if (!recs.length) {
      list.innerHTML = `<p class="ic-empty">还没有记录 · No records yet</p>`;
      return;
    }
    list.innerHTML = [...recs].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`
      <div class="ic-row ic-row-${r.type}">
        <div class="ic-rl">
          <span class="ic-tag ic-tag-${r.type}">${r.type==='income'?'收入':'支出'}</span>
          <span class="ic-rmk">${r.note||'—'}</span>
        </div>
        <div class="ic-rr">
          <span class="ic-ra ic-${r.type}">${r.type==='income'?'+':'-'}¥${Number(r.amount).toFixed(2)}</span>
          <span class="ic-rd">${fmt(r.date)}</span>
          <button class="ic-del" data-id="${r.id}">×</button>
        </div>
      </div>`).join('');

    list.querySelectorAll('.ic-del').forEach(b=>{
      b.addEventListener('click',()=>{ save(load().filter(r=>r.id!==b.dataset.id)); render(); });
    });
  }

  /* ── collapse: whole window ───────────────────── */
  function applyCapsule() {
    const c = getCollapsed();
    const body  = document.getElementById('ic-body');
    const hint  = document.getElementById('ic-collapse-hint');
    const win   = document.getElementById('ic-win');
    if (!body) return;
    if (c.window) {
      body.style.display = 'none';
      win.classList.add('ic-capsule');
      if (hint) hint.textContent = '▴';
    } else {
      body.style.display = '';
      win.classList.remove('ic-capsule');
      if (hint) hint.textContent = '▾';
    }
  }

  function toggleCapsule(e) {
    if (e.target.closest('#ic-x')) return;
    const c = getCollapsed();
    c.window = !c.window;
    localStorage.setItem(COL_KEY, JSON.stringify(c));
    applyCapsule();
  }

  /* ── collapse: records section ────────────────── */
  function applyRecCollapse() {
    const c     = getCollapsed();
    const wrap  = document.getElementById('ic-list-wrap');
    const arrow = document.getElementById('ic-rec-arrow');
    if (!wrap) return;
    if (c.records) {
      wrap.style.display = 'none';
      if (arrow) arrow.textContent = '▸';
    } else {
      wrap.style.display = '';
      if (arrow) arrow.textContent = '▾';
    }
  }

  function toggleRecCollapse() {
    const c = getCollapsed();
    c.records = !c.records;
    localStorage.setItem(COL_KEY, JSON.stringify(c));
    applyRecCollapse();
  }

  /* ── drag ─────────────────────────────────────── */
  function enableDrag(win) {
    const bar = document.getElementById('ic-bar');
    let dragging=false, ox=0, oy=0, sx=0, sy=0, moved=false;

    function start(e) {
      if (e.target.closest('#ic-x')) return;
      dragging=true; moved=false;
      const t = e.touches?e.touches[0]:e;
      sx=t.clientX; sy=t.clientY;
      ox=win.offsetLeft; oy=win.offsetTop;
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      const t = e.touches?e.touches[0]:e;
      const dx=t.clientX-sx, dy=t.clientY-sy;
      if (Math.abs(dx)+Math.abs(dy)>4) moved=true;
      const nx=Math.max(0,Math.min(ox+dx,window.innerWidth-win.offsetWidth));
      const ny=Math.max(0,Math.min(oy+dy,window.innerHeight-win.offsetHeight));
      win.style.left=nx+'px'; win.style.top=ny+'px';
      win.style.right='auto'; win.style.bottom='auto';
      e.preventDefault();
    }
    function end(e) {
      if (!dragging) return;
      dragging=false;
      try { localStorage.setItem(POS_KEY, JSON.stringify({l:win.style.left,t:win.style.top})); } catch{}
      // if barely moved, treat as tap → toggle capsule
      if (!moved) toggleCapsule(e);
    }
    bar.addEventListener('mousedown',  start,{passive:false});
    bar.addEventListener('touchstart', start,{passive:false});
    document.addEventListener('mousemove', move,{passive:false});
    document.addEventListener('touchmove', move,{passive:false});
    document.addEventListener('mouseup',  end);
    document.addEventListener('touchend', end);
  }

  function restorePos(win) {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY)||'null');
      if (p&&p.l&&p.t) { win.style.left=p.l; win.style.top=p.t; win.style.right='auto'; win.style.bottom='auto'; }
    } catch {}
  }

  /* ── open / close window ──────────────────────── */
  function openWin() {
    const w = document.getElementById('ic-win');
    if (!w) return;
    winVisible=true;
    w.style.display='flex';
    requestAnimationFrame(()=>w.classList.add('ic-visible'));
    render();
    applyCapsule();
    applyRecCollapse();
    const lb=document.getElementById('ic-panel-toggle');
    if (lb) { lb.textContent='关闭 · Close'; lb.classList.add('ic-ext-btn-open'); }
  }
  function closeWin() {
    const w=document.getElementById('ic-win');
    if (!w) return;
    winVisible=false;
    w.classList.remove('ic-visible');
    w.addEventListener('transitionend',()=>{ if(!winVisible) w.style.display='none'; },{once:true});
    const lb=document.getElementById('ic-panel-toggle');
    if (lb) { lb.textContent='打开 · Open'; lb.classList.remove('ic-ext-btn-open'); }
  }
  function toggleWin() { winVisible?closeWin():openWin(); }

  /* ── add record ───────────────────────────────── */
  function addRecord() {
    const ae=document.getElementById('ic-amt');
    const ne=document.getElementById('ic-note');
    const amt=parseFloat(ae.value);
    if (!amt||amt<=0) {
      ae.classList.add('ic-shake');
      setTimeout(()=>ae.classList.remove('ic-shake'),500);
      return;
    }
    const recs=load();
    recs.push({id:uid(),type:curType,amount:amt,note:ne.value.trim(),date:new Date().toISOString()});
    save(recs); ae.value=''; ne.value='';
    render();
    const btn=document.getElementById('ic-addbtn');
    btn.textContent='已记录 ✓'; btn.classList.add('ic-addbtn-ok');
    setTimeout(()=>{ btn.textContent='记录 · Add'; btn.classList.remove('ic-addbtn-ok'); },1500);
  }

  /* ── share ────────────────────────────────────── */
  function share() {
    const recs=load();
    const inc=recs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp=recs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const lines=recs.length
      ? [...recs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)
          .map(r=>`${fmt(r.date)} ${r.type==='income'?'＋':'－'}¥${r.amount}${r.note?' · '+r.note:''}`).join('\n')
      : '（暂无记录）';
    const extra = (document.getElementById('ic-share-note')||{}).value||'';
    const msg = `【iCost 账单】\n收入 ¥${inc.toFixed(2)} · 支出 ¥${exp.toFixed(2)} · 结余 ¥${(inc-exp).toFixed(2)}\n\n最近记录：\n${lines}${extra?'\n\n'+extra:''}`;
    const ta=document.querySelector('#send_textarea');
    if (ta) { ta.value=msg; ta.dispatchEvent(new Event('input',{bubbles:true})); }
    // clear the note input but keep window open
    const sn=document.getElementById('ic-share-note');
    if (sn) sn.value='';
    // send
    setTimeout(()=>{ const s=document.querySelector('#send_but'); if(s) s.click(); },120);
    // window stays visible — just show a brief flash
    const btn=document.getElementById('ic-share');
    btn.textContent='已发送 ✓'; btn.classList.add('ic-share-ok');
    setTimeout(()=>{ btn.textContent='📤 发给爸爸看 · Share to Chat'; btn.classList.remove('ic-share-ok'); },1800);
  }

  /* ── inject extension panel entry ────────────── */
  function injectPanel() {
    if (document.getElementById('ic-ext-section')) return;
    const target=document.getElementById('extensions_settings');
    if (!target) return;
    const sec=document.createElement('div');
    sec.id='ic-ext-section';
    sec.className='ic-ext-section';
    sec.innerHTML=`
      <div class="ic-ext-row">
        <div class="ic-ext-info">
          <span class="ic-ext-name">iCost</span>
          <span class="ic-ext-sub">珍珠账本 · 收支记录</span>
        </div>
        <button class="ic-ext-btn" id="ic-panel-toggle">打开 · Open</button>
      </div>`;
    target.prepend(sec);
    document.getElementById('ic-panel-toggle').addEventListener('click',toggleWin);
  }

  /* ── mount ────────────────────────────────────── */
  function mount() {
    if (document.getElementById('ic-win')) return;
    const w=buildWin();
    document.body.appendChild(w);
    restorePos(w);
    enableDrag(w);

    document.getElementById('ic-x').addEventListener('click', closeWin);
    document.getElementById('ic-rechd').addEventListener('click', toggleRecCollapse);
    document.getElementById('ic-tb-exp').addEventListener('click',()=>{
      curType='expense';
      document.getElementById('ic-tb-exp').className='ic-tb ic-tb-exp active';
      document.getElementById('ic-tb-inc').className='ic-tb ic-tb-inc';
    });
    document.getElementById('ic-tb-inc').addEventListener('click',()=>{
      curType='income';
      document.getElementById('ic-tb-inc').className='ic-tb ic-tb-inc active';
      document.getElementById('ic-tb-exp').className='ic-tb ic-tb-exp';
    });
    document.getElementById('ic-addbtn').addEventListener('click',addRecord);
    document.getElementById('ic-share').addEventListener('click',share);
  }

  function init() { mount(); injectPanel(); }
  const D=[800,2200,4500];
  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded',()=>D.forEach(d=>setTimeout(init,d)));
  } else { D.forEach(d=>setTimeout(init,d)); }
})();
