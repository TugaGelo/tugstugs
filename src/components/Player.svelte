<script>
  import { currentSong, currentTitle, playlist, currentIndex } from '../lib/store.ts';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';

  $: fullUrl = $currentSong ? `${PUBLIC_BUCKET_URL}/${$currentSong}` : null;

  let paused = true;
  let time = 0;
  let duration = 0;
  let volume = 1; // 1 = 100% volume

  function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  // --- NEW LOGIC: Next / Prev ---
  function playNext() {
    if ($currentIndex < $playlist.length - 1) {
      const nextIdx = $currentIndex + 1;
      currentIndex.set(nextIdx);
      currentSong.set($playlist[nextIdx].path);
      currentTitle.set($playlist[nextIdx].title);
    }
  }

  function playPrev() {
    if ($currentIndex > 0) {
      const prevIdx = $currentIndex - 1;
      currentIndex.set(prevIdx);
      currentSong.set($playlist[prevIdx].path);
      currentTitle.set($playlist[prevIdx].title);
    }
  }
</script>

<div class="fixed bottom-0 left-0 w-full bg-retro-slate border-t-4 border-retro-orange p-4 md:p-6 flex flex-col items-center justify-between z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
  
  {#if fullUrl}
    <audio 
      src={fullUrl} 
      bind:paused={paused} 
      bind:currentTime={time} 
      bind:duration={duration} 
      bind:volume={volume}
      on:ended={playNext} 
      autoplay
    ></audio>

    <div class="flex flex-col md:flex-row items-center w-full max-w-6xl gap-4 md:gap-8">
      
      <div class="flex flex-col w-full md:w-48 text-center md:text-left shrink-0">
        <span class="text-[10px] text-retro-gold uppercase font-black tracking-widest mb-1">Now Spinning</span>
        <span class="text-gray-100 font-bold truncate text-base">{$currentTitle}</span>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <button on:click={playPrev} class="text-gray-400 hover:text-white transition-colors disabled:opacity-30" disabled={$currentIndex === 0}>
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>

        <button on:click={() => paused = !paused} class="w-12 h-12 flex items-center justify-center rounded-full bg-retro-gold text-retro-slate hover:bg-retro-orange hover:text-white hover:scale-105 transition-all shadow-md">
          {#if paused}
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1"><path d="M8 5v14l11-7z"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          {/if}
        </button>

        <button on:click={playNext} class="text-gray-400 hover:text-white transition-colors disabled:opacity-30" disabled={$currentIndex === $playlist.length - 1}>
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      <div class="flex items-center gap-6 w-full text-xs font-mono text-gray-400">
        
        <div class="flex items-center gap-2 flex-1">
          <span class="w-10 text-right">{formatTime(time)}</span>
          <input type="range" min="0" max={duration || 0} bind:value={time} class="w-full h-2 rounded-lg appearance-none cursor-pointer bg-black/30 accent-retro-coral" />
          <span class="w-10 text-left">{formatTime(duration)}</span>
        </div>

        <div class="hidden md:flex items-center gap-2 w-28 group">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 group-hover:text-retro-gold transition-colors"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          <input type="range" min="0" max="1" step="0.01" bind:value={volume} class="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-black/30 accent-retro-gold" />
        </div>

      </div>

    </div>
  {:else}
    <div class="w-full max-w-6xl flex items-center justify-center border-2 border-dashed border-retro-coral/40 rounded-full bg-black/20 p-3">
      <span class="text-retro-coral/80 text-sm italic font-medium">Drop a coin to play...</span>
    </div>
  {/if}
</div>
