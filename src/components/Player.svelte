<script>
  import { currentSong, currentTitle } from '../lib/store.ts';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';

  $: fullUrl = $currentSong ? `${PUBLIC_BUCKET_URL}/${$currentSong}` : null;
</script>

<div class="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-zinc-800 p-6 flex items-center justify-between z-50">
  <div class="flex flex-col min-w-[150px]">
    <span class="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">Now Playing</span>
    <span class="text-white font-bold truncate">{$currentTitle}</span>
  </div>

  <div class="flex-1 max-w-2xl px-8">
    {#if fullUrl}
      <audio 
        src={fullUrl} 
        controls 
        autoplay 
        class="w-full h-8 brightness-90 invert"
      ></audio>
    {:else}
      <div class="h-8 flex items-center justify-center border border-dashed border-zinc-800 rounded-lg">
        <span class="text-zinc-600 text-xs italic">Select a track to start the TugsTugs...</span>
      </div>
    {/if}
  </div>
</div>
