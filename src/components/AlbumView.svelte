<script>
  import { onMount } from 'svelte';
  import { getTrackMetadata } from '../lib/metadata';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';
  import { currentSong, currentTitle, currentIndex, playlist, browsingCover, isPlaying } from '../lib/store';

  export let albumName;
  export let rawPaths = [];

  let tracks = [];
  let coverUrl = null;
  let albumArtist = "";
  let isLoading = true;
  let pageRgb = '30, 30, 36'; 

  onMount(async () => {
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
      } catch(e) {
        return { path, title: cleanFallbackTitle, artist: "Unknown Artist", trackNum: 999, discNum: 1, cover: null };
      }
    });

    const results = await Promise.all(promises);
    results.sort((a, b) => {
      if (a.discNum !== b.discNum) return a.discNum - b.discNum; 
      return a.trackNum - b.trackNum;
    });

    tracks = results;

    const firstValid = tracks.find(t => t.cover) || tracks[0];
    if (firstValid) {
      coverUrl = firstValid.cover;
      albumArtist = tracks.find(t => t.artist !== "Unknown Artist")?.artist || "Unknown Artist";
      extractAlbumColor(coverUrl); 
    }

    browsingCover.set(coverUrl); 
    isLoading = false;
  });

  function extractAlbumColor(imgSrc) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1; canvas.height = 1;
      ctx.drawImage(img, 0, 0, 1, 1);
      const [rawR, rawG, rawB] = ctx.getImageData(0, 0, 1, 1).data;
      
      const brightness = (rawR * 299 + rawG * 587 + rawB * 114) / 1000;
      let r = rawR, g = rawG, b = rawB;
      if (brightness < 60) {
        const boost = 60 - brightness; 
        r = Math.min(255, Math.floor(rawR + boost));
        g = Math.min(255, Math.floor(rawG + boost));
        b = Math.min(255, Math.floor(rawB + boost));
      }
      pageRgb = `${r}, ${g}, ${b}`;
    };
    img.src = imgSrc;
  }

  function handleTrackClick(index, trackPath) {
    if ($currentSong === trackPath) {
      $isPlaying = !$isPlaying;
      return;
    }

    playlist.set(tracks.map(t => ({ 
      path: t.path, 
      title: t.title,
      cover: t.cover || coverUrl 
    })));

    currentSong.set(tracks[index].path);
    currentTitle.set(tracks[index].title);
    currentIndex.set(index);
    $isPlaying = true;
  }
</script>

<div 
  class="fixed inset-0 pointer-events-none z-[-1] transition-colors duration-1000" 
  style={`background: radial-gradient(circle at 15% 10%, rgba(${pageRgb}, 0.35) 0%, rgba(30, 30, 36, 1) 60%);`}
></div>

{#if isLoading}
  <div class="flex flex-col md:flex-row gap-8 md:items-start mt-2 w-full animate-pulse">
    <div class="w-full md:w-1/3 lg:w-1/4 flex flex-col items-center md:items-start">
      <div class="w-48 h-48 md:w-full md:h-auto aspect-square bg-white/5 rounded-lg mb-4"></div>
      <div class="h-8 w-3/4 bg-white/5 rounded-md mb-2"></div>
      <div class="h-4 w-1/2 bg-white/5 rounded-md mb-2"></div>
      <div class="h-3 w-1/4 bg-white/5 rounded-md"></div>
    </div>
    <div class="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-2 pb-32">
      {#each Array(8) as _, i}
        <div class="flex items-center w-full p-3 rounded-xl bg-white/5">
           <div class="w-10 h-6 bg-white/10 rounded-md mr-4 mx-auto"></div>
           <div class="flex-1">
             <div class="h-5 w-1/2 bg-white/10 rounded-md mb-2"></div>
             <div class="h-3 w-1/3 bg-white/10 rounded-md"></div>
           </div>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="flex flex-col md:flex-row gap-8 md:items-start mt-2">
    <div class="w-full md:w-1/3 lg:w-1/4 flex flex-col items-center md:items-start md:sticky md:top-10 z-10 h-fit self-start">
      <div class="w-48 h-48 md:w-full md:h-auto aspect-square bg-black/40 rounded-lg overflow-hidden shadow-2xl mb-4 border border-white/10">
        {#if coverUrl}
          <img src={coverUrl} alt="Cover" class="w-full h-full object-cover" />
        {:else}
          <div class="w-full h-full flex items-center justify-center text-retro-gold/20 font-black text-6xl">?</div>
        {/if}
      </div>
      
      <h1 class="text-2xl md:text-3xl font-black text-white text-center md:text-left leading-tight mb-1">{albumName}</h1>
      <p class="text-gray-300 font-medium text-sm text-center md:text-left mb-1">{albumArtist}</p>
      <p class="text-xs text-gray-400 uppercase tracking-widest text-center md:text-left">{tracks.length} Songs</p>
    </div>

    <div class="w-full md:w-2/3 lg:w-3/4 flex flex-col pb-32">
      {#each tracks as track, index}
        <button 
          on:click={() => handleTrackClick(index, track.path)}
          class="group flex items-center w-full p-3 hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer border border-transparent hover:border-white/5"
        >
          <div class="w-10 flex-shrink-0 text-center text-gray-400 font-medium relative h-6">
            <span class={`group-hover:hidden text-xs absolute inset-0 flex items-center justify-center ${track.path === $currentSong ? 'text-[#EA5455] font-black' : ''}`}>
              {index + 1}
            </span>
            
            <div class="hidden group-hover:flex absolute inset-0 items-center justify-center text-white">
              {#if track.path === $currentSong && $isPlaying}
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              {:else}
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
              {/if}
            </div>
          </div>

          <div class="flex-1 overflow-hidden pr-4 ml-2">
            <div class={`font-bold truncate group-hover:text-white transition-colors ${track.path === $currentSong ? 'text-[#EA5455]' : 'text-gray-100'}`}>
              {track.title}
            </div>
            <div class="text-sm text-gray-400 truncate mt-0.5">{track.artist}</div>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}
