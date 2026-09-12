/* Matches tab: upcoming (planned) matches and played match records. */
const MatchesView = (() => {
  const e = Wizard.escapeHTML;

  function render(state) {
    const planned = state.sessions.filter(s => s.type === 'match' && s.status === 'planned');
    const played = state.sessions.filter(s => s.type === 'match' && s.status !== 'planned');
    const won = played.filter(s => s.matchStats?.result === 'won').length;
    const lost = played.filter(s => s.matchStats?.result === 'lost').length;
    const runs = played.reduce((n, s) => n + (+s.matchStats?.runs || 0), 0);
    const wkts = played.reduce((n, s) => n + (+s.matchStats?.wickets || 0), 0);

    return `
      <div class="card plays-card">
        <h3>🏟️ Matches</h3>
        <button class="cta-log" id="btnPlanMatch">📋 Plan next match</button>
        <p class="hint">Plan before the match (opponent + targets), then fill the post-match report after.</p>
      </div>

      <div class="card actions-bar">
        <div class="stat"><div class="stat-num">${won}</div><div class="stat-label">Wins 🎉</div></div>
        <div class="stat"><div class="stat-num">${lost}</div><div class="stat-label">Losses 😢</div></div>
        <div class="stat"><div class="stat-num">${runs}</div><div class="stat-label">Career runs</div></div>
        <div class="stat"><div class="stat-num">${wkts}</div><div class="stat-label">Career wkts</div></div>
      </div>

      ${planned.length ? `
      <h3 class="section-title">📅 Upcoming (${planned.length})</h3>
      ${planned.slice().reverse().map(s => `
        <div class="card planned-card">
          <div class="planned-head">
            <b>🆚 ${e(s.matchStats?.opponent || 'Opponent TBC')}</b>
            <span class="muted small">${Wizard.formatDate(s.date)}</span>
          </div>
          ${s.targets.length ? `
            <div class="muted small" style="margin:6px 0">🎯 Targets:</div>
            ${s.targets.map(t => `<div class="note-line good">🎯 ${e(t)}</div>`).join('')}` : '<p class="muted small">No targets set</p>'}
          <div class="settings-row">
            <button class="btn primary postmatch-btn" data-sid="${s.id}">📝 Post-match report</button>
            <button class="btn secondary del-planned" data-sid="${s.id}">🗑️ Cancel</button>
          </div>
        </div>`).join('')}` : ''}

      <h3 class="section-title">📖 Played (${played.length})</h3>
      ${played.length ? played.slice().reverse().map(s => {
        const ms = s.matchStats || {};
        const res = ms.result === 'won' ? '🎉 WON' : ms.result === 'lost' ? '😢 Lost' : ms.result === 'tied' ? '🤝 Tied' : ms.result === 'draw' ? '⏸️ Draw' : '';
        return `
        <div class="card session-card" data-sid="${s.id}">
          <div class="session-head">
            <span class="session-emoji">${res ? res.split(' ')[0] : '🏟️'}</span>
            <div>
              <b>${ms.opponent ? 'vs ' + e(ms.opponent) : 'Match'}</b>
              <div class="muted small">${Wizard.formatDate(s.date)}${res ? ' · ' + res : ''}</div>
            </div>
          </div>
          ${(ms.runs !== '' || ms.wickets !== '') ? `<div class="muted small" style="margin-top:6px">
            ${ms.runs !== '' ? '🏏 ' + ms.runs + ' runs ' : ''}${ms.wickets !== '' ? '· ⚽ ' + ms.wickets + ' wkts ' : ''}${ms.catches !== '' ? '· 🧤 ' + ms.catches + ' catches' : ''}
          </div>` : ''}
        </div>`;
      }).join('') : '<div class="card welcome"><p>No matches played yet. Plan one above! 🏟️</p></div>'}`;
  }

  return { render };
})();
