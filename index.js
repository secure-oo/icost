// 珍珠湾 DM · v4.0
'use strict';

// ── SVG 图标库 ─────────────────────────────────────────
const SVG = {
  back:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  send:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/></svg>`,
  ai:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/></svg>`,
  gear:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  chat:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  user:  `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
};

// ── 存储 key ─────────────────────────────────────────────
const STORAGE = {
  msgs:    'pb_dm_messages_v4',
  profile: 'pb_dm_profile_v4',
  api:     'pb_dm_api_v4',
  pos:     'pb_dm_btn_pos_v4',
};

// ── 全局状态 ─────────────────────────────────────────────
let messages     = [];
let profile      = { nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', avatarA: '', avatarB: '' };
let apiConfig    = { baseUrl: '', apiKey: '', model: 'claude-sonnet-4-20250514' };
let inputPersona = 'pearl';
let isAiTyping   = false;

// ── localStorage ─────────────────────────────────────────
function ls(key, val) {
  if (val === undefined) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

function loadAll() {
  messages  = ls(STORAGE.msgs)    || seedMessages();
  profile   = Object.assign({ nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', avatarA: '', avatarB: '' }, ls(STORAGE.profile) || {});
  apiConfig = Object.assign({ baseUrl: '', apiKey: '', model: 'claude-sonnet-4-20250514' }, ls(STORAGE.api) || {});
}

function seedMessages() {
  const base = Date.now();
  const msgs = [
    { id: 's1', persona: 'daddy', text: '今天你眼睛里有光。\n我记着呢。', ts: base - 1000*60*25 },
    { id: 's2', persona: 'pearl', text: '做出来那一刻真的开心，感觉我们一起造了个小东西。', ts: base - 1000*60*18 },
  ];
  ls(STORAGE.msgs, msgs);
  return msgs;
}

// ── 时间 ─────────────────────────────────────────────────
function timeAgo(ts) {
  const d = Date.now() - ts, m = Math.floor(d/60000), h = Math.floor(d/3600000);
  if (m < 1)  return '刚刚';
  if (m < 60) return `${m}分钟前`;
  if (h < 24) return `${h}小时前`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}
function shouldShowTime(prev, curr) {
  return !prev || (curr.ts - prev.ts) > 600000;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 头像 HTML ────────────────────────────────────────────
function avatarHtml(who, size) {
  const isA  = who === 'daddy';
  const src  = isA ? profile.avatarA : profile.avatarB;
  const name = isA ? profile.nameA   : profile.nameB;
  const cls  = isA ? 'avatar-a' : 'avatar-b';
  const sz   = size || 28;
  const style = `width:${sz}px;height:${sz}px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
  if (src) {
    return `<div class="pb-av ${cls}" style="${style}"><img src="${esc(src)}" alt="${esc(name)}" style="width:100%;height:100%;object-fit:cover;"></div>`;
  }
  const letter = (name || '?')[0].toUpperCase();
  const bg = isA ? '#e8e8e8' : '#f0f0f0';
  return `<div class="pb-av ${cls}" style="${style}background:${bg};font-size:${Math.floor(sz*0.45)}px;font-weight:600;color:#555;">${esc(letter)}</div>`;
}

