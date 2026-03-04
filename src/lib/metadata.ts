// @ts-ignore - Tell TS to relax about importing the specific browser bundle
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

export async function getTrackMetadata(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    new jsmediatags.Reader(url).read({
      onSuccess: (tag: any) => {
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

        resolve({
          title: title || "Unknown Title",
          artist: artist || "Unknown Artist",
          album: album || "Unknown Album",
          cover: imageUrl,
          trackNum: trackNum
        });
      },
      onError: (error: any) => {
        console.error("Error reading tags for:", url, error);
        reject(error);
      }
    });
  });
}
