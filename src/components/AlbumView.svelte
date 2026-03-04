<script>
  import { onMount } from 'svelte';
  import { getTrackMetadata } from '../lib/metadata';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';
  import { currentSong, currentTitle, currentIndex, playlist } from '../lib/store';

  export let albumName;
  export let rawPaths = [];

  let tracks = [];
  let coverUrl = null;
  let albumArtist = "Loading...";
  let isLoading = true;

  onMount(async () => {
    // 1. Fetch metadata for all songs
    const promises = rawPaths.map(async (path) => {
      const cleanFallbackTitle = path.split('/').pop().replace(/\.(mp3|m4a)$/i, "");
      try {
        const url = `${PUBLIC_BUCKET_URL}/${path}`;
        const data = await getTrackMetadata(url);
        return {
          path,
          title: data.title !== "Unknown Title" ? data.title : cleanFallbackTitle,
          artist: data.artist !== "Unknown Artist" ? data.artist : "Unknown Artist",
          trackNum: data.trackNum,
          cover: data.cover
        };
      } catch(e) {
        return { path, title: cleanFallbackTitle, artist: "Unknown Artist", trackNum: 999, cover: null };
      }
    });

    const results = await Promise.all(promises);

    // 2. Sort tracks by track number
    results.sort((a, b) => a.trackNum - b.trackNum);
    tracks = results;

    // 3. Extract cover and artist
    const firstValid = tracks.find(t => t.cover) || tracks[0];
    if (firstValid) {
      coverUrl = firstValid.cover;
      albumArtist = tracks.find(t => t.artist !== "Unknown Artist")?.artist || "Unknown Artist";
    }

    // 4. Set global playlist
    playlist.set(tracks.map(t => ({ path: t.path, title: t.title })));
    isLoading = false;
  });

  function playTrack(index) {
    currentSong.set(tracks[index].path);
    currentTitle.set(tracks[index].title);
    currentIndex.set(index);
  }
</script>

{#if isLoading}
  <div class="flex items-center justify-center h-64">
    <div class="animate-pulse text-retro-gold font-bold tracking-widest uppercase">Loading Metadata...</div>
  </div>
{:else}
  <div class="flex flex-col md:flex-row gap-8 md:items-start mt-2">
    
    <div class="w-full md:w-1/3 lg:w-1/4 flex flex-col items-center md:items-start md:sticky md:top-10 z-10 h-fit self-start">
      
      <div class="w-48 h-48 md:w-full md:h-auto aspect-square bg-black/40 rounded-lg overflow-hidden shadow-2xl mb-4 border border-white/5">
        {#if coverUrl}
          <img src={coverUrl} alt="Cover" class="w-full h-full object-cover" />
        {:else}
          <div class="w-full h-full flex items-center justify-center text-retro-gold/20 font-black text-6xl">?</div>
        {/if}
      </div>
      
      <h1 class="text-2xl md:text-3xl font-black text-white text-center md:text-left leading-tight mb-1">{albumName}</h1>
      <p class="text-gray-400 font-medium text-sm text-center md:text-left mb-1">{albumArtist}</p>
      <p class="text-xs text-gray-500 uppercase tracking-widest text-center md:text-left">{tracks.length} Songs</p>
      
    </div>

    <div class="w-full md:w-2/3 lg:w-3/4 flex flex-col pb-32">
      {#each tracks as track, index}
        <button 
          on:click={() => playTrack(index)}
          class="group flex items-center w-full p-3 hover:bg-white/5 rounded-xl transition-colors text-left cursor-pointer border border-transparent hover:border-white/5"
        >
          <div class="w-10 flex-shrink-0 text-center text-gray-400 font-medium">
            <span class="group-hover:hidden">{index + 1}</span>
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 hidden group-hover:block mx-auto text-white"><path d="M8 5v14l11-7z"/></svg>
          </div>

          <div class="flex-1 overflow-hidden pr-4">
            <div class="font-bold text-gray-100 truncate group-hover:text-white transition-colors">{track.title}</div>
            <div class="text-sm text-gray-400 truncate mt-0.5">{track.artist}</div>
          </div>
        </button>
      {/each}
    </div>

  </div>
{/if}