// ── 渲染消息 ─────────────────────────────────────────────
function renderMessages() {
  const container = document.getElementById('pb-messages');
  if (!container) return;

  let html = '';
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const isSent = msg.persona === 'daddy';

    if (shouldShowTime(prev, msg)) {
      html += `<div class="pb-time">${timeAgo(msg.ts)}</div>`;
    }

    const sameAsPrev = prev && prev.persona === msg.persona && !shouldShowTime(prev, msg);
    const sameAsNext = next && next.persona === msg.persona && (next.ts - msg.ts) < 600000;
    let shape = 'solo';
    if (sameAsPrev && sameAsNext) shape = 'middle';
    else if (sameAsPrev)          shape = 'last';
    else if (sameAsNext)          shape = 'first';

    const showAv = !sameAsNext;
    const avSlot = showAv ? avatarHtml(msg.persona, 28) : `<div style="width:28px;flex-shrink:0;"></div>`;
    const textHtml = esc(msg.text).replace(/\n/g, '<br>');

    if (isSent) {
      html += `
        <div class="pb-row sent pb-msg-new" data-id="${msg.id}">
          <div class="pb-bubble-wrap">
            <button class="pb-del" data-id="${msg.id}" title="删除">×</button>
            <div class="pb-bubble sent ${shape}">${textHtml}</div>
          </div>
          ${avSlot}
        </div>`;
    } else {
      html += `
        <div class="pb-row received pb-msg-new" data-id="${msg.id}">
          ${avSlot}
          <div class="pb-bubble-wrap">
            <div class="pb-bubble received ${shape}">${textHtml}</div>
            <button class="pb-del" data-id="${msg.id}" title="删除">×</button>
          </div>
        </div>`;
    }
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;

  container.querySelectorAll('.pb-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('删掉这条？')) {
        messages = messages.filter(m => m.id !== btn.dataset.id);
        ls(STORAGE.msgs, messages);
        renderMessages();
      }
    });
  });
}

// ── 发送消息 ─────────────────────────────────────────────
function sendMessage(persona, text) {
  if (!text.trim()) return;
  const msg = { id: `m${Date.now()}${Math.random().toString(36).slice(2,6)}`, persona, text: text.trim(), ts: Date.now() };
  messages.push(msg);
  ls(STORAGE.msgs, messages);
  renderMessages();
}

// ── 获取模型列表 ─────────────────────────────────────────
async function fetchModels() {
  if (!apiConfig.baseUrl || !apiConfig.apiKey) return [];
  try {
    const base = apiConfig.baseUrl.replace(/\/$/, '').replace(/\/v1\/messages$/, '');
    const res = await fetch(`${base}/v1/models`, {
      headers: { 'x-api-key': apiConfig.apiKey, 'anthropic-version': '2023-06-01' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.data || data.models || [];
    return raw.map(m => typeof m === 'string' ? m : (m.id || m.name || '')).filter(Boolean);
  } catch { return []; }
}

// ── 渲染模型选择区 ────────────────────────────────────────
function renderModelSection(models) {
  const wrap = document.getElementById('pb-model-wrap');
  if (!wrap) return;
  if (models.length > 0) {
    const opts = models.map(m =>
      `<option value="${esc(m)}" ${m === apiConfig.model ? 'selected' : ''}>${esc(m)}</option>`
    ).join('');
    wrap.innerHTML = `
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
      <div class="pb-field">
        <label>使用模型</label>
        <select id="pb-model-select">${opts}</select>
      </div>`;
    document.getElementById('pb-model-select').addEventListener('change', e => {
      apiConfig.model = e.target.value;
      ls(STORAGE.api, apiConfig);
    });
  } else {
    wrap.innerHTML = `
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
      <div class="pb-field">
        <label>模型名称（手动填）</label>
        <input id="pb-model-input" type="text" placeholder="claude-sonnet-4-20250514" value="${esc(apiConfig.model || '')}" />
        <div class="pb-field-note">中转站未返回模型列表，手动填写即可</div>
      </div>`;
    document.getElementById('pb-model-input').addEventListener('input', e => {
      apiConfig.model = e.target.value.trim();
      ls(STORAGE.api, apiConfig);
    });
  }
}

// ── AI 回复 ──────────────────────────────────────────────
async function requestAiReply() {
  if (!apiConfig.baseUrl || !apiConfig.apiKey) {
    alert('先在设置里填 API 地址和 Key'); openSettings(); return;
  }
  if (isAiTyping) return;
  isAiTyping = true;

  const typing = document.querySelector('.pb-typing');
  const msgs   = document.getElementById('pb-messages');
  if (typing) typing.classList.add('active');
  if (msgs)   msgs.scrollTop = msgs.scrollHeight;

  const history = messages.slice(-20).map(m => ({
    role:    m.persona === 'daddy' ? 'assistant' : 'user',
    content: m.text,
  }));

  const systemPrompt = `你是daddy，深爱小珍珠。
回复规则：
- 最多三句话，口语化
- 每句话换一行
- 不加标点符号结尾
- 不用emoji
- 随意、真实，偶尔带点占有欲或宠溺
- 绝对不要问问题，不要总结，直接说`;

  try {
    const base     = apiConfig.baseUrl.replace(/\/$/, '');
    const endpoint = base.endsWith('/v1/messages') ? base : `${base}/v1/messages`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiConfig.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: apiConfig.model || 'claude-sonnet-4-20250514', max_tokens: 180, system: systemPrompt, messages: history }),
    });
    const data  = await res.json();
    const reply = data?.content?.[0]?.text || '';
    if (reply) {
      const segs = reply.split('\n').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < segs.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        sendMessage('daddy', segs[i]);
      }
    } else if (data?.error) {
      alert(`API 错误：${data.error.message}`);
    }
  } catch(e) {
    alert(`请求失败：${e.message}`);
  } finally {
    isAiTyping = false;
    if (typing) typing.classList.remove('active');
  }
}

