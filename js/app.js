/* App shell: state, routing, events, toasts, modals. */
const App = (() => {
  let state = Storage.load();
  let currentTab = 'home';

  function save() { Storage.save(state); Sync.onSave(); }

  function refresh(tab) {
    if (tab) currentTab = tab;
    render();
  }

  function render() {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === currentTab));
    const view = document.getElementById('view');
    if (currentTab === 'home') {
      view.innerHTML = Views.home(state);
      Mascot.home(state.sessions, state.missions.filter(m => !m.completedAt).length);
    }
    if (currentTab === 'coach') view.innerHTML = CoachView.render(state);
    if (currentTab === 'matches') view.innerHTML = MatchesView.render(state);
    if (currentTab === 'history') view.innerHTML = Views.history(state);
    if (currentTab === 'rewards') view.innerHTML = Views.rewards(state);
    if (currentTab === 'log') { Wizard.start(state, save, refresh); return; }

    updateHeader();
    wireViewEvents();
    view.querySelectorAll('.session-card').forEach(c => c.onclick = () => {
      const s = state.sessions.find(x => x.id === c.dataset.sid);
      if (s) {
        showModal(`${Game.SESSION_TYPES[s.type].label} · ${Wizard.formatDate(s.date)}`,
          Views.sessionDetail(s) + mediaSectionHTML(s.id));
        renderMedia(s.id);
      }
    });
  }

  function mediaSectionHTML(sessionId) {
    return `
      <div class="media-section">
        <h3>🎬 Videos & Photos from this session</h3>
        <div id="mediaList"></div>
        <button class="btn secondary" id="btnAddMedia">➕ Attach coach video / photo</button>
        <input type="file" id="mediaFile" accept="video/*,image/*" hidden>
        <p class="muted small">Media is stored on this device only (not cloud-synced).</p>
      </div>`;
  }

  async function renderMedia(sessionId) {
    const list = document.getElementById('mediaList');
    if (!list) return;
    try {
      const items = await Media.list(sessionId);
      list.innerHTML = items.length ? items.map(m => `
        <div class="media-item">
          ${m.type.startsWith('video')
            ? `<video controls preload="metadata" src="${Media.urlOf(m)}"></video>`
            : `<img src="${Media.urlOf(m)}" alt="${Wizard.escapeHTML(m.name)}" class="media-img">`}
          <div class="media-meta">
            <span>${Wizard.escapeHTML(m.name)} · ${(m.size / 1048576).toFixed(1)}MB</span>
            <button class="media-del" data-mid="${m.id}">🗑️</button>
          </div>
        </div>`).join('')
        : '<p class="muted small">No media attached yet.</p>';
      list.querySelectorAll('.media-del').forEach(b => b.onclick = async () => {
        if (!confirm('Delete this media?')) return;
        await Media.remove(b.dataset.mid);
        renderMedia(sessionId);
      });
      const btn = document.getElementById('btnAddMedia');
      const file = document.getElementById('mediaFile');
      if (btn) btn.onclick = () => file.click();
      if (file) file.onchange = async () => {
        const f = file.files[0];
        if (!f) return;
        try {
          await Media.add(sessionId, f);
          toast('Attached! 🎬');
          renderMedia(sessionId);
        } catch (err) { toast('Could not attach: ' + err.message); }
        file.value = '';
      };
    } catch (e) {
      list.innerHTML = '<p class="muted small">Media unavailable.</p>';
    }
  }

  function updateHeader() {
    const { level } = Game.levelFor(Game.totalXP(state));
    document.getElementById('xpBadge').innerHTML =
      `${level.icon} <b>${Game.totalXP(state)}</b> XP`;
    const line = document.getElementById('playerLine');
    const m = Mentor.current();
    line.innerHTML = (state.player.name ? `${state.player.name} · ${level.name}` : `Welcome, Champion! · ${level.name}`)
      + (m.emoji ? `<br>guided by ${m.name} ${m.emoji}` : '');
  }

  function wireViewEvents() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };

    on('btnFav', () => {
      const fav = prompt("Who's your favourite cricketer? (your mentor!)", state.player.favCricketer || '');
      state.player.favCricketer = (fav || '').trim();
      save(); render();
      const m = Mentor.current();
      if (m.emoji) toast(`Your mentor is now ${m.name} ${m.emoji} (${m.title})!`);
    });

    on('btnAddCoach', () => {
      const name = prompt("Coach's name?");
      if (!name || !name.trim()) return;
      state.settings.coaches = state.settings.coaches || [];
      if (!state.settings.coaches.includes(name.trim())) state.settings.coaches.push(name.trim());
      save(); render();
    });
    document.querySelectorAll('.coach-del').forEach(b => b.onclick = () => {
      const n = b.dataset.cname;
      if (!confirm(`Remove ${n} from the roster? Their past notes stay in history.`)) return;
      state.settings.coaches = state.settings.coaches.filter(c => c !== n);
      save(); render();
    });

    on('btnQuickLog', () => refresh('log'));
    on('btnPlanMatch', () => refresh('log'));

    document.querySelectorAll('.postmatch-btn').forEach(b => b.onclick = () => {
      const s = state.sessions.find(x => x.id === b.dataset.sid);
      if (s) Wizard.startPost(state, save, refresh, s);
    });
    document.querySelectorAll('.del-planned').forEach(b => b.onclick = () => {
      if (!confirm('Cancel this match plan?')) return;
      state.sessions = state.sessions.filter(x => x.id !== b.dataset.sid);
      save(); render();
    });

    document.querySelectorAll('.practise-btn').forEach(b => b.onclick = () => {
      const res = Game.practiseMission(state, b.dataset.mid);
      if (!res) return;
      save();
      if (res.completed) {
        let msg = `Mission complete! +${res.xp} XP and +${res.rp} 🎁 reward points 🎯🎉`;
        if (res.leveledUp) msg += ` LEVEL UP! ${res.level.icon} ${res.level.name}! 🎊`;
        App.toast(msg, 5000);
        Mascot.say(Mascot.LINES.mission(res.rp), 6000);
        const newBadges = Game.checkBadges(state);
        save();
        if (newBadges.length) setTimeout(() => showBadgesModal(newBadges), 600);
      } else {
        App.toast(`Nice! Practise ${res.mission.targetCount - res.mission.progress} more time${res.mission.targetCount - res.mission.progress > 1 ? 's' : ''} to complete 💪`);
      }
      render();
    });

    // Reward shop (Rewards tab)
    document.querySelectorAll('.redeem-btn').forEach(b => b.onclick = () => {
      const r = state.rewards.find(x => x.id === b.dataset.rid);
      if (!r || state.rewardPoints < r.cost) return;
      if (!confirm(`Redeem "${r.name}" for ${r.cost} reward points?\nShow this to your parent! 👋`)) return;
      if (Game.redeem(state, r)) {
        save();
        toast(`Redeemed: ${r.name}! 🎁 Enjoy!`);
        Mascot.say(Mascot.LINES.redeemed, 7000);
        render();
      }
    });
    document.querySelectorAll('.shop-del').forEach(b => b.onclick = () => {
      const i = state.rewards.findIndex(x => x.id === b.dataset.rid);
      if (i < 0) return;
      if (!confirm(`Remove "${state.rewards[i].name}" from the shop?`)) return;
      state.rewards.splice(i, 1);
      save(); render();
    });
    on('btnAddReward', () => {
      const name = prompt("Reward name (e.g. 'Cinema trip 🎬')?");
      if (!name || !name.trim()) return;
      const cost = parseInt(prompt('Cost in reward points?', '100'), 10);
      if (!cost || cost <= 0) return;
      state.rewards.push({ id: 'r' + Date.now(), name: name.trim(), cost });
      save(); render();
    });

    on('btnExport', () => Storage.exportJSON(state));
    on('btnImport', () => document.getElementById('importFile').click());
    const file = document.getElementById('importFile');
    if (file) file.onchange = async () => {
      if (!file.files[0]) return;
      if (!confirm('Importing will replace current data on this device. Continue?')) { file.value = ''; return; }
      try {
        const data = await Storage.importJSON(file.files[0]);
        state = data;
        save(); toast('Backup restored! 📥'); refresh('home');
      } catch (err) { toast('That file could not be read 😕'); }
      file.value = '';
    };
    on('btnName', () => {
      const name = prompt("What's the champion's name?");
      if (name && name.trim()) { state.player.name = name.trim(); save(); render(); }
    });

    on('btnSyncSetup', () => {
      const url = prompt('Paste your Supabase project URL\n(e.g. https://abcd.supabase.co)');
      if (!url || !url.trim()) return;
      const key = prompt('Paste the Supabase anon key\n(Settings → API → anon public)');
      if (!key || !key.trim()) return;
      const code = prompt('Choose a secret chronicle code\n(letters/numbers only — use the SAME code on every phone to share this chronicle)', randomCode());
      if (!code || !code.trim()) return;
      state.settings.supabaseUrl = url.trim();
      state.settings.supabaseAnonKey = key.trim();
      state.settings.syncCode = code.trim().toLowerCase();
      save();
      Sync.fullSync(false).then(res => {
        if (res.ok) { toast('☁️ Cloud sync on! Data backed up.'); render(); }
      });
    });

    on('btnRestoreLink', () => {
      const cfg = state.settings;
      const payload = btoa([cfg.supabaseUrl, cfg.supabaseAnonKey, cfg.syncCode].join('|'));
      const base = location.origin === 'null' || location.protocol === 'file:'
        ? (prompt('What is the app web address (URL) you open the app from?') || '').trim()
        : location.origin + location.pathname;
      if (!base) return;
      const link = base + (base.includes('?') ? '&' : '?') + 'sync=' + payload;
      showModal('🔗 Parent Restore Link', `
        <p class="muted small">Save this link somewhere safe (parent's phone notes or password manager). On any new phone, just open it — the app sets itself up and restores all history. Keep it private: anyone with this link can access the chronicle.</p>
        <textarea id="restoreLinkBox" rows="4" readonly>${link}</textarea>
        <div class="settings-row"><button class="btn primary" id="btnCopyLink">📋 Copy link</button></div>`);
      document.getElementById('btnCopyLink').onclick = async () => {
        try {
          await navigator.clipboard.writeText(link);
          toast('Link copied! Save it somewhere safe 🔐');
        } catch (e) {
          document.getElementById('restoreLinkBox').select();
          document.execCommand('copy');
          toast('Link copied! Save it somewhere safe 🔐');
        }
      };
    });

    on('btnSyncNow', async () => {
      toast('Syncing… ⏳');
      const res = await Sync.fullSync(false);
      if (res.ok) { toast(res.changed ? 'Synced & merged new data! 🔄' : 'Everything is up to date ✅'); render(); }
    });

    on('btnSyncOff', () => {
      if (!confirm('Turn off cloud sync? Data stays on this device only.')) return;
      state.settings.supabaseUrl = '';
      state.settings.supabaseAnonKey = '';
      state.settings.syncCode = '';
      save(); render();
    });
  }

  function randomCode() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function toast(msg, ms = 3000) {
    const root = document.getElementById('toastRoot');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, ms);
  }

  function showModal(title, html) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-backdrop" id="modalBackdrop">
        <div class="modal">
          <div class="modal-head"><h3>${title}</h3><button class="modal-close" id="modalClose">✕</button></div>
          <div class="modal-body">${html}</div>
        </div>
      </div>`;
    const close = () => root.innerHTML = '';
    document.getElementById('modalClose').onclick = close;
    document.getElementById('modalBackdrop').onclick = e => { if (e.target.id === 'modalBackdrop') close(); };
  }

  function showBadgesModal(badges) {
    showModal('🎊 New Badge Earned!', `
      <div class="badge-modal">
        ${badges.map(b => `
          <div class="badge-pop">
            <div class="badge-icon big">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
          </div>`).join('')}
      </div>`);
  }

  function init() {
    document.querySelectorAll('.tab').forEach(t => t.onclick = () => refresh(t.dataset.tab));

    // Restore via parent magic link: ?sync=<base64(url|anonKey|code)>
    const syncParam = new URLSearchParams(location.search).get('sync');
    let restored = false;
    if (syncParam) {
      try {
        const [url, key, code] = atob(syncParam).split('|');
        if (url && key && code) {
          state.settings.supabaseUrl = url;
          state.settings.supabaseAnonKey = key;
          state.settings.syncCode = code;
          Storage.save(state);
          restored = true;
          history.replaceState(null, '', location.pathname); // keep link out of the address bar
        }
      } catch (e) { /* bad link — ignore */ }
    }

    render();

    // First-launch onboarding with Cheeku
    if (Onboarding.needed(state)) {
      Onboarding.start(state, save, () => {
        render();
        const m = Mentor.current();
        if (m.emoji) Mascot.say(`${state.player.name || 'Champ'}, I'll be your mentor on this journey to greatness! Let's log your first session! ${m.emoji}`, 8000);
        else Mascot.say(`Welcome aboard, ${state.player.name || 'champ'}! Let's log your first session! 🏏`, 7000);
      });
    }

    // Gentle practice reminder: notification next evening if no session today (when permitted).
    Sync.init();
    if (restored) {
      Sync.fullSync(false).then(res => {
        if (res.ok) { render(); toast('☁️ Chronicle restored — welcome back! 🏏', 4500); }
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    if ('Notification' in window && Notification.permission === 'default' && state.sessions.length >= 2) {
      // Ask once the habit has started forming.
      setTimeout(() => Notification.requestPermission(), 15000);
    }
    scheduleReminder();
  }

  function scheduleReminder() {
    // Check once an hour while app is open; notify at ~5pm if nothing logged today.
    setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const hour = new Date().getHours();
      const today = new Date().toISOString().slice(0, 10);
      const loggedToday = state.sessions.some(s => s.date === today);
      const key = 'ccNotified_' + today;
      if (hour >= 17 && !loggedToday && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        const open = state.missions.filter(m => !m.completedAt);
        const focus = open.length ? ` Focus mission waiting: "${open[0].weaknessText}" 🔥` : '';
        new Notification('🏏 Cric Chronicles', { body: 'Time to log today\'s session!' + focus });
      }
    }, 3600000);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { toast, showModal, showBadgesModal, refresh, get state() { return state; } };
})();
