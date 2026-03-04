<script>
  import { onMount } from 'svelte';
  import { getTrackMetadata } from '../lib/metadata';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';
  import { currentSong, currentTitle, currentIndex, playlist, isPlaying } from '../lib/store';

  export let albumName;
  export let firstSongPath;
  export let rawPaths = []; 

  let coverUrl = null;
  let artist = "Loading...";
  let isLoadingPlay = false;
  let cardRgb = '234, 84, 85'; 

  $: isActiveAlbum = rawPaths.includes($currentSong);

  onMount(async () => {
    try {
      const url = `${PUBLIC_BUCKET_URL}/${firstSongPath}`;
      const data = await getTrackMetadata(url);
      if (data.cover) {
        coverUrl = data.cover;
        extractVibrantColor(coverUrl);
      }
      artist = data.artist !== "Unknown Artist" ? data.artist : "Unknown Artist";
    } catch (e) {
      artist = "Unknown Artist";
    }
  });

  function extractVibrantColor(imgSrc) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 64; canvas.height = 64;
      ctx.drawImage(img, 0, 0, 64, 64);
      const data = ctx.getImageData(0, 0, 64, 64).data;
      let maxScore = -1;
      let bestR, bestG, bestB;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const luma = (r * 299 + g * 587 + b * 114) / 1000;
        const score = (sat * 100) - Math.abs(luma - 127) * 0.5;

        if (score > maxScore) {
          maxScore = score; bestR = r; bestG = g; bestB = b;
        }
      }

      const finalLuma = (bestR * 299 + bestG * 587 + bestB * 114) / 1000;
      if (finalLuma < 100) {
        const boost = 100 - finalLuma; 
        bestR = Math.min(255, Math.floor(bestR + boost));
        bestG = Math.min(255, Math.floor(bestG + boost));
        bestB = Math.min(255, Math.floor(bestB + boost));
      }
      cardRgb = `${bestR}, ${bestG}, ${bestB}`;
    };
    img.src = imgSrc;
  }

  async function handleQuickPlay() {
    if (isActiveAlbum) { $isPlaying = !$isPlaying; return; }
    if (isLoadingPlay || rawPaths.length === 0) return;
    isLoadingPlay = true;

    const promises = rawPaths.map(async (path) => {
      const cleanFallbackTitle = path.split('/').pop().replace(/\.(mp3|m4a)$/i, "");
      try {
        const url = `${PUBLIC_BUCKET_URL}/${path}`;
        const data = await getTrackMetadata(url);
        return {
          path, title: data.title !== "Unknown Title" ? data.title : cleanFallbackTitle,
          artist: data.artist !== "Unknown Artist" ? data.artist : "Unknown Artist",
          trackNum: data.trackNum || 999, discNum: data.discNum || 1, cover: data.cover
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

    const finalPlaylist = results.map(t => ({
      path: t.path, title: t.title, cover: t.cover || coverUrl 
    }));

    playlist.set(finalPlaylist);
    currentSong.set(finalPlaylist[0].path);
    currentTitle.set(finalPlaylist[0].title);
    currentIndex.set(0);
    $isPlaying = true;
    isLoadingPlay = false;
  }
</script>

<a href={`/album/${albumName}`} class="group relative flex flex-col cursor-pointer transition-transform hover:-translate-y-1">
  <div class="w-full aspect-square rounded-xl bg-white/5 shadow-lg overflow-hidden relative mb-3 border border-white/5 group-hover:shadow-2xl transition-all">
    {#if coverUrl}
      <img src={coverUrl} alt="Cover" class="w-full h-full object-cover" />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-white/20 font-black text-4xl">?</div>
    {/if}

    <button 
      on:click|preventDefault|stopPropagation={handleQuickPlay}
      class="absolute bottom-3 right-3 w-12 h-12 flex items-center justify-center rounded-full text-white shadow-xl translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 transition-all duration-300 z-20"
      style={`background-color: rgb(${cardRgb}); box-shadow: 0 4px 15px rgba(${cardRgb}, 0.5);`}
      disabled={isLoadingPlay && !isActiveAlbum}
    >
      {#if isLoadingPlay && !isActiveAlbum}
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      {:else if isActiveAlbum && $isPlaying}
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
      {/if}
    </button>
  </div>

  <h3 class="font-bold text-gray-100 truncate text-base mb-0.5 group-hover:text-white transition-colors">{albumName}</h3>
  <p class="text-sm text-gray-400 truncate font-medium">{artist}</p>
</a>