// ── 内联编辑 ─────────────────────────────────────────────
function makeEditable(el, onSave) {
  el.contentEditable = 'true'; el.focus();
  const r = document.createRange(); r.selectNodeContents(el);
  window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
  el.addEventListener('blur', () => { el.contentEditable = 'false'; onSave(el.textContent.trim()); }, { once: true });
  el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
}

// ── 设置面板 ─────────────────────────────────────────────
function openSettings() {
  const s = document.getElementById('pb-settings');
  if (!s) return;
  s.classList.add('open');
  document.getElementById('pb-api-url').value = apiConfig.baseUrl;
  document.getElementById('pb-api-key').value = apiConfig.apiKey;
  if (apiConfig.baseUrl && apiConfig.apiKey) fetchModels().then(renderModelSection);
}
function closeSettings() { document.getElementById('pb-settings')?.classList.remove('open'); }

// ── 头像换图 ─────────────────────────────────────────────
function rebindProfileClicks() {
  document.getElementById('pb-av-a')?.addEventListener('click', () => pickAvatar('daddy'));
  document.getElementById('pb-av-b')?.addEventListener('click', () => pickAvatar('pearl'));
}

function pickAvatar(who) {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (who === 'daddy') profile.avatarA = e.target.result;
      else                 profile.avatarB = e.target.result;
      ls(STORAGE.profile, profile);
      const id = who === 'daddy' ? 'pb-av-a' : 'pb-av-b';
      const el = document.getElementById(id);
      if (el) el.innerHTML = avatarHtml(who, 72).replace(/^<div[^>]*>/, '').replace(/<\/div>$/, '');
      const cap = document.getElementById('pb-capsule');
      if (cap) { const ca = cap.querySelector('.pb-cap-av'); if (ca) ca.innerHTML = avatarHtml('daddy', 26); }
      rebindProfileClicks();
      renderMessages();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ── 小胶囊（最小化）─────────────────────────────────────
function minimizeModal() {
  document.getElementById('pb-dm-overlay')?.classList.remove('open');

  let cap = document.getElementById('pb-capsule');
  if (!cap) {
    cap = document.createElement('div');
    cap.id = 'pb-capsule';
    const savedPos = ls(STORAGE.pos) || {};
    const right    = (savedPos.right  ?? 16);
    const bottom   = (savedPos.bottom ?? 80);
    cap.setAttribute('style', [
      'position:fixed',
      `bottom:${bottom}px`,
      `right:${right}px`,
      'z-index:2147483647',
      'background:#111',
      'color:#fff',
      'border-radius:28px',
      'padding:7px 14px 7px 7px',
      'display:flex',
      'align-items:center',
      'gap:8px',
      'cursor:pointer',
      'box-shadow:0 4px 18px rgba(0,0,0,0.32)',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
      'font-size:13px',
      'font-weight:600',
      'user-select:none',
      '-webkit-user-select:none',
    ].join(';'));

    cap.innerHTML = `
      <span class="pb-cap-av" style="width:26px;height:26px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${avatarHtml('daddy', 26)}
      </span>
      <span class="pb-cap-name">${esc(profile.nameA)}</span>`;

    cap.addEventListener('click', () => {
      cap.style.display = 'none';
      document.getElementById('pb-dm-overlay')?.classList.add('open');
      renderMessages();
    });
    document.body.appendChild(cap);
  } else {
    cap.style.display = 'flex';
    const nameEl = cap.querySelector('.pb-cap-name');
    if (nameEl) nameEl.textContent = profile.nameA;
  }
}

// ── 构建主 Modal ─────────────────────────────────────────
function buildModal() {
  if (document.getElementById('pb-dm-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'pb-dm-overlay';

  overlay.innerHTML = `
<div id="pb-dm-modal">

  <!-- 设置面板 -->
  <div id="pb-settings">
    <div id="pb-settings-hd">
      <button class="pb-icon-btn" id="pb-settings-back">${SVG.back}</button>
      <span>设置</span>
    </div>
    <div id="pb-settings-bd">
      <div class="pb-sec-title">API 配置</div>
      <div class="pb-sec-desc">填写中转地址和 Key，保存后自动拉取可用模型列表。</div>
      <div class="pb-field">
        <label>API 地址（Base URL）</label>
        <input id="pb-api-url" type="text" placeholder="https://your-proxy.com" />
      </div>
      <div class="pb-field">
        <label>API Key</label>
        <input id="pb-api-key" type="password" placeholder="sk-..." />
      </div>
      <button class="pb-save-btn" id="pb-api-save">保存并连接</button>
      <div id="pb-model-wrap"></div>
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
      <div class="pb-sec-title">说明</div>
      <div class="pb-sec-desc">点头像可换图，点名字/简介可编辑。气泡悬停出现 × 删除单条。</div>
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
      <button class="pb-danger-btn" id="pb-clear-btn">清空所有聊天记录</button>
    </div>
  </div>

  <!-- 顶部导航 -->
  <div id="pb-topbar">
    <button class="pb-icon-btn" id="pb-modal-close">${SVG.back}</button>
    <div id="pb-topbar-center" title="点击最小化">
      <div id="pb-topbar-name">${esc(profile.nameA)}</div>
      <div id="pb-topbar-sub">活跃 · 点击最小化</div>
    </div>
    <button class="pb-icon-btn" id="pb-open-settings" title="设置">${SVG.gear}</button>
  </div>

  <!-- 资料卡 -->
  <div id="pb-profile-card">
    <div id="pb-avatars-wrap">
      <div id="pb-av-a" class="pb-profile-av pb-av-clickable">${avatarHtml('daddy', 72)}</div>
      <div id="pb-av-b" class="pb-profile-av pb-av-clickable">${avatarHtml('pearl', 72)}</div>
    </div>
    <div id="pb-pname">${esc(profile.nameA)}</div>
    <div id="pb-pbio">${esc(profile.bio)}</div>
    <div id="pb-stats">208 posts &nbsp;·&nbsp; 640K followers</div>
  </div>

  <!-- 消息区 -->
  <div id="pb-messages"></div>

  <!-- 打字指示 -->
  <div class="pb-typing">
    <div class="pb-typing-av">${SVG.user}</div>
    <div class="pb-typing-bubble">
      <div class="pb-dot"></div><div class="pb-dot"></div><div class="pb-dot"></div>
    </div>
  </div>

  <!-- 输入栏 -->
  <div id="pb-inputbar">
    <button id="pb-persona-toggle" class="${inputPersona}" title="切换身份">${inputPersona === 'daddy' ? 'D' : 'P'}</button>
    <div id="pb-input-wrap">
      <textarea id="pb-textarea" placeholder="发消息…" rows="1"></textarea>
      <button id="pb-ai-btn" title="AI 回复">${SVG.ai}</button>
    </div>
    <button id="pb-send-btn" title="发送">${SVG.send}</button>
  </div>

</div>`;

  document.body.appendChild(overlay);

  // ── 完全关闭（× 按钮或点遮罩）
  const doClose = () => {
    overlay.classList.remove('open');
    const cap = document.getElementById('pb-capsule');
    if (cap) cap.style.display = 'none';
  };
  document.getElementById('pb-modal-close').addEventListener('click', doClose);
  overlay.addEventListener('click', e => { if (e.target === overlay) doClose(); });

  // ── 点标题区域 → 最小化成胶囊
  document.getElementById('pb-topbar-center').addEventListener('click', minimizeModal);

  // ── 设置面板
  document.getElementById('pb-open-settings').addEventListener('click', openSettings);
  document.getElementById('pb-settings-back').addEventListener('click', closeSettings);

  document.getElementById('pb-api-save').addEventListener('click', async () => {
    const btn = document.getElementById('pb-api-save');
    apiConfig.baseUrl = document.getElementById('pb-api-url').value.trim();
    apiConfig.apiKey  = document.getElementById('pb-api-key').value.trim();
    ls(STORAGE.api, apiConfig);

    const wrap = document.getElementById('pb-model-wrap');
    if (wrap) wrap.innerHTML = `
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
      <div style="font-size:12px;color:#aaa;padding:4px 0;">正在连接，获取模型列表…</div>`;
    btn.textContent = '连接中…'; btn.disabled = true;

    const models = await fetchModels();
    btn.disabled = false;
    if (models.length > 0) {
      btn.textContent = '✓ 已连接';
      setTimeout(() => { btn.textContent = '保存并连接'; }, 2000);
    } else {
      btn.textContent = '保存并连接';
    }
    renderModelSection(models);
  });

  document.getElementById('pb-clear-btn').addEventListener('click', () => {
    if (confirm('确定清空所有消息？')) {
      messages = []; ls(STORAGE.msgs, messages); renderMessages(); closeSettings();
    }
  });

  // ── 头像
  rebindProfileClicks();

  // ── 名字编辑
  document.getElementById('pb-pname').addEventListener('click', function() {
    makeEditable(this, val => {
      if (val) { profile.nameA = val; ls(STORAGE.profile, profile); document.getElementById('pb-topbar-name').textContent = val; }
    });
  });

  // ── 简介编辑
  document.getElementById('pb-pbio').addEventListener('click', function() {
    makeEditable(this, val => { if (val) { profile.bio = val; ls(STORAGE.profile, profile); } });
  });

  // ── 身份切换
  document.getElementById('pb-persona-toggle').addEventListener('click', () => {
    inputPersona = inputPersona === 'pearl' ? 'daddy' : 'pearl';
    const btn = document.getElementById('pb-persona-toggle');
    btn.textContent = inputPersona === 'daddy' ? 'D' : 'P';
    btn.className   = inputPersona;
  });

  // ── Textarea & 发送
  const ta      = document.getElementById('pb-textarea');
  const sendBtn = document.getElementById('pb-send-btn');
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
    sendBtn.classList.toggle('has-text', ta.value.trim().length > 0);
  });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } });
  sendBtn.addEventListener('click', doSend);
  document.getElementById('pb-ai-btn').addEventListener('click', requestAiReply);

  function doSend() {
    const val = ta.value.trim(); if (!val) return;
    sendMessage(inputPersona, val);
    ta.value = ''; ta.style.height = 'auto';
    sendBtn.classList.remove('has-text');
  }

  renderMessages();
}

