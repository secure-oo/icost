// 珍珠湾 DM · v3.1
// 合并版：SVG 图标 + 双头像 + 可拖拽 + 全部修复

'use strict';

// ── SVG 图标 ─────────────────────────────────────────────
const SVG = {
  back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  dots: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  send: `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  ai:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/></svg>`,
  gear: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  chat: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  user: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
};

// ── Storage keys ─────────────────────────────────────────
const STORAGE = {
  msgs:    'pb_dm_messages_v3',
  profile: 'pb_dm_profile_v3',
  api:     'pb_dm_api_v3',
  pos:     'pb_dm_btn_pos_v3',
};

// ── 常用模型列表 ─────────────────────────────────────────
const DEFAULT_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'claude-haiku-4-5-20251001',
  'gpt-4o',
  'gpt-4o-mini',
  'deepseek-chat',
  'gemini-1.5-pro',
];

// ── 身份 ─────────────────────────────────────────────────
const PERSONAS = {
  daddy: { key: 'daddy', name: 'daddy',  side: 'sent'     },
  pearl: { key: 'pearl', name: '小珍珠', side: 'received' },
};

// ── 全局状态 ─────────────────────────────────────────────
let messages     = [];
let profile      = { nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', sticker: '🎀', avatarA: '', avatarB: '' };
let apiConfig    = { baseUrl: '', apiKey: '', model: 'claude-sonnet-4-20250514' };
let inputPersona = 'pearl';
let isAiTyping   = false;

// ── localStorage 工具 ────────────────────────────────────
function ls(key, val) {
  if (val === undefined) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

function loadAll() {
  messages  = ls(STORAGE.msgs) || seedMessages();
  profile   = Object.assign(
    { nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', sticker: '🎀', avatarA: '', avatarB: '' },
    ls(STORAGE.profile) || {}
  );
  apiConfig = Object.assign(
    { baseUrl: '', apiKey: '', model: 'claude-sonnet-4-20250514' },
    ls(STORAGE.api) || {}
  );
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
  if (!prev) return true;
  return (curr.ts - prev.ts) > 1000 * 60 * 10;
}

// ── HTML 转义 ────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 头像渲染（有图用图，无图用首字）─────────────────────
function avatarHtml(who) {
  const isA  = who === 'daddy';
  const src  = isA ? profile.avatarA : profile.avatarB;
  const name = isA ? profile.nameA   : profile.nameB;
  const cls  = isA ? 'avatar-a'      : 'avatar-b';
  if (src) return `<img class="pb-av ${cls}" src="${esc(src)}" alt="${esc(name)}">`;
  const letter = (name || '?')[0].toUpperCase();
  return `<div class="pb-av ${cls} pb-av-letter">${esc(letter)}</div>`;
}

// ── 渲染消息 ─────────────────────────────────────────────
function renderMessages() {
  const container = document.getElementById('pb-messages');
  if (!container) return;

  let html = '';
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const p      = PERSONAS[msg.persona];
    const isSent = p.side === 'sent';

    if (shouldShowTime(prev, msg)) {
      html += `<div class="pb-time">${timeAgo(msg.ts)}</div>`;
    }

    const sameAsPrev = prev && prev.persona === msg.persona && !shouldShowTime(prev, msg);
    const sameAsNext = next && next.persona === msg.persona && (next.ts - msg.ts) < 1000*60*10;
    let shape = 'solo';
    if (sameAsPrev && sameAsNext) shape = 'middle';
    else if (sameAsPrev)          shape = 'last';
    else if (sameAsNext)          shape = 'first';

    const showAv = !sameAsNext;
    const avHtml = avatarHtml(msg.persona);
    const avSlot = showAv ? `<div class="pb-av">${avHtml}</div>` : `<div class="pb-av-gap"></div>`;
    const textHtml = esc(msg.text).replace(/\n/g, '<br>');

    // bubble wrap with delete button
    const bubbleWrap = `
      <div class="pb-bubble-wrap">
        <div class="pb-bubble ${isSent?'sent':'received'} ${shape}">${textHtml}</div>
        <button class="pb-del" data-id="${msg.id}" title="删除">×</button>
      </div>`;

    if (isSent) {
      html += `<div class="pb-row sent pb-msg-new" data-id="${msg.id}">${bubbleWrap}${avSlot}</div>`;
    } else {
      html += `<div class="pb-row received pb-msg-new" data-id="${msg.id}">${avSlot}${bubbleWrap}</div>`;
    }
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;

  // 删除按钮 — 悬停显示，单击删除
  container.querySelectorAll('.pb-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      messages = messages.filter(m => m.id !== id);
      ls(STORAGE.msgs, messages);
      renderMessages();
    });
  });
}

