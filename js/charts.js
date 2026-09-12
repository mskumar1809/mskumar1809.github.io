/* Tiny dependency-free SVG charts. */
const Charts = (() => {

  const COLORS = { batting: '#2563eb', bowling: '#d97706', fielding: '#16a34a', overall: '#7c3aed', mind: '#db2777' };

  function lastN(sessions, n) { return sessions.slice(-n); }

  function trend(sessions) {
    const data = lastN(sessions, 15);
    if (data.length < 2) return '<p class="muted">Log a few more sessions to see your trend!</p>';
    const W = 320, H = 120, pad = 24;
    const series = ['batting', 'bowling', 'fielding', 'overall'];
    const x = i => pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = v => H - pad - ((v - 1) / 4) * (H - pad * 2);
    let svg = `<svg viewBox="0 0 ${W} ${H}" class="chart">`;
    for (let g = 1; g <= 5; g++) svg += `<line x1="${pad}" y1="${y(g)}" x2="${W - pad}" y2="${y(g)}" class="grid"/><text x="4" y="${y(g) + 3}" class="tick">${g}</text>`;
    for (const k of series) {
      const pts = data.map((s, i) => s.scores[k] ? `${x(i)},${y(s.scores[k])}` : null);
      // split into contiguous segments
      let seg = [];
      const draw = () => { if (seg.length > 1) svg += `<polyline points="${seg.join(' ')}" fill="none" stroke="${COLORS[k]}" stroke-width="2.5" stroke-linecap="round"/>`; seg = []; };
      pts.forEach(p => { if (p) seg.push(p); else draw(); });
      draw();
      pts.forEach(p => { if (p) svg += `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3" fill="${COLORS[k]}"/>`; });
    }
    svg += '</svg>';
    return svg + `<div class="legend">${series.map(k => `<span><i style="background:${COLORS[k]}"></i>${k}</span>`).join('')}</div>`;
  }

  function averages(sessions) {
    const rows = ['batting', 'bowling', 'fielding', 'overall'].map(k => {
      const vals = sessions.map(s => s.scores[k]).filter(Boolean);
      if (!vals.length) return '';
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return `<div class="avg-row">
        <span class="avg-label">${{batting:'🏏 Batting',bowling:'⚽ Bowling',fielding:'🧤 Fielding',overall:'🌟 Overall'}[k]}</span>
        <div class="avg-bar"><div class="avg-fill" style="width:${(avg / 5) * 100}%;background:${COLORS[k]}"></div></div>
        <span class="avg-val">★${avg.toFixed(1)}</span>
      </div>`;
    }).join('');
    return rows || '<p class="muted">No ratings yet.</p>';
  }

  function mind(sessions) {
    const data = lastN(sessions, 15).filter(s => s.mind.rating);
    if (data.length < 2) return '<p class="muted">Rate your mind power in sessions to see this chart!</p>';
    const W = 320, H = 100, pad = 24;
    const x = i => pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = v => H - pad - ((v - 1) / 4) * (H - pad * 2);
    const pts = data.map((s, i) => `${x(i)},${y(s.mind.rating)}`);
    let svg = `<svg viewBox="0 0 ${W} ${H}" class="chart">`;
    for (let g = 1; g <= 5; g += 2) svg += `<line x1="${pad}" y1="${y(g)}" x2="${W - pad}" y2="${y(g)}" class="grid"/><text x="4" y="${y(g) + 3}" class="tick">${g}</text>`;
    svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${COLORS.mind}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    data.forEach((s, i) => svg += `<circle cx="${x(i)}" cy="${y(s.mind.rating)}" r="3" fill="${COLORS.mind}"/>`);
    svg += '</svg>';
    return svg;
  }

  return { trend, averages, mind };
})();
