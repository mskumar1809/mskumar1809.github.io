/* Session media: coach videos/photos stored in IndexedDB (localStorage is
   too small for video). Media stays on this device — it is not cloud-synced. */
const Media = (() => {
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB per file

  let dbPromise;
  function open() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('ccMedia', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('media', { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function add(sessionId, file) {
    if (file.size > MAX_SIZE) throw new Error('File too big (max 100MB)');
    const db = await open();
    const rec = {
      id: 'v' + Date.now() + Math.random().toString(36).slice(2, 6),
      sessionId, name: file.name, type: file.type || 'video/mp4',
      size: file.size, blob: file, at: new Date().toISOString()
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction('media', 'readwrite');
      tx.objectStore('media').put(rec);
      tx.oncomplete = () => resolve(rec);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function list(sessionId) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction('media').objectStore('media').getAll();
      req.onsuccess = () => resolve(req.result.filter(m => m.sessionId === sessionId).sort((a, b) => a.at < b.at ? -1 : 1));
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(id) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('media', 'readwrite');
      tx.objectStore('media').delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function urlOf(rec) { return URL.createObjectURL(rec.blob); }

  return { add, list, remove, urlOf };
})();
