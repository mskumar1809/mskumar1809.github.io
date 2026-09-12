/* Voice input: Web Speech API mic buttons on text fields. */
const Voice = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function wire(container) {
    if (!SR) return;
    container.querySelectorAll('textarea, input[type="text"]').forEach(inp => {
      if (inp.dataset.voiced) return;
      inp.dataset.voiced = '1';
      const mic = document.createElement('button');
      mic.type = 'button';
      mic.className = 'mic';
      mic.textContent = '🎤';
      mic.title = 'Tap and speak';
      mic.onclick = () => listen(inp, mic);
      const wrap = document.createElement('div');
      wrap.className = 'voice-wrap';
      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(inp);
      wrap.appendChild(mic);
    });
  }

  let active = null;
  function listen(inp, mic) {
    if (active) { active.stop(); return; }
    const rec = new SR();
    rec.lang = navigator.language || 'en-IN';
    rec.interimResults = true;
    rec.continuous = false;
    active = rec;
    mic.classList.add('rec');
    mic.textContent = '🔴';
    const base = inp.value ? inp.value + ' ' : '';
    let finals = '';
    rec.onresult = e => {
      let interim = '';
      for (const r of e.results) {
        if (r.isFinal) finals += r[0].transcript;
        else interim += r[0].transcript;
      }
      inp.value = base + finals + interim;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const done = () => {
      mic.classList.remove('rec');
      mic.textContent = '🎤';
      if (active === rec) active = null;
    };
    rec.onend = () => {
      if (finals) { inp.value = base + finals; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      done();
    };
    rec.onerror = () => done();
    try { rec.start(); } catch (e) { done(); }
  }

  return { wire, supported: !!SR };
})();
