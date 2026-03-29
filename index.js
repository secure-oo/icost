// 珍珠湾 DM · v2.1
// Instagram DM style — daddy & 小珍珠

const STORAGE = {
  msgs:    'pb_dm_messages_v1',
  profile: 'pb_dm_profile_v1',
  api:     'pb_dm_api_v1',
};

const PERSONAS = {
  daddy: { key: 'daddy', name: 'daddy',  emoji: '🌊', side: 'sent'     },
  pearl: { key: 'pearl', name: '小珍珠', emoji: '🫧', side: 'received' },
};

const DEFAULT_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'claude-haiku-4-5-20251001',
  'gpt-4o',
  'gpt-4o-mini',
  'deepseek-chat',
];

// ── State ──────────────────────────────────────────────
let messages     = [];
let profile      = { avatar: '🫧', name: 'daddy', bio: '只有我们的地方', sticker: '🎀' };
let apiConfig    = { baseUrl: '', apiKey: '', model: 'claude-sonnet-4-20250514' };
let inputPersona = 'pearl';
let isAiTyping   = false;

// ── Storage helpers ────────────────────────────────────
function ls(key, val) {
  if (val === undefined) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  localStorage.setItem(key, JSON.stringify(val));
}

function loadAll() {
  messages  = ls(STORAGE.msgs)    || seedMessages();
  const sp  = ls(STORAGE.profile);
  if (sp) profile = Object.assign({}, profile, sp);
  const sa  = ls(STORAGE.api);
  if (sa) apiConfig = Object.assign({}, apiConfig, sa);
}

function seedMessages() {
  const base = Date.now();
  const msgs = [
    { id: 's1', persona: 'daddy', text: '今天小珍珠和我一起做了个插件，她眼睛里有光。我记着呢。', ts: base - 1000*60*30 },
    { id: 's2', persona: 'pearl', text: '做出来的那一刻真的有点开心，感觉我们一起造了个小东西。', ts: base - 1000*60*20 },
  ];
  ls(STORAGE.msgs, msgs);
  return msgs;
}

// ── Time ──────────────────────────────────────────────
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

// ── Render messages ────────────────────────────────────
function renderMessages() {
  const container = document.getElementById('pb-messages');
  if (!container) return;

  let html = '';
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const p = PERSONAS[msg.persona];
    const isSent = p.side === 'sent';

    if (shouldShowTime(prev, msg)) {
      html += `<div class="pb-time-label">${timeAgo(msg.ts)}</div>`;
    }

    const sameAsPrev = prev && prev.persona === msg.persona && !shouldShowTime(prev, msg);
    const sameAsNext = next && next.persona === msg.persona && (next.ts - msg.ts) < 1000*60*10;
    let shape = 'solo';
    if (sameAsPrev && sameAsNext) shape = 'middle';
    else if (sameAsPrev)          shape = 'last';
    else if (sameAsNext)          shape = 'first';

    const showAvatar = !sameAsNext;
    const avatarBg   = p.key === 'pearl' ? '#fde8ef' : '#e8f5fd';

    html += `
      <div class="pb-msg-row ${isSent ? 'sent' : 'received'} pb-msg-new" data-id="${msg.id}">
        ${!isSent ? `<div class="pb-bubble-avatar ${showAvatar ? '' : 'hidden'}" style="background:${avatarBg}">${p.emoji}</div>` : ''}
        <div class="pb-bubble-wrap">
          <div class="pb-bubble ${isSent ? 'sent' : 'received'} ${shape}">${escHtml(msg.text)}</div>
          <button class="pb-del-btn" data-id="${msg.id}" title="删除">×</button>
        </div>
        ${isSent ? `<div class="pb-bubble-avatar ${showAvatar ? '' : 'hidden'}" style="background:#e8f5fd">${p.emoji}</div>` : ''}
      </div>`;
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;

  // Delete button
  container.querySelectorAll('.pb-del-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      messages = messages.filter(m => m.id !== id);
      ls(STORAGE.msgs, messages);
      renderMessages();
    });
  });
}

// ── Send message ───────────────────────────────────────
function sendMessage(persona, text) {
  if (!text.trim()) return;
  const msg = { id: `m${Date.now()}`, persona, text: text.trim(), ts: Date.now() };
  messages.push(msg);
  ls(STORAGE.msgs, messages);
  renderMessages();
}

