/* First-launch onboarding: Cheeku introduces the app, kid sets his name. */
const Onboarding = (() => {

  const SLIDES = [
    {
      title: 'Welcome to Cric Chronicles! 🏏',
      body: `I'm <b>Cheeku</b>, your personal cricket coach! This is YOUR app — a diary of every practice, net, match and win.`,
      showFace: true
    },
    {
      title: 'Chronicle everything 📖',
      body: `After every session we'll record what you did, your batting / bowling / fielding, your strengths, what to work on, how you felt, and what your coach said — you can even <b>talk instead of typing</b> with the 🎤 buttons!`
    },
    {
      title: 'Matches are special 🏟️',
      body: `Set <b>targets before</b> the match, record your real stats, add your personal bests, then dissect it all <b>after</b> — win or learn!`
    },
    {
      title: 'Earn XP + Reward Points 🎁',
      body: `Level up from Debutant to Legend, collect badges, complete focus missions — and earn <b>reward points</b> to redeem for Robux, burgers, Lego and more (from your parents!).`,
      showFace: true
    },
    {
      title: "What's your name, champ? 😎",
      body: '',
      nameInput: true
    },
    {
      title: "Who's your favourite cricketer? ⭐",
      body: `They'll be your <b>GUIDE & MENTOR</b> on this journey — cheering you on at every step!`,
      favInput: true
    }
  ];

  function start(state, save, done) {
    const root = document.getElementById('modalRoot');
    let idx = 0;
    let name = state.player.name || '';
    let fav = state.player.favCricketer || '';

    function render() {
      const s = SLIDES[idx];
      const last = idx === SLIDES.length - 1;
      root.innerHTML = `
        <div class="onboarding">
          <div class="ob-skip" id="obSkip">Skip</div>
          <div class="ob-slide">
            ${s.showFace ? `<div class="ob-face">${Mascot.FACE}</div>` : `<div class="ob-emoji">${['🏏','📖','🏟️','🎁','😎','⭐'][idx]}</div>`}
            <h2>${s.title}</h2>
            <p>${s.body}</p>
            ${s.nameInput ? `
              <input type="text" id="obName" class="ob-input" placeholder="Type your name…" maxlength="20" value="${Wizard.escapeHTML(name)}">
              <p class="ob-note">You can also tap 🎤 and just say it!</p>` : ''}
            ${s.favInput ? `
              <input type="text" id="obFav" class="ob-input" placeholder="e.g. Virat Kohli" maxlength="30" value="${Wizard.escapeHTML(fav)}">
              <div class="fav-chips">
                ${Mentor.SUGGESTIONS.map(c => `<button class="fav-chip" data-fav="${Wizard.escapeHTML(c)}">${Wizard.escapeHTML(c)}</button>`).join('')}
              </div>
              <p class="ob-note">Or tap a star below — or speak it! 🎤</p>` : ''}
          </div>
          <div class="ob-dots">${SLIDES.map((_, i) => `<span class="ob-dot ${i === idx ? 'on' : ''}"></span>`).join('')}</div>
          <div class="ob-nav">
            ${idx > 0 ? '<button class="btn secondary" id="obBack">← Back</button>' : ''}
            <button class="btn primary" id="obNext">${last ? "Let's play! 🏏" : 'Next →'}</button>
          </div>
        </div>`;

      const input = document.getElementById('obName');
      if (input) {
        name = input.value;
        input.addEventListener('input', e => name = e.target.value);
        setTimeout(() => Voice.wire(root.querySelector('.ob-slide')), 0);
        input.focus();
      }
      const favInput = document.getElementById('obFav');
      if (favInput) {
        favInput.addEventListener('input', e => fav = e.target.value);
        setTimeout(() => Voice.wire(root.querySelector('.ob-slide')), 0);
        root.querySelectorAll('.fav-chip').forEach(ch => ch.onclick = () => {
          fav = ch.dataset.fav;
          favInput.value = fav;
          root.querySelectorAll('.fav-chip').forEach(x => x.classList.remove('sel'));
          ch.classList.add('sel');
        });
      }
      document.getElementById('obNext').onclick = () => {
        if (last) {
          state.player.name = (name || '').trim();
          state.player.favCricketer = (fav || '').trim();
          state.settings.onboarded = true;
          save(state);
          root.innerHTML = '';
          done();
        } else { if (favInput) fav = favInput.value; idx++; render(); }
      };
      const back = document.getElementById('obBack');
      if (back) back.onclick = () => { if (input) name = input.value; idx--; render(); };
      document.getElementById('obSkip').onclick = () => {
        state.settings.onboarded = true;
        save(state);
        root.innerHTML = '';
        done();
      };
    }
    render();
  }

  return { start, needed: state => !state.settings.onboarded && !state.sessions.length };
})();
