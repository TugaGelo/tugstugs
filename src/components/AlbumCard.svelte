<script>
  import { onMount } from 'svelte';
  import { getTrackMetadata } from '../lib/metadata';
  import { PUBLIC_BUCKET_URL } from 'astro:env/client';

  export let albumName;
  export let firstSongPath;

  let coverUrl = null;
  let artistName = "Loading...";

  onMount(async () => {
    try {
      const url = `${PUBLIC_BUCKET_URL}/${firstSongPath}`;
      const data = await getTrackMetadata(url);
      
      if (data.cover) coverUrl = data.cover;
      if (data.artist !== "Unknown Artist") artistName = data.artist;
    } catch(e) {
      artistName = "Unknown Artist";
    }
  });
</script>

<a href={`/album/${encodeURIComponent(albumName)}`} class="group flex flex-col gap-3 cursor-pointer p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors">
  
  <div class="aspect-square w-full bg-black/40 rounded-lg overflow-hidden shadow-lg relative border border-white/5">
     {#if coverUrl}
       <img src={coverUrl} alt={albumName} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
     {:else}
       <div class="w-full h-full flex items-center justify-center text-retro-gold/20 font-black text-4xl">?</div>
     {/if}
     
     <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
        <div class="w-12 h-12 bg-retro-gold text-retro-slate rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
           <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1"><path d="M8 5v14l11-7z"/></svg>
        </div>
     </div>
  </div>

  <div>
     <h3 class="font-bold text-gray-50 truncate text-lg group-hover:text-retro-gold transition-colors">{albumName}</h3>
     <p class="text-gray-400 text-sm truncate">{artistName}</p>
  </div>
</a>