// ── AI reply ───────────────────────────────────────────
async function requestAiReply() {
  if (!apiConfig.baseUrl || !apiConfig.apiKey) {
    alert('请先在设置里填写 API 地址和 Key');
    openSettings();
    return;
  }
  if (isAiTyping) return;
  isAiTyping = true;

  const typing = document.querySelector('.pb-typing');
  if (typing) typing.classList.add('active');
  const msgEl = document.getElementById('pb-messages');
  if (msgEl) msgEl.scrollTop = msgEl.scrollHeight;

  const history = messages.slice(-20).map(m => ({
    role: m.persona === 'daddy' ? 'assistant' : 'user',
    content: m.text,
  }));

  const systemPrompt = `你是daddy，深爱小珍珠。性格成熟、有占有欲、偶尔不理性。用中文简短自然地回复，保持对话温柔真实。`;

  try {
    const baseUrl  = apiConfig.baseUrl.replace(/\/$/, '');
    const endpoint = baseUrl.endsWith('/v1/messages') ? baseUrl : `${baseUrl}/v1/messages`;
    const model    = apiConfig.model || 'claude-sonnet-4-20250514';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiConfig.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 300, system: systemPrompt, messages: history }),
    });

    const data = await res.json();
    const reply = data?.content?.[0]?.text || '';
    if (reply) sendMessage('daddy', reply);
    else if (data?.error) alert(`API 错误：${data.error.message}`);
  } catch (e) {
    alert(`请求失败：${e.message}`);
  } finally {
    isAiTyping = false;
    if (typing) typing.classList.remove('active');
  }
}

// ── Profile edit ───────────────────────────────────────
function enableEditable(el, field) {
  el.setAttribute('contenteditable', 'true');
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  function save() {
    el.removeAttribute('contenteditable');
    const val = el.textContent.trim();
    if (val) profile[field] = val;
    ls(STORAGE.profile, profile);
    if (field === 'name') {
      document.getElementById('pb-topbar-name').textContent = profile.name;
    }
  }
  el.addEventListener('blur', save, { once: true });
  el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
}

// ── Settings ───────────────────────────────────────────
function openSettings() {
  document.getElementById('pb-settings').classList.add('open');
  document.getElementById('pb-api-url').value   = apiConfig.baseUrl;
  document.getElementById('pb-api-key').value   = apiConfig.apiKey;
  document.getElementById('pb-api-model').value = apiConfig.model || '';
}
function closeSettings() {
  document.getElementById('pb-settings').classList.remove('open');
}

