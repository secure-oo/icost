// iCost · 珍珠账本  v6.0
(function () {
  'use strict';

  const REC_KEY = 'icost_records_v1';
  const POS_KEY = 'icost_pos_v1';
  const COL_KEY = 'icost_collapsed_v1';
  let curType    = 'expense';
  let winVisible = false;
  let editingId  = null;   // id of record being edited, or null

  /* ── storage ──────────────────────────────────────── */
  function load()  { try { return JSON.parse(localStorage.getItem(REC_KEY)||'[]'); } catch(e){return[];} }
  function save(r) { localStorage.setItem(REC_KEY, JSON.stringify(r)); }
  function uid()   { return Date.now().toString(36)+Math.random().toString(36).slice(2); }
  function fmt(iso){ const d=new Date(iso); return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`; }
  function getCol(){ try{return JSON.parse(localStorage.getItem(COL_KEY)||'{}');}catch(e){return{};} }
  function setCol(k,v){ const c=getCol(); c[k]=v; localStorage.setItem(COL_KEY,JSON.stringify(c)); }

  /* ── build window ─────────────────────────────────── */
  function buildWin(){
    const w=document.createElement('div');
    w.id='ic-win';
    w.innerHTML=`
      <div id="ic-bar">
        <div class="ic-titles">
          <span class="ic-cn">iCost</span>
          <span class="ic-en" id="ic-en-sub">珍珠账本</span>
        </div>
        <div class="ic-bar-right">
          <span class="ic-hint" id="ic-hint">▾</span>
          <button id="ic-x">✕</button>
        </div>
      </div>

      <div id="ic-body">
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

        <!-- form block — background changes with type -->
        <div class="ic-form ic-form-expense" id="ic-form">
          <div class="ic-trow">
            <button class="ic-tb ic-tb-exp active" id="ic-tb-exp">支出 Expense</button>
            <button class="ic-tb ic-tb-inc"        id="ic-tb-inc">收入 Income</button>
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

        <div class="ic-rechd" id="ic-rechd">
          <span>明细 · Records <span class="ic-cnt" id="ic-cnt">0 条</span></span>
          <span class="ic-rec-arrow" id="ic-rec-arrow">▾</span>
        </div>
        <div id="ic-list-wrap"><div id="ic-list"></div></div>

        <div class="ic-foot">
          <input id="ic-share-note" class="ic-share-note" type="text" placeholder="加一句话给爸爸（可选）…" maxlength="100">
          <button class="ic-share" id="ic-share">📤 发给爸爸看 · Share to Chat</button>
        </div>
      </div>`;
    return w;
  }

  /* ── set type (changes form bg) ───────────────────── */
  function setType(t){
    curType = t;
    const form = document.getElementById('ic-form');
    if (!form) return;
    form.className = 'ic-form ic-form-' + t;
    document.getElementById('ic-tb-exp').className = 'ic-tb ic-tb-exp' + (t==='expense'?' active':'');
    document.getElementById('ic-tb-inc').className = 'ic-tb ic-tb-inc' + (t==='income'?' active':'');
    // if editing, keep edit mode visible
    const btn = document.getElementById('ic-addbtn');
    if (editingId) btn.textContent = '保存修改 · Save';
  }

  /* ── render ───────────────────────────────────────── */
  function render(){
    const recs=load();
    const list=document.getElementById('ic-list');
    if(!list) return;

    const inc=recs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp=recs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const bal=inc-exp;
    document.getElementById('ic-inc').textContent=`¥${inc.toFixed(2)}`;
    document.getElementById('ic-exp').textContent=`¥${exp.toFixed(2)}`;
    const bel=document.getElementById('ic-bal');
    bel.textContent=(bal<0?'-¥':'¥')+Math.abs(bal).toFixed(2);
    bel.className='ic-sval '+(bal>=0?'ic-green':'ic-red');
    document.getElementById('ic-cnt').textContent=`${recs.length} 条`;

    if(!recs.length){ list.innerHTML=`<p class="ic-empty">还没有记录 · No records yet</p>`; return; }

    list.innerHTML=[...recs].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`
      <div class="ic-row ic-row-${r.type}" data-id="${r.id}">
        <div class="ic-row-actions">
          <button class="ic-edit-action" data-id="${r.id}">编辑</button>
        </div>
        <div class="ic-row-content">
          <div class="ic-rl">
            <span class="ic-tag ic-tag-${r.type}">${r.type==='income'?'收入':'支出'}</span>
            <span class="ic-rmk">${r.note||'—'}</span>
          </div>
          <div class="ic-rr">
            <span class="ic-ra ic-${r.type}">${r.type==='income'?'+':'-'}¥${Number(r.amount).toFixed(2)}</span>
            <span class="ic-rd">${fmt(r.date)}</span>
            <button class="ic-del" data-id="${r.id}">×</button>
          </div>
        </div>
      </div>`).join('');

    // swipe-to-reveal edit
    list.querySelectorAll('.ic-row').forEach(row => attachSwipe(row));

    list.querySelectorAll('.ic-del').forEach(b=>{
      b.addEventListener('click', e=>{
        e.stopPropagation();
        if(editingId===b.dataset.id) cancelEdit();
        save(load().filter(r=>r.id!==b.dataset.id));
        render();
      });
    });

    list.querySelectorAll('.ic-edit-action').forEach(b=>{
      b.addEventListener('click', e=>{ e.stopPropagation(); startEdit(b.dataset.id); });
    });
  }

  /* ── swipe left to reveal edit button ────────────── */
  function attachSwipe(row){
    const content = row.querySelector('.ic-row-content');
    let startX=0, startY=0, swiping=false, revealed=false;

    function pointerStart(e){
      const t=e.touches?e.touches[0]:e;
      startX=t.clientX; startY=t.clientY; swiping=true;
    }
    function pointerMove(e){
      if(!swiping) return;
      const t=e.touches?e.touches[0]:e;
      const dx=t.clientX-startX;
      const dy=Math.abs(t.clientY-startY);
      if(dy>10){ swiping=false; return; } // vertical scroll, abort
      if(dx<-8){
        const shift=Math.max(-72, dx);
        content.style.transform=`translateX(${shift}px)`;
        e.preventDefault();
      } else if(dx>8 && revealed){
        content.style.transform='translateX(0)';
      }
    }
    function pointerEnd(){
      if(!swiping) return;
      swiping=false;
      const cur=parseFloat(content.style.transform.replace('translateX(',''))||0;
      if(cur<-36){
        content.style.transform='translateX(-68px)';
        revealed=true;
        // close other revealed rows
        document.querySelectorAll('.ic-row-content').forEach(c=>{
          if(c!==content && parseFloat(c.style.transform.replace('translateX(',''))||0)<0){
            c.style.transform='translateX(0)';
          }
        });
      } else {
        content.style.transform='translateX(0)';
        revealed=false;
      }
    }

    content.addEventListener('touchstart', pointerStart,{passive:true});
    content.addEventListener('touchmove',  pointerMove, {passive:false});
    content.addEventListener('touchend',   pointerEnd);
    content.addEventListener('mousedown',  pointerStart);
    document.addEventListener('mousemove', pointerMove);
    document.addEventListener('mouseup',   pointerEnd);
  }

  /* ── edit helpers ─────────────────────────────────── */
  function startEdit(id){
    const rec = load().find(r=>r.id===id);
    if(!rec) return;
    editingId = id;
    // scroll form into view
    document.getElementById('ic-body').scrollTo({top:0,behavior:'smooth'});
    // populate form
    const amtEl  = document.getElementById('ic-amt');
    const noteEl = document.getElementById('ic-note');
    amtEl.value  = rec.amount;
    noteEl.value = rec.note;
    setType(rec.type);
    const btn = document.getElementById('ic-addbtn');
    btn.textContent = '保存修改 · Save';
    btn.classList.add('ic-addbtn-edit');
    amtEl.focus();
  }

  function cancelEdit(){
    editingId = null;
    document.getElementById('ic-amt').value  = '';
    document.getElementById('ic-note').value = '';
    const btn = document.getElementById('ic-addbtn');
    btn.textContent = '记录 · Add';
    btn.classList.remove('ic-addbtn-edit');
  }

  /* ── add / save record ────────────────────────────── */
  function addRecord(){
    const ae  = document.getElementById('ic-amt');
    const ne  = document.getElementById('ic-note');
    const amt = parseFloat(ae.value);
    if(!amt||amt<=0){ ae.classList.add('ic-shake'); setTimeout(()=>ae.classList.remove('ic-shake'),500); return; }

    let recs = load();
    if(editingId){
      recs = recs.map(r=>r.id===editingId ? {...r, type:curType, amount:amt, note:ne.value.trim()} : r);
      editingId = null;
    } else {
      recs.push({id:uid(), type:curType, amount:amt, note:ne.value.trim(), date:new Date().toISOString()});
    }
    save(recs);
    ae.value=''; ne.value='';
    const btn=document.getElementById('ic-addbtn');
    btn.textContent='已保存 ✓'; btn.classList.remove('ic-addbtn-edit'); btn.classList.add('ic-addbtn-ok');
    setTimeout(()=>{ btn.textContent='记录 · Add'; btn.classList.remove('ic-addbtn-ok'); },1500);
    render();
  }

  /* ── collapse: whole window ───────────────────────── */
  function applyCapsule(){
    const c    = getCol();
    const body = document.getElementById('ic-body');
    const hint = document.getElementById('ic-hint');
    const sub  = document.getElementById('ic-en-sub');
    const win  = document.getElementById('ic-win');
    if(!body) return;
    if(c.window){
      body.style.display='none';
      win.classList.add('ic-capsule');
      if(hint) hint.textContent='▴';
      if(sub)  sub.style.display='none';
    } else {
      body.style.display='';
      win.classList.remove('ic-capsule');
      if(hint) hint.textContent='▾';
      if(sub)  sub.style.display='';
    }
  }

  /* ── collapse: records ────────────────────────────── */
  function applyRecCollapse(){
    const c    = getCol();
    const wrap = document.getElementById('ic-list-wrap');
    const arr  = document.getElementById('ic-rec-arrow');
    if(!wrap) return;
    wrap.style.display = c.records ? 'none' : '';
    if(arr) arr.textContent = c.records ? '▸' : '▾';
  }

  /* ── drag ─────────────────────────────────────────── */
  function enableDrag(win){
    const bar=document.getElementById('ic-bar');
    let dragging=false,ox=0,oy=0,sx=0,sy=0,moved=false;
    function start(e){
      if(e.target.closest('#ic-x')) return;
      dragging=true; moved=false;
      const t=e.touches?e.touches[0]:e;
      sx=t.clientX; sy=t.clientY; ox=win.offsetLeft; oy=win.offsetTop;
      e.preventDefault();
    }
    function move(e){
      if(!dragging) return;
      const t=e.touches?e.touches[0]:e;
      const dx=t.clientX-sx, dy=t.clientY-sy;
      if(Math.abs(dx)+Math.abs(dy)>5) moved=true;
      const nx=Math.max(0,Math.min(ox+dx,window.innerWidth-win.offsetWidth));
      const ny=Math.max(0,Math.min(oy+dy,window.innerHeight-win.offsetHeight));
      win.style.left=nx+'px'; win.style.top=ny+'px';
      win.style.right='auto'; win.style.bottom='auto';
      e.preventDefault();
    }
    function end(e){
      if(!dragging) return; dragging=false;
      try{ localStorage.setItem(POS_KEY,JSON.stringify({l:win.style.left,t:win.style.top})); }catch{}
      if(!moved){ const c=getCol(); c.window=!c.window; localStorage.setItem(COL_KEY,JSON.stringify(c)); applyCapsule(); }
    }
    bar.addEventListener('mousedown', start,{passive:false});
    bar.addEventListener('touchstart',start,{passive:false});
    document.addEventListener('mousemove',move,{passive:false});
    document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('mouseup', end);
    document.addEventListener('touchend',end);
  }

  function restorePos(win){
    try{ const p=JSON.parse(localStorage.getItem(POS_KEY)||'null'); if(p&&p.l&&p.t){win.style.left=p.l;win.style.top=p.t;win.style.right='auto';win.style.bottom='auto';} }catch{}
  }

  /* ── open / close window ──────────────────────────── */
  function openWin(){
    const w=document.getElementById('ic-win'); if(!w) return;
    winVisible=true; w.style.display='flex';
    requestAnimationFrame(()=>w.classList.add('ic-visible'));
    render(); applyCapsule(); applyRecCollapse();
    const lb=document.getElementById('ic-panel-toggle');
    if(lb){lb.textContent='关闭 · Close';lb.classList.add('ic-ext-btn-open');}
  }
  function closeWin(){
    const w=document.getElementById('ic-win'); if(!w) return;
    winVisible=false; w.classList.remove('ic-visible');
    w.addEventListener('transitionend',()=>{if(!winVisible)w.style.display='none';},{once:true});
    const lb=document.getElementById('ic-panel-toggle');
    if(lb){lb.textContent='打开 · Open';lb.classList.remove('ic-ext-btn-open');}
  }
  function toggleWin(){ winVisible?closeWin():openWin(); }

  /* ── share ────────────────────────────────────────── */
  function share(){
    const recs=load();
    const inc=recs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp=recs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const lines=recs.length
      ? [...recs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)
          .map(r=>`${fmt(r.date)} ${r.type==='income'?'＋':'－'}¥${r.amount}${r.note?' · '+r.note:''}`).join('\n')
      : '（暂无记录）';
    const extra=(document.getElementById('ic-share-note')||{}).value||'';
    const msg=`【iCost 账单】\n收入 ¥${inc.toFixed(2)} · 支出 ¥${exp.toFixed(2)} · 结余 ¥${(inc-exp).toFixed(2)}\n\n最近记录：\n${lines}${extra?'\n\n'+extra:''}`;
    const ta=document.querySelector('#send_textarea');
    if(ta){ta.value=msg;ta.dispatchEvent(new Event('input',{bubbles:true}));}
    const sn=document.getElementById('ic-share-note'); if(sn) sn.value='';
    setTimeout(()=>{const s=document.querySelector('#send_but');if(s)s.click();},120);
    const btn=document.getElementById('ic-share');
    btn.textContent='已发送 ✓'; btn.classList.add('ic-share-ok');
    setTimeout(()=>{btn.textContent='📤 发给爸爸看 · Share to Chat';btn.classList.remove('ic-share-ok');},1800);
  }

  /* ── extension panel entry ────────────────────────── */
  function injectPanel(){
    if(document.getElementById('ic-ext-section')) return;
    const target=document.getElementById('extensions_settings'); if(!target) return;
    const sec=document.createElement('div');
    sec.id='ic-ext-section'; sec.className='ic-ext-section';
    sec.innerHTML=`<div class="ic-ext-row">
      <div class="ic-ext-info">
        <span class="ic-ext-name">iCost</span>
        <span class="ic-ext-sub">珍珠账本 · 收支记录</span>
      </div>
      <button class="ic-ext-btn" id="ic-panel-toggle">打开 · Open</button>
    </div>`;
    target.prepend(sec);
    document.getElementById('ic-panel-toggle').addEventListener('click',toggleWin);
  }

  /* ── mount ────────────────────────────────────────── */
  function mount(){
    if(document.getElementById('ic-win')) return;
    const w=buildWin(); document.body.appendChild(w);
    restorePos(w); enableDrag(w);

    document.getElementById('ic-x').addEventListener('click', closeWin);
    document.getElementById('ic-rechd').addEventListener('click',()=>{
      const c=getCol(); c.records=!c.records; localStorage.setItem(COL_KEY,JSON.stringify(c)); applyRecCollapse();
    });
    document.getElementById('ic-tb-exp').addEventListener('click',()=>setType('expense'));
    document.getElementById('ic-tb-inc').addEventListener('click',()=>setType('income'));
    document.getElementById('ic-addbtn').addEventListener('click',addRecord);
    document.getElementById('ic-share').addEventListener('click',share);
  }

  function init(){ mount(); injectPanel(); }
  const D=[800,2200,4500];
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>D.forEach(d=>setTimeout(init,d)));
  } else { D.forEach(d=>setTimeout(init,d)); }
})();
