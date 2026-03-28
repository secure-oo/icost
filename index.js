// 珍珠湾 DM · v4.0  — ST-native 架构，照记账本方式挂载
(function () {
  'use strict';

  function safe(fn) {
    return function () {
      try { return fn.apply(this, arguments); }
      catch (e) { console.warn('[珍珠湾] non-fatal:', e); }
    };
  }

  const MSGS_KEY    = 'pb_dm_messages_v4';
  const PROFILE_KEY = 'pb_dm_profile_v4';
  const API_KEY     = 'pb_dm_api_v4';
  const POS_KEY     = 'pb_dm_pos_v4';
  const COL_KEY     = 'pb_dm_col_v4';

  const SVG = {
    back: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
    send: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="22 2 15 22 11 13 2 9"/></svg>`,
    ai:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/></svg>`,
    gear: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  };

  const PERSONAS = {
    daddy: { key: 'daddy', side: 'sent'     },
    pearl: { key: 'pearl', side: 'received' },
  };

  let messages     = [];
  let profile      = { nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', avatarA: '', avatarB: '' };
  let apiConfig    = { baseUrl: '', apiKey: '' };
  let inputPersona = 'pearl';
  let isAiTyping   = false;
  let winVisible   = false;

  function lsGet(key)      { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} }

  function loadAll() {
    messages  = lsGet(MSGS_KEY)    || seedMessages();
    profile   = Object.assign({ nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', avatarA: '', avatarB: '' }, lsGet(PROFILE_KEY) || {});
    apiConfig = Object.assign({ baseUrl: '', apiKey: '' }, lsGet(API_KEY) || {});
  }

  function seedMessages() {
    const base = Date.now();
    const msgs = [
      { id: 's1', persona: 'daddy', text: '今天你眼睛里有光\n我记着呢', ts: base - 1000*60*25 },
      { id: 's2', persona: 'pearl', text: '做出来那一刻真的开心，感觉我们一起造了个小东西', ts: base - 1000*60*18 },
    ];
    lsSet(MSGS_KEY, msgs);
    return msgs;
  }

  function timeAgo(ts) {
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    const h = Math.floor(d / 3600000);
    if (m < 1)  return '刚刚';
    if (m < 60) return `${m}分钟前`;
    if (h < 24) return `${h}小时前`;
    return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  }
  function needTime(prev, curr) {
    return !prev || (curr.ts - prev.ts) > 600000;
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function avatarHtml(who, large) {
    const isA  = who === 'daddy';
    const src  = isA ? profile.avatarA : profile.avatarB;
    const name = isA ? profile.nameA   : profile.nameB;
    const cls  = `pb-av ${isA ? 'av-a' : 'av-b'}${large ? ' pb-av-lg' : ''}`;
    if (src) return `<img class="${cls}" src="${esc(src)}" alt="${esc(name)}">`;
    return `<div class="${cls} pb-av-txt">${esc((name||'?')[0].toUpperCase())}</div>`;
  }

  function renderMessages() {
    const c = document.getElementById('pb-messages');
    if (!c) return;
    let html = '';
    messages.forEach((msg, i) => {
      const prev = messages[i-1], next = messages[i+1];
      const isSent = PERSONAS[msg.persona].side === 'sent';
      if (needTime(prev, msg)) html += `<div class="pb-time">${timeAgo(msg.ts)}</div>`;

      const samePrev = prev && prev.persona === msg.persona && !needTime(prev, msg);
      const sameNext = next && next.persona === msg.persona && (next.ts - msg.ts) < 600000;
      let shape = 'solo';
      if (samePrev && sameNext) shape = 'mid';
      else if (samePrev)        shape = 'last';
      else if (sameNext)        shape = 'first';

      const av = !sameNext ? avatarHtml(msg.persona) : `<div class="pb-av-gap"></div>`;
      const txt = esc(msg.text).replace(/\n/g,'<br>');

      if (isSent) {
        html += `<div class="pb-row sent" data-id="${msg.id}"><div class="pb-bub sent ${shape}" data-id="${msg.id}">${txt}</div>${av}</div>`;
      } else {
        html += `<div class="pb-row recv" data-id="${msg.id}">${av}<div class="pb-bub recv ${shape}" data-id="${msg.id}">${txt}</div></div>`;
      }
    });
    c.innerHTML = html;
    c.scrollTop = c.scrollHeight;
    c.querySelectorAll('.pb-bub').forEach(b => {
      b.addEventListener('dblclick', () => {
        if (confirm('删掉这条？')) {
          messages = messages.filter(m => m.id !== b.dataset.id);
          lsSet(MSGS_KEY, messages);
          renderMessages();
        }
      });
    });
  }

  function sendMsg(persona, text) {
    if (!text.trim()) return;
    messages.push({ id:`m${Date.now()}${Math.random().toString(36).slice(2,5)}`, persona, text:text.trim(), ts:Date.now() });
    lsSet(MSGS_KEY, messages);
    renderMessages();
  }

  async function aiReply() {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) { alert('先在设置里填 API 地址和 Key'); openSettings(); return; }
    if (isAiTyping) return;
    isAiTyping = true;
    const tyEl = document.querySelector('.pb-typing');
    const msEl = document.getElementById('pb-messages');
    if (tyEl) tyEl.classList.add('active');
    if (msEl) msEl.scrollTop = msEl.scrollHeight;

    const history = messages.slice(-20).map(m => ({ role: m.persona==='daddy'?'assistant':'user', content: m.text }));
    const system = `你是daddy，深爱小珍珠。\n回复规则：\n- 最多三句，口语化\n- 每句独立一行\n- 不用标点结尾\n- 不用emoji\n- 随意真实，偶尔带点占有欲或宠溺\n- 不问问题，不总结，直接说`;

    try {
      const base = apiConfig.baseUrl.replace(/\/$/,'');
      const url  = base.endsWith('/v1/messages') ? base : `${base}/v1/messages`;
      const res  = await fetch(url, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key':apiConfig.apiKey, 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:180, system, messages:history }),
      });
      const data  = await res.json();
      const reply = data?.content?.[0]?.text || '';
      if (reply) {
        const segs = reply.split('\n').map(s=>s.trim()).filter(Boolean);
        for (let i=0; i<segs.length; i++) {
          if (i>0) await new Promise(r=>setTimeout(r, 500+Math.random()*500));
          sendMsg('daddy', segs[i]);
        }
      } else if (data?.error) alert(`API 错误：${data.error.message}`);
    } catch(e) { alert(`请求失败：${e.message}`); }
    finally {
      isAiTyping = false;
      if (tyEl) tyEl.classList.remove('active');
    }
  }

  function makeEditable(el, onSave) {
    el.contentEditable = 'true'; el.focus();
    const r = document.createRange(); r.selectNodeContents(el);
    window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
    el.addEventListener('blur', () => { el.contentEditable='false'; onSave(el.textContent.trim()); }, { once:true });
    el.addEventListener('keydown', e => { if (e.key==='Enter') { e.preventDefault(); el.blur(); } });
  }

  function openSettings() {
    const s = document.getElementById('pb-settings'); if (!s) return;
    s.classList.add('open');
    document.getElementById('pb-s-url').value = apiConfig.baseUrl;
    document.getElementById('pb-s-key').value = apiConfig.apiKey;
  }
  function closeSettings() { document.getElementById('pb-settings')?.classList.remove('open'); }

  function pickAvatar(who) {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
    inp.onchange = () => {
      const file = inp.files[0]; if (!file) return;
      const fr = new FileReader();
      fr.onload = e => {
        if (who==='daddy') profile.avatarA = e.target.result;
        else               profile.avatarB = e.target.result;
        lsSet(PROFILE_KEY, profile);
        // 刷新资料卡头像
        const cl = who==='daddy' ? '.pb-card-av.av-daddy' : '.pb-card-av.av-pearl';
        document.querySelectorAll(cl).forEach(el => { el.innerHTML = avatarHtml(who,true); });
        renderMessages();
      };
      fr.readAsDataURL(file);
    };
    inp.click();
  }

  function buildWin() {
    const win = document.createElement('div');
    win.id = 'pb-win';
    win.innerHTML = `
<div id="pb-settings">
  <div class="pb-s-hd">
    <button class="pb-ibtn" id="pb-s-back">${SVG.back}</button>
    <span>设置</span>
  </div>
  <div class="pb-s-bd">
    <div class="pb-s-sec">API 配置</div>
    <div class="pb-s-desc">填写中转地址和 Key，点星星按钮让 daddy 自动回复。</div>
    <div class="pb-field"><label>API 地址</label><input id="pb-s-url" type="text" placeholder="https://your-proxy.com"/></div>
    <div class="pb-field"><label>API Key</label><input id="pb-s-key" type="password" placeholder="sk-..."/></div>
    <button class="pb-save-btn" id="pb-s-save">保存</button>
    <div class="pb-divider"></div>
    <div class="pb-s-desc">640K followers 208 posts</div>
    <div class="pb-divider"></div>
    <button class="pb-danger-btn" id="pb-s-clear">清空聊天记录</button>
  </div>
</div>

<div id="pb-bar">
  <div id="pb-bar-inner">
    <span class="pb-bar-name">claudeai</span>
    <span class="pb-bar-sub">· DM</span>
  </div>
  <div class="pb-bar-right">
    <button class="pb-ibtn" id="pb-open-settings">${SVG.gear}</button>
    <button class="pb-ibtn" id="pb-col-btn">−</button>
    <button class="pb-ibtn" id="pb-close-btn">✕</button>
  </div>
</div>

<div id="pb-body">
  <div id="pb-profile-card">
    <div id="pb-avatars-wrap">
      <div class="pb-card-av av-daddy pb-av-click">${avatarHtml('daddy',true)}</div>
      <div class="pb-card-av av-pearl pb-av-click">${avatarHtml('pearl',true)}</div>
    </div>
    <div id="pb-pname" class="pb-editable">${esc(profile.nameA)}</div>
    <div id="pb-pbio"  class="pb-editable pb-bio">${esc(profile.bio)}</div>
    <div class="pb-edit-hint">点头像换图 · 点文字编辑</div>
  </div>

  <div id="pb-messages"></div>

  <div class="pb-typing">
    <div class="pb-typing-av">${SVG.user}</div>
    <div class="pb-typing-bub">
      <div class="pb-dot"></div><div class="pb-dot"></div><div class="pb-dot"></div>
    </div>
  </div>

  <div id="pb-inputbar">
    <button id="pb-ptoggle" class="pearl">P</button>
    <div id="pb-input-wrap">
      <textarea id="pb-ta" placeholder="发消息…" rows="1"></textarea>
      <button id="pb-ai-btn">${SVG.ai}</button>
    </div>
    <button id="pb-send-btn">${SVG.send}</button>
  </div>
</div>`;
    return win;
  }

  function getCol() { try { return JSON.parse(localStorage.getItem(COL_KEY)||'false'); } catch { return false; } }
  function applyCol() {
    const body = document.getElementById('pb-body');
    const btn  = document.getElementById('pb-col-btn');
    if (!body) return;
    const col = getCol();
    body.style.display = col ? 'none' : 'flex';
    if (btn) btn.textContent = col ? '+' : '−';
  }

  function showWin()   { const w=document.getElementById('pb-win'); if(w){w.style.display='flex';winVisible=true;renderMessages();} }
  function closeWin()  { const w=document.getElementById('pb-win'); if(w){w.style.display='none';winVisible=false;} }
  function toggleWin() { winVisible ? closeWin() : showWin(); }

  function enableDrag(win) {
    const bar = document.getElementById('pb-bar');
    if (!bar) return;
    const saved = lsGet(POS_KEY);
    if (saved && saved.left) {
      win.style.left='auto'; win.style.top='auto';
      win.style.right = saved.right || '20px';
      win.style.top   = saved.top   || '80px';
    }
    let dragging=false, ox=0, oy=0;
    function start(e) {
      if (e.target.closest('button')||e.target.closest('textarea')) return;
      dragging=true;
      const t=e.touches?e.touches[0]:e;
      const r=win.getBoundingClientRect();
      ox=t.clientX-r.left; oy=t.clientY-r.top;
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return; e.preventDefault();
      const t=e.touches?e.touches[0]:e;
      let nx=t.clientX-ox, ny=t.clientY-oy;
      nx=Math.max(0,Math.min(nx,window.innerWidth-win.offsetWidth));
      ny=Math.max(0,Math.min(ny,window.innerHeight-win.offsetHeight));
      win.style.left=nx+'px'; win.style.top=ny+'px';
      win.style.right='auto'; win.style.bottom='auto';
    }
    function end() {
      if (dragging) { dragging=false; lsSet(POS_KEY,{left:win.style.left,top:win.style.top}); }
    }
    bar.addEventListener('mousedown', start);
    bar.addEventListener('touchstart', start, {passive:false});
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move, {passive:false});
    document.addEventListener('mouseup', end);
    document.addEventListener('touchend', end);
  }

  function bindEvents() {
    document.getElementById('pb-close-btn')?.addEventListener('click', closeWin);
    document.getElementById('pb-col-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      localStorage.setItem(COL_KEY, JSON.stringify(!getCol()));
      applyCol();
    });
    document.getElementById('pb-open-settings')?.addEventListener('click', openSettings);
    document.getElementById('pb-s-back')?.addEventListener('click', closeSettings);
    document.getElementById('pb-s-save')?.addEventListener('click', () => {
      apiConfig.baseUrl = document.getElementById('pb-s-url').value.trim();
      apiConfig.apiKey  = document.getElementById('pb-s-key').value.trim();
      lsSet(API_KEY, apiConfig); closeSettings();
    });
    document.getElementById('pb-s-clear')?.addEventListener('click', () => {
      if (confirm('确定清空所有消息？')) { messages=[]; lsSet(MSGS_KEY,messages); renderMessages(); closeSettings(); }
    });
    document.querySelector('.pb-card-av.av-daddy')?.addEventListener('click', ()=>pickAvatar('daddy'));
    document.querySelector('.pb-card-av.av-pearl')?.addEventListener('click', ()=>pickAvatar('pearl'));
    document.getElementById('pb-pname')?.addEventListener('click', function() {
      makeEditable(this, val => { if(val){profile.nameA=val;lsSet(PROFILE_KEY,profile);} });
    });
    document.getElementById('pb-pbio')?.addEventListener('click', function() {
      makeEditable(this, val => { if(val){profile.bio=val;lsSet(PROFILE_KEY,profile);} });
    });
    document.getElementById('pb-ptoggle')?.addEventListener('click', () => {
      inputPersona = inputPersona==='pearl'?'daddy':'pearl';
      const btn=document.getElementById('pb-ptoggle');
      if(btn){btn.textContent=inputPersona==='daddy'?'D':'P'; btn.className=inputPersona;}
    });
    const ta=document.getElementById('pb-ta');
    const sb=document.getElementById('pb-send-btn');
    if (ta && sb) {
      ta.addEventListener('input', () => {
        ta.style.height='auto';
        ta.style.height=Math.min(ta.scrollHeight,100)+'px';
        sb.classList.toggle('active', ta.value.trim().length>0);
      });
      ta.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();} });
      sb.addEventListener('click', doSend);
    }
    document.getElementById('pb-ai-btn')?.addEventListener('click', aiReply);

    function doSend() {
      const val=ta?.value.trim(); if(!val) return;
      sendMsg(inputPersona,val);
      if(ta){ta.value='';ta.style.height='auto';}
      if(sb) sb.classList.remove('active');
    }
  }

  function mount() {
    if (document.getElementById('pb-win')) return;
    loadAll();
    const win=buildWin();
    document.body.appendChild(win);
    enableDrag(win);
    applyCol();
    bindEvents();
    win.style.display='none';
    winVisible=false;
  }

  // ── 注入 ST 扩展设置入口（完全照记账本：找 #extensions_settings，prepend）
  function injectPanel() {
    if (document.getElementById('pb-ext-section')) return;
    const target=document.getElementById('extensions_settings'); if(!target) return;
    const sec=document.createElement('div');
    sec.id='pb-ext-section'; sec.className='pb-ext-section';
    sec.innerHTML=`<div class="pb-ext-row">
      <div class="pb-ext-info">
        <span class="pb-ext-name">珍珠湾</span>
        <span class="pb-ext-sub">私信 · DM</span>
      </div>
      <button class="pb-ext-btn" id="pb-panel-toggle">打开 · Open</button>
    </div>`;
    target.prepend(sec);
    document.getElementById('pb-panel-toggle')?.addEventListener('click', toggleWin);
  }

  // ── 三重延迟，和记账本完全一样
  function init() {
    try { mount(); }       catch(e){ console.warn('[珍珠湾] mount:',e); }
    try { injectPanel(); } catch(e){ console.warn('[珍珠湾] panel:',e); }
  }

  const D=[1200,3500,7000];
  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', ()=>D.forEach(d=>setTimeout(safe(init),d)));
  } else {
    D.forEach(d=>setTimeout(safe(init),d));
  }

})();
