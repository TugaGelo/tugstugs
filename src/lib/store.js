import { writable } from 'svelte/store';

export const currentSong = writable(null);
export const currentTitle = writable("No song selected");
