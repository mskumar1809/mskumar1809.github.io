/* Post-session wizard: step-by-step, kid-friendly. */
const Wizard = (() => {

  const ACTIVITIES = {
    Batting:  ['Front foot drive', 'Back foot punch', 'Pull shot', 'Cut shot', 'Sweep', 'Defence', 'Running between wickets', 'Throwdowns', 'Power hitting'],
    Bowling:  ['Fast bowling', 'Swing bowling', 'Spin bowling', 'Yorkers', 'Bouncers', 'Slower balls', 'Line & length drills', 'Bowling at stumps'],
    Fielding: ['Catching (high)', 'Catching (close)', 'Ground fielding', 'Direct hits / throwing', 'Under-arm throws', 'Diving stops', 'Wicket keeping'],
    Fitness:  ['Running / sprints', 'Stretching', 'Strength exercises', 'Agility ladder', 'Cool down']
  };

  const MATCH_EVENTS = {
    'What I did': ['Batted', 'Bowled', 'Wicket keeping', 'Fielding', 'Captaincy'],
    'How I got out': ['Did not bat', 'Not out', 'Bowled', 'Caught', 'LBW', 'Run out', 'Stumped'],
    'Highlights': ['Half-century', 'Century', '3-wicket haul', '5-wicket haul', 'Great catch', 'Run out', 'Direct hit', 'Match win']
  };

  const MIND_FEELINGS = [
    { v: 'calm',      icon: '😌', label: 'Calm & focused' },
    { v: 'confident', icon: '😎', label: 'Confident' },
    { v: 'nervous',   icon: '😬', label: 'A bit nervous' },
    { v: 'frustrated',icon: '😤', label: 'Frustrated' },
    { v: 'excited',   icon: '🤩', label: 'Super excited' },
    { v: 'tired',     icon: '🥱', label: 'Tired' }
  ];

  const STEPS = ['type', 'activities', 'scores', 'strengths', 'injury', 'mind', 'coach', 'review'];
  const MATCH_PRE = ['type', 'matchpre', 'review'];
  const MATCH_POST = ['activities', 'scores', 'strengths', 'injury', 'mind', 'coach', 'retro', 'review'];

  // Matches: plan first (date/opponent/targets), report later (post-match).
  function stepsFor(s) {
    if (s.type === 'match') return s.__post ? MATCH_POST : MATCH_PRE;
    return STEPS;
  }

  // Open the post-match report for an already-planned match.
  function startPost(state, save, refresh, session) {
    session.__post = true;
    render(state, save, refresh, 0, session);
  }

  function start(state, save, refresh) {
    const session = {
      id: 's' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: null, activities: [],
      scores: { batting: null, bowling: null, fielding: null, overall: null },
      matchScore: '',       // free text: runs/wickets etc.
      matchStats: null,     // structured match stats (matches only)
      targets: [],          // pre-match personal targets
      targetsStatus: [],    // achieved flags, parallel to targets
      highlights: [],       // free-text personal bests
      retrospective: '',    // what could have been done better
      strengths: '', weaknesses: '',
      injury: { happened: null, what: '', preventable: null, lesson: '' },
      mind: { feelings: [], rating: null, thoughts: '' },
      coach: { name: '', rating: null, feedback: '', drills: '' },
      focusNote: ''         // did you work on a focus area today?
    };
    render(state, save, refresh, 0, session);
  }

  function render(state, save, refresh, stepIdx, s) {
    const steps = stepsFor(s);
    const step = steps[stepIdx];
    const view = document.getElementById('view');
    const pct = Math.round((stepIdx / (steps.length - 1)) * 100);
    view.innerHTML = `
      <div class="wizard">
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="step-count">Step ${stepIdx + 1} of ${steps.length}</div>
        <div class="card" id="stepCard"></div>
        <div class="wizard-nav">
          ${stepIdx > 0 ? '<button class="btn secondary" id="wBack">← Back</button>' : ''}
          <button class="btn primary" id="wNext">${stepIdx === steps.length - 1 ? '🏁 Save Session' : 'Next →'}</button>
        </div>
      </div>`;

    const card = document.getElementById('stepCard');
    const next = () => {
      if (!validate(step, s)) return;
      if (stepIdx === steps.length - 1) finish(state, save, refresh, s);
      else render(state, save, refresh, stepIdx + 1, s);
    };
    document.getElementById('wNext').onclick = next;
    const back = document.getElementById('wBack');
    if (back) back.onclick = () => render(state, save, refresh, stepIdx - 1, s);

    const bind = (sel, ev, fn) => { const el = card.querySelector(sel); if (el) el.addEventListener(ev, fn); };

    if (step === 'type') {
      card.innerHTML = `<h2>What did you do today? 🏏</h2>
        <label class="field-label">Date</label>
        <input type="date" id="wDate" value="${s.date}" max="${new Date().toISOString().slice(0,10)}">
        <div class="type-grid">
          ${Object.entries(Game.SESSION_TYPES).map(([k, t]) => `
            <button class="type-card ${s.type === k ? 'sel' : ''}" data-type="${k}">
              <span class="type-icon">${t.icon}</span><span>${t.label}</span>
            </button>`).join('')}
        </div>`;
      bind('#wDate', 'change', e => s.date = e.target.value);
      card.querySelectorAll('.type-card').forEach(b => b.onclick = () => {
        s.type = b.dataset.type;
        card.querySelectorAll('.type-card').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
      });
    }

    if (step === 'matchpre') {
      if (!s.matchStats) s.matchStats = { runs: '', balls: '', howOut: '', wickets: '', conceded: '', overs: '', extras: '', catches: '', runOuts: '', result: null, opponent: '', margin: '' };
      card.innerHTML = `<h2>Match Plan 📋</h2>
        <p class="hint">Set this up BEFORE the match — when and against whom, plus your personal targets</p>
        <label class="field-label">Match date 📅</label>
        <input type="date" id="mpDate" value="${s.date}">
        <label class="field-label">Opponent 🆚</label>
        <input type="text" id="mpOpponent" placeholder="e.g. Riverside CC U-10s" value="${escapeHTML(s.matchStats.opponent)}">
        <label class="field-label">My targets 🎯</label>
        <div class="chips" id="targetChips">
          ${s.targets.map((t, i) => `<button class="chip sel" data-ti="${i}">🎯 ${escapeHTML(t)} ✕</button>`).join('')}
        </div>
        <div class="add-own">
          <input type="text" id="newTargetInput" placeholder="e.g. score 15 runs, take my first wicket, stay NOT OUT">
          <button class="btn secondary" id="addTargetBtn">➕ Add</button>
        </div>
        <p class="hint">After the match, open the 🏟️ Matches tab to fill in your post-match report — each achieved target earns reward points! 🎁</p>`;
      bind('#mpDate', 'change', e => s.date = e.target.value);
      bind('#mpOpponent', 'input', e => s.matchStats.opponent = e.target.value);
      const addTarget = () => {
        const inp = card.querySelector('#newTargetInput');
        const val = inp.value.trim();
        if (!val) return;
        s.targets.push(val);
        s.targetsStatus.push(false);
        inp.value = '';
        render(state, save, refresh, stepIdx, s);
      };
      card.querySelector('#addTargetBtn').onclick = addTarget;
      card.querySelector('#newTargetInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTarget(); } });
      card.querySelectorAll('#targetChips .chip').forEach(c => c.onclick = () => {
        const i = +c.dataset.ti;
        s.targets.splice(i, 1);
        s.targetsStatus.splice(i, 1);
        render(state, save, refresh, stepIdx, s);
      });
    }

    if (step === 'activities') {
      const isMatch = s.type === 'match';
      const groups = isMatch ? MATCH_EVENTS : ACTIVITIES;
      const customs = state.settings.customActivities || [];
      card.innerHTML = `<h2>${isMatch ? 'What happened in the match? 🏟️' : 'What did you work on? ✅'}</h2>
        <p class="hint">${isMatch ? 'Tap everything that happened — roles, how you got out, highlights' : 'Tap everything you did today'}</p>
        <div class="act-group"><div class="act-title">${isMatch ? 'Anything else to add?' : 'My own drills'}</div>
          <div class="chips" id="customChips">
            ${customs.map(a => `<button class="chip ${s.activities.includes(a) ? 'sel' : ''}" data-act="${escapeHTML(a)}">${escapeHTML(a)}</button>`).join('')}
          </div>
          <div class="add-own">
            <input type="text" id="newActInput" placeholder="${isMatch ? 'Anything not listed? Type it here…' : 'Not in the list? Type it here…'}">
            <button class="btn secondary" id="addActBtn">➕ Add</button>
          </div>
        </div>
        <div class="act-group"><div class="act-title">My personal bests & highlights ⭐</div>
          <p class="hint small">First wicket? 10 runs NOT OUT? 2 catches? Anything YOU are proud of!</p>
          <div class="chips" id="highlightChips">
            ${s.highlights.map((h, i) => `<button class="chip sel" data-hi="${i}">⭐ ${escapeHTML(h)} ✕</button>`).join('')}
          </div>
          <div class="add-own">
            <input type="text" id="newHighlightInput" placeholder="e.g. took my first wicket!, 10 runs NOT OUT">
            <button class="btn secondary" id="addHighlightBtn">➕ Add</button>
          </div>
        </div>
        ${Object.entries(groups).filter(([g]) => g !== 'Highlights').map(([group, items]) => `
          <div class="act-group"><div class="act-title">${group}</div>
          <div class="chips">${items.map(a => `
            <button class="chip ${s.activities.includes(a) ? 'sel' : ''}" data-act="${a}">${a}</button>`).join('')}
          </div></div>`).join('')}`;
      const toggle = c => {
        const a = c.dataset.act;
        const i = s.activities.indexOf(a);
        if (i >= 0) { s.activities.splice(i, 1); c.classList.remove('sel'); }
        else { s.activities.push(a); c.classList.add('sel'); }
      };
      card.querySelectorAll('.chip').forEach(c => c.onclick = () => toggle(c));

      const addHighlight = () => {
        const inp = card.querySelector('#newHighlightInput');
        const val = inp.value.trim();
        if (!val) return;
        s.highlights.push(val);
        inp.value = '';
        render(state, save, refresh, stepIdx, s);
      };
      const addHlBtn = card.querySelector('#addHighlightBtn');
      if (addHlBtn) {
        addHlBtn.onclick = addHighlight;
        card.querySelector('#newHighlightInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } });
        card.querySelectorAll('#highlightChips .chip').forEach(c => c.onclick = () => {
          s.highlights.splice(+c.dataset.hi, 1);
          render(state, save, refresh, stepIdx, s);
        });
      }

      const addCustom = () => {
        const inp = card.querySelector('#newActInput');
        const val = inp.value.trim();
        if (!val) return;
        state.settings.customActivities = state.settings.customActivities || [];
        if (!state.settings.customActivities.includes(val)) state.settings.customActivities.push(val);
        save(state);
        if (!s.activities.includes(val)) s.activities.push(val);
        const chip = document.createElement('button');
        chip.className = 'chip sel';
        chip.dataset.act = val;
        chip.textContent = val;
        chip.onclick = () => toggle(chip);
        card.querySelector('#customChips').appendChild(chip);
        inp.value = '';
        inp.focus();
      };
      card.querySelector('#addActBtn').onclick = addCustom;
      card.querySelector('#newActInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } });
    }

    if (step === 'scores') {
      if (!s.matchStats) s.matchStats = { runs: '', balls: '', howOut: '', wickets: '', conceded: '', overs: '', extras: '', catches: '', runOuts: '', result: null, opponent: '', margin: '' };
      const ms = s.matchStats;
      card.innerHTML = `<h2>${s.type === 'match' ? 'Match Stats & Result 📊' : 'How did it go? ⭐'}</h2>
        <p class="hint">${s.type === 'match' ? 'Fill what applies — leave the rest blank' : 'Rate yourself — be honest, that\'s how champions grow!'}</p>
        ${s.type === 'match' ? `
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-box-title">🏏 Batting</div>
              <input type="number" inputmode="numeric" id="msRuns" placeholder="Runs scored" min="0" value="${ms.runs}">
              <input type="number" inputmode="numeric" id="msBalls" placeholder="Balls faced" min="0" value="${ms.balls}">
              <input type="text" id="msHowOut" placeholder="How out? (bowled / caught / not out…)" value="${escapeHTML(ms.howOut)}">
            </div>
            <div class="stat-box">
              <div class="stat-box-title">⚽ Bowling</div>
              <input type="number" inputmode="decimal" id="msOvers" placeholder="Overs bowled (e.g. 2.4)" min="0" value="${ms.overs}">
              <input type="number" inputmode="numeric" id="msWickets" placeholder="Wickets taken" min="0" value="${ms.wickets}">
              <input type="number" inputmode="numeric" id="msConceded" placeholder="Runs conceded" min="0" value="${ms.conceded}">
              <input type="number" inputmode="numeric" id="msExtras" placeholder="Extras (wides / no-balls)" min="0" value="${ms.extras}">
            </div>
            <div class="stat-box">
              <div class="stat-box-title">🧤 Fielding</div>
              <input type="number" inputmode="numeric" id="msCatches" placeholder="Catches" min="0" value="${ms.catches}">
              <input type="number" inputmode="numeric" id="msRunOuts" placeholder="Run outs" min="0" value="${ms.runOuts}">
            </div>
            <div class="stat-box">
              <div class="stat-box-title">🏆 Match Result</div>
              <div class="result-row">
                ${['won', 'lost', 'tied', 'draw'].map(r => `<button class="result-btn ${ms.result === r ? 'sel' : ''}" data-r="${r}">${r === 'won' ? '🎉 Won' : r === 'lost' ? '😢 Lost' : r === 'tied' ? '🤝 Tied' : '⏸️ Draw'}</button>`).join('')}
              </div>
              <input type="text" id="msOpponent" placeholder="vs whom? (opponent team)" value="${escapeHTML(ms.opponent)}">
              <input type="text" id="msMargin" placeholder="Margin (e.g. by 12 runs / 3 wickets)" value="${escapeHTML(ms.margin)}">
            </div>
          </div>
          <label class="field-label">And how do YOU feel you played? ⭐</label>
        ` : ''}
        ${[['batting', '🏏 Batting'], ['bowling', '⚽ Bowling'], ['fielding', '🧤 Fielding'], ['overall', '🌟 Overall']].map(([k, label]) => `
          <div class="rate-row"><span>${label}</span>
          <div class="stars" data-key="${k}">
            ${[1,2,3,4,5].map(n => `<button class="star ${s.scores[k] >= n ? 'on' : ''}" data-n="${n}">★</button>`).join('')}
          </div></div>`).join('')}
        ${s.type === 'match' ? '' : `
        <label class="field-label">Scores or results (runs, wickets, catches…)</label>
        <input type="text" id="wMatchScore" placeholder="e.g. 34 runs, 2 wickets, 3 catches" value="${s.matchScore.replace(/"/g, '&quot;')}">`}`;
      const num = (id, key) => { const el = card.querySelector('#' + id); if (el) el.addEventListener('input', e => ms[key] = e.target.value); };
      const txt = (id, key) => { const el = card.querySelector('#' + id); if (el) el.addEventListener('input', e => ms[key] = e.target.value); };
      if (s.type === 'match') {
        num('msRuns', 'runs'); num('msBalls', 'balls'); txt('msHowOut', 'howOut');
        num('msOvers', 'overs'); num('msWickets', 'wickets'); num('msConceded', 'conceded'); num('msExtras', 'extras');
        num('msCatches', 'catches'); num('msRunOuts', 'runOuts');
        txt('msOpponent', 'opponent'); txt('msMargin', 'margin');
        card.querySelectorAll('.result-btn').forEach(b => b.onclick = () => {
          ms.result = ms.result === b.dataset.r ? null : b.dataset.r;
          card.querySelectorAll('.result-btn').forEach(x => x.classList.toggle('sel', ms.result === x.dataset.r));
        });
      }
      card.querySelectorAll('.stars').forEach(row => row.querySelectorAll('.star').forEach(st => st.onclick = () => {
        const k = row.dataset.key, n = +st.dataset.n;
        s.scores[k] = s.scores[k] === n ? null : n;
        row.querySelectorAll('.star').forEach(x => x.classList.toggle('on', s.scores[k] >= +x.dataset.n));
      }));
      const msEl = card.querySelector('#wMatchScore');
      if (msEl) msEl.addEventListener('input', e => s.matchScore = e.target.value);
    }

    if (step === 'strengths') {
      const openMissions = state.missions.filter(m => !m.completedAt);
      card.innerHTML = `<h2>Superpowers & Growth 🌱</h2>
        <label class="field-label">💪 My strengths today</label>
        <textarea id="wStr" rows="3" placeholder="What went really well? e.g. my driving was strong">${s.strengths}</textarea>
        <label class="field-label">🔧 What I need to work on</label>
        <textarea id="wWeak" rows="3" placeholder="e.g. I keep getting out to short balls">${s.weaknesses}</textarea>
        ${openMissions.length ? `
          <label class="field-label">🎯 Did you practise a focus mission today?</label>
          ${openMissions.map(m => `
            <button class="mission-pick ${s.focusNote === m.weaknessText ? 'sel' : ''}" data-mid="${m.id}">
              ${m.progress}/${m.targetCount} — ${escapeHTML(m.weaknessText)}
            </button>`).join('')}` : ''}`;
      bind('#wStr', 'input', e => s.strengths = e.target.value);
      bind('#wWeak', 'input', e => s.weaknesses = e.target.value);
      card.querySelectorAll('.mission-pick').forEach(b => b.onclick = () => {
        const m = state.missions.find(x => x.id === b.dataset.mid);
        s.focusNote = s.focusNote === m.weaknessText ? '' : m.weaknessText;
        card.querySelectorAll('.mission-pick').forEach(x => x.classList.remove('sel'));
        if (s.focusNote) b.classList.add('sel');
      });
    }

    if (step === 'injury') {
      card.innerHTML = `<h2>Body check 🩺</h2>
        <p class="hint">Did anything hurt or get injured today?</p>
        <div class="yesno">
          <button class="btn ${s.injury.happened === false ? 'primary' : 'secondary'}" id="injNo">🙌 No, all good!</button>
          <button class="btn ${s.injury.happened === true ? 'primary' : 'secondary'}" id="injYes">😕 Yes</button>
        </div>
        ${s.injury.happened ? `
          <label class="field-label">What happened?</label>
          <input type="text" id="injWhat" placeholder="e.g. got hit on the thumb, sore shoulder" value="${s.injury.what.replace(/"/g, '&quot;')}">
          <label class="field-label">Do you think it could have been prevented?</label>
          <div class="yesno">
            <button class="btn ${s.injury.preventable === true ? 'primary' : 'secondary'}" id="prevYes">👍 Yes</button>
            <button class="btn ${s.injury.preventable === false ? 'primary' : 'secondary'}" id="prevNo">👎 No</button>
          </div>
          ${s.injury.preventable ? `
            <label class="field-label">What could prevent it next time? 🎓</label>
            <textarea id="injLesson" rows="3" placeholder="e.g. wear a chest guard, warm up properly, correct technique">${s.injury.lesson}</textarea>` : ''
        }` : ''}`;
      const yes = document.getElementById('injYes'), no = document.getElementById('injNo');
      if (yes) yes.onclick = () => { s.injury.happened = true; render(state, save, refresh, stepIdx, s); };
      if (no) no.onclick = () => { s.injury.happened = false; render(state, save, refresh, stepIdx, s); };
      bind('#injWhat', 'input', e => s.injury.what = e.target.value);
      const py = document.getElementById('prevYes'), pn = document.getElementById('prevNo');
      if (py) py.onclick = () => { s.injury.preventable = true; render(state, save, refresh, stepIdx, s); };
      if (pn) pn.onclick = () => { s.injury.preventable = false; render(state, save, refresh, stepIdx, s); };
      const lesson = card.querySelector('#injLesson');
      if (lesson) lesson.addEventListener('input', e => s.injury.lesson = e.target.value);
    }

    if (step === 'mind') {
      card.innerHTML = `<h2>Mind Power 🧠</h2>
        <p class="hint">How did you feel during the session or match? Tap all the feelings you had!</p>
        <div class="feelings">
          ${MIND_FEELINGS.map(f => `
            <button class="feel ${s.mind.feelings.includes(f.v) ? 'sel' : ''}" data-v="${f.v}">
              <span class="feel-icon">${f.icon}</span><span>${f.label}</span>
            </button>`).join('')}
        </div>
        <label class="field-label">Mind strength rating</label>
        <div class="stars big" id="mindStars">
          ${[1,2,3,4,5].map(n => `<button class="star ${s.mind.rating >= n ? 'on' : ''}" data-n="${n}">★</button>`).join('')}
        </div>
        <label class="field-label">What was going on in your head? 💭</label>
        <textarea id="wMindText" rows="3" placeholder="e.g. I stayed calm when the bowler sledged me; I got upset after dropping a catch">${s.mind.thoughts}</textarea>`;
      card.querySelectorAll('.feel').forEach(b => b.onclick = () => {
        const v = b.dataset.v;
        const i = s.mind.feelings.indexOf(v);
        if (i >= 0) { s.mind.feelings.splice(i, 1); b.classList.remove('sel'); }
        else { s.mind.feelings.push(v); b.classList.add('sel'); }
      });
      card.querySelectorAll('#mindStars .star').forEach(st => st.onclick = () => {
        const n = +st.dataset.n;
        s.mind.rating = s.mind.rating === n ? null : n;
        card.querySelectorAll('#mindStars .star').forEach(x => x.classList.toggle('on', s.mind.rating >= +x.dataset.n));
      });
      bind('#wMindText', 'input', e => s.mind.thoughts = e.target.value);
    }

    if (step === 'coach') {
      card.innerHTML = `<h2>Coach's Corner 👨‍🏫</h2>
        <p class="hint">Hand the phone to your coach — this part is typed by the Coach, in their own words! (Skip if no coach today)</p>
        <label class="field-label">Coach's name</label>
        <input type="text" id="coachName" list="coachList" placeholder="e.g. Coach Ravi" value="${s.coach.name.replace(/"/g, '&quot;')}">
        ${(state.settings.coaches || []).length ? `<datalist id="coachList">${state.settings.coaches.map(c => `<option value="${escapeHTML(c)}">`).join('')}</datalist>` : ''}
        <label class="field-label">How I rate today's session</label>
        <div class="stars big" id="coachStars">
          ${[1,2,3,4,5].map(n => `<button class="star ${s.coach.rating >= n ? 'on' : ''}" data-n="${n}">★</button>`).join('')}
        </div>
        <label class="field-label">My feedback today</label>
        <textarea id="coachFeedback" rows="3" placeholder="e.g. Great bat swing and balance today. But your head falls over on the leg side when playing across.">${s.coach.feedback}</textarea>
        <label class="field-label">Drills I want practised before the next session 🎯</label>
        <textarea id="coachDrills" rows="3" placeholder="e.g. Shadow batting with head still — 10 mins every day. 20 throwdowns on the short ball.">${s.coach.drills}</textarea>`;
      bind('#coachName', 'input', e => s.coach.name = e.target.value);
      card.querySelectorAll('#coachStars .star').forEach(st => st.onclick = () => {
        const n = +st.dataset.n;
        s.coach.rating = s.coach.rating === n ? null : n;
        card.querySelectorAll('#coachStars .star').forEach(x => x.classList.toggle('on', s.coach.rating >= +x.dataset.n));
      });
      bind('#coachFeedback', 'input', e => s.coach.feedback = e.target.value);
      bind('#coachDrills', 'input', e => s.coach.drills = e.target.value);
    }

    if (step === 'retro') {
      card.innerHTML = `<h2>Match Retrospective 🔍</h2>
        <p class="hint">The best players dissect every match. Let's see how you did against your targets!</p>
        ${s.targets.length ? `
          <label class="field-label">🎯 Did you achieve your targets?</label>
          ${s.targets.map((t, i) => `
            <button class="target-check ${s.targetsStatus[i] ? 'achieved' : ''}" data-ti="${i}">
              ${s.targetsStatus[i] ? '✅' : '⬜'} ${escapeHTML(t)} ${s.targetsStatus[i] ? '· +5 🎁' : ''}
            </button>`).join('')}
        ` : '<p class="hint">No targets were set before this match — set some next time to earn bonus reward points!</p>'}
        <label class="field-label">🤔 What could have been done for a better result?</label>
        <textarea id="wRetro" rows="3" placeholder="e.g. I could have rotated strike instead of blocking; warmed up better before bowling">${s.retrospective}</textarea>
        <p class="hint">💡 Each achieved target = +5 reward points 🎁</p>`;
      card.querySelectorAll('.target-check').forEach(b => b.onclick = () => {
        const i = +b.dataset.ti;
        s.targetsStatus[i] = !s.targetsStatus[i];
        render(state, save, refresh, stepIdx, s);
      });
      bind('#wRetro', 'input', e => s.retrospective = e.target.value);
    }

    if (step === 'review') {
      const type = Game.SESSION_TYPES[s.type];
      if (s.type === 'match' && !s.__post) {
        card.innerHTML = `<h2>Match Plan Ready 📋</h2>
          <div class="review">
            <div class="review-row"><b>🏟️ Match${s.matchStats.opponent ? ' vs ' + escapeHTML(s.matchStats.opponent) : ''}</b> — ${formatDate(s.date)}</div>
            ${s.targets.length ? `<div class="review-row">🎯 ${s.targets.length} targets set:<br>${s.targets.map(t => '• ' + escapeHTML(t)).join('<br>')}</div>` : '<div class="review-row">No targets set yet — add some for bonus reward points!</div>'}
          </div>
          <div class="xp-preview">Good luck, champ! 🍀 Come back after the match for the post-match report.</div>`;
        document.getElementById('wNext').textContent = '🏁 Save Match Plan';
      } else {
      card.innerHTML = `<h2>All set? 📋</h2>
        <div class="review">
          <div class="review-row"><b>${type.icon} ${type.label}</b>${s.matchStats?.opponent ? ' vs ' + escapeHTML(s.matchStats.opponent) : ''} — ${formatDate(s.date)}</div>
          ${s.type === 'match' && s.matchStats ? matchStatsLine(s.matchStats) : ''}
          ${s.targets.length ? `<div class="review-row">🎯 Targets: ${Game.achievedTargets(s).length}/${s.targets.length} achieved</div>` : ''}
          ${s.highlights.length ? `<div class="review-row">⭐ ${s.highlights.map(escapeHTML).join(' · ')}</div>` : ''}
          ${s.activities.length ? `<div class="review-row">✅ ${s.type === 'match' ? s.activities.length + ' match events' : s.activities.length + ' activities'}</div>` : ''}
          ${Object.entries(s.scores).filter(([k, v]) => v).map(([k, v]) =>
            `<div class="review-row">${{batting:'🏏',bowling:'⚽',fielding:'🧤',overall:'🌟'}[k]} ${k}: ${'★'.repeat(v)}</div>`).join('')}
          ${s.matchScore ? `<div class="review-row">📊 ${escapeHTML(s.matchScore)}</div>` : ''}
          ${s.strengths ? `<div class="review-row">💪 ${escapeHTML(s.strengths)}</div>` : ''}
          ${s.weaknesses ? `<div class="review-row">🔧 Work on: ${escapeHTML(s.weaknesses)}</div>` : ''}
          ${s.retrospective ? `<div class="review-row">🔍 Retro: ${escapeHTML(s.retrospective)}</div>` : ''}
          ${s.injury.happened ? `<div class="review-row">🩺 Injury logged${s.injury.preventable ? ' + prevention lesson' : ''}</div>` : '<div class="review-row">🙌 No injuries</div>'}
          ${mindFeelingsOf(s).length ? `<div class="review-row">🧠 ${mindFeelingsOf(s).map(v => { const f = MIND_FEELINGS.find(x => x.v === v); return (f ? f.icon : ''); }).join(' ')}${s.mind.rating ? ` (${'★'.repeat(s.mind.rating)})` : ''}</div>` : ''}
          ${s.coach && (s.coach.feedback || s.coach.drills || s.coach.rating) ? `<div class="review-row">👨‍🏫 Coach${s.coach.name ? ' ' + escapeHTML(s.coach.name) : ''}${s.coach.rating ? ` (${'★'.repeat(s.coach.rating)})` : ''}${s.coach.drills ? ' + drills to practise' : ''}</div>` : ''}
        </div>
        <div class="xp-preview">You'll earn <b>+${Game.xpForSession(s)} XP</b>${Game.rpForSession(s).rp ? ` and <b>+${Game.rpForSession(s).rp} 🎁 reward points</b>` : ''} 🎉</div>`;
      }
    }

    window.scrollTo(0, 0);
    Voice.wire(card);
    if (step === 'activities' && s.type === 'match') Mascot.say(Mascot.LINES.activitiesMatch);
    else if (Mascot.LINES[step]) Mascot.say(pickLine(step));
  }

  function pickLine(step) {
    const l = Mascot.LINES[step];
    return Array.isArray(l) ? l[Math.floor(Math.random() * l.length)] : l;
  }

  function mindFeelingsOf(s) {
    if (Array.isArray(s.mind.feelings)) return s.mind.feelings;
    return s.mind.feeling ? [s.mind.feeling] : [];
  }

  function matchStatsLine(ms) {
    const bits = [];
    if (ms.runs !== '' || ms.balls !== '') bits.push(`🏏 ${ms.runs === '' ? '0' : ms.runs} runs${ms.balls !== '' ? ` off ${ms.balls} balls` : ''}${ms.howOut ? ' (' + escapeHTML(ms.howOut) + ')' : ''}`);
    if (ms.wickets !== '' || ms.overs !== '') bits.push(`⚽ ${ms.wickets === '' ? '0' : ms.wickets} wkts${ms.overs !== '' ? ` / ${ms.overs} ov` : ''}${ms.conceded !== '' ? ` for ${ms.conceded}` : ''}${ms.extras !== '' ? ` (${ms.extras} extras)` : ''}`);
    if (ms.catches !== '' || ms.runOuts !== '') bits.push(`🧤 ${ms.catches === '' ? '0' : ms.catches} catches, ${ms.runOuts === '' ? '0' : ms.runOuts} run outs`);
    if (ms.result) bits.push(ms.result === 'won' ? '🎉 WON' : ms.result === 'lost' ? '😢 Lost' : ms.result === 'tied' ? '🤝 Tied' : '⏸️ Draw');
    if (ms.margin) bits.push(escapeHTML(ms.margin));
    return bits.length ? `<div class="review-row">📊 ${bits.join(' · ')}</div>` : '';
  }

  function validate(step, s) {
    const msgs = {
      type: () => s.type ? null : 'Pick your session type first! 👆',
      injury: () => s.injury.happened === null ? 'Let us know if anything hurt today' : null,
      mind: () => s.mind.feelings.length ? null : 'Pick at least one feeling today 😊'
    };
    const err = msgs[step] && msgs[step]();
    if (err) { App.toast(err); return false; }
    return true;
  }

  function finish(state, save, refresh, s) {
    // Pre-match plan: store it as a planned match, tiny XP, done.
    if (s.type === 'match' && !s.__post) {
      s.status = 'planned';
      delete s.__post;
      state.sessions.push(s);
      Game.addXP(state, 5, 'Match planned');
      const newBadges = Game.checkBadges(state);
      save(state);
      App.toast('Match plan saved! +5 XP 📋 Good luck! 🍀');
      Mascot.say(`A match${s.matchStats.opponent ? ' vs ' + s.matchStats.opponent : ''}! Set your goals high — see you after the match! 🍀`, 7000);
      refresh('matches');
      if (newBadges.length) setTimeout(() => App.showBadgesModal(newBadges), 600);
      return;
    }

    if (s.__post) {
      delete s.__post;
      // replace the planned entry with the full post-match record
      const i = state.sessions.findIndex(x => x.id === s.id);
      if (i >= 0) state.sessions[i] = s; else state.sessions.push(s);
    } else {
      state.sessions.push(s);
    }
    s.status = 'played';
    if (s.coach?.name?.trim()) {
      state.settings.coaches = state.settings.coaches || [];
      const n = s.coach.name.trim();
      if (!state.settings.coaches.includes(n)) state.settings.coaches.push(n);
    }
    const xp = Game.xpForSession(s);
    const res = Game.addXP(state, xp, 'Session: ' + (Game.SESSION_TYPES[s.type]?.label || s.type));
    const { rp, why } = Game.rpForSession(s);
    Game.addRP(state, rp, why.join(' + ') || 'Session logged');
    Game.maybeGenerateMissions(state);
    if (s.coach?.drills?.trim()) Game.createMission(state, s.coach.drills.trim(), s.id, true);
    if (s.retrospective?.trim()) Game.createMission(state, s.retrospective.trim(), s.id, false);
    const doneMissions = Game.progressMissions(state, s);
    for (const m of doneMissions) { Game.addXP(state, m.rewardedXp, 'Focus mission complete!'); Game.addRP(state, 20, 'Focus mission complete'); }
    const newBadges = Game.checkBadges(state);
    save(state);

    let msg = `+${xp} XP earned! 🎉`;
    if (rp) msg += ` +${rp} 🎁 reward points!`;
    if (doneMissions.length) msg += ` Mission complete: +${doneMissions.reduce((t, m) => t + m.rewardedXp, 0)} XP 🎯`;
    if (res.leveledUp) msg += ` LEVEL UP! You're now ${res.level.icon} ${res.level.name}! 🎊`;
    App.toast(msg, 6000);
    Mascot.say(Mascot.LINES.saved(xp, rp), 7000);
    const achieved = Game.achievedTargets(s).length;
    if (achieved === (s.targets || []).length && achieved > 0) {
      setTimeout(() => Mascot.say(`UNBELIEVABLE! You achieved ALL ${achieved} targets! That's how champions do it! 💯🎉`, 8000), 7500);
    } else if (achieved) {
      setTimeout(() => Mascot.say(Mascot.LINES.savedTargets(achieved, achieved * 5), 7000), 7500);
    }

    refresh('home');
    if (newBadges.length) {
      setTimeout(() => App.showBadgesModal(newBadges), 600);
    }
  }

  function escapeHTML(t) { return String(t || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function formatDate(d) { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); }

  return { start, startPost, STEPS, ACTIVITIES, MIND_FEELINGS, formatDate, escapeHTML };
})();
