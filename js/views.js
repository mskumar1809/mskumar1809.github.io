/* Screen views: Home dashboard, History, Rewards, Settings. */
const Views = (() => {
  const e = Wizard.escapeHTML;

  function home(state) {
    const cfg = state.settings;
    const xp = Game.totalXP(state);
    const { level, next, pct } = Game.levelFor(xp);
    const streak = Game.currentStreakDays(state.sessions);
    const open = state.missions.filter(m => !m.completedAt);
    const doneMissions = state.missions.length - open.length;
    const last = state.sessions[state.sessions.length - 1];
    const today = new Date().toISOString().slice(0, 10);
    const loggedToday = state.sessions.some(s => s.date === today);

    // Action-oriented "what should I do next" panel
    const plays = [];
    if (!loggedToday) plays.push({ cta: true });
    for (const m of open.slice(0, 3)) plays.push({ mission: m });
    const playsHTML = `
      <div class="card plays-card">
        <h3>🚀 Your Next Plays</h3>
        ${loggedToday ? `<div class="play-done">✅ Session logged today — awesome! Now keep your plays going:</div>` : ''}
        ${plays.length === 0 ? `<p class="hint">No open plays right now. Log a session and note what to work on — a mission will appear here!</p>` : ''}
        ${plays.map(p => p.cta ? `
          <button class="cta-log" id="btnQuickLog">➕ Log today's session 🏏</button>` : `
          <div class="play-row">
            <div class="play-info">
              <div class="play-text">${p.mission.coach ? '👨‍🏫 ' : '🎯 '}${e(p.mission.weaknessText)}</div>
              <div class="mission-pips small-pips">${Array.from({length: p.mission.targetCount}, (_, i) =>
                `<span class="pip ${i < p.mission.progress ? 'full' : ''}"></span>`).join('')}</div>
            </div>
            <button class="btn primary practise-btn" data-mid="${p.mission.id}">✔ Practised!</button>
          </div>`).join('')}
      </div>
      <div class="card actions-bar">
        <div class="stat"><div class="stat-num">${state.missions.length}</div><div class="stat-label">Planned</div></div>
        <div class="stat"><div class="stat-num amber">${open.length}</div><div class="stat-label">Pending</div></div>
        <div class="stat"><div class="stat-num green">${doneMissions}</div><div class="stat-label">Completed</div></div>
        <div class="stat"><div class="stat-num">🔥 ${Game.currentStreakDays(state.sessions)}</div><div class="stat-label">Day streak</div></div>
      </div>`;

    const focusHTML = open.length > 3 ? `
      <div class="card focus-card">
        <h3>🎯 All Pending Missions (${open.length})</h3>
        ${open.slice(3).map(m => `
          <div class="mission-row">
            <div class="mission-pips">${Array.from({length: m.targetCount}, (_, i) =>
              `<span class="pip ${i < m.progress ? 'full' : ''}"></span>`).join('')}</div>
            <div class="mission-text">${m.coach ? '👨‍🏫 ' : ''}${e(m.weaknessText)}</div>
          </div>`).join('')}
      </div>` : '';

    const lastCoached = [...state.sessions].reverse().find(s => s.coach && (s.coach.drills || s.coach.feedback));
    const coachHTML = lastCoached ? `
      <div class="card coach-card">
        <h3>👨‍🏫 Coach's Plan${lastCoached.coach.name ? ' — ' + e(lastCoached.coach.name) : ''}</h3>
        <p class="muted small">From your ${Game.SESSION_TYPES[lastCoached.type].label.toLowerCase()} on ${Wizard.formatDate(lastCoached.date)} · follow this until the next session</p>
        ${lastCoached.coach.drills ? `<div class="coach-drills">🎯 ${e(lastCoached.coach.drills)}</div>` : ''}
        ${lastCoached.coach.feedback ? `<div class="coach-feedback">💬 ${e(lastCoached.coach.feedback)}${lastCoached.coach.rating ? `<span class="coach-stars"> ${'★'.repeat(lastCoached.coach.rating)}</span>` : ''}</div>` : ''}
      </div>` : '';

    const injuryLessons = state.sessions.filter(s => s.injury.happened && s.injury.lesson);
    const lessonsHTML = injuryLessons.length ? `
      <div class="card">
        <h3>🎓 Injury Prevention Lessons</h3>
        ${injuryLessons.slice(-3).reverse().map(s => `
          <div class="lesson-row">🛡️ <b>${e(s.injury.what)}</b> → ${e(s.injury.lesson)}
          <span class="muted">${Wizard.formatDate(s.date)}</span></div>`).join('')}
      </div>` : '';

    const remindHTML = !last ? '' : (() => {
      const days = daysSince(last.date);
      if (days <= 1) return '';
      const nudge = days >= 7 ? "It's been over a week — let's get back out there! 💪"
                 : days >= 3 ? `It's been ${days} days — keep your missions fresh! 🔥` : '';
      return nudge ? `<div class="card nudge">${nudge}</div>` : '';
    })();

    // Strengths & growth picture: skill averages + recent self/coach notes
    const avg = k => {
      const vals = state.sessions.map(s => s.scores?.[k]).filter(Boolean);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const skills = ['batting', 'bowling', 'fielding'].map(k => ({ k, v: avg(k) })).filter(x => x.v);
    const strongest = skills.length ? skills.slice().sort((a, b) => b.v - a.v)[0] : null;
    const focusSkill = skills.length > 1 ? skills.slice().sort((a, b) => a.v - b.v)[0] : null;
    const SKILL_LABEL = { batting: '🏏 Batting', bowling: '⚽ Bowling', fielding: '🧤 Fielding' };
    const recentStrengths = state.sessions.slice(-5).reverse().filter(s => s.strengths?.trim()).slice(0, 3);
    const recentWeak = state.sessions.slice(-5).reverse().filter(s => s.weaknesses?.trim()).slice(0, 3);
    const strengthsHTML = `
      <div class="card">
        <h3>💪 Strengths & Growth Areas</h3>
        ${!state.sessions.length ? '<p class="hint">Log a session or two and your strength picture will appear here!</p>' : `
        ${skills.length ? `
          <div class="skill-bars">
            ${skills.map(sk => `
              <div class="avg-row">
                <span class="avg-label">${SKILL_LABEL[sk.k]}${strongest && sk.k === strongest.k ? ' ⭐' : ''}${focusSkill && sk.k === focusSkill.k ? ' 🎯' : ''}</span>
                <div class="avg-bar"><div class="avg-fill" style="width:${(sk.v / 5) * 100}%"></div></div>
                <span class="avg-val">★${sk.v.toFixed(1)}</span>
              </div>`).join('')}
          </div>
          ${strongest ? `<div class="strength-line">⭐ Strongest right now: <b>${SKILL_LABEL[strongest.k]}</b>${focusSkill && focusSkill.k !== strongest.k ? ` · 🎯 Needs most work: <b>${SKILL_LABEL[focusSkill.k]}</b>` : ''}</div>` : ''}` : ''}
        ${recentStrengths.length ? `
          <div class="muted small" style="margin-top:10px">💪 Strengths he noted recently:</div>
          ${recentStrengths.map(s => `<div class="note-line good">👍 ${e(s.strengths)} <span class="muted small">${Wizard.formatDate(s.date)}</span></div>`).join('')}` : ''}
        ${recentWeak.length ? `
          <div class="muted small" style="margin-top:10px">🔧 Areas to work on (from recent sessions):</div>
          ${recentWeak.map(s => `<div class="note-line weak-note">🔧 ${e(s.weaknesses)} <span class="muted small">${Wizard.formatDate(s.date)}</span></div>`).join('')}` : ''}
        ${!recentStrengths.length && !recentWeak.length ? '<p class="hint">Fill in strengths & "work on" notes after sessions to build this picture.</p>' : ''}
        `}
      </div>`;

    return `
      ${playsHTML}
      ${state.sessions.length ? strengthsHTML : `
      <div class="card welcome"><h3>Welcome! 👋</h3>
        <p>Log your first session to start your cricket journey!</p></div>`}
      <div class="card hero">
        <div class="level-row">
          <span class="level-emoji">${level.icon}</span>
          <div class="level-info">
            <div class="level-name">${level.name}</div>
            <div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div>
            <div class="xp-text">${xp} XP${next ? ` · ${next.xp - xp} to ${next.name}` : ' · MAX LEVEL!'}</div>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat"><div class="stat-num">${state.sessions.length}</div><div class="stat-label">Sessions</div></div>
          <div class="stat"><div class="stat-num">🏅 ${state.badges.length}</div><div class="stat-label">Badges</div></div>
          <div class="stat"><div class="stat-num">${Game.totalXP(state)}</div><div class="stat-label">XP</div></div>
        </div>
      </div>
      ${remindHTML}
      ${coachHTML}
      ${focusHTML}
      <div class="card">
        <h3>📈 Performance Trend</h3>
        ${Charts.trend(state.sessions)}
      </div>
      ${last ? `
      <div class="card">
        <h3>🏏 Last Session</h3>
        <div class="last-session" id="lastSessionCard">
          ${Game.SESSION_TYPES[last.type].icon} <b>${Game.SESSION_TYPES[last.type].label}</b>
          · ${Wizard.formatDate(last.date)}<br>
          ${scoreLine(last)}
        </div>
      </div>` : ''}
      ${lessonsHTML}
      <div class="card settings-card">
        <h3>⚙️ Data & Settings</h3>
        <div class="settings-row">
          <button class="btn secondary" id="btnExport">📤 Export backup</button>
          <button class="btn secondary" id="btnImport">📥 Import backup</button>
        </div>
        <p class="muted small">Your chronicle lives safely on this device. Export a backup regularly — import restores everything, as far back as your data goes.</p>
        <input type="file" id="importFile" accept=".json" hidden>
        <div class="player-profile">
          <div class="pp-avatar">${mentorAvatarOrFallback(state)}</div>
          <div class="pp-info">
            <div class="pp-name">${state.player.name ? e(state.player.name) : 'Champion'} <button class="pp-edit" id="btnName" title="Edit name">✏️</button></div>
            <div class="pp-mentor">${state.player.favCricketer ? `Mentor: ${e(state.player.favCricketer)} ${Mentor.current().emoji}` : 'No mentor yet'} <button class="pp-edit" id="btnFav" title="Change mentor">✏️</button></div>
          </div>
        </div>
      </div>
      <div class="card settings-card">
        <h3>☁️ Cloud Sync</h3>
        ${cfg.supabaseUrl && cfg.syncCode ? `
          <div class="sync-status">✅ Syncing to cloud · code <b>${e(cfg.syncCode)}</b></div>
          <div class="settings-row">
            <button class="btn secondary" id="btnSyncNow">🔄 Sync now</button>
            <button class="btn secondary" id="btnSyncOff">🔌 Disconnect</button>
          </div>
          <button class="btn secondary restore-btn" id="btnRestoreLink">🔗 Create parent restore link</button>
          <p class="muted small">Every session is backed up automatically. On a new phone, the parent just opens the restore link — no typing needed.</p>
        ` : `
          <p class="muted small">Never lose your chronicle — sync it to a free cloud backup. Ask a parent to set this up once (see the README for the 5-minute guide).</p>
          <div class="settings-row">
            <button class="btn primary" id="btnSyncSetup">☁️ Set up cloud sync</button>
          </div>
        `}
      </div>`;
  }

  function mentorAvatarOrFallback(state) {
    const m = Mentor.current();
    if (m.avatar) return Mentor.avatarSVG(m.avatar);
    if (m.emoji) return `<span class="mentor-emoji">${m.emoji}</span>`;
    return `<span class="mentor-emoji">🏏</span>`;
  }

  function scoreLine(s) {
    const parts = [];
    if (s.matchScore) parts.push(e(s.matchScore));
    const stars = Object.entries(s.scores).filter(([, v]) => v)
      .map(([k, v]) => `${{batting:'🏏',bowling:'⚽',fielding:'🧤',overall:'🌟'}[k]}${'★'.repeat(v)}`);
    if (stars.length) parts.push(stars.join('  '));
    return parts.join('<br>') || '<span class="muted">No scores recorded</span>';
  }

  function history(state) {
    const sessions = [...state.sessions].reverse();
    if (!sessions.length) {
      return `<div class="card welcome"><h3>📚 Your Chronicle</h3><p>No sessions yet — your story starts with the first one! Tap ➕ New Session.</p></div>`;
    }
    return `
      <div class="card">
        <h3>📊 Skill Averages (all time)</h3>
        ${Charts.averages(state.sessions)}
      </div>
      <div class="card">
        <h3>🧠 Mind Power Trend</h3>
        ${Charts.mind(state.sessions)}
      </div>
      <h3 class="section-title">All Sessions (${sessions.length})</h3>
      ${sessions.map(s => `
        <div class="card session-card" data-sid="${s.id}">
          <div class="session-head">
            <span class="session-emoji">${Game.SESSION_TYPES[s.type].icon}</span>
            <div>
              <b>${Game.SESSION_TYPES[s.type].label}</b>
              <div class="muted small">${Wizard.formatDate(s.date)}</div>
            </div>
            <div class="session-stars">${s.scores.overall ? '★'.repeat(s.scores.overall) : ''}</div>
          </div>
        </div>`).join('')}`;
  }

  function sessionDetail(s) {
    const feels = (Array.isArray(s.mind?.feelings) ? s.mind.feelings : s.mind?.feeling ? [s.mind.feeling] : [])
      .map(v => Wizard.MIND_FEELINGS.find(f => f.v === v)).filter(Boolean);
    return `
      <div class="detail">
        <div class="detail-row"><b>${Game.SESSION_TYPES[s.type].icon} ${Game.SESSION_TYPES[s.type].label}</b>${s.matchStats?.opponent ? ' vs <b>' + e(s.matchStats.opponent) + '</b>' : ''} · ${Wizard.formatDate(s.date)}</div>
        ${s.matchStats ? `
          ${s.matchStats.runs !== '' || s.matchStats.wickets !== '' || s.matchStats.catches !== '' ? `
          <div class="detail-row">
            ${s.matchStats.runs !== '' || s.matchStats.balls !== '' ? `🏏 <b>${s.matchStats.runs || 0}</b> runs${s.matchStats.balls !== '' ? ` off <b>${s.matchStats.balls}</b> balls` : ''}${s.matchStats.howOut ? ` (${e(s.matchStats.howOut)})` : ''}<br>` : ''}
            ${s.matchStats.wickets !== '' || s.matchStats.overs !== '' ? `⚽ <b>${s.matchStats.wickets || 0}</b> wickets${s.matchStats.overs !== '' ? ` in ${s.matchStats.overs} overs` : ''}${s.matchStats.conceded !== '' ? ` for ${s.matchStats.conceded} runs` : ''}${s.matchStats.extras !== '' ? ` (${s.matchStats.extras} extras)` : ''}<br>` : ''}
            ${s.matchStats.catches !== '' || s.matchStats.runOuts !== '' ? `🧤 <b>${s.matchStats.catches || 0}</b> catches, <b>${s.matchStats.runOuts || 0}</b> run outs` : ''}
          </div>` : ''}
          ${s.matchStats.result ? `<div class="detail-row">${s.matchStats.result === 'won' ? '🎉' : s.matchStats.result === 'lost' ? '😢' : '🤝'} <b>${s.matchStats.result === 'won' ? 'WON' : s.matchStats.result === 'lost' ? 'Lost' : s.matchStats.result === 'tied' ? 'Tied' : 'Draw'}</b> the match${s.matchStats.margin ? ' ' + e(s.matchStats.margin) : ''}</div>` : ''}
        ` : ''}
        ${s.targets?.length ? `<div class="detail-row">🎯 <b>Targets:</b><br>${s.targets.map((t, i) =>
          `${s.targetsStatus?.[i] ? '✅' : '⬜'} ${e(t)}`).join('<br>')}</div>` : ''}
        ${s.highlights?.length ? `<div class="detail-row highlight">⭐ <b>Personal bests:</b> ${s.highlights.map(e).join(' · ')}</div>` : ''}
        ${s.retrospective ? `<div class="detail-row retro">🔍 <b>Retro:</b> ${e(s.retrospective)}</div>` : ''}
        ${s.activities.length ? `<div class="detail-row"><b>Activities:</b> ${s.activities.map(e).join(', ')}</div>` : ''}
        ${Object.entries(s.scores).filter(([, v]) => v).map(([k, v]) =>
          `<div class="detail-row">${{batting:'🏏 Batting',bowling:'⚽ Bowling',fielding:'🧤 Fielding',overall:'🌟 Overall'}[k]}: ${'★'.repeat(v)}${'☆'.repeat(5 - v)}</div>`).join('')}
        ${s.matchScore ? `<div class="detail-row"><b>Results:</b> ${e(s.matchScore)}</div>` : ''}
        ${s.strengths ? `<div class="detail-row strength">💪 <b>Strengths:</b> ${e(s.strengths)}</div>` : ''}
        ${s.weaknesses ? `<div class="detail-row weak">🔧 <b>Work on:</b> ${e(s.weaknesses)}</div>` : ''}
        <div class="detail-row">${s.injury.happened
          ? `🩺 <b>Injury:</b> ${e(s.injury.what)}${s.injury.preventable === true ? ' — preventable ✅' : s.injury.preventable === false ? ' — not preventable' : ''}${s.injury.lesson ? `<br>🎓 <b>Lesson:</b> ${e(s.injury.lesson)}` : ''}`
          : '🙌 No injuries'}</div>
        ${feels.length ? `<div class="detail-row">🧠 <b>Mind:</b> ${feels.map(f => f.icon + ' ' + f.label).join(' · ')}${s.mind.rating ? ` (${'★'.repeat(s.mind.rating)})` : ''}</div>` : ''}
        ${s.coach && (s.coach.feedback || s.coach.drills || s.coach.rating) ? `
          <div class="detail-row coach">👨‍🏫 <b>Coach${s.coach.name ? ' ' + e(s.coach.name) : ''}</b>${s.coach.rating ? `: ${'★'.repeat(s.coach.rating)}` : ''}
            ${s.coach.feedback ? `<br>💬 ${e(s.coach.feedback)}` : ''}
            ${s.coach.drills ? `<br>🎯 <b>Drills until next session:</b> ${e(s.coach.drills)}` : ''}
          </div>` : ''}
        ${s.mind.thoughts ? `<div class="detail-row thought">💭 "${e(s.mind.thoughts)}"</div>` : ''}
      </div>`;
  }

  function rewards(state) {
    const xp = Game.totalXP(state);
    const { level, next, pct } = Game.levelFor(xp);
    const earned = new Set(state.badges.map(b => b.id));
    const missions = state.missions;
    return `
      <div class="card hero">
        <div class="level-row">
          <span class="level-emoji big">${level.icon}</span>
          <div class="level-info">
            <div class="level-name">${level.name}</div>
            <div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div>
            <div class="xp-text">${xp} XP${next ? ` · ${next.xp - xp} to ${next.name}` : ''}</div>
          </div>
        </div>
        <div class="level-ladder">
          ${Game.LEVELS.map(l => `<span class="ladder-step ${xp >= l.xp ? 'reached' : ''}">${l.icon}</span>`).join('<span class="ladder-line"></span>')}
        </div>
      </div>
      ${missions.length ? `
      <div class="card">
        <h3>🎯 Actions & Missions — ${missions.length - missions.filter(m => !m.completedAt).length} of ${missions.length} completed</h3>
        ${missions.filter(m => !m.completedAt).length ? `
          <div class="muted small" style="margin-bottom:6px">⏳ Pending (${missions.filter(m => !m.completedAt).length})</div>
          ${missions.slice().reverse().filter(m => !m.completedAt).map(m => `
          <div class="mission-row">
            <span class="mission-pips">${Array.from({length: m.targetCount}, (_, i) => `<span class="pip ${i < m.progress ? 'full' : ''}"></span>`).join('')}</span>
            <div class="mission-text">${m.coach ? '👨‍🏫 ' : ''}${e(m.weaknessText)}
              <span class="muted small">Practise ${m.targetCount - m.progress} more time${m.targetCount - m.progress > 1 ? 's' : ''} → +${m.rewardedXp} XP</span>
            </div>
          </div>`).join('')}` : ''}
        ${missions.filter(m => m.completedAt).length ? `
          <div class="muted small" style="margin:12px 0 6px">✅ Completed (${missions.filter(m => m.completedAt).length})</div>
          ${missions.slice().reverse().filter(m => m.completedAt).map(m => `
          <div class="mission-row done">
            ✅ <div class="mission-text">${m.coach ? '👨‍🏫 ' : ''}${e(m.weaknessText)}
              <span class="muted small">Done! +${m.rewardedXp} XP</span>
            </div>
          </div>`).join('')}` : ''}
      </div>` : ''}
      ${shopHTML(state)}
      <div class="card">
        <h3>🏅 Badge Collection (${earned.size}/${Game.BADGES.length})</h3>
        <div class="badge-grid">
          ${Game.BADGES.map(b => `
            <div class="badge ${earned.has(b.id) ? 'earned' : 'locked'}" title="${b.desc}">
              <div class="badge-icon">${earned.has(b.id) ? b.icon : '🔒'}</div>
              <div class="badge-name">${b.name}</div>
              <div class="badge-desc">${earned.has(b.id) ? 'Earned!' : b.desc}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function shopHTML(state) {
    const pts = state.rewardPoints || 0;
    return `
      <div class="card shop-card">
        <h3>🎁 Reward Shop</h3>
        <div class="shop-balance">💰 <b>${pts}</b> reward points</div>
        <p class="hint">Earn points: achieve your match targets (+5 each), win matches (+10), get coach praise (+10), complete missions (+20), log personal bests (+5)!</p>
        ${state.rewards.map(r => `
          <div class="shop-item">
            <span>${e(r.name)}</span>
            <span class="shop-cost">${r.cost} pts</span>
            <button class="btn ${pts >= r.cost ? 'primary' : 'secondary'} redeem-btn" data-rid="${r.id}" ${pts < r.cost ? 'disabled' : ''}>
              ${pts >= r.cost ? 'Redeem' : 'Need ' + (r.cost - pts) + ' more'}
            </button>
            <button class="shop-del" data-rid="${r.id}" title="Remove (parent)">✕</button>
          </div>`).join('')}
        <button class="btn secondary restore-btn" id="btnAddReward">➕ Add a reward (parent)</button>
        ${state.redemptions.length ? `
          <div class="muted small" style="margin-top:10px">Recent redemptions:</div>
          ${state.redemptions.slice(-3).reverse().map(r => `<div class="muted small">🎁 ${e(r.name)} — ${r.cost} pts · ${Wizard.formatDate(r.at.slice(0, 10))}</div>`).join('')}
        ` : ''}
      </div>`;
  }


  function daysSince(dateStr) {
    return Math.floor((Date.now() - new Date(dateStr + 'T00:00:00').getTime()) / 86400000);
  }

  return { home, history, rewards, sessionDetail };
})();
