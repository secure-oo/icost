// iCost · 珍珠账本 v6.2 — 增强兼容性版
(function () {
  'use strict';

  const REC_KEY = 'icost_records_v1';
  const POS_KEY = 'icost_pos_v1';
  const COL_KEY = 'icost_collapsed_v1';
  let curType   = 'expense';
  let winVisible = false;
  let editingId  = null;

  /* ── 存储逻辑 ── */
  function load()  { try { return JSON.parse(localStorage.getItem(REC_KEY)||'[]'); } catch(e){return[];} }
  function save(r) { localStorage.setItem(REC_KEY, JSON.stringify(r)); }
  function uid()   { return Date.now().toString(36)+Math.random().toString(36).slice(2); }
  function fmt(iso){ const d=new Date(iso); return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`; }
  function getCol(){ try{return JSON.parse(localStorage.getItem(COL_KEY)||'{}');}catch(e){return{};} }

  /* ── 构建窗口 ── */
  function buildWin(){
    if(document.getElementById('ic-win')) return document.getElementById('ic-win');
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
          <input id="ic-share-note" class="ic-share-note" type="text" placeholder="给爸爸留言（可选）…" maxlength="100">
          <button class="ic-share" id="ic-share">📤 发送账单 · Share</button>
        </div>
      </div>`;
    document.body.appendChild(w);
    return w;
  }

  function setType(t){
    curType=t;
    const form=document.getElementById('ic-form'); if(!form) return;
    form.className='ic-form ic-form-'+t;
    document.getElementById('ic-tb-exp').className='ic-tb ic-tb-exp'+(t==='expense'?' active':'');
    document.getElementById('ic-tb-inc').className='ic-tb ic-tb-inc'+(t==='income'?' active':'');
    const btn=document.getElementById('ic-addbtn');
    if(editingId && btn) btn.textContent='保存修改 · Save';
  }

  function render(){
    const recs=load();
    const list=document.getElementById('ic-list'); if(!list) return;
    const inc=recs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
    const exp=recs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
    const bal=inc-exp;
    document.getElementById('ic-inc').textContent=`¥${inc.toFixed(2)}`;
    document.getElementById('ic-exp').textContent=`¥${exp.toFixed(2)}`;
    const bel=document.getElementById('ic-bal');
    bel.textContent=(bal<0?'-¥':'¥')+Math.abs(bal).toFixed(2);
    bel.className='ic-sval '+(bal>=0?'ic-green':'ic-red');
    document.getElementById('ic-cnt').textContent=`${recs.length} 条`;

    if(!recs.length){ list.innerHTML=`<p class="ic-empty">还没有记录</p>`; return; }
    list.innerHTML=[...recs].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`
      <div class="ic-row ic-row-${r.type}" data-id="${r.id}">
        <div class="ic-row-actions"><button class="ic-edit-action" data-id="${r.id}">编辑</button></div>
        <div class="ic-row-content">
          <div class="ic-rl"><span class="ic-tag ic-tag-${r.type}">${r.type==='income'?'收入':'支出'}</span><span class="ic-rmk">${r.note||'—'}</span></div>
          <div class="ic-rr"><span class="ic-ra ic-${r.type}">${r.type==='income'?'+':'-'}¥${Number(r.amount).toFixed(2)}</span><button class="ic-del" data-id="${r.id}">×</button></div>
        </div>
      </div>`).join('');

    list.querySelectorAll('.ic-row').forEach(row=>attachSwipe(row));
    list.querySelectorAll('.ic-del').forEach(b=>{
      b.onclick=(e)=>{ e.stopPropagation(); if(editingId===b.dataset.id) cancelEdit(); save(load().filter(r=>r.id!==b.dataset.id)); render(); };
    });
    list.querySelectorAll('.ic-edit-action').forEach(b=>{
      b.onclick=(e)=>{ e.stopPropagation(); startEdit(b.dataset.id); };
    });
  }

  function attachSwipe(row){
    const content=row.querySelector('.ic-row-content'); if(!content) return;
    let startX=0, active=false, revealed=false;
    content.ontouchstart=(e)=>{ startX=e.touches[0].clientX; active=true; };
    content.ontouchmove=(e)=>{
      if(!active) return;
      const dx=e.touches[0].clientX-startX;
      if(dx<-10 || (revealed && dx>10)) content.style.transform=`translateX(${revealed?Math.min(0,-68+dx):Math.max(-68,dx)}px)`;
    };
    content.ontouchend=()=>{
      active=false;
      const cur=parseFloat(content.style.transform.replace('translateX(',''))||0;
      if(cur<-34){ content.style.transform='translateX(-68px)'; revealed=true; }
      else { content.style.transform='translateX(0)'; revealed=false; }
    };
  }

  function startEdit(id){
    const rec=load().find(r=>r.id===id); if(!rec) return;
    editingId=id;
    document.getElementById('ic-amt').value=rec.amount;
    document.getElementById('ic-note').value=rec.note;
    setType(rec.type);
    const btn=document.getElementById('ic-addbtn');
    btn.textContent='保存修改 · Save';
    btn.classList.add('ic-addbtn-edit');
  }

  function cancelEdit(){
    editingId=null;
    document.getElementById('ic-amt').value='';
    document.getElementById('ic-note').value='';
    const btn=document.getElementById('ic-addbtn');
    btn.textContent='记录 · Add';
    btn.classList.remove('ic-addbtn-edit');
  }

  function addRecord(){
    const ae=document.getElementById('ic-amt'), ne=document.getElementById('ic-note');
    const amt=parseFloat(ae.value);
    if(!amt||amt<=0){ ae.classList.add('ic-shake'); setTimeout(()=>ae.classList.remove('ic-shake'),500); return; }
    let recs=load();
    if(editingId){
      recs=recs.map(r=>r.id===editingId?{...r,type:curType,amount:amt,note:ne.value.trim()}:r);
      editingId=null;
    } else {
      recs.push({id:uid(),type:curType,amount:amt,note:ne.value.trim(),date:new Date().toISOString()});
    }
    save(recs); ae.value=''; ne.value='';
    const btn=document.getElementById('ic-addbtn');
    btn.textContent='已保存 ✓';
    setTimeout(()=>{ btn.textContent='记录 · Add'; btn.classList.remove('ic-addbtn-edit'); render(); },800);
  }

  function applyCapsule(){
    const c=getCol(), body=document.getElementById('ic-body'), win=document.getElementById('ic-win');
    if(!body||!win) return;
    if(c.window){ body.style.display='none'; win.classList.add('ic-capsule'); }
    else { body.style.display=''; win.classList.remove('ic-capsule'); }
  }

  function enableDrag(win){
    const bar=document.getElementById('ic-bar');
    let dragging=false,ox=0,oy=0,sx=0,sy=0,moved=false;
    const onStart=(e)=>{
      if(e.target.closest('#ic-x')) return;
      dragging=true; moved=false;
      const t=e.touches?e.touches[0]:e;
      sx=t.clientX; sy=t.clientY; ox=win.offsetLeft; oy=win.offsetTop;
    };
    const onMove=(e)=>{
      if(!dragging) return; moved=true;
      const t=e.touches?e.touches[0]:e;
      win.style.left=(ox+t.clientX-sx)+'px'; win.style.top=(oy+t.clientY-sy)+'px';
      win.style.right='auto'; win.style.bottom='auto';
    };
    const onEnd=()=>{
      if(!dragging) return; dragging=false;
      localStorage.setItem(POS_KEY,JSON.stringify({l:win.style.left,t:win.style.top}));
      if(!moved){ const c=getCol(); c.window=!c.window; localStorage.setItem(COL_KEY,JSON.stringify(c)); applyCapsule(); }
    };
    bar.onmousedown=onStart; bar.ontouchstart=onStart;
    document.onmousemove=onMove; document.ontouchmove=onMove;
    document.onmouseup=onEnd; document.ontouchend=onEnd;
  }

  function toggleWin(){
    const w=document.getElementById('ic-win');
    if(!w) { mount(); return; }
    winVisible = !winVisible;
    if(winVisible){
      w.style.display='flex';
      setTimeout(()=>w.classList.add('ic-visible'),10);
      render(); applyCapsule();
    } else {
      w.classList.remove('ic-visible');
      setTimeout(()=>{ if(!winVisible) w.style.display='none'; },300);
    }
  }

  function mount(){
    const w=buildWin();
    try{
      const p=JSON.parse(localStorage.getItem(POS_KEY));
      if(p){ w.style.left=p.l; w.style.top=p.t; w.style.right='auto'; w.style.bottom='auto'; }
    }catch(e){}
    enableDrag(w);
    document.getElementById('ic-x').onclick=toggleWin;
    document.getElementById('ic-tb-exp').onclick=()=>setType('expense');
    document.getElementById('ic-tb-inc').onclick=()=>setType('income');
    document.getElementById('ic-addbtn').onclick=addRecord;
    document.getElementById('ic-rechd').onclick=()=>{
      const wrap=document.getElementById('ic-list-wrap');
      wrap.style.display=wrap.style.display==='none'?'':'none';
    };
    document.getElementById('ic-share').onclick=()=>{
       const recs=load();
       const inc=recs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
       const exp=recs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
       const msg=`【iCost 账单】\n收入 ¥${inc.toFixed(2)} / 支出 ¥${exp.toFixed(2)}\n结余 ¥${(inc-exp).toFixed(2)}`;
       const ta=document.querySelector('#send_textarea');
       if(ta){ ta.value=msg; ta.dispatchEvent(new Event('input',{bubbles:true})); }
       setTimeout(()=>{ document.querySelector('#send_but')?.click(); },150);
    };
  }

  // 这里的 injectPanel 增加了“自动浮动按钮”逻辑
  function injectPanel(){
    if(document.getElementById('ic-launcher')) return;
    const target=document.getElementById('extensions_settings');
    if(target){
      // 如果找到了设置面板，嵌入到里面
      const sec=document.createElement('div');
      sec.className='ic-ext-section';
      sec.innerHTML=`<div class="ic-ext-row"><span>iCost 珍珠账本</span><button class="ic-ext-btn" id="ic-panel-toggle">打开/关闭</button></div>`;
      target.prepend(sec);
      document.getElementById('ic-panel-toggle').onclick=toggleWin;
    } else {
      // 如果没找到面板，在屏幕右侧创建一个固定的黄色小按钮
      const btn=document.createElement('div');
      btn.id='ic-launcher';
      btn.innerHTML='💰';
      btn.title='打开珍珠账本';
      btn.onclick=toggleWin;
      document.body.appendChild(btn);
    }
  }

  function init(){ mount(); injectPanel(); }
  if(document.readyState==='complete') init();
  else window.addEventListener('load', init);
  // 多试几次确保加载
  [1000, 3000].forEach(t => setTimeout(init, t));
})();
