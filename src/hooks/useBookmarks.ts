import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@hackmate:bookmarks';

type Listener = (ids: string[]) => void;

let cache: string[] | null = null;
let loadPromise: Promise<string[]> | null = null;
const listeners = new Set<Listener>();

async function loadFromStorage(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

async function ensureLoaded(): Promise<string[]> {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = loadFromStorage().then((ids) => {
      cache = ids;
      return ids;
    });
  }
  return loadPromise;
}

async function persist(ids: string[]) {
  cache = ids;
  listeners.forEach((l) => l(ids));
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[useBookmarks] Failed to persist bookmarks:', e);
  }
}

export function useBookmarks(eventId?: string) {
  const [allBookmarkedIds, setAllBookmarkedIds] = useState<string[]>(cache ?? []);

  useEffect(() => {
    let cancelled = false;
    ensureLoaded().then((ids) => {
      if (!cancelled) setAllBookmarkedIds(ids);
    });
    const listener: Listener = (ids) => setAllBookmarkedIds([...ids]);
    listeners.add(listener);
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  const isBookmarked = eventId ? allBookmarkedIds.includes(eventId) : false;

  const toggleBookmark = useCallback(async () => {
    if (!eventId) return;
    try {
      const current = cache ?? (await ensureLoaded());
      const next = current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId];
      await persist(next);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[useBookmarks] toggleBookmark error:', e);
    }
  }, [eventId]);

  return { isBookmarked, toggleBookmark, allBookmarkedIds };
}
