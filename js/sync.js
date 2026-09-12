/* Cloud sync: whole-chronicle JSON in a Supabase table (free tier).
   Strategy: pull-and-merge on launch, auto-push (debounced) after every save.
   Merge = union of sessions/badges/missions/xpEvents by id, so two devices
   can both add sessions without losing either side. */
const Sync = (() => {

  const cfg = () => App.state.settings;
  const configured = () => cfg().supabaseUrl && cfg().supabaseAnonKey && cfg().syncCode;

  const headers = () => ({
    'Content-Type': 'application/json',
    'apikey': cfg().supabaseAnonKey,
    'Authorization': 'Bearer ' + cfg().supabaseAnonKey,
    'Prefer': 'resolution=merge-duplicates'
  });

  function rowUrl(select) {
    const u = cfg().supabaseUrl.replace(/\/+$/, '');
    const q = select ? '?select=*&code=eq.' + encodeURIComponent(cfg().syncCode) : '';
    return `${u}/rest/v1/chronicles${q}`;
  }

  async function fetchRow() {
    const res = await fetch(rowUrl(true), { headers: headers() });
    if (!res.ok) throw new Error('Cloud read failed (' + res.status + ')');
    const rows = await res.json();
    return rows[0] || null;
  }

  async function upsert(data) {
    const body = JSON.stringify({
      code: cfg().syncCode,
      data: data,
      updated_at: new Date().toISOString()
    });
    const res = await fetch(rowUrl(false), { method: 'POST', headers: headers(), body });
    if (!res.ok && res.status !== 201 && res.status !== 204) {
      throw new Error('Cloud write failed (' + res.status + ')');
    }
  }

  /* Merge remote doc into local state (in place). Returns true if changed. */
  function mergeInto(local, remote) {
    let changed = false;

    const byId = arr => Object.fromEntries(arr.map(x => [x.id, x]));
    const mergeArr = (key) => {
      const map = byId(local[key]);
      for (const item of remote[key] || []) {
        if (!map[item.id]) { local[key].push(item); changed = true; }
      }
    };
    mergeArr('sessions'); mergeArr('badges'); mergeArr('missions'); mergeArr('xpEvents');

    if (remote.player && remote.player.name && remote.player.name !== local.player.name) {
      local.player.name = remote.player.name; changed = true;
    }
    return changed;
  }

  async function fullSync(quiet) {
    if (!configured()) return { ok: false, reason: 'not-configured' };
    try {
      const row = await fetchRow();
      const remote = row ? row.data : null;
      if (!remote) {
        // First sync ever: seed the cloud with local data.
        await upsert(App.state);
        return { ok: true, action: 'seeded' };
      }
      const changed = mergeInto(App.state, remote);
      if (changed) Storage.save(App.state);
      // Always push merged result so the cloud holds the union.
      await upsert(App.state);
      return { ok: true, action: changed ? 'merged' : 'synced', changed };
    } catch (e) {
      if (!quiet) App.toast('Sync failed: ' + e.message + ' 😕', 4000);
      return { ok: false, reason: e.message };
    }
  }

  /* Debounced auto-push after local saves. */
  let timer = null;
  function onSave() {
    if (!configured()) return;
    clearTimeout(timer);
    timer = setTimeout(() => fullSync(true), 3000);
  }

  function init() {
    if (!configured()) return;
    fullSync(true).then(res => {
      if (res.ok && res.changed) App.refresh();
    });
  }

  return { configured, fullSync, onSave, init };
})();