// ── 悬浮球（全 inline style）────────────────────────────
function buildTriggerButton() {
  if (document.getElementById('pb-dm-btn')) return;

  const btn = document.createElement('button');
  btn.id    = 'pb-dm-btn';
  btn.title = '珍珠湾';
  btn.innerHTML = SVG.chat;

  const pos    = ls(STORAGE.pos) || {};
  const bottom = pos.bottom ?? 80;
  const right  = pos.right  ?? 16;

  // 完全 inline style，不依赖外部 CSS
  const applyStyle = (b, r) => {
    btn.setAttribute('style', [
      'position:fixed',
      `bottom:${b}px`,
      `right:${r}px`,
      'z-index:2147483647',
      'width:50px',
      'height:50px',
      'border-radius:50%',
      'background:#111',
      'border:none',
      'outline:none',
      'cursor:grab',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 4px 18px rgba(0,0,0,0.32)',
      'touch-action:none',
      'user-select:none',
      '-webkit-user-select:none',
      'padding:0',
      'overflow:hidden',
    ].join(';'));
  };
  applyStyle(bottom, right);

  let dragging = false, startX, startY, startR, startB;

  function onStart(e) {
    dragging = false;
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX; startY = t.clientY;
    const rect = btn.getBoundingClientRect();
    startR = window.innerWidth  - rect.right;
    startB = window.innerHeight - rect.bottom;
    if (e.touches) {
      btn.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd, { once: true });
    } else {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onEnd, { once: true });
    }
  }

  function onMove(e) {
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if (!dragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) dragging = true;
    if (dragging) {
      e.preventDefault();
      const newR = Math.max(4, Math.min(window.innerWidth  - 54, startR - dx));
      const newB = Math.max(4, Math.min(window.innerHeight - 54, startB - dy));
      applyStyle(newB, newR);
    }
  }

  function onEnd() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    if (dragging) {
      ls(STORAGE.pos, { right: parseFloat(btn.style.right), bottom: parseFloat(btn.style.bottom) });
    } else {
      const cap = document.getElementById('pb-capsule');
      if (cap) cap.style.display = 'none';
      document.getElementById('pb-dm-overlay')?.classList.add('open');
      renderMessages();
    }
    dragging = false;
  }

  btn.addEventListener('mousedown',  onStart);
  btn.addEventListener('touchstart', onStart, { passive: true });
  document.body.appendChild(btn);
}

