/* Gamification engine: XP, levels, streaks, badges, focus missions. */
const Game = (() => {

  const SESSION_TYPES = {
    practice: { label: 'Practice', icon: '🏋️', xp: 20 },
    net:      { label: 'Net Session', icon: '🥅', xp: 25 },
    '1-1':    { label: '1-1 Coaching', icon: '🎯', xp: 30 },
    match:    { label: 'Match', icon: '🏟️', xp: 40 }
  };

  // Level = fun cricket-themed ranks; XP needed grows gently.
  const LEVELS = [
    { name: 'Debutant',        icon: '🌟', xp: 0 },
    { name: 'Club Player',     icon: '🏏', xp: 100 },
    { name: 'Rising Star',     icon: '⭐', xp: 300 },
    { name: 'Net Crusher',     icon: '🔥', xp: 600 },
    { name: 'Talented Prodigy',icon: '💫', xp: 1000 },
    { name: 'Match Winner',    icon: '🏅', xp: 1600 },
    { name: 'Star Performer',  icon: '🌠', xp: 2400 },
    { name: 'Captain Material',icon: '🧢', xp: 3500 },
    { name: 'Legend in Making',icon: '👑', xp: 5000 },
    { name: 'Chronicle Legend',icon: '🏆', xp: 8000 }
  ];

  const BADGES = [
    { id: 'first-session',   icon: '🎉', name: 'First Chronicle!',      desc: 'Log your very first session' },
    { id: 'five-sessions',   icon: '🖐️', name: 'Getting Going',        desc: 'Log 5 sessions' },
    { id: 'ten-sessions',    icon: '🔟', name: 'Committed Cricketer',  desc: 'Log 10 sessions' },
    { id: 'twenty-five',     icon: '🎖️', name: 'Quarter Century',      desc: 'Log 25 sessions' },
    { id: 'fifty',           icon: '💎', name: 'Half Century!',        desc: 'Log 50 sessions' },
    { id: 'streak-3',        icon: '🔥', name: 'On a Roll',            desc: '3 sessions in 7 days' },
    { id: 'streak-7',        icon: '⚡', name: 'Unstoppable',          desc: '7 sessions in 14 days' },
    { id: 'mindful-5',       icon: '🧠', name: 'Mind Master',          desc: 'Write 5 mind reflections' },
    { id: 'honest-learner',  icon: '📖', name: 'Honest Learner',       desc: 'Log a weakness 10 times' },
    { id: 'mission-1',       icon: '✅', name: 'Mission Accomplished', desc: 'Complete your first focus mission' },
    { id: 'mission-5',       icon: '🎯', name: 'Focus Champion',       desc: 'Complete 5 focus missions' },
    { id: 'full-honesty',    icon: '🛡️', name: 'Safe & Smart',        desc: 'Log injury prevention learning' },
    { id: 'target-smasher',  icon: '💯', name: 'Target Smasher',      desc: 'Achieve ALL your match targets' },
    { id: 'goal-getter',     icon: '🎯', name: 'Goal Getter',         desc: 'Achieve 10 match targets in total' }
  ];

  function levelFor(xp) {
    let lvl = LEVELS[0];
    for (const l of LEVELS) if (xp >= l.xp) lvl = l;
    const next = LEVELS.find(l => l.xp > xp);
    const span = next ? next.xp - lvl.xp : 1;
    const into = next ? xp - lvl.xp : 1;
    return { level: lvl, next, pct: next ? Math.round((into / span) * 100) : 100 };
  }

  function totalXP(state) {
    return state.xpEvents.reduce((s, e) => s + e.amount, 0);
  }

  // Streak = sessions in the trailing window (keeps it forgiving for kids).
  function recentStreak(sessions, windowDays) {
    if (!sessions.length) return 0;
    const cutoff = Date.now() - windowDays * 86400000;
    return sessions.filter(s => new Date(s.date + 'T23:59:59').getTime() >= cutoff).length;
  }

  function currentStreakDays(sessions) {
    // consecutive-day chain: how many distinct days in a row ending today/yesterday
    const days = [...new Set(sessions.map(s => s.date))].sort().reverse();
    if (!days.length) return 0;
    const dayMs = 86400000;
    const today = new Date(); today.setHours(0,0,0,0);
    const latest = new Date(days[0] + 'T00:00:00');
    const gap = Math.round((today - latest) / dayMs);
    if (gap > 1) return 0;
    let streak = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i-1] + 'T00:00:00');
      const cur = new Date(days[i] + 'T00:00:00');
      if (Math.round((prev - cur) / dayMs) === 1) streak++; else break;
    }
    return streak;
  }

  function xpForSession(session) {
    let xp = SESSION_TYPES[session.type]?.xp || 20;
    if (session.strengths?.trim()) xp += 5;
    if (session.weaknesses?.trim()) xp += 5;
    if (session.mind?.thoughts?.trim()) xp += 5;
    if (session.injury?.happened && session.injury.preventable !== null) xp += 5;
    if (session.coach?.feedback?.trim() || session.coach?.drills?.trim()) xp += 5;
    if (session.type === 'match') {
      if (session.matchStats?.result === 'won') xp += 10;
      const achieved = achievedTargets(session).length;
      xp += achieved * 5;
      if ((session.highlights || []).length) xp += 5;
      // Perfect day: every target set was achieved
      if ((session.targets || []).length && achieved === session.targets.length) xp += 10;
    }
    if ((session.coach?.rating || 0) >= 4) xp += 10;
    return xp;
  }

  /* Reward Points (RP): earned for good things — achieved targets, match wins,
     coach praise, completed missions. Redeemable in the parent Reward Shop. */
  function achievedTargets(session) {
    return (session.targets || []).filter((t, i) => session.targetsStatus?.[i]);
  }

  function rpForSession(session) {
    let rp = 0;
    const why = [];
    if (session.type === 'match') {
      if (session.matchStats?.result === 'won') { rp += 10; why.push('Match won! 🏆'); }
      const achieved = achievedTargets(session).length;
      if (achieved) { rp += achieved * 5; why.push(achieved + ' target' + (achieved > 1 ? 's' : '') + ' achieved 🎯'); }
      if ((session.targets || []).length && achieved === session.targets.length) { rp += 10; why.push('ALL targets smashed! 💯'); }
      if ((session.highlights || []).length) { rp += 5; why.push('Personal bests! ⭐'); }
    }
    if ((session.coach?.rating || 0) >= 4) { rp += 10; why.push('Coach praised you! 👨‍🏫'); }
    if (session.strengths?.trim() && session.weaknesses?.trim()) { rp += 2; why.push('Honest reflection 💪'); }
    return { rp, why };
  }

  function addRP(state, amount, reason) {
    if (!amount) return;
    state.rewardPoints += amount;
    state.pointsLog.push({ at: new Date().toISOString(), amount, reason });
  }

  function redeem(state, reward) {
    if (state.rewardPoints < reward.cost) return false;
    state.rewardPoints -= reward.cost;
    state.redemptions.push({ at: new Date().toISOString(), name: reward.name, cost: reward.cost });
    return true;
  }

  function addXP(state, amount, reason) {
    const before = levelFor(totalXP(state)).level;
    state.xpEvents.push({ at: new Date().toISOString(), amount, reason });
    const after = levelFor(totalXP(state)).level;
    saveCheckBadges(state);
    return { leveledUp: before !== after, level: after };
  }

  function checkBadges(state) {
    const earned = new Set(state.badges.map(b => b.id));
    const newly = [];
    const n = state.sessions.length;
    const count = id => { if (!earned.has(id)) { newly.push(id); } };

    if (n >= 1) count('first-session');
    if (n >= 5) count('five-sessions');
    if (n >= 10) count('ten-sessions');
    if (n >= 25) count('twenty-five');
    if (n >= 50) count('fifty');
    if (recentStreak(state.sessions, 7) >= 3) count('streak-3');
    if (recentStreak(state.sessions, 14) >= 7) count('streak-7');
    if (state.sessions.filter(s => s.mind?.thoughts?.trim()).length >= 5) count('mindful-5');
    if (state.sessions.filter(s => s.weaknesses?.trim()).length >= 10) count('honest-learner');
    if (state.missions.filter(m => m.completedAt).length >= 1) count('mission-1');
    if (state.missions.filter(m => m.completedAt).length >= 5) count('mission-5');
    if (state.sessions.some(s => s.injury?.happened && s.injury.preventable === true)) count('full-honesty');
    if (state.sessions.some(s => (s.targets || []).length && achievedTargets(s).length === s.targets.length)) count('target-smasher');
    if (state.sessions.reduce((n, s) => n + achievedTargets(s).length, 0) >= 10) count('goal-getter');

    for (const id of newly) {
      state.badges.push({ id, at: new Date().toISOString() });
    }
    return newly.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
  }

  function saveCheckBadges(state) { checkBadges(state); }

  /* Focus missions: generated from recent weaknesses not yet covered by an
     open/completed mission, phrased as kid-friendly practice challenges. */
  function createMission(state, weaknessText, sourceSessionId, isCoachDrill) {
    const exists = state.missions.some(m => m.weaknessText.toLowerCase() === weaknessText.toLowerCase());
    if (exists) return null;
    const m = {
      id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6),
      weaknessText,
      sourceSessionId: sourceSessionId || null,
      createdAt: new Date().toISOString(),
      targetCount: 2,                       // practice it twice
      progress: 0,
      completedAt: null,
      rewardedXp: 40,
      coach: !!isCoachDrill
    };
    state.missions.push(m);
    return m;
  }

  function maybeGenerateMissions(state) {
    const recent = state.sessions.slice(-5);
    let added = 0;
    for (const s of recent) {
      const w = (s.weaknesses || '').trim();
      if (!w) continue;
      if (createMission(state, w, s.id, false)) added++;
    }
    return added;
  }

  // Called when a new session's activities mention a weakness focus.
  function progressMissions(state, session) {
    const text = ((session.activities || []).join(' ') + ' ' + (session.strengths || '') + ' ' + (session.focusNote || '')).toLowerCase();
    let completed = [];
    for (const m of state.missions) {
      if (m.completedAt) continue;
      const words = m.weaknessText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const hit = words.some(w => text.includes(w));
      if (hit) {
        m.progress++;
        if (m.progress >= m.targetCount) {
          m.completedAt = new Date().toISOString();
          completed.push(m);
        }
      }
    }
    return completed;
  }

  // One-tap "I practised this!" from the dashboard.
  function practiseMission(state, missionId) {
    const m = state.missions.find(x => x.id === missionId);
    if (!m || m.completedAt) return null;
    m.progress++;
    if (m.progress >= m.targetCount) {
      m.completedAt = new Date().toISOString();
      const res = Game.addXP(state, m.rewardedXp, 'Focus mission complete!');
      Game.addRP(state, 20, 'Focus mission complete: ' + m.weaknessText);
      checkBadges(state);
      return { mission: m, completed: true, xp: m.rewardedXp, rp: 20, leveledUp: res.leveledUp, level: res.level };
    }
    return { mission: m, completed: false };
  }

  return {
    SESSION_TYPES, LEVELS, BADGES,
    levelFor, totalXP, xpForSession, addXP,
    checkBadges, currentStreakDays, recentStreak,
    maybeGenerateMissions, progressMissions, createMission, practiseMission,
    rpForSession, addRP, redeem, achievedTargets
  };
})();