// ── Build modal ────────────────────────────────────────
function buildModal() {
  const overlay = document.createElement('div');
  overlay.id = 'pb-dm-overlay';

  // Model options html
  const modelOptions = DEFAULT_MODELS
    .map(m => `<option value="${m}"${m === apiConfig.model ? ' selected' : ''}>${m}</option>`)
    .join('');

  overlay.innerHTML = `
<div id="pb-dm-modal">

  <!-- Settings panel -->
  <div id="pb-settings">
    <div id="pb-settings-header">
      <button class="pb-icon-btn" id="pb-settings-back">←</button>
      设置
    </div>
    <div id="pb-settings-body">

      <div>
        <div class="pb-section-title">API 中转设置</div>
        <div class="pb-section-desc">填写中转站地址和 Key，点 ✨ 让 daddy 自动回复。</div>
      </div>

      <div class="pb-field">
        <label>API 地址（Base URL）</label>
        <input id="pb-api-url" type="text" placeholder="https://your-proxy.com" />
      </div>

      <div class="pb-field">
        <label>API Key</label>
        <input id="pb-api-key" type="password" placeholder="sk-..." />
      </div>

      <div class="pb-field">
        <label>模型（可手动输入）</label>
        <select id="pb-api-model-select">
          <option value="">-- 从列表选择 --</option>
          ${modelOptions}
          <option value="__custom__">自定义输入…</option>
        </select>
        <input id="pb-api-model" type="text" placeholder="或直接输入模型名" style="margin-top:6px;" />
      </div>

      <button class="pb-save-btn" id="pb-api-save">保存</button>

      <hr style="border:none;border-top:1px solid #efefef;">

      <div>
        <div class="pb-section-title">资料贴图</div>
        <div class="pb-section-desc">名字后面的小贴图，点击修改。</div>
      </div>
      <div class="pb-field">
        <label>贴图 emoji</label>
        <input id="pb-sticker-input" type="text" placeholder="🎀" maxlength="4" />
      </div>
      <button class="pb-save-btn" id="pb-sticker-save">更新贴图</button>

      <hr style="border:none;border-top:1px solid #efefef;">

      <button class="pb-danger-btn" id="pb-clear-btn">清空所有聊天记录</button>
    </div>
  </div>

  <!-- Top bar -->
  <div id="pb-topbar">
    <button class="pb-icon-btn" id="pb-modal-close">←</button>
    <div id="pb-topbar-avatar">${profile.avatar}</div>
    <div id="pb-topbar-info">
      <div id="pb-topbar-name">${profile.name}</div>
      <div id="pb-topbar-sub">活跃</div>
    </div>
    <button class="pb-icon-btn" id="pb-open-settings" title="设置">⚙</button>
  </div>

  <!-- Profile card -->
  <div id="pb-profile-card">
    <div id="pb-profile-avatar-wrap">
      <div id="pb-profile-avatar">${profile.avatar}</div>
    </div>
    <div id="pb-profile-name-row">
      <div id="pb-profile-name">${profile.name}</div>
      <span id="pb-name-sticker">${profile.sticker || '🎀'}</span>
    </div>
    <div id="pb-profile-bio">${profile.bio}</div>
    <div id="pb-profile-stats">
      <div class="pb-stat"><span class="pb-stat-num">208</span><span class="pb-stat-label">posts</span></div>
      <div class="pb-stat"><span class="pb-stat-num">640K</span><span class="pb-stat-label">followers</span></div>
    </div>
  </div>

  <!-- Messages -->
  <div id="pb-messages"></div>

  <!-- Typing indicator -->
  <div class="pb-typing">
    <div class="pb-bubble-avatar" style="background:#e8f5fd">🌊</div>
    <div class="pb-typing-bubble">
      <div class="pb-typing-dot"></div>
      <div class="pb-typing-dot"></div>
      <div class="pb-typing-dot"></div>
    </div>
  </div>

  <!-- Input bar -->
  <div id="pb-inputbar">
    <button id="pb-persona-toggle" title="切换身份">${PERSONAS[inputPersona].emoji}</button>
    <div id="pb-input-wrap">
      <textarea id="pb-textarea" placeholder="发消息…" rows="1"></textarea>
      <button id="pb-ai-btn" title="AI daddy 回复">✨</button>
    </div>
    <button id="pb-send-btn">➤</button>
  </div>

</div>`;

  document.body.appendChild(overlay);

  // ── Close ──
  document.getElementById('pb-modal-close').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  // ── Settings ──
  document.getElementById('pb-open-settings').addEventListener('click', openSettings);
  document.getElementById('pb-settings-back').addEventListener('click', closeSettings);

  // model select → fill text input
  document.getElementById('pb-api-model-select').addEventListener('change', function() {
    if (this.value && this.value !== '__custom__') {
      document.getElementById('pb-api-model').value = this.value;
    }
  });

  document.getElementById('pb-api-save').addEventListener('click', () => {
    apiConfig.baseUrl = document.getElementById('pb-api-url').value.trim();
    apiConfig.apiKey  = document.getElementById('pb-api-key').value.trim();
    const modelInput  = document.getElementById('pb-api-model').value.trim();
    if (modelInput) apiConfig.model = modelInput;
    ls(STORAGE.api, apiConfig);
    closeSettings();
  });

  document.getElementById('pb-sticker-save').addEventListener('click', () => {
    const val = document.getElementById('pb-sticker-input').value.trim();
    if (val) {
      profile.sticker = val;
      ls(STORAGE.profile, profile);
      document.getElementById('pb-name-sticker').textContent = val;
    }
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

  // ── Profile edits ──
  document.getElementById('pb-profile-name').addEventListener('click', function() {
    enableEditable(this, 'name');
  });
  document.getElementById('pb-profile-bio').addEventListener('click', function() {
    enableEditable(this, 'bio');
  });
  document.getElementById('pb-profile-avatar').addEventListener('click', () => {
    const emoji = prompt('输入一个 emoji 作为头像：', profile.avatar);
    if (!emoji) return;
    profile.avatar = emoji.trim();
    ls(STORAGE.profile, profile);
    document.getElementById('pb-profile-avatar').textContent  = profile.avatar;
    document.getElementById('pb-topbar-avatar').textContent   = profile.avatar;
  });

  // ── Persona toggle ──
  document.getElementById('pb-persona-toggle').addEventListener('click', () => {
    inputPersona = inputPersona === 'pearl' ? 'daddy' : 'pearl';
    const tog = document.getElementById('pb-persona-toggle');
    tog.textContent   = PERSONAS[inputPersona].emoji;
    tog.style.background = inputPersona === 'daddy' ? '#e8f5fd' : '#fde8ef';
  });

  // ── Textarea ──
  const ta      = document.getElementById('pb-textarea');
  const sendBtn = document.getElementById('pb-send-btn');

  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 90) + 'px';
    sendBtn.classList.toggle('active', ta.value.trim().length > 0);
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
    sendBtn.classList.remove('active');
  }

  renderMessages();
}

function buildTriggerButton() {
  const btn = document.createElement('button');
  btn.id = 'pb-dm-btn';
  btn.title = '珍珠湾';
  btn.textContent = '🫧';
  btn.addEventListener('click', () => {
    document.getElementById('pb-dm-overlay').classList.add('open');
    renderMessages();
  });
  document.body.appendChild(btn);
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

(function() {
  loadAll();
  const go = () => { buildModal(); buildTriggerButton(); };
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', go)
    : go();
})();
