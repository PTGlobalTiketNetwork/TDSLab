import { openDB, DBSchema } from 'idb';

interface HandoffDB extends DBSchema {
  assets: {
    key: string;
    value: Blob;
  };
}

const DB_NAME = 'figma-make-handoff';
const STORE_NAME = 'assets';

export const handoffStore = {
  async set(key: string, blob: Blob): Promise<void> {
    const db = await openDB<HandoffDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
    await db.put(STORE_NAME, blob, key);
  },

  async get(key: string): Promise<Blob | undefined> {
    const db = await openDB<HandoffDB>(DB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });
    return await db.get(STORE_NAME, key);
  },

  async delete(key: string): Promise<void> {
    const db = await openDB<HandoffDB>(DB_NAME, 1);
    await db.delete(STORE_NAME, key);
  }
};
