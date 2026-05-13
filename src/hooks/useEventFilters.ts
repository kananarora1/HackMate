import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@hackmate:filters';

export type FilterMode = 'all' | 'online' | 'offline';

export type ActiveFilters = {
  search: string;
  tags: string[];
  mode: FilterMode;
};

const DEFAULT_FILTERS: ActiveFilters = {
  search: '',
  tags: [],
  mode: 'all',
};

async function loadFilters(): Promise<ActiveFilters> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw);
    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: unknown) => typeof t === 'string') : [],
      mode: ['all', 'online', 'offline'].includes(parsed.mode) ? parsed.mode : 'all',
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

async function saveFilters(filters: ActiveFilters): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.warn('[useEventFilters] Failed to persist filters:', e);
  }
}

export function useEventFilters() {
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted filters on mount
  useEffect(() => {
    loadFilters().then((saved) => {
      setFilters(saved);
      setHydrated(true);
    });
  }, []);

  // Persist whenever filters change (after initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveFilters(filters);
  }, [filters, hydrated]);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => {
      const has = prev.tags.includes(tag);
      return {
        ...prev,
        tags: has ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  }, []);

  const setMode = useCallback((mode: FilterMode) => {
    setFilters((prev) => ({ ...prev, mode }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters =
    filters.search.trim().length > 0 || filters.tags.length > 0 || filters.mode !== 'all';

  return { filters, hydrated, setSearch, toggleTag, setMode, clearAll, hasActiveFilters };
}
