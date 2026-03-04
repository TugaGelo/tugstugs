import { writable } from 'svelte/store';

export const currentSong = writable(null);
export const currentTitle = writable("");
export const currentIndex = writable(0);
export const playlist = writable([]); 
export const browsingCover = writable(null);

export const isPlaying = writable(false);