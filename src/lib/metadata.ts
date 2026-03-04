// @ts-ignore - Tell TS to relax about importing the specific browser bundle
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

const DB_NAME = 'TugsTugsMetadata';
const STORE_NAME = 'tracks';

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

async function getSavedMetadata(url: string): Promise<any> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMetadataLocally(url: string, data: any): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, url);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

const memoryCache = new Map();

export async function getTrackMetadata(url: string): Promise<any> {
  
  if (memoryCache.has(url)) {
    return memoryCache.get(url);
  }

  try {
    const savedData = await getSavedMetadata(url);
    if (savedData) {
      memoryCache.set(url, savedData);
      return savedData;
    }
  } catch (e) {
    console.warn("Could not read from IndexedDB", e);
  }

  return new Promise((resolve, reject) => {
    new jsmediatags.Reader(url).read({
      onSuccess: async (tag: any) => {
        const { title, artist, album, picture, track } = tag.tags;
        
        let imageUrl = null;
        if (picture) {
          const { data, format } = picture;
          let base64String = "";
          for (let i = 0; i < data.length; i++) {
            base64String += String.fromCharCode(data[i]);
          }
          imageUrl = `data:${format};base64,${window.btoa(base64String)}`;
        }

        let trackNum = 999; 
        if (track) {
          const parsed = parseInt(track.toString().split('/')[0]);
          if (!isNaN(parsed)) trackNum = parsed;
        }

        const finalData = {
          title: title || "Unknown Title",
          artist: artist || "Unknown Artist",
          album: album || "Unknown Album",
          cover: imageUrl,
          trackNum: trackNum
        };

        memoryCache.set(url, finalData);
        try {
          await saveMetadataLocally(url, finalData);
        } catch(e) { 
          console.error("Failed to save to local DB", e); 
        }

        resolve(finalData);
      },
      onError: (error: any) => {
        console.error("Error reading tags for:", url, error);
        reject(error);
      }
    });
  });
}
