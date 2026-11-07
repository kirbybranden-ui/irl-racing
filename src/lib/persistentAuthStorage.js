/**
 * Persistent storage adapter for Supabase Auth.
 *
 * Supabase uses its normal refresh-token rotation and expiration rules; this
 * adapter only makes its *existing* storage survive localStorage failures.
 * Never use it to bypass Supabase's revocation/refresh checks.
 */
const DATABASE_NAME = "brl-device-auth-v1";
const STORE_NAME = "auth";
let dbPromise;

function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DATABASE_NAME, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => db.close();
          resolve(db);
        };
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch { resolve(null); }
    });
  }
  return dbPromise;
}

async function readBackup(key) {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
      request.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function writeBackup(key, value) {
  const db = await openDatabase();
  if (!db) return;
  await new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
      tx.onabort = resolve;
    } catch { resolve(); }
  });
}

async function deleteBackup(key) {
  const db = await openDatabase();
  if (!db) return;
  await new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
      tx.onabort = resolve;
    } catch { resolve(); }
  });
}

export const persistentAuthStorage = {
  async getItem(key) {
    let primary = null;
    try { primary = localStorage.getItem(key); } catch { /* storage blocked */ }
    if (primary !== null) {
      // Migrate sessions already saved by the pre-existing Supabase client.
      // Wait for the backup write so a subsequent reload cannot race it.
      await writeBackup(key, primary);
      return primary;
    }
    const backup = await readBackup(key);
    if (backup !== null) {
      try { localStorage.setItem(key, backup); } catch { /* storage blocked */ }
    }
    return backup;
  },
  async setItem(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage blocked */ }
    await writeBackup(key, value);
  },
  async removeItem(key) {
    try { localStorage.removeItem(key); } catch { /* storage blocked */ }
    await deleteBackup(key);
  },
};
