import { supabase } from '../lib/supabase';
import type { Event } from '../types/database';

export type EventFilters = {
  city?: string;
  tags?: string[];
  search?: string;
};

export async function getAllEvents(_filters: EventFilters = {}): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Event[];
}
