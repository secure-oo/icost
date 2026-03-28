// 珍珠湾 DM · v3.0
// 手机端适配 + SVG化 + SillyTavern整合

'use strict';

// ── SVG 图标库（全部内联，无emoji）────────────────────
const SVG = {
  back:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  dots:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  send:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/></svg>`,
  ai:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/></svg>`,
  gear:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  chat:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  plus:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  user:  `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
};

// ── 存储 key ────────────────────────────────────────────
const STORAGE = {
  msgs:    'pb_dm_messages_v3',
  profile: 'pb_dm_profile_v3',
  api:     'pb_dm_api_v3',
  pos:     'pb_dm_btn_pos_v3',
};

// ── 发言身份 ────────────────────────────────────────────
const PERSONAS = {
  daddy: { key: 'daddy', name: 'daddy', side: 'sent'     },
  pearl: { key: 'pearl', name: '小珍珠', side: 'received' },
};

// ── 全局状态 ────────────────────────────────────────────
let messages     = [];
let profile      = { nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', avatarA: '', avatarB: '' };
let apiConfig    = { baseUrl: '', apiKey: '' };
let inputPersona = 'pearl';
let isAiTyping   = false;

// ── localStorage 工具 ───────────────────────────────────
function ls(key, val) {
  if (val === undefined) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

function loadAll() {
  messages  = ls(STORAGE.msgs)    || seedMessages();
  profile   = Object.assign({ nameA: 'daddy', nameB: '小珍珠', bio: '只有我们的地方', avatarA: '', avatarB: '' }, ls(STORAGE.profile) || {});
  apiConfig = Object.assign({ baseUrl: '', apiKey: '' }, ls(STORAGE.api) || {});
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

// ── 时间格式 ────────────────────────────────────────────
function timeAgo(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  const h = Math.floor(d / 3600000);
  if (m < 1)  return '刚刚';
  if (m < 60) return `${m}分钟前`;
  if (h < 24) return `${h}小时前`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function shouldShowTime(prev, curr) {
  if (!prev) return true;
  return (curr.ts - prev.ts) > 1000 * 60 * 10;
}

// ── 转义 HTML ───────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── 头像渲染（有图用图，无图用首字）────────────────────
function avatarHtml(who) {
  const isA = who === 'daddy';
  const src  = isA ? profile.avatarA : profile.avatarB;
  const name = isA ? profile.nameA   : profile.nameB;
  const cls  = isA ? 'avatar-a' : 'avatar-b';
  if (src) return `<img class="pb-av ${cls}" src="${esc(src)}" alt="${esc(name)}">`;
  const letter = (name || '?')[0].toUpperCase();
  return `<div class="pb-av ${cls} pb-av-letter">${esc(letter)}</div>`;
}

// ── 渲染消息列表 ────────────────────────────────────────
function renderMessages() {
  const container = document.getElementById('pb-messages');
  if (!container) return;

  let html = '';
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const p     = PERSONAS[msg.persona];
    const isSent = p.side === 'sent';

    if (shouldShowTime(prev, msg)) {
      html += `<div class="pb-time">${timeAgo(msg.ts)}</div>`;
    }

    const sameAsPrev = prev && prev.persona === msg.persona && !shouldShowTime(prev, msg);
    const sameAsNext = next && next.persona === msg.persona && (next.ts - msg.ts) < 1000 * 60 * 10;
    let shape = 'solo';
    if (sameAsPrev && sameAsNext)  shape = 'middle';
    else if (sameAsPrev)           shape = 'last';
    else if (sameAsNext)           shape = 'first';

    const showAv = !sameAsNext;
    const avHtml = avatarHtml(msg.persona);
    const avSlot = showAv ? avHtml : `<div class="pb-av-gap"></div>`;

    const textHtml = esc(msg.text).replace(/\n/g, '<br>');

    if (isSent) {
      html += `
        <div class="pb-row sent pb-msg-new" data-id="${msg.id}">
          <div class="pb-bubble sent ${shape}" data-id="${msg.id}">${textHtml}</div>
          ${avSlot}
        </div>`;
    } else {
      html += `
        <div class="pb-row received pb-msg-new" data-id="${msg.id}">
          ${avSlot}
          <div class="pb-bubble received ${shape}" data-id="${msg.id}">${textHtml}</div>
        </div>`;
    }
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;

  container.querySelectorAll('.pb-bubble').forEach(b => {
    b.addEventListener('dblclick', () => {
      const id = b.dataset.id;
      if (confirm('删掉这条？')) {
        messages = messages.filter(m => m.id !== id);
        ls(STORAGE.msgs, messages);
        renderMessages();
      }
    });
  });
}

// ── 发送消息 ────────────────────────────────────────────
function sendMessage(persona, text) {
  if (!text.trim()) return;
  const msg = { id: `m${Date.now()}${Math.random().toString(36).slice(2,6)}`, persona, text: text.trim(), ts: Date.now() };
  messages.push(msg);
  ls(STORAGE.msgs, messages);
  renderMessages();
}

// ── AI 回复 ─────────────────────────────────────────────
async function requestAiReply() {
  if (!apiConfig.baseUrl || !apiConfig.apiKey) {
    alert('先在设置里填 API 地址和 Key');
    openSettings();
    return;
  }
  if (isAiTyping) return;
  isAiTyping = true;

  const typing = document.querySelector('.pb-typing');
  const msgs   = document.getElementById('pb-messages');
  if (typing) typing.classList.add('active');
  if (msgs)   msgs.scrollTop = msgs.scrollHeight;

  // 取最近20条消息作为上下文
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
- 绝对不要问问题，不要总结，直接说就行`;

  try {
    const baseUrl  = apiConfig.baseUrl.replace(/\/$/, '');
    const endpoint = baseUrl.endsWith('/v1/messages') ? baseUrl : `${baseUrl}/v1/messages`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiConfig.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 180,
        system:     systemPrompt,
        messages:   history,
      }),
    });

    const data  = await res.json();
    const reply = data?.content?.[0]?.text || '';
    if (reply) {
      // 按换行分段发送，模拟真实打字节奏
      const segments = reply.split('\n').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < segments.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
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

// ── 内联编辑 ────────────────────────────────────────────
function makeEditable(el, onSave) {
  el.contentEditable = 'true';
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  function save() {
    el.contentEditable = 'false';
    onSave(el.textContent.trim());
  }
  el.addEventListener('blur',    save,                              { once: true });
  el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
}

// ── 设置面板 ────────────────────────────────────────────
function openSettings() {
  const s = document.getElementById('pb-settings');
  if (s) {
    s.classList.add('open');
    document.getElementById('pb-api-url').value = apiConfig.baseUrl;
    document.getElementById('pb-api-key').value = apiConfig.apiKey;
  }
}
function closeSettings() {
  document.getElementById('pb-settings')?.classList.remove('open');
}

// ── 更新头像区域 ─────────────────────────────────────────
function refreshProfileCard() {
  const card = document.getElementById('pb-profile-card');
  if (!card) return;
  card.querySelector('#pb-av-a').outerHTML = `<div id="pb-av-a" class="pb-profile-av pb-av-clickable">${avatarHtml('daddy')}</div>`;
  card.querySelector('#pb-av-b').outerHTML = `<div id="pb-av-b" class="pb-profile-av pb-av-clickable">${avatarHtml('pearl')}</div>`;
  card.querySelector('#pb-pname').textContent = profile.nameA;
  card.querySelector('#pb-pbio').textContent  = profile.bio;
  rebindProfileClicks();
}

function rebindProfileClicks() {
  document.getElementById('pb-av-a')?.addEventListener('click', () => pickAvatar('daddy'));
  document.getElementById('pb-av-b')?.addEventListener('click', () => pickAvatar('pearl'));
}

function pickAvatar(who) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (who === 'daddy') profile.avatarA = e.target.result;
      else                 profile.avatarB = e.target.result;
      ls(STORAGE.profile, profile);
      // 刷新头像显示
      document.querySelectorAll(`.pb-av.${who === 'daddy' ? 'avatar-a' : 'avatar-b'}`).forEach(el => {
        el.outerHTML = avatarHtml(who);
      });
      refreshProfileCard();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ── 构建主 Modal ─────────────────────────────────────────
function buildModal() {
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
      <div class="pb-sec-desc">填写你的中转地址和 Key，点「AI 回复」按钮让 daddy 自动说话。</div>
      <div class="pb-field">
        <label>API 地址（Base URL）</label>
        <input id="pb-api-url" type="text" placeholder="https://your-proxy.com" />
      </div>
      <div class="pb-field">
        <label>API Key</label>
        <input id="pb-api-key" type="password" placeholder="sk-..." />
      </div>
      <button class="pb-save-btn" id="pb-api-save">保存</button>
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
      <div class="pb-sec-title">说明</div>
      <div class="pb-sec-desc">点击资料区的头像可以换图片，点名字和简介可以编辑。双击气泡可以删除。</div>
      <div style="border-top:1px solid #efefef;margin:4px 0;"></div>
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
    <button class="pb-icon-btn" id="pb-open-settings" title="设置">${SVG.gear}</button>
  </div>

  <!-- 资料区（两头像+名字+简介）-->
  <div id="pb-profile-card">
    <div id="pb-avatars-wrap">
      <div id="pb-av-a" class="pb-profile-av pb-av-clickable">${avatarHtml('daddy')}</div>
      <div id="pb-av-b" class="pb-profile-av pb-av-clickable">${avatarHtml('pearl')}</div>
    </div>
    <div id="pb-pname" class="pb-editable">${esc(profile.nameA)}</div>
    <div id="pb-pbio"  class="pb-editable pb-bio-text">${esc(profile.bio)}</div>
    <div class="pb-edit-hint">点头像换图 · 点名字/简介编辑</div>
  </div>

  <!-- 消息区 -->
  <div id="pb-messages"></div>

  <!-- 打字指示 -->
  <div class="pb-typing">
    <div class="pb-typing-av">${SVG.user}</div>
    <div class="pb-typing-bubble">
      <div class="pb-dot"></div>
      <div class="pb-dot"></div>
      <div class="pb-dot"></div>
    </div>
  </div>

  <!-- 输入栏 -->
  <div id="pb-inputbar">
    <button id="pb-persona-toggle" title="切换发言身份" class="${inputPersona}">${inputPersona === 'daddy' ? 'D' : 'P'}</button>
    <div id="pb-input-wrap">
      <textarea id="pb-textarea" placeholder="发消息…" rows="1"></textarea>
      <button id="pb-ai-btn" title="AI 回复">${SVG.ai}</button>
    </div>
    <button id="pb-send-btn" title="发送">${SVG.send}</button>
  </div>

</div>`;

  document.body.appendChild(overlay);

  // 关闭
  document.getElementById('pb-modal-close').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  // 设置
  document.getElementById('pb-open-settings').addEventListener('click', openSettings);
  document.getElementById('pb-settings-back').addEventListener('click', closeSettings);
  document.getElementById('pb-api-save').addEventListener('click', () => {
    apiConfig.baseUrl = document.getElementById('pb-api-url').value.trim();
    apiConfig.apiKey  = document.getElementById('pb-api-key').value.trim();
    ls(STORAGE.api, apiConfig);
    closeSettings();
  });
  document.getElementById('pb-clear-btn').addEventListener('click', () => {
    if (confirm('确定清空所有消息？')) {
      messages = [];
      ls(STORAGE.msgs, messages);
      renderMessages();
      closeSettings();
    }
  });

  // 头像点击
  rebindProfileClicks();

  // 名字编辑
  document.getElementById('pb-pname').addEventListener('click', function() {
    makeEditable(this, val => {
      if (val) {
        profile.nameA = val;
        ls(STORAGE.profile, profile);
        document.getElementById('pb-topbar-name').textContent = val;
      }
    });
  });

  // 简介编辑
  document.getElementById('pb-pbio').addEventListener('click', function() {
    makeEditable(this, val => {
      if (val) {
        profile.bio = val;
        ls(STORAGE.profile, profile);
      }
    });
  });

  // 切换发言身份
  document.getElementById('pb-persona-toggle').addEventListener('click', () => {
    inputPersona = inputPersona === 'pearl' ? 'daddy' : 'pearl';
    const btn = document.getElementById('pb-persona-toggle');
    btn.textContent = inputPersona === 'daddy' ? 'D' : 'P';
    btn.className   = inputPersona;
  });

  // Textarea
  const ta      = document.getElementById('pb-textarea');
  const sendBtn = document.getElementById('pb-send-btn');
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
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
  const btn = document.createElement('button');
  btn.id    = 'pb-dm-btn';
  btn.title = '珍珠湾';
  btn.innerHTML = SVG.chat;

  // 恢复上次位置
  const savedPos = ls(STORAGE.pos);
  if (savedPos && savedPos.bottom !== undefined) {
    btn.style.bottom = savedPos.bottom + 'px';
    btn.style.right  = savedPos.right  + 'px';
  }

  // 拖拽
  let dragging = false, startX, startY, startR, startB;

  function onStart(e) {
    dragging = false;
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
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
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
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
    document.removeEventListener('touchmove', onMove);
    if (dragging) {
      ls(STORAGE.pos, { right: parseFloat(btn.style.right), bottom: parseFloat(btn.style.bottom) });
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

// ── 尝试在 SillyTavern 扩展栏注册入口 ───────────────────
function tryRegisterSTExtension() {
  // ST 扩展菜单通常有这些选择器
  const selectors = [
    '#extensionsMenu',
    '#extensionsMenuList',
    '#extension_settings',
    '.extensions_block',
  ];

  for (const sel of selectors) {
    const menu = document.querySelector(sel);
    if (menu) {
      const item = document.createElement('div');
      item.id        = 'pb-st-entry';
      item.className = 'extension_block';
      item.style.cssText = 'cursor:pointer;padding:8px 12px;display:flex;align-items:center;gap:8px;font-size:14px;';
      item.innerHTML = `${SVG.chat.replace('stroke="white"','stroke="currentColor"')} <span>珍珠湾 DM</span>`;
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
    // 延迟100ms等ST渲染完再尝试注册
    setTimeout(tryRegisterSTExtension, 100);
    setTimeout(tryRegisterSTExtension, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go);
  } else {
    go();
  }
})();
