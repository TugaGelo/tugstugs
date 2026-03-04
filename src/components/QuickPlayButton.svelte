<script>
  import { getTrackMetadata } from '../lib/metadata';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';
  import { currentSong, currentTitle, currentIndex, playlist } from '../lib/store';

  export let rawPaths = [];
  
  let isLoading = false;

  async function handleQuickPlay(e) {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || rawPaths.length === 0) return;
    isLoading = true;

    const promises = rawPaths.map(async (path) => {
      const cleanFallbackTitle = path.split('/').pop().replace(/\.(mp3|m4a)$/i, "");
      try {
        const url = `${PUBLIC_BUCKET_URL}/${path}`;
        const data = await getTrackMetadata(url);
        return {
          path,
          title: data.title !== "Unknown Title" ? data.title : cleanFallbackTitle,
          artist: data.artist !== "Unknown Artist" ? data.artist : "Unknown Artist",
          trackNum: data.trackNum || 999,
          discNum: data.discNum || 1,
          cover: data.cover
        };
      } catch(err) {
        return { path, title: cleanFallbackTitle, artist: "Unknown Artist", trackNum: 999, discNum: 1, cover: null };
      }
    });

    const results = await Promise.all(promises);

    results.sort((a, b) => {
      if (a.discNum !== b.discNum) return a.discNum - b.discNum;
      return a.trackNum - b.trackNum;
    });

    const firstValid = results.find(t => t.cover) || results[0];
    const finalPlaylist = results.map(t => ({
      path: t.path,
      title: t.title,
      cover: t.cover || (firstValid ? firstValid.cover : null)
    }));

    playlist.set(finalPlaylist);
    currentSong.set(finalPlaylist[0].path);
    currentTitle.set(finalPlaylist[0].title);
    currentIndex.set(0);

    isLoading = false;
  }
</script>

<button 
  on:click={handleQuickPlay}
  class="absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-retro-orange text-white shadow-xl opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-20 cursor-pointer"
  disabled={isLoading}
>
  {#if isLoading}
    <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
  {:else}
    <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1"><path d="M8 5v14l11-7z"/></svg>
  {/if}
</button>
