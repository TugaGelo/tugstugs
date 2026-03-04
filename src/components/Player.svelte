<script>
  import { currentSong, currentTitle } from '../lib/store.ts';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';

  $: fullUrl = $currentSong ? `${PUBLIC_BUCKET_URL}/${$currentSong}` : null;
</script>

<div class="fixed bottom-0 left-0 w-full bg-retro-slate border-t-4 border-retro-orange p-4 md:p-6 flex flex-col md:flex-row items-center justify-between z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
  
  <div class="flex flex-col min-w-[200px] mb-4 md:mb-0 text-center md:text-left">
    <span class="text-[10px] text-retro-gold uppercase font-black tracking-widest mb-1">Now Spinning</span>
    <span class="text-gray-100 font-bold truncate text-lg">{$currentTitle}</span>
  </div>

  <div class="flex-1 w-full max-w-3xl md:px-8">
    {#if fullUrl}
      <audio 
        src={fullUrl} 
        controls 
        autoplay 
        class="w-full h-10 rounded-full"
      ></audio>
    {:else}
      <div class="h-10 flex items-center justify-center border-2 border-dashed border-retro-coral/40 rounded-full bg-black/20">
        <span class="text-retro-coral/80 text-sm italic font-medium">Drop a coin to play...</span>
      </div>
    {/if}
  </div>

</div>
