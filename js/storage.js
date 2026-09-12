/* Storage layer: localStorage-backed, versioned, with export/import. */
const Storage = (() => {
  const KEY = 'cricketChronicles';
  const SCHEMA_VERSION = 1;

  const defaultData = () => ({
    schemaVersion: SCHEMA_VERSION,
    player: { name: '', createdAt: new Date().toISOString() },
    sessions: [],       // array of session objects, oldest first
    missions: [],       // focus missions derived from weaknesses/coach drills
    xpEvents: [],       // { at, amount, reason }
    badges: [],         // { id, at }
    rewardPoints: 0,
    pointsLog: [],      // { at, amount, reason }
    redemptions: [],    // { at, name, cost }
    rewards: [
      { id: 'r1', name: 'McD burger 🍔', cost: 80 },
      { id: 'r2', name: 'Roblox gift card 🎮', cost: 100 },
      { id: 'r3', name: 'Toy of your choice 🧸', cost: 150 },
      { id: 'r4', name: 'Dinner outside 🍕', cost: 250 },
      { id: 'r5', name: 'Lego set 🧱', cost: 300 }
    ],
    settings: { remindersOn: false, customActivities: [], coaches: [], supabaseUrl: '', supabaseAnonKey: '', syncCode: '' }
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultData();
      const data = JSON.parse(raw);
      const base = defaultData();
      return Object.assign(base, data, {
        player: Object.assign(base.player, data.player),
        settings: Object.assign(base.settings, data.settings)
      });
    } catch (e) {
      console.error('Failed to load data', e);
      return defaultData();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save data', e);
      alert('Could not save data! Storage may be full. Please export a backup.');
      return false;
    }
  }

  function exportJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cricket-chronicles-backup-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!Array.isArray(data.sessions)) throw new Error('Not a valid backup file');
          resolve(data);
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  return { load, save, exportJSON, importJSON, defaultData };
})();
