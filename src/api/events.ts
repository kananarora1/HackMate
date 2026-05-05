import { supabase } from '../lib/supabase';
import type { Event } from '../types/database';

export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Event[];
}
