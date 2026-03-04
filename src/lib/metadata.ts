// @ts-ignore
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

const DB_NAME = 'TugsTugsMetadata';
const STORE_NAME = 'tracks';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        db.createObjectStore(STORE_NAME);
      };
      
      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event: any) => {
        dbPromise = null;
        reject(event.target.error);
      };
    });
  }
  return dbPromise;
}

async function getSavedMetadata(url: string): Promise<any> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return null;
  }
}

async function saveMetadataLocally(url: string, data: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, url);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Could not save to IndexedDB", e);
  }
}

const memoryCache = new Map();

export async function getTrackMetadata(url: string): Promise<any> {
  if (memoryCache.has(url)) return memoryCache.get(url);

  const savedData = await getSavedMetadata(url);
  if (savedData) {
    memoryCache.set(url, savedData);
    return savedData;
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
        const rawTrack = track || tag.tags.trkn?.data; 
        if (Array.isArray(rawTrack)) trackNum = rawTrack[0]; 
        else if (rawTrack) trackNum = parseInt(rawTrack.toString().split('/')[0]) || trackNum;

        let discNum = 1;
        if (tag.tags.TPOS) discNum = parseInt(tag.tags.TPOS.data.toString().split('/')[0]) || 1;
        else if (tag.tags.disk) {
          const d = tag.tags.disk.data;
          if (Array.isArray(d)) discNum = d[0] || 1;
          else if (typeof d === 'string') discNum = parseInt(d.split('/')[0]) || 1;
          else if (d && d.disk) discNum = d.disk;
        } else if (tag.tags.discnumber) discNum = parseInt(tag.tags.discnumber.data?.toString().split('/')[0]) || 1;

        const finalData = {
          title: title || "Unknown Title",
          artist: artist || "Unknown Artist",
          album: album || "Unknown Album",
          cover: imageUrl,
          trackNum: trackNum,
          discNum: discNum 
        };

        memoryCache.set(url, finalData);
        await saveMetadataLocally(url, finalData);
        resolve(finalData);
      },
      onError: (error: any) => reject(error)
    });
  });
}
