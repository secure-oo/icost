
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Little Pearl - ST Extension Edition</title>
    <link href="https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #FDFBF9;
            --accent: #7a3a4e;
            --accent-light: #b87882;
            --text: #281e20;
            --text-secondary: #7a6568;
            --card-bg: #ffffff;
            --me-bubble: #e8c4b8;
            --dad-bubble: #ffffff;
            --border: rgba(40,30,32,0.08);
            --radius: 20px;
        }

        /* 核心调整：允许插件容器滚动，不要锁死高度 */
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        body { 
            background: transparent; /* 背景透明，适配插件窗口 */
            font-family: 'Noto Serif SC', serif; 
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
        }

        /* 模拟手机容器改为自适应容器 */
        #phone {
            width: 100%;
            max-width: 500px; /* 稍微放宽，适配不同尺寸的弹窗 */
            margin: 0 auto;
            background: var(--bg);
            position: relative;
            flex: 1;
            display: flex;
            flex-direction: column;
            box-shadow: 0 5px 25px rgba(0,0,0,0.1);
            /* 给顶部的拖拽条留出 30px 的空隙，防止点不到关闭/移动 */
            margin-top: 30px; 
            border-radius: 15px 15px 0 0;
        }

        /* 状态栏：在插件里主要起装饰作用 */
        .status-bar {
            height: 30px;
            padding: 0 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            opacity: 0.6;
        }

        .screen {
            position: absolute;
            inset: 0;
            background: var(--bg);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
            z-index: 10;
        }
        
        .screen.hide { transform: translateX(100%); pointer-events: none; }

        /* --- 首页特定样式 --- */
        #s-home { 
            background: linear-gradient(172deg, #1c0f13 0%, #130a0d 100%); 
            color: white; 
            z-index: 5; /* 首页层级最低 */
        }
        .home-clock { text-align: center; margin: 40px 0; }
        .clock-t { font-family: 'ZCOOL XiaoWei', serif; font-size: 60px; }
        
        .app-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            padding: 20px;
            margin-top: auto;
            margin-bottom: 60px;
        }
        .app-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
        .app-icon {
            width: 55px; height: 55px;
            border-radius: 15px;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px;
            box-shadow: 0 8px 15px rgba(0,0,0,0.3);
        }

        /* --- 导航栏：增加关闭交互 --- */
        .nav-bar {
            height: 50px;
            display: flex;
            align-items: center;
            padding: 0 15px;
            border-bottom: 1px solid var(--border);
            background: var(--bg);
        }
        .nav-back { font-size: 24px; cursor: pointer; color: var(--accent); width: 30px; }
        
        .chat-area { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
        .msg { max-width: 85%; padding: 10px 14px; border-radius: 18px; font-size: 14px; line-height: 1.5; }
        .msg.dad { align-self: flex-start; background: var(--dad-bubble); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .msg.me { align-self: flex-end; background: var(--me-bubble); }

        .input-bar {
            padding: 10px 15px 20px;
            display: flex; gap: 8px;
            background: var(--bg);
            border-top: 1px solid var(--border);
        }
        .input-bar input {
            flex: 1; border: 1px solid var(--border);
            padding: 10px 15px; border-radius: 20px; outline: none;
        }
        .btn-send { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: white; border: none; cursor: pointer; }

        #loading {
            position: absolute; inset: 0; background: rgba(255,255,255,0.8);
            display: none; align-items: center; justify-content: center; z-index: 1000;
        }

        /* 适配 SillyTavern 的关闭提示 */
        .close-hint {
            text-align: center; font-size: 10px; color: #999; padding: 10px; cursor: pointer;
        }
    </style>
</head>
<body>

<div id="phone">
    <div id="loading">思考中...</div>

    <div class="screen" id="s-setup">
        <div style="padding: 30px;">
            <h2 style="font-family:'ZCOOL XiaoWei'; text-align:center; margin-bottom:20px;">系统配置</h2>
            <div style="display:flex; flex-direction:column; gap:15px;">
                <input id="cfg-url" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:8px;" type="text" placeholder="API 地址">
                <input id="cfg-key" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:8px;" type="password" placeholder="API Key">
                <button onclick="saveConfig()" style="background:var(--accent); color:white; padding:15px; border:none; border-radius:8px; cursor:pointer;">保存并进入</button>
                <div class="close-hint" onclick="window.parent.postMessage('close_external_extension', '*')">点此尝试关闭插件窗口</div>
            </div>
        </div>
    </div>

    <div class="screen hide" id="s-home">
        <div class="status-bar">
            <span id="st-time">12:00</span>
            <span>SIM 🔋</span>
        </div>
        <div class="home-clock">
            <div class="clock-t" id="clock-t">12:00</div>
            <div style="font-size:12px; opacity:0.6;">Welcome back, Pearl.</div>
        </div>
        <div class="app-grid">
            <div class="app-item" onclick="showScreen('chat')">
                <div class="app-icon" style="background: linear-gradient(135deg, #7a3a4e, #c07888);">💬</div>
                <span>聊天</span>
            </div>
            <div class="app-item" onclick="showScreen('ledger')">
                <div class="app-icon" style="background: linear-gradient(135deg, #5a3a1a, #a87038);">📊</div>
                <span>记账</span>
            </div>
            <div class="app-item" onclick="showScreen('letters')">
                <div class="app-icon" style="background: linear-gradient(135deg, #3a2850, #7a50a0);">💌</div>
                <span>情书</span>
            </div>
        </div>
        <div style="text-align:center; padding-bottom:30px; opacity:0.4; font-size:11px;" onclick="showScreen('setup')">⚙ 偏好设置</div>
    </div>

    </div>

<script>
    let state = {
        config: JSON.parse(localStorage.getItem('prl_cfg') || '{"url":"","key":"","model":"gpt-4o"}'),
        chats: JSON.parse(localStorage.getItem('prl_chats') || '[]'),
        expenses: JSON.parse(localStorage.getItem('prl_exps') || '[]'),
        letters: JSON.parse(localStorage.getItem('prl_ltrs') || '[]')
    };

    function save() {
        localStorage.setItem('prl_cfg', JSON.stringify(state.config));
        localStorage.setItem('prl_chats', JSON.stringify(state.chats.slice(-30)));
        localStorage.setItem('prl_exps', JSON.stringify(state.expenses));
        localStorage.setItem('prl_ltrs', JSON.stringify(state.letters));
    }

    // 路由切换
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hide'));
        const target = document.getElementById('s-' + id);
        if(target) target.classList.remove('hide');
    }

    function saveConfig() {
        state.config.url = document.getElementById('cfg-url').value.trim();
        state.config.key = document.getElementById('cfg-key').value.trim();
        if(!state.config.key) return alert('请填写 Key');
        save();
        showScreen('home');
    }

    // 初始化：如果有 Key 就直接进首页，没有就留设置页
    if(state.config.key) showScreen('home');

    // 自动更新时间
    setInterval(() => {
        const now = new Date();
        const t = now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
        document.getElementById('st-time').innerText = t;
        if(document.getElementById('clock-t')) document.getElementById('clock-t').innerText = t;
    }, 1000);
</script>

</body>
</html>

