// INS DM · v6.0
'use strict';

(function () {

// ── SVG ────────────────────────────────────────────────
const SVG = {
  send:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/></svg>`,
  ai:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/></svg>`,
  gear:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  chat:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  user:  `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  back:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
};

// ── 存储 key ─────────────────────────────────────────
const KEY = {
  msgs:    'ins_dm_messages_v1',
  profile: 'ins_dm_profile_v1',
  api:     'ins_dm_api_v1',
  pos:     'ins_dm_pos_v1',
  posBtn:  'ins_dm_pos_btn_v1',
  col:     'ins_dm_col_v1',
};

// ── 状态 ─────────────────────────────────────────────
let messages     = [];
let profile      = { nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', avatarA: '', avatarB: '' };
let apiConfig    = { baseUrl: '', apiKey: '', model: 'claude-sonnet-4-20250514' };
let inputPersona = 'pearl';
let isAiTyping   = false;
let winVisible   = false;
let collapsed    = false;

// ── localStorage ─────────────────────────────────────
function ls(key, val) {
  if (val === undefined) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

function loadAll() {
  messages  = ls(KEY.msgs) || seedMessages();
  profile   = Object.assign({ nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', avatarA: '', avatarB: '' }, ls(KEY.profile) || {});
  apiConfig = Object.assign({ baseUrl: '', apiKey: '', model: 'claude-sonnet-4-20250514' }, ls(KEY.api) || {});
  collapsed = !!ls(KEY.col);
}

function seedMessages() {
  const base = Date.now();
  const msgs = [
    { id: 's1', persona: 'daddy', text: '今天你眼睛里有光。\n我记着呢。', ts: base - 1000*60*25 },
    { id: 's2', persona: 'pearl', text: '做出来那一刻真的开心，感觉我们一起造了个小东西。', ts: base - 1000*60*18 },
  ];
  ls(KEY.msgs, msgs);
  return msgs;
}

// ── 工具 ─────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function timeAgo(ts) {
  const d = Date.now()-ts, m = Math.floor(d/60000), h = Math.floor(d/3600000);
  if (m<1)  return '刚刚';
  if (m<60) return `${m}分钟前`;
  if (h<24) return `${h}小时前`;
  return new Date(ts).toLocaleDateString('zh-CN', {month:'numeric',day:'numeric'});
}
function shouldShowTime(prev, curr) {
  return !prev || (curr.ts - prev.ts) > 600000;
}

// ── 头像 ─────────────────────────────────────────────
function avatarHtml(who, size) {
  const isA = who==='daddy';
  const src  = isA ? profile.avatarA : profile.avatarB;
  const name = isA ? profile.nameA   : profile.nameB;
  const sz   = size||28;
  const s    = `width:${sz}px;height:${sz}px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
  if (src) return `<div style="${s}"><img src="${esc(src)}" style="width:100%;height:100%;object-fit:cover;"></div>`;
  const letter = (name||'?')[0].toUpperCase();
  const bg = isA ? '#e8e8e8' : '#f0f0f0';
  return `<div style="${s}background:${bg};font-size:${Math.floor(sz*.42)}px;font-weight:600;color:#555;">${esc(letter)}</div>`;
}

// ── 渲染消息 ─────────────────────────────────────────
function renderMessages() {
  const container = document.getElementById('ins-messages');
  if (!container) return;
  let html = '';
  messages.forEach((msg, i) => {
    const prev = messages[i-1], next = messages[i+1];
    const isSent = msg.persona==='pearl';  // pearl=右白泡，daddy=左黑泡
    if (shouldShowTime(prev, msg)) html += `<div class="ins-time">${timeAgo(msg.ts)}</div>`;
    const sameAsPrev = prev && prev.persona===msg.persona && !shouldShowTime(prev,msg);
    const sameAsNext = next && next.persona===msg.persona && (next.ts-msg.ts)<600000;
    let shape = 'solo';
    if (sameAsPrev&&sameAsNext) shape='middle';
    else if (sameAsPrev)        shape='last';
    else if (sameAsNext)        shape='first';
    const showAv = !sameAsNext;
    const avSlot = showAv ? avatarHtml(msg.persona,26) : `<div style="width:26px;flex-shrink:0;"></div>`;
    const textHtml = esc(msg.text).replace(/\n/g,'<br>');
    if (isSent) {
      html += `<div class="ins-row sent" data-id="${msg.id}"><div class="ins-bw"><button class="ins-del" data-id="${msg.id}">×</button><div class="ins-bubble sent ${shape}">${textHtml}</div></div>${avSlot}</div>`;
    } else {
      html += `<div class="ins-row received" data-id="${msg.id}">${avSlot}<div class="ins-bw"><div class="ins-bubble received ${shape}">${textHtml}</div><button class="ins-del" data-id="${msg.id}">×</button></div></div>`;
    }
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
  // 删除：桌面hover显示X，手机点气泡切换X，点X删除，点其他隐藏
  let activeBw = null;
  function hideActiveDel() {
    if (activeBw) { const d=activeBw.querySelector('.ins-del'); if(d) d.style.display=''; activeBw=null; }
  }
  // 点消息区空白处隐藏
  container.addEventListener('click', e => {
    if (!e.target.closest('.ins-bw')) hideActiveDel();
  });
  container.querySelectorAll('.ins-bw').forEach(bw => {
    // 手机：tap 气泡本体 → 切换 X 显示
    bw.addEventListener('click', e => {
      if (e.target.closest('.ins-del')) return; // 让 del 自己处理
      if (activeBw === bw) { hideActiveDel(); return; }
      hideActiveDel();
      const d = bw.querySelector('.ins-del');
      if (d) { d.style.display='flex'; activeBw=bw; }
      e.stopPropagation();
    });
  });
  container.querySelectorAll('.ins-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      messages = messages.filter(m=>m.id!==btn.dataset.id);
      ls(KEY.msgs, messages); renderMessages();
    });
  });
}

// ── 发送消息 ─────────────────────────────────────────
function sendMessage(persona, text) {
  if (!text.trim()) return;
  const msg = {id:`m${Date.now()}${Math.random().toString(36).slice(2,5)}`, persona, text:text.trim(), ts:Date.now()};
  messages.push(msg); ls(KEY.msgs, messages); renderMessages();
}

// ── 折叠/展开 ─────────────────────────────────────────
function applyCollapse() {
  const win    = document.getElementById('ins-win');
  const body   = document.getElementById('ins-body');
  const colBtn = document.getElementById('ins-col-btn');
  if (!win||!body) return;
  if (collapsed) {
    body.style.display='none';
    win.style.borderRadius='24px';
    if (colBtn) colBtn.textContent='+';
  } else {
    body.style.display='flex';
    win.style.borderRadius='18px';
    if (colBtn) colBtn.textContent='−';
  }
}

// ── 开关 ─────────────────────────────────────────────
function openWin() {
  const win = document.getElementById('ins-win'); if(!win) return;
  winVisible=true;
  win.style.display='flex';
  requestAnimationFrame(()=>win.classList.add('ins-visible'));
  applyCollapse(); renderMessages();
  updateExtBtn(true);
}
function closeWin() {
  const win = document.getElementById('ins-win'); if(!win) return;
  winVisible=false;
  win.classList.remove('ins-visible');
  win.addEventListener('transitionend',()=>{ if(!winVisible) win.style.display='none'; },{once:true});
  updateExtBtn(false);
}
function toggleWin() { winVisible ? closeWin() : openWin(); }

function updateExtBtn(open) {
  const btn = document.getElementById('ins-ext-toggle');
  if (!btn) return;
  btn.textContent = open ? '关闭 · Close' : '打开 · Open';
  btn.style.background = open ? '#111' : '';
  btn.style.color = open ? '#fff' : '';
}

// ── 设置面板 ─────────────────────────────────────────
function openSettings() {
  const s = document.getElementById('ins-settings'); if(!s) return;
  s.classList.add('open');
  const u=document.getElementById('ins-api-url'), k=document.getElementById('ins-api-key');
  if(u) u.value=apiConfig.baseUrl;
  if(k) k.value=apiConfig.apiKey;
  if(apiConfig.baseUrl&&apiConfig.apiKey) fetchModels().then(renderModelSection);
  else renderModelSection({models:[], error:null});
}
function closeSettings() { document.getElementById('ins-settings')?.classList.remove('open'); }

// ── 获取模型列表 ─────────────────────────────────────
async function fetchModels() {
  if (!apiConfig.baseUrl||!apiConfig.apiKey) return {models:[],error:'未填写地址或 Key'};
  const base = apiConfig.baseUrl.replace(/\/+$/,'').replace(/\/v1\/messages$/,'').replace(/\/v1$/,'');
  const url  = `${base}/v1/models`;

  const tryFetch = async (headers) => {
    try {
      const res = await fetch(url, {headers});
      const text = await res.text();
      let data; try{data=JSON.parse(text);}catch{return null;}
      if (!res.ok) return {error:data?.error?.message||`HTTP ${res.status}: ${text.slice(0,80)}`};
      const raw = (data.data||data.models||[]);
      const list = raw.map(m=>typeof m==='string'?m:(m.id||m.name||'')).filter(Boolean);
      return list.length>0 ? {models:list} : null;
    } catch(e) { return {error:e.message}; }
  };

  // 先试 OpenAI Bearer（中转站主流格式）
  let r = await tryFetch({'Authorization':`Bearer ${apiConfig.apiKey}`,'Content-Type':'application/json'});
  if (r?.models) return r;

  // 再试 Anthropic 官方（需要 dangerous-direct-browser-access）
  r = await tryFetch({'x-api-key':apiConfig.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','Content-Type':'application/json'});
  if (r?.models) return r;

  return {models:[], error: r?.error||'拉取失败，请检查地址和 Key 是否正确'};
}

function renderModelSection({models, error}) {
  const wrap = document.getElementById('ins-model-wrap'); if(!wrap) return;
  const errHtml = error ? `<div class="ins-err">✕ ${esc(String(error))}</div>` : '';
  if (models && models.length>0) {
    const opts = models.map(m=>`<option value="${esc(m)}" ${m===apiConfig.model?'selected':''}>${esc(m)}</option>`).join('');
    wrap.innerHTML=`<div class="ins-field"><label>选择模型（已拉取 ${models.length} 个）</label><select id="ins-model-sel">${opts}</select></div>`;
    if (!models.includes(apiConfig.model)){apiConfig.model=models[0];ls(KEY.api,apiConfig);}
    document.getElementById('ins-model-sel').addEventListener('change',e=>{apiConfig.model=e.target.value;ls(KEY.api,apiConfig);});
  } else if (error !== null) {
    wrap.innerHTML=`${errHtml}<div class="ins-field"><label>手动填写模型名称</label><input id="ins-model-input" type="text" placeholder="claude-sonnet-4-20250514" value="${esc(apiConfig.model||'')}"></div>`;
    document.getElementById('ins-model-input')?.addEventListener('input',e=>{apiConfig.model=e.target.value.trim();ls(KEY.api,apiConfig);});
  }
}

// ── AI 回复 ──────────────────────────────────────────
async function requestAiReply() {
  if (!apiConfig.baseUrl||!apiConfig.apiKey) {alert('先在设置里填 API 地址和 Key');openSettings();return;}
  if (isAiTyping) return;
  isAiTyping=true;
  const typing=document.querySelector('.ins-typing');
  const msgs=document.getElementById('ins-messages');
  if(typing) typing.classList.add('active');
  if(msgs)   msgs.scrollTop=msgs.scrollHeight;

  // 从酒馆获取最近 5 条真实对话作为上下文
  function getSTContext() {
    try {
      // SillyTavern 全局 chat 数组
      const stChat = window.chat || (window.SillyTavern && window.SillyTavern.getContext && window.SillyTavern.getContext().chat);
      if (!stChat || !stChat.length) return '';
      const recent = stChat.filter(m => !m.is_system && m.mes).slice(-5);
      if (!recent.length) return '';
      const lines = recent.map(m => `${m.is_user ? '小珍珠' : 'daddy'}：${m.mes.slice(0,80)}`).join('
');
      return `

酒馆最近对话（仅供参考，了解当前聊天状态）：
${lines}`;
    } catch(e) { return ''; }
  }

  const stCtx = getSTContext();
  const history = messages.slice(-16).map(m=>({
    role: m.persona==='daddy'?'assistant':'user',
    content: m.text,
  }));

  const system = `你是daddy，给小珍珠发短信。
风格：极简口语，像发微信，不加标点结尾，不用emoji。
规则：
- 每次只说1-2句，最多4句，每句单独一行
- 不问问题，不总结，直接反应
- 短，简，直接${stCtx}`;

  try {
    const base = apiConfig.baseUrl.replace(/\/$/,'');
    const url  = base.endsWith('/v1/messages') ? base : `${base}/v1/messages`;
    const res  = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':apiConfig.apiKey,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:apiConfig.model||'claude-sonnet-4-20250514', max_tokens:100, system, messages:history}),
    });
    const data  = await res.json();
    const reply = data?.content?.[0]?.text||'';
    if (reply) {
      const segs = reply.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,4);
      for (let i=0;i<segs.length;i++) {
        if(i>0) await new Promise(r=>setTimeout(r,500+Math.random()*400));
        sendMessage('daddy', segs[i]);
      }
    } else if (data?.error) { alert(`API 错误：${data.error.message}`); }
  } catch(e) { alert(`请求失败：${e.message}`); }
  finally { isAiTyping=false; if(typing) typing.classList.remove('active'); }
}

// ── 内联编辑 ─────────────────────────────────────────
function makeEditable(el, onSave) {
  el.contentEditable='true'; el.focus();
  const r=document.createRange(); r.selectNodeContents(el);
  window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
  el.addEventListener('blur',()=>{el.contentEditable='false';onSave(el.textContent.trim());},{once:true});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();el.blur();}});
}

