import { supabase } from '../lib/supabase';
import type { Event } from '../types/database';

export type EventFilters = {
  search?: string;       // ilike on title | organizer | description
  tags?: string[];       // OR logic via postgres array overlap
  mode?: 'all' | 'online' | 'offline';
};

function escapeSqlWildcards(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&');
}

export async function getAllEvents(filters: EventFilters = {}): Promise<Event[]> {
  let query = supabase.from('events').select('*');

  // ── Search ──────────────────────────────────────────────────────────────
  const search = filters.search?.trim() ?? '';
  if (search.length > 0) {
    const escaped = escapeSqlWildcards(search);
    const pattern = `%${escaped}%`;
    query = query.or(
      `title.ilike.${pattern},organizer.ilike.${pattern},description.ilike.${pattern}`
    );
  }

  // ── Tags (any overlap) ─────────────────────────────────────────────────
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  // ── Mode ───────────────────────────────────────────────────────────────
  if (filters.mode === 'online') {
    query = query.eq('is_online', true);
  } else if (filters.mode === 'offline') {
    query = query.eq('is_online', false);
  }
  // ── Hide past events (end_date < now) ──────────────────────────────────
  // Events with no end_date are treated as ongoing and always shown.
  query = query.or(`end_date.gte.${new Date().toISOString()},end_date.is.null`);

  // ── Order ──────────────────────────────────────────────────────────────
  query = query.order('start_date', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Event[];
}

export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Event | null) ?? null;
}
