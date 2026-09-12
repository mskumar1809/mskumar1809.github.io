/* Cheeku the Cricket 🦗 — friendly mascot who talks at every stage. */
const Mascot = (() => {
  const NAME = 'Cheeku';

  // Friendly cartoon coach — inline SVG so it works offline.
  const FACE = `
    <svg class="mascot-img" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" aria-label="Cheeku the coach">
      <!-- body / polo shirt -->
      <path d="M25 110 L25 88 Q25 74 40 70 L60 70 Q75 74 75 88 L75 110 Z" fill="#1a7a4a"/>
      <rect x="46" y="70" width="8" height="12" rx="3" fill="#e8b88a"/>
      <!-- collar -->
      <path d="M42 70 L50 78 L58 70 Z" fill="#fff"/>
      <!-- arms -->
      <path d="M27 78 Q14 84 12 96" stroke="#1a7a4a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M73 78 Q86 84 88 96" stroke="#1a7a4a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <!-- hands -->
      <circle cx="12" cy="97" r="6" fill="#e8b88a"/>
      <circle cx="88" cy="97" r="6" fill="#e8b88a"/>
      <!-- clipboard in left hand -->
      <rect x="4" y="86" width="14" height="18" rx="2" fill="#f5e6c8" stroke="#b08d4f" stroke-width="2"/>
      <!-- head -->
      <circle cx="50" cy="42" r="24" fill="#f2c49b"/>
      <!-- ears -->
      <circle cx="26" cy="44" r="5" fill="#f2c49b"/>
      <circle cx="74" cy="44" r="5" fill="#f2c49b"/>
      <!-- cap -->
      <path d="M26 34 Q26 16 50 16 Q74 16 74 34 L74 34 Q74 30 50 30 Q26 30 26 34 Z" fill="#14603a"/>
      <path d="M26 33 Q14 34 10 40 Q22 42 30 38 Z" fill="#14603a"/>
      <!-- hair peeking -->
      <path d="M32 30 Q50 22 68 30 L68 34 Q50 27 32 34 Z" fill="#2b1d12"/>
      <!-- eyes -->
      <circle cx="42" cy="44" r="3" fill="#221"/>
      <circle cx="58" cy="44" r="3" fill="#221"/>
      <circle cx="43" cy="43" r="1" fill="#fff"/>
      <circle cx="59" cy="43" r="1" fill="#fff"/>
      <!-- eyebrows -->
      <path d="M38 38 Q42 36 46 38" stroke="#2b1d12" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M54 38 Q58 36 62 38" stroke="#2b1d12" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- smile -->
      <path d="M42 54 Q50 61 58 54" stroke="#a0522d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- blush -->
      <circle cx="36" cy="51" r="3" fill="#f4a988" opacity="0.7"/>
      <circle cx="64" cy="51" r="3" fill="#f4a988" opacity="0.7"/>
    </svg>`;

  const LINES = {
    home: [
      "Ready for cricket greatness today? 🏏",
      "Champions are made one session at a time!",
      "Show me your best today — I'm watching! 👀",
      "Small improvements every day = big results!",
      "Let's go! The pitch is calling! 🏟️"
    ],
    homePending: n => `You have ${n} play${n > 1 ? 's' : ''} waiting — tap "Practised!" when you work on them! 💪`,
    homeNoSession: "No session logged yet today — let's fix that! 🏏",
    type: "So what kind of cricket did we play today? 🤔",
    targets: "Set your targets BEFORE the match — aim high but keep it real! 🎯",
    activities: "Tell me everything you did — I love details! ✅",
    activitiesMatch: "What happened in the match? Brag a little! 🏟️",
    scores: "Rate yourself honestly — that's how champions grow! ⭐",
    strengths: "Be proud of your strengths AND honest about what to fix! 🌱",
    injury: "Body check time — look after yourself, champ! 🩺",
    mind: "The mind is a superpower — tell me what was going on in there! 🧠",
    coach: "Shhh… coach time! Hand the phone over 🤫",
    coachDone: "Ooh, coach feedback! Let's use it wisely! 👨‍🏫",
    retro: "The best players review every match — what did we learn? 🔍",
    review: "Last check before we lock it in the chronicle! 📋",
    saved: (xp, rp) => `Saved! +${xp} XP${rp ? ` and +${rp} reward points 🎁` : ''} — I'm so proud of you! 🎉`,
    savedTargets: (n, rp) => `You smashed ${n} target${n > 1 ? 's' : ''}! +${rp} reward points 🎁`,
    redeemed: "Enjoy your reward — you EARNED it! 🎁😄",
    mission: (rp) => `Mission complete! +${rp} reward points! You're on fire! 🔥`
  };

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  let el, timer;
  function ensure() {
    el = document.getElementById('mascot');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mascot';
      el.className = 'mascot';
      document.body.appendChild(el);
    }
    return el;
  }

  function say(text, ms = 5000) {
    const box = ensure();
    const m = Mentor.current();
    let charHTML, who;
    if (m.avatar) {
      charHTML = `<span class="mascot-char mentor-char">${Mentor.avatarSVG(m.avatar)}</span>`;
      who = `<b>${Wizard.escapeHTML(m.name)}</b> <span class="mentor-title">${m.title}</span>`;
    } else if (m.emoji) {
      charHTML = `<span class="mascot-char mentor-char"><span class="mentor-emoji">${m.emoji}</span></span>`;
      who = `<b>${Wizard.escapeHTML(m.name)}</b> <span class="mentor-title">${m.title}</span>`;
    } else {
      charHTML = `<span class="mascot-char">${FACE}</span>`;
      who = `<b>${NAME}:</b>`;
    }
    box.innerHTML = `${charHTML}<div class="mascot-bubble">${who}<br>${text}</div>`;
    box.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => box.classList.remove('show'), ms);
  }

  function home(sessions, pendingMissions) {
    const today = new Date().toISOString().slice(0, 10);
    if (!sessions.some(s => s.date === today)) return say(LINES.homeNoSession, 6000);
    if (pendingMissions > 0) return say(LINES.homePending(pendingMissions), 6000);
    say(pick(LINES.home), 6000);
  }

  return { say, home, LINES, FACE };
})();
