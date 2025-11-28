
import { Story } from '@/types';

const DB_NAME = 'DreamWeaverDB';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject('Error opening IndexedDB');
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }
  return dbPromise;
};

export const saveStory = async (story: Story): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(story);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      console.error('Error saving story:', transaction.error);
      reject('Error saving story');
    };
  });
};

export const getStories = async (): Promise<Story[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        // Sort stories by creation date, newest first
        const sortedStories = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(sortedStories);
    };
    request.onerror = () => {
        console.error('Error fetching stories:', request.error);
        reject('Error fetching stories');
    };
  });
};

export const deleteStory = async (id: string): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      console.error('Error deleting story:', transaction.error);
      reject('Error deleting story');
    };
  });
};