// ── 发送消息 ─────────────────────────────────────────────
function sendMessage(persona, text) {
  if (!text.trim()) return;
  const msg = {
    id: `m${Date.now()}${Math.random().toString(36).slice(2,5)}`,
    persona, text: text.trim(), ts: Date.now(),
  };
  messages.push(msg);
  ls(STORAGE.msgs, messages);
  renderMessages();
}

// ── AI 回复 ──────────────────────────────────────────────
async function requestAiReply() {
  if (!apiConfig.baseUrl || !apiConfig.apiKey) {
    alert('先在设置里填 API 地址和 Key');
    openSettings();
    return;
  }
  if (isAiTyping) return;
  isAiTyping = true;

  const typing = document.querySelector('.pb-typing');
  const msgEl  = document.getElementById('pb-messages');
  if (typing) typing.classList.add('active');
  if (msgEl)  msgEl.scrollTop = msgEl.scrollHeight;

  const history = messages.slice(-20).map(m => ({
    role:    m.persona === 'daddy' ? 'assistant' : 'user',
    content: m.text,
  }));

  const systemPrompt = `你是daddy，深爱小珍珠。
回复规则：
- 最多三句话，口语化，不用文绉绉的词
- 每句话换一行
- 不用加标点符号结尾
- 不用emoji
- 像在发消息一样，随意、真实，偶尔带点占有欲或宠溺
- 绝对不要问问题，直接说就行`;

  try {
    const baseUrl  = apiConfig.baseUrl.replace(/\/$/, '');
    const endpoint = baseUrl.endsWith('/v1/messages') ? baseUrl : `${baseUrl}/v1/messages`;
    const model    = apiConfig.model || 'claude-sonnet-4-20250514';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiConfig.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 200, system: systemPrompt, messages: history }),
    });

    const data  = await res.json();
    const reply = data?.content?.[0]?.text || '';
    if (reply) {
      const segments = reply.split('\n').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < segments.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
        sendMessage('daddy', segments[i]);
      }
    } else if (data?.error) {
      alert(`API 错误：${data.error.message}`);
    }
  } catch (e) {
    alert(`请求失败：${e.message}`);
  } finally {
    isAiTyping = false;
    if (typing) typing.classList.remove('active');
  }
}

