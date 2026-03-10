<script>
  import { currentSong, currentTitle, playlist, currentIndex, browsingCover, isPlaying } from '../lib/store.ts';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';

  let audioA;
  let audioB;
  
  let activeDeck = 'A'; 
  let playingPath = null; 
  
  let time = 0;
  let duration = 0;
  let paused = true;
  let volume = 1; 
  let isMuted = false;
  let isDragging = false;
  let isTransitioning = false;
  let hasPreloadedNext = false;

  let playerRgb = '234, 84, 85'; 
  let playingCover = null; 

  $: if ($currentSong && $currentSong !== playingPath) {
    playingPath = $currentSong; 
    playingCover = $playlist[$currentIndex]?.cover || playingCover;
    playExplicitTrack($currentIndex);
  }

  $: themeCover = $browsingCover || playingCover;

  $: if (themeCover) {
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
      playerRgb = `${bestR}, ${bestG}, ${bestB}`;
    };
    img.src = themeCover;
  }

  $: {
    if ($isPlaying && paused) {
      const activeAudio = activeDeck === 'A' ? audioA : audioB;
      if (activeAudio) activeAudio.play().catch(e => console.error(e));
    } else if (!$isPlaying && !paused) {
      const activeAudio = activeDeck === 'A' ? audioA : audioB;
      if (activeAudio) activeAudio.pause();
    }
  }

  function playExplicitTrack(index) {
    if (index === undefined || index === null || !$playlist[index]) return;
    const url = `${PUBLIC_BUCKET_URL}/${$playlist[index].path}`;
    if (audioA) { audioA.pause(); audioA.currentTime = 0; }
    if (audioB) { audioB.pause(); audioB.currentTime = 0; }
    
    activeDeck = 'A'; 
    hasPreloadedNext = false;
    isTransitioning = false;

    setTimeout(() => {
        if (audioA) {
            audioA.src = url;
            audioA.play().catch(e => console.error(e));
            paused = false;
            $isPlaying = true; 
        }
    }, 0);
  }

  function handleTimeUpdate(e) {
    const targetDeck = e.target === audioA ? 'A' : 'B';
    if (targetDeck === activeDeck) {
      if (!isDragging) time = e.target.currentTime;
      duration = e.target.duration;

      if (duration > 0 && (duration - time) <= 15 && !hasPreloadedNext) {
        preloadNext($currentIndex, activeDeck);
        hasPreloadedNext = true;
      }

      if (duration > 0 && (duration - time) <= 0.25 && !isTransitioning) {
        doGaplessTransition();
      }
    }
  }

  function handleEnded(e) {
    const targetDeck = e.target === audioA ? 'A' : 'B';
    if (targetDeck === activeDeck && !isTransitioning) {
      doGaplessTransition();
    }
  }

  function preloadNext(currentIdx, active) {
    const nextIdx = currentIdx + 1;
    if (nextIdx < $playlist.length) {
      const nextUrl = `${PUBLIC_BUCKET_URL}/${$playlist[nextIdx].path}`;
      if (active === 'A' && audioB) { audioB.src = nextUrl; audioB.load(); } 
      else if (active === 'B' && audioA) { audioA.src = nextUrl; audioA.load(); }
    }
  }

  function doGaplessTransition() {
    if ($currentIndex >= $playlist.length - 1) return; 
    isTransitioning = true;
    const nextIdx = $currentIndex + 1;
    playingPath = $playlist[nextIdx].path;
    
    hasPreloadedNext = false;

    if (activeDeck === 'A') {
      activeDeck = 'B';
      if (audioB) audioB.play().catch(e => console.error(e));
    } else {
      activeDeck = 'A';
      if (audioA) audioA.play().catch(e => console.error(e));
    }
    
    currentIndex.set(nextIdx);
    currentSong.set(playingPath);
    currentTitle.set($playlist[nextIdx].title);
    
    setTimeout(() => { isTransitioning = false; }, 1000); 
  }

  function togglePause() { $isPlaying = !$isPlaying; }

  function playNext() {
    if ($currentIndex < $playlist.length - 1) {
      currentIndex.set($currentIndex + 1);
      currentSong.set($playlist[$currentIndex + 1].path);
      currentTitle.set($playlist[$currentIndex + 1].title);
    }
  }

  function playPrev() {
    if ($currentIndex > 0) {
      currentIndex.set($currentIndex - 1);
      currentSong.set($playlist[$currentIndex - 1].path);
      currentTitle.set($playlist[$currentIndex - 1].title);
    }
  }

  function handleSeek() {
    const activeAudio = activeDeck === 'A' ? audioA : audioB;
    if (activeAudio) activeAudio.currentTime = time;
  }

  $: {
    if (audioA) { audioA.volume = volume; audioA.muted = isMuted; }
    if (audioB) { audioB.volume = volume; audioB.muted = isMuted; }
  }

  function formatTime(sec) {
    if (isNaN(sec) || !isFinite(sec)) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
</script>

<div 
  class="fixed bottom-0 left-0 w-full p-4 md:p-6 flex flex-col items-center justify-between z-50 transition-all duration-1000 border-t border-white/10 backdrop-blur-2xl"
  style={`background: linear-gradient(180deg, rgba(${playerRgb}, 0.15) 0%, rgba(20, 20, 24, 0.95) 100%); box-shadow: 0 -20px 60px rgba(${playerRgb}, 0.15); border-top-color: rgba(${playerRgb}, 0.6);`}
>
  <audio bind:this={audioA} preload="auto" on:timeupdate={handleTimeUpdate} on:ended={handleEnded} on:play={() => { paused = false; $isPlaying = true; }} on:pause={() => { paused = true; $isPlaying = false; }} class="hidden"></audio>
  <audio bind:this={audioB} preload="auto" on:timeupdate={handleTimeUpdate} on:ended={handleEnded} on:play={() => { paused = false; $isPlaying = true; }} on:pause={() => { paused = true; $isPlaying = false; }} class="hidden"></audio>

  {#if $currentSong}
    <div class="flex flex-col md:flex-row items-center w-full max-w-6xl gap-4 md:gap-8">
      
      <div class="flex items-center justify-center md:justify-start w-full md:w-64 shrink-0 gap-3">
        {#if playingCover}
          <img src={playingCover} alt="Cover" class="w-12 h-12 rounded bg-black/40 object-cover shadow-lg border border-white/10" />
        {/if}
        <div class="flex flex-col text-center md:text-left overflow-hidden">
          <span class="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-0.5" style={`color: rgba(${playerRgb}, 1)`}>Now Spinning</span>
          <span class="text-gray-100 font-bold truncate text-sm md:text-base">{$currentTitle}</span>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <button 
          on:click={playPrev} 
          aria-label="Previous Track"
          title="Previous Track"
          class="text-gray-300 hover:text-white transition-colors disabled:opacity-30 cursor-pointer" 
          disabled={$currentIndex === 0}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>

        <button 
          on:click={togglePause} 
          aria-label={$isPlaying ? 'Pause' : 'Play'}
          title={$isPlaying ? 'Pause' : 'Play'}
          class="w-12 h-12 flex items-center justify-center rounded-full text-white hover:scale-105 transition-transform shadow-md cursor-pointer"
          style={`background-color: rgb(${playerRgb}); box-shadow: 0 4px 15px rgba(${playerRgb}, 0.4);`}
        >
          {#if !$isPlaying}
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          {/if}
        </button>

        <button 
          on:click={playNext} 
          aria-label="Next Track"
          title="Next Track"
          class="text-gray-300 hover:text-white transition-colors disabled:opacity-30 cursor-pointer" 
          disabled={$currentIndex === $playlist.length - 1}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      <div class="flex items-center gap-6 w-full text-xs font-mono text-gray-300">
        <div class="flex items-center gap-2 flex-1 relative">
          <span class="w-10 text-right">{formatTime(time)}</span>
          <input 
            type="range" min="0" max={duration || 0} step="0.1"
            bind:value={time} 
            on:mousedown={() => isDragging = true}
            on:mouseup={() => { isDragging = false; handleSeek(); }}
            on:touchstart={() => isDragging = true}
            on:touchend={() => { isDragging = false; handleSeek(); }}
            class="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10" 
            style={`accent-color: rgb(${playerRgb});`}
          />
          <span class="w-10 text-left">{formatTime(duration)}</span>
        </div>

        <div class="hidden md:flex items-center gap-2 w-32 group">
          <button on:click={() => isMuted = !isMuted} class="text-gray-300 hover:text-white transition-colors flexshrink-0 cursor-pointer">
            {#if isMuted || volume === 0}
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            {/if}
          </button>
          <input 
            type="range" min="0" max="1" step="0.01" 
            bind:value={volume} 
            on:input={() => { if(isMuted && volume > 0) isMuted = false; }}
            class="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10"
            style={`accent-color: rgb(${playerRgb});`} 
          />
        </div>
      </div>
    </div>
  {:else}
    <div class="w-full max-w-6xl flex items-center justify-center border-2 border-dashed border-white/10 rounded-full bg-black/20 p-3">
      <span class="text-gray-400 text-sm italic font-medium">Drop a coin to play...</span>
    </div>
  {/if}
</div>
