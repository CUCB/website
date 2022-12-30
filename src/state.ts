import { writable, type Writable } from "svelte/store";

export const cache = <T>(fn: (...args: any[]) => T) => {
  let cached: Map<string, T> = new Map();
  return (...args: any[]): T => {
    let key = JSON.stringify(args);
    let result = cached.get(key);
    if (result !== undefined) {
      return result;
    } else {
      const newResult = fn(...args);
      cached.set(key, newResult);
      return newResult;
    }
  };
};

export const prefs: Writable<Record<string, boolean> | null> = writable(null);