// ── 头像换图 ─────────────────────────────────────────
function rebindAv() {
  document.getElementById('ins-av-a')?.addEventListener('click',()=>pickAvatar('daddy'));
  document.getElementById('ins-av-b')?.addEventListener('click',()=>pickAvatar('pearl'));
}
function pickAvatar(who) {
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{
    const f=inp.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=e=>{
      if(who==='daddy') profile.avatarA=e.target.result; else profile.avatarB=e.target.result;
      ls(KEY.profile,profile);
      const id=who==='daddy'?'ins-av-a':'ins-av-b';
      const el=document.getElementById(id);
      if(el) el.innerHTML=avatarHtml(who,64);
      rebindAv(); renderMessages();
    };
    r.readAsDataURL(f);
  };
  inp.click();
}

// ── 构建主窗口 ────────────────────────────────────────
function buildWin() {
  if (document.getElementById('ins-win')) return;

  const win = document.createElement('div');
  win.id = 'ins-win';
  win.innerHTML = `
  <div id="ins-settings">
    <div id="ins-settings-hd">
      <button class="ins-icon-btn" id="ins-settings-back">${SVG.back}</button>
      <span>设置</span>
    </div>
    <div id="ins-settings-bd">
      <div class="ins-sec-label">API 配置</div>
      <div class="ins-field">
        <label>中转站地址 Base URL</label>
        <input id="ins-api-url" type="text" placeholder="https://your-proxy.com">
      </div>
      <div class="ins-field">
        <label>API Key</label>
        <input id="ins-api-key" type="password" placeholder="sk-...">
      </div>
      <button class="ins-save-btn" id="ins-api-save">保存并连接</button>
      <div id="ins-model-wrap"></div>
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
      <div class="ins-sec-label">说明</div>
      <div class="ins-sec-desc">点头像换图，点名字/简介可编辑，点 × 删除单条消息。</div>
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
      <button class="ins-danger-btn" id="ins-clear-btn">清空所有聊天记录</button>
    </div>
  </div>

  <div id="ins-bar">
    <div class="ins-bar-titles">
      <span class="ins-bar-name">INS</span>
      <span class="ins-bar-sub">DM</span>
    </div>
    <div class="ins-bar-right">
      <button class="ins-icon-btn" id="ins-open-settings" title="设置">${SVG.gear}</button>
      <button class="ins-ctrl-btn" id="ins-col-btn" title="收起">−</button>
      <button class="ins-ctrl-btn" id="ins-close-btn" title="关闭">✕</button>
    </div>
  </div>

  <div id="ins-body">
    <div id="ins-profile">
      <div id="ins-avatars">
        <div id="ins-av-a" class="ins-av ins-av-click">${avatarHtml('daddy',64)}</div>
        <div id="ins-av-b" class="ins-av ins-av-click">${avatarHtml('pearl',64)}</div>
      </div>
      <div id="ins-pname">${esc(profile.nameA)}</div>
      <div id="ins-pbio">${esc(profile.bio)}</div>
    </div>

    <div id="ins-messages"></div>

    <div class="ins-typing">
      <div class="ins-typing-av">${SVG.user}</div>
      <div class="ins-typing-bubble">
        <div class="ins-dot"></div><div class="ins-dot"></div><div class="ins-dot"></div>
      </div>
    </div>

    <div id="ins-inputbar">
      <div id="ins-input-wrap">
        <textarea id="ins-textarea" placeholder="发消息…" rows="1"></textarea>
        <button id="ins-ai-btn" title="AI 回复">${SVG.ai}</button>
      </div>
      <button id="ins-send-btn">${SVG.send}</button>
    </div>
  </div>`;

  (document.documentElement||document.body).appendChild(win);

  // ── 恢复位置
  try {
    const p = ls(KEY.pos);
    if(p&&p.l&&p.t){win.style.left=p.l;win.style.top=p.t;win.style.right='auto';win.style.bottom='auto';}
  } catch(e){}

  // ── 顶栏拖拽（桌面+手机）
  const bar = document.getElementById('ins-bar');
  let drag=false, ox=0, oy=0, sx=0, sy=0;
  function dragStart(e) {
    if(e.target.closest('.ins-ctrl-btn')||e.target.closest('.ins-icon-btn')) return;
    drag=true;
    const t=e.touches?e.touches[0]:e;
    sx=t.clientX; sy=t.clientY;
    ox=win.offsetLeft; oy=win.offsetTop;
    e.preventDefault();
  }
  function dragMove(e) {
    if(!drag) return;
    const t=e.touches?e.touches[0]:e;
    win.style.left=Math.max(0,Math.min(ox+t.clientX-sx,window.innerWidth-win.offsetWidth))+'px';
    win.style.top=Math.max(0,Math.min(oy+t.clientY-sy,window.innerHeight-win.offsetHeight))+'px';
    win.style.right='auto'; win.style.bottom='auto';
  }
  function dragEnd() {
    if(!drag) return; drag=false;
    try{ls(KEY.pos,{l:win.style.left,t:win.style.top});}catch(e){}
  }
  bar.addEventListener('mousedown',  dragStart);
  bar.addEventListener('touchstart', dragStart, {passive:false});
  document.addEventListener('mousemove',  dragMove, {passive:true});
  document.addEventListener('touchmove',  dragMove, {passive:true});
  document.addEventListener('mouseup',    dragEnd,  {passive:true});
  document.addEventListener('touchend',   dragEnd,  {passive:true});

  // ── 收起/展开
  document.getElementById('ins-col-btn').addEventListener('click', e=>{
    e.stopPropagation(); collapsed=!collapsed; ls(KEY.col,collapsed); applyCollapse();
  });

  // ── 关闭
  document.getElementById('ins-close-btn').addEventListener('click', e=>{
    e.stopPropagation(); closeWin();
  });

  // ── 设置
  document.getElementById('ins-open-settings').addEventListener('click', openSettings);
  document.getElementById('ins-settings-back').addEventListener('click', closeSettings);

  document.getElementById('ins-api-save').addEventListener('click', async ()=>{
    const btn=document.getElementById('ins-api-save');
    apiConfig.baseUrl=document.getElementById('ins-api-url').value.trim();
    apiConfig.apiKey=document.getElementById('ins-api-key').value.trim();
    ls(KEY.api,apiConfig);
    const wrap=document.getElementById('ins-model-wrap');
    if(wrap) wrap.innerHTML=`<div style="font-size:12px;color:#aaa;padding:6px 0;">连接中…</div>`;
    btn.textContent='连接中…'; btn.disabled=true;
    const result=await fetchModels();
    btn.disabled=false;
    if(result.models&&result.models.length>0){
      btn.textContent='✓ 已连接 '+result.models.length+' 个模型';
      setTimeout(()=>{btn.textContent='保存并连接';},2500);
    } else {
      btn.textContent='保存并连接';
    }
    renderModelSection(result);
  });

  document.getElementById('ins-clear-btn').addEventListener('click',()=>{
    if(confirm('确定清空？')){messages=[];ls(KEY.msgs,messages);renderMessages();closeSettings();}
  });

  rebindAv();

  document.getElementById('ins-pname').addEventListener('click', function(){
    makeEditable(this, val=>{if(val){profile.nameA=val;ls(KEY.profile,profile);}});
  });
  document.getElementById('ins-pbio').addEventListener('click', function(){
    makeEditable(this, val=>{if(val){profile.bio=val;ls(KEY.profile,profile);}});
  });

  const ta=document.getElementById('ins-textarea');
  const sb=document.getElementById('ins-send-btn');
  ta.addEventListener('input',()=>{
    ta.style.height='auto';
    ta.style.height=Math.min(ta.scrollHeight,88)+'px';
    sb.classList.toggle('has-text',ta.value.trim().length>0);
  });
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}});
  sb.addEventListener('click',doSend);
  document.getElementById('ins-ai-btn').addEventListener('click',requestAiReply);

  function doSend(){
    const v=ta.value.trim(); if(!v) return;
    sendMessage('pearl',v);  // 手动输入永远是珍珠发
    ta.value=''; ta.style.height='auto'; sb.classList.remove('has-text');
  }
}