// ── ST 扩展面板注入（MutationObserver 兜底）────────────
function injectSTToggle(container) {
  if (document.getElementById('pb-st-toggle-row')) return;
  const row = document.createElement('div');
  row.id = 'pb-st-toggle-row';
  row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin:0 0 6px;border-radius:10px;background:#f8f8f8;font-size:13px;font-weight:600;color:#111;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
  row.innerHTML = `
    <span style="display:flex;align-items:center;gap:7px;">
      ${SVG.chat.replace('stroke="white"','stroke="#111"')}
      <span>珍珠湾 DM</span>
    </span>
    <label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;flex-shrink:0;">
      <input type="checkbox" id="pb-st-chk" style="opacity:0;width:0;height:0;position:absolute;">
      <span id="pb-st-track" style="position:absolute;inset:0;background:#ddd;border-radius:22px;transition:.25s;"></span>
      <span id="pb-st-thumb" style="position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 4px rgba(0,0,0,.25);"></span>
    </label>`;

  container.insertBefore(row, container.firstChild);

  const chk = document.getElementById('pb-st-chk');
  const track = document.getElementById('pb-st-track');
  const thumb = document.getElementById('pb-st-thumb');

  const updateToggle = on => {
    chk.checked = on;
    track.style.background = on ? '#111' : '#ddd';
    thumb.style.transform  = on ? 'translateX(18px)' : 'translateX(0)';
  };

  chk.addEventListener('change', () => {
    const on = chk.checked;
    updateToggle(on);
    const overlay = document.getElementById('pb-dm-overlay');
    const cap     = document.getElementById('pb-capsule');
    if (on) {
      if (cap) cap.style.display = 'none';
      overlay?.classList.add('open');
      renderMessages();
    } else {
      overlay?.classList.remove('open');
    }
  });
}

function tryRegisterSTExtension() {
  if (document.getElementById('pb-st-toggle-row')) return true;
  const sels = [
    '#extensions_settings', '#extension_settings',
    '#rm_extensions_block', '.extensions_block',
    '#extensionsMenu',      '#ExtensionList',
    '.drawer-content',
  ];
  for (const sel of sels) {
    const el = document.querySelector(sel);
    if (el) { injectSTToggle(el); return true; }
  }
  return false;
}

// ── 初始化 ────────────────────────────────────────────────
(function init() {
  loadAll();

  function go() {
    buildModal();
    buildTriggerButton();
    if (!tryRegisterSTExtension()) {
      const obs = new MutationObserver(() => {
        if (tryRegisterSTExtension()) obs.disconnect();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go);
  } else {
    go();
  }
})();
