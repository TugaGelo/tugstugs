import { writable } from 'svelte/store';

export const currentSong = writable<string | null>(null);
export const currentTitle = writable<string>("No song selected");