// ── 内联编辑 ─────────────────────────────────────────────
function makeEditable(el, onSave) {
  el.contentEditable = 'true';
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  el.addEventListener('blur',    () => { el.contentEditable = 'false'; onSave(el.textContent.trim()); }, { once: true });
  el.addEventListener('keydown', e  => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
}

// ── 设置面板 ─────────────────────────────────────────────
function openSettings() {
  const s = document.getElementById('pb-settings');
  if (!s) return;
  s.classList.add('open');
  document.getElementById('pb-api-url').value   = apiConfig.baseUrl;
  document.getElementById('pb-api-key').value   = apiConfig.apiKey;
  document.getElementById('pb-api-model').value = apiConfig.model || '';
  document.getElementById('pb-sticker-inp').value = profile.sticker || '🎀';
}
function closeSettings() {
  document.getElementById('pb-settings')?.classList.remove('open');
}

// ── 刷新资料区 ───────────────────────────────────────────
function refreshProfileCard() {
  const card = document.getElementById('pb-profile-card');
  if (!card) return;
  // 头像
  const avA = card.querySelector('#pb-av-a');
  const avB = card.querySelector('#pb-av-b');
  if (avA) avA.innerHTML = avatarHtml('daddy');
  if (avB) avB.innerHTML = avatarHtml('pearl');
  // 名字、简介、贴图
  const pname = card.querySelector('#pb-pname');
  const pbio  = card.querySelector('#pb-pbio');
  const stick = card.querySelector('#pb-name-sticker');
  if (pname) pname.textContent = profile.nameA;
  if (pbio)  pbio.textContent  = profile.bio;
  if (stick) stick.textContent = profile.sticker || '🎀';
  rebindProfileClicks();
}

function rebindProfileClicks() {
  document.getElementById('pb-av-a')?.addEventListener('click', () => pickAvatar('daddy'));
  document.getElementById('pb-av-b')?.addEventListener('click', () => pickAvatar('pearl'));
}

function pickAvatar(who) {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (who === 'daddy') profile.avatarA = e.target.result;
      else                 profile.avatarB = e.target.result;
      ls(STORAGE.profile, profile);
      refreshProfileCard();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ── 构建弹窗 ─────────────────────────────────────────────
function buildModal() {
  const overlay = document.createElement('div');
  overlay.id = 'pb-dm-overlay';

  // 模型下拉选项
  const modelOpts = DEFAULT_MODELS
    .map(m => `<option value="${esc(m)}"${m === apiConfig.model ? ' selected' : ''}>${esc(m)}</option>`)
    .join('');

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
      <div class="pb-sec-desc">填写中转地址和 Key，点 ✦ 让 daddy 自动回复。</div>

      <div class="pb-field">
        <label>API 地址（Base URL）</label>
        <input id="pb-api-url" type="text" placeholder="https://your-proxy.com" />
      </div>
      <div class="pb-field">
        <label>API Key</label>
        <input id="pb-api-key" type="password" placeholder="sk-..." />
      </div>
      <div class="pb-field">
        <label>模型</label>
        <select id="pb-api-model-sel">${modelOpts}<option value="">自定义（见下方）</option></select>
        <input id="pb-api-model" type="text" placeholder="或直接填模型名" style="margin-top:6px;" />
        <div class="pb-field-note">下拉选择后会自动填入，也可手动输入中转站专属模型名。</div>
      </div>
      <button class="pb-save-btn" id="pb-api-save">保存 API 设置</button>

      <div style="border-top:1px solid #f0f0f0;"></div>

      <div class="pb-sec-title">名字贴图</div>
      <div class="pb-field">
        <label>贴图 Emoji（显示在名字后面）</label>
        <input id="pb-sticker-inp" type="text" placeholder="🎀" maxlength="4" />
      </div>
      <button class="pb-save-btn" id="pb-sticker-save">更新贴图</button>

      <div style="border-top:1px solid #f0f0f0;"></div>

      <div class="pb-sec-desc">点击资料区头像可以换图片，点名字/简介可以编辑。悬停气泡出现 × 可单击删除。</div>

      <button class="pb-danger-btn" id="pb-clear-btn">清空所有聊天记录</button>
    </div>
  </div>

  <!-- 顶部导航 -->
  <div id="pb-topbar">
    <button class="pb-icon-btn" id="pb-modal-close">${SVG.back}</button>
    <div id="pb-topbar-center">
      <div id="pb-topbar-name">${esc(profile.nameA)}</div>
      <div id="pb-topbar-sub">活跃</div>
    </div>
    <button class="pb-icon-btn" id="pb-open-settings">${SVG.gear}</button>
  </div>

  <!-- 资料区 -->
  <div id="pb-profile-card">
    <div id="pb-avatars-wrap">
      <div id="pb-av-a" class="pb-profile-av pb-av-clickable">${avatarHtml('daddy')}</div>
      <div id="pb-av-b" class="pb-profile-av pb-av-clickable">${avatarHtml('pearl')}</div>
    </div>
    <div id="pb-pname-row">
      <div id="pb-pname">${esc(profile.nameA)}</div>
      <span id="pb-name-sticker">${esc(profile.sticker || '🎀')}</span>
    </div>
    <div id="pb-pbio">${esc(profile.bio)}</div>
    <div id="pb-stats">
      <div class="pb-stat"><span class="pb-stat-n">208</span><span class="pb-stat-l">posts</span></div>
      <div class="pb-stat"><span class="pb-stat-n">640K</span><span class="pb-stat-l">followers</span></div>
    </div>
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
    <button id="pb-persona-toggle" class="${inputPersona}" title="切换身份">
      ${inputPersona === 'daddy' ? 'D' : 'P'}
    </button>
    <div id="pb-input-wrap">
      <textarea id="pb-textarea" placeholder="发消息…" rows="1"></textarea>
      <button id="pb-ai-btn" title="AI daddy 回复">${SVG.ai}</button>
    </div>
    <button id="pb-send-btn" title="发送">${SVG.send}</button>
  </div>

</div>`;

  document.body.appendChild(overlay);

  // ── 关闭 ──
  document.getElementById('pb-modal-close').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  // ── 设置开关 ──
  document.getElementById('pb-open-settings').addEventListener('click', openSettings);
  document.getElementById('pb-settings-back').addEventListener('click', closeSettings);

  // 模型下拉 → 同步到文本框
  document.getElementById('pb-api-model-sel').addEventListener('change', function() {
    if (this.value) document.getElementById('pb-api-model').value = this.value;
  });

  // 保存 API
  document.getElementById('pb-api-save').addEventListener('click', () => {
    apiConfig.baseUrl = document.getElementById('pb-api-url').value.trim();
    apiConfig.apiKey  = document.getElementById('pb-api-key').value.trim();
    const m = document.getElementById('pb-api-model').value.trim();
    if (m) apiConfig.model = m;
    ls(STORAGE.api, apiConfig);
    closeSettings();
  });

  // 保存贴图
  document.getElementById('pb-sticker-save').addEventListener('click', () => {
    const val = document.getElementById('pb-sticker-inp').value.trim();
    if (val) {
      profile.sticker = val;
      ls(STORAGE.profile, profile);
      document.getElementById('pb-name-sticker').textContent = val;
    }
    closeSettings();
  });

  // 清空
  document.getElementById('pb-clear-btn').addEventListener('click', () => {
    if (confirm('确定清空所有消息？')) {
      messages = [];
      ls(STORAGE.msgs, messages);
      renderMessages();
      closeSettings();
    }
  });

  // ── 头像 ──
  rebindProfileClicks();

  // ── 名字/简介编辑 ──
  document.getElementById('pb-pname').addEventListener('click', function() {
    makeEditable(this, val => {
      if (val) {
        profile.nameA = val;
        ls(STORAGE.profile, profile);
        document.getElementById('pb-topbar-name').textContent = val;
      }
    });
  });
  document.getElementById('pb-pbio').addEventListener('click', function() {
    makeEditable(this, val => {
      if (val) { profile.bio = val; ls(STORAGE.profile, profile); }
    });
  });

  // ── 身份切换 ──
  document.getElementById('pb-persona-toggle').addEventListener('click', () => {
    inputPersona = inputPersona === 'pearl' ? 'daddy' : 'pearl';
    const btn = document.getElementById('pb-persona-toggle');
    btn.textContent = inputPersona === 'daddy' ? 'D' : 'P';
    btn.className   = inputPersona;
  });

  // ── Textarea ──
  const ta      = document.getElementById('pb-textarea');
  const sendBtn = document.getElementById('pb-send-btn');

  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 90) + 'px';
    sendBtn.classList.toggle('has-text', ta.value.trim().length > 0);
  });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });
  sendBtn.addEventListener('click', doSend);
  document.getElementById('pb-ai-btn').addEventListener('click', requestAiReply);

  function doSend() {
    const val = ta.value.trim();
    if (!val) return;
    sendMessage(inputPersona, val);
    ta.value = '';
    ta.style.height = 'auto';
    sendBtn.classList.remove('has-text');
  }

  renderMessages();
}

// ── 可拖拽悬浮球 ─────────────────────────────────────────
function buildTriggerButton() {
  const btn   = document.createElement('button');
  btn.id      = 'pb-dm-btn';
  btn.title   = '珍珠湾';
  btn.innerHTML = SVG.chat;

  // 恢复位置（加边界保护，防止手机上跑出屏幕外）
  const savedPos = ls(STORAGE.pos);
  if (savedPos) {
    const maxR = window.innerWidth  - 54;
    const maxB = window.innerHeight - 54;
    btn.style.right  = Math.max(4, Math.min(savedPos.right  || 16, maxR)) + 'px';
    btn.style.bottom = Math.max(4, Math.min(savedPos.bottom || 80, maxB)) + 'px';
  }

  let dragging = false, startX, startY, startR, startB;

  function onStart(e) {
    dragging = false;
    const t  = e.touches ? e.touches[0] : e;
    startX   = t.clientX;
    startY   = t.clientY;
    const rect = btn.getBoundingClientRect();
    startR   = window.innerWidth  - rect.right;
    startB   = window.innerHeight - rect.bottom;

    if (e.touches) {
      btn.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd, { once: true });
    } else {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onEnd, { once: true });
    }
  }

  function onMove(e) {
    const t  = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (!dragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) dragging = true;
    if (dragging) {
      e.preventDefault();
      const newR = Math.max(4, Math.min(window.innerWidth  - btn.offsetWidth  - 4, startR - dx));
      const newB = Math.max(4, Math.min(window.innerHeight - btn.offsetHeight - 4, startB - dy));
      btn.style.right  = newR + 'px';
      btn.style.bottom = newB + 'px';
    }
  }

  function onEnd() {
    document.removeEventListener('mousemove', onMove);
    btn.removeEventListener('touchmove', onMove);
    if (dragging) {
      ls(STORAGE.pos, {
        right:  parseFloat(btn.style.right),
        bottom: parseFloat(btn.style.bottom),
      });
    } else {
      // 点击打开
      document.getElementById('pb-dm-overlay')?.classList.add('open');
      renderMessages();
    }
    dragging = false;
  }

  btn.addEventListener('mousedown',  onStart);
  btn.addEventListener('touchstart', onStart, { passive: true });
  document.body.appendChild(btn);
}

// ── ST 扩展栏注册 ────────────────────────────────────────
function tryRegisterSTExtension() {
  const selectors = ['#extensionsMenu','#extensionsMenuList','#extension_settings','.extensions_block'];
  for (const sel of selectors) {
    const menu = document.querySelector(sel);
    if (menu) {
      const item = document.createElement('div');
      item.id        = 'pb-st-entry';
      item.className = 'extension_block';
      item.style.cssText = 'cursor:pointer;padding:8px 12px;display:flex;align-items:center;gap:8px;font-size:14px;color:inherit;';
      item.innerHTML = `${SVG.chat.replace('stroke="white"','stroke="currentColor"')}<span>珍珠湾 DM</span>`;
      item.addEventListener('click', () => {
        document.getElementById('pb-dm-overlay')?.classList.add('open');
        renderMessages();
      });
      menu.appendChild(item);
      return true;
    }
  }
  return false;
}

// ── 初始化 ───────────────────────────────────────────────
(function init() {
  loadAll();
  function go() {
    buildModal();
    buildTriggerButton();
    setTimeout(tryRegisterSTExtension, 120);
    setTimeout(tryRegisterSTExtension, 900);
  }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', go)
    : go();
})();
