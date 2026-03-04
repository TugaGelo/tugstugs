<script>
  import { onMount } from 'svelte';
  import { getTrackMetadata } from '../lib/metadata';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';
  import { currentSong, currentTitle, currentIndex } from '../lib/store';

  export let path;
  export let index;

  const cleanFallbackTitle = path.split('/').pop().replace(/\.(mp3|m4a)$/i, "");
  
  let metadata = { title: cleanFallbackTitle, artist: 'Loading...', cover: null };

  onMount(async () => {
    try {
      const url = `${PUBLIC_BUCKET_URL}/${path}`;
      const data = await getTrackMetadata(url);
      
      if (data.title !== "Unknown Title") metadata.title = data.title;
      if (data.artist !== "Unknown Artist") metadata.artist = data.artist;
      if (data.cover) metadata.cover = data.cover;
      
    } catch (e) {
      metadata.artist = 'Unknown Artist';
    }
  });

  function playThis() {
    currentSong.set(path);
    currentTitle.set(metadata.title);
    currentIndex.set(index);
  }
</script>

<div class="group flex items-center justify-between p-3 bg-black/10 hover:bg-black/20 border border-white/5 rounded-xl transition-all duration-300">
  <div class="flex items-center gap-4">
    <div class="w-12 h-12 bg-retro-slate rounded-md overflow-hidden shrink-0 border border-white/10 shadow-inner">
      {#if metadata.cover}
        <img src={metadata.cover} alt="cover" class="w-full h-full object-cover" />
      {:else}
        <div class="w-full h-full flex items-center justify-center text-retro-gold/20 font-black">?</div>
      {/if}
    </div>

    <div>
      <strong class="block text-lg font-bold text-gray-50 group-hover:text-retro-gold transition-colors truncate max-w-50 md:max-w-xs">
        {metadata.title}
      </strong>
      <span class="text-xs text-gray-400 uppercase tracking-widest">{metadata.artist}</span>
    </div>
  </div>

  <button 
    on:click={playThis}
    class="bg-retro-gold text-retro-slate font-black py-2 px-6 rounded-full hover:bg-retro-orange hover:text-white hover:scale-105 transition-all shadow-lg"
  >
    PLAY
  </button>
</div>