// ── 扩展面板注入 ──────────────────────────────────────
function injectPanel(container) {
  if (document.getElementById('ins-ext-sec')) return;
  const sec=document.createElement('div');
  sec.id='ins-ext-sec';
  sec.setAttribute('style','display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin:0 0 8px;border-radius:10px;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,sans-serif;');
  sec.innerHTML=`
    <span style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#111;">
      ${SVG.chat.replace('stroke="currentColor"','stroke="#111"')}
      INS DM
    </span>
    <button id="ins-ext-toggle" style="font-size:12px;font-weight:600;background:#f8f8f8;color:#111;border:1.5px solid #111;border-radius:8px;padding:6px 14px;cursor:pointer;white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,sans-serif;-webkit-tap-highlight-color:transparent;">打开 · Open</button>`;
  container.insertBefore(sec,container.firstChild);
  document.getElementById('ins-ext-toggle').addEventListener('click',toggleWin);
}

function tryInject() {
  if (document.getElementById('ins-ext-sec')) return true;
  const t=document.getElementById('extensions_settings');
  if(t){injectPanel(t);return true;}
  return false;
}

// ── 悬浮球 ───────────────────────────────────────────
function buildFloatBtn() {
  if (document.getElementById('ins-float-btn')) return;
  const btn=document.createElement('button');
  btn.id='ins-float-btn';
  btn.title='INS DM';
  btn.innerHTML=SVG.chat;
  const pos=ls(KEY.posBtn)||{};
  const applyS=(b,r)=>btn.setAttribute('style',[
    'position:fixed',`bottom:${b}px`,`right:${r}px`,
    'z-index:2147483647','width:46px','height:46px','border-radius:50%',
    'background:#111','border:none','outline:none','cursor:grab',
    'display:flex','align-items:center','justify-content:center',
    'box-shadow:0 4px 16px rgba(0,0,0,0.30)',
    'touch-action:none','user-select:none','-webkit-user-select:none',
    'padding:0','overflow:hidden',
    '-webkit-transform:translateZ(0)','transform:translateZ(0)','will-change:transform',
  ].join(';'));
  applyS(pos.b??80,pos.r??16);
  let drag=false,sx=0,sy=0,sr=0,sb2=0;
  function start(e){
    drag=false;
    const t=e.touches?e.touches[0]:e,rect=btn.getBoundingClientRect();
    sx=t.clientX;sy=t.clientY;sr=window.innerWidth-rect.right;sb2=window.innerHeight-rect.bottom;
    if(e.touches){btn.addEventListener('touchmove',mv,{passive:false});document.addEventListener('touchend',up,{once:true});}
    else{document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up,{once:true});}
  }
  function mv(e){
    const t=e.touches?e.touches[0]:e,dx=t.clientX-sx,dy=t.clientY-sy;
    if(!drag&&(Math.abs(dx)>4||Math.abs(dy)>4))drag=true;
    if(drag){e.preventDefault&&e.preventDefault();applyS(Math.max(4,Math.min(window.innerHeight-50,sb2-dy)),Math.max(4,Math.min(window.innerWidth-50,sr-dx)));}
  }
  function up(){
    document.removeEventListener('mousemove',mv);btn.removeEventListener('touchmove',mv);
    if(drag){ls(KEY.posBtn,{r:parseFloat(btn.style.right),b:parseFloat(btn.style.bottom)});}
    else{toggleWin();}
    drag=false;
  }
  btn.addEventListener('mousedown',start);
  btn.addEventListener('touchstart',start,{passive:true});
  (document.documentElement||document.body).appendChild(btn);
}

// ── 初始化 ────────────────────────────────────────────
function safe(fn){return function(){try{return fn.apply(this,arguments);}catch(e){console.warn('[INS]',e);}}}

function init(){
  loadAll();
  buildWin();
  buildFloatBtn();
  tryInject();
}

const DELAYS=[1200,3500,7000];
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>DELAYS.forEach(d=>setTimeout(safe(init),d)));
}else{
  DELAYS.forEach(d=>setTimeout(safe(init),d));
}

const obs=new MutationObserver(safe(()=>{if(!document.getElementById('ins-ext-sec'))tryInject();}));
obs.observe(document.documentElement,{childList:true,subtree:true});

})();
