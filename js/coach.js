/* Coach hub: every coach note, the current plan, and action item status —
   grouped by coach. */
const CoachView = (() => {
  const e = Wizard.escapeHTML;

  const nameOf = s => (s.coach.name || '').trim() || 'Coach';

  function render(state) {
    const coached = state.sessions.filter(s => s.coach && (s.coach.feedback || s.coach.drills || s.coach.rating || s.coach.name));
    const latest = coached[coached.length - 1];

    if (!coached.length) {
      return `<div class="card welcome"><h3>👨‍🏫 Coach Hub</h3>
        <p>No coach notes yet. After a session with a coach, fill in the <b>Coach's Corner</b> step — everything every coach says will be collected here, forever, grouped by coach.</p></div>`;
    }

    // Group notes by coach name (unknown names still get their own group).
    const groups = {};
    for (const s of coached) {
      const n = nameOf(s);
      (groups[n] = groups[n] || []).push(s);
    }
    // Known roster first (most-notes first), then ad-hoc names.
    const roster = state.settings.coaches || [];
    const names = Object.keys(groups).sort((a, b) => {
      const ra = roster.includes(a) ? 0 : 1, rb = roster.includes(b) ? 0 : 1;
      return ra - rb || groups[b].length - groups[a].length;
    });

    const coachMissions = state.missions.filter(m => m.coach);
    const openItems = coachMissions.filter(m => !m.completedAt);
    const doneItems = coachMissions.filter(m => m.completedAt);

    return `
      ${latest ? `
      <div class="card coach-card">
        <h3>📋 Current Plan — ${e(nameOf(latest))}</h3>
        <p class="muted small">Given after the ${Game.SESSION_TYPES[latest.type].label.toLowerCase()} on ${Wizard.formatDate(latest.date)} · active until the next coached session</p>
        ${latest.coach.drills ? `<div class="coach-drills">🎯 ${e(latest.coach.drills)}</div>` : ''}
        ${latest.coach.feedback ? `<div class="coach-feedback">💬 ${e(latest.coach.feedback)}${latest.coach.rating ? `<span class="coach-stars"> ${'★'.repeat(latest.coach.rating)}</span>` : ''}</div>` : ''}
      </div>` : ''}

      <div class="card actions-bar">
        <div class="stat"><div class="stat-num">${coached.length}</div><div class="stat-label">Coach sessions</div></div>
        <div class="stat"><div class="stat-num amber">${openItems.length}</div><div class="stat-label">Open actions</div></div>
        <div class="stat"><div class="stat-num green">${doneItems.length}</div><div class="stat-label">Done actions</div></div>
        <div class="stat"><div class="stat-num">${names.length}</div><div class="stat-label">Coaches</div></div>
      </div>

      ${openItems.length ? `
      <div class="card">
        <h3>🎯 Coach Action Items — Open (${openItems.length})</h3>
        ${openItems.slice().reverse().map(m => `
          <div class="mission-row">
            <span class="mission-pips">${Array.from({length: m.targetCount}, (_, i) => `<span class="pip ${i < m.progress ? 'full' : ''}"></span>`).join('')}</span>
            <div class="mission-text">${e(m.weaknessText)}
              <span class="muted small">Practise ${m.targetCount - m.progress} more → +${m.rewardedXp} XP +20 🎁</span>
            </div>
          </div>`).join('')}
      </div>` : ''}
      ${doneItems.length ? `
      <div class="card">
        <h3>✅ Coach Action Items — Completed (${doneItems.length})</h3>
        ${doneItems.slice().reverse().map(m => `
          <div class="mission-row done">✅ <div class="mission-text">${e(m.weaknessText)}
            <span class="muted small">Done! +${m.rewardedXp} XP</span></div>
          </div>`).join('')}
      </div>` : ''}

      ${names.map(n => coachSection(n, groups[n], state)).join('')}

      <div class="card settings-card">
        <h3>👥 Coach Roster (${roster.length})</h3>
        ${roster.length ? roster.map(c => `
          <div class="roster-row"><span>👨‍🏫 ${e(c)}</span>
            <span class="muted small">${(groups[c] || []).length} sessions</span>
            <button class="shop-del coach-del" data-cname="${e(c)}">✕</button>
          </div>`).join('') : '<p class="muted small">Coaches are added automatically the first time their name is used in a session.</p>'}
        <button class="btn secondary restore-btn" id="btnAddCoach">➕ Add coach</button>
      </div>`;
  }

  function coachSection(name, sessions, state) {
    const ratings = sessions.map(s => s.coach.rating).filter(Boolean);
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
    const last = sessions[sessions.length - 1];
    return `
      <h3 class="section-title">👨‍🏫 ${e(name)} · ${sessions.length} session${sessions.length > 1 ? 's' : ''}${avg ? ` · avg ★${avg}` : ''}</h3>
      ${sessions.slice().reverse().map(s => `
        <div class="card session-card" data-sid="${s.id}">
          <div class="coach-note-head">
            <span class="muted small">${Wizard.formatDate(s.date)} · ${Game.SESSION_TYPES[s.type].label}</span>
            ${s.coach.rating ? `<span class="coach-stars">${'★'.repeat(s.coach.rating)}</span>` : ''}
          </div>
          ${s.coach.feedback ? `<div class="coach-feedback">💬 ${e(s.coach.feedback)}</div>` : ''}
          ${s.coach.drills ? `<div class="coach-feedback">🎯 ${e(s.coach.drills)}</div>` : ''}
          <div class="muted small" style="margin-top:6px">Tap to see the full session →</div>
        </div>`).join('')}
      ${last === sessions[sessions.length - 1] ? '' : ''}`;
  }

  return { render };
})();
