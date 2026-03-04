import { writable } from 'svelte/store';

export const currentSong = writable<string | null>(null);
export const currentTitle = writable<string>("No song selected");

export const playlist = writable<{title: string, path: string}[]>([]);
export const currentIndex = writable<number>(0);
