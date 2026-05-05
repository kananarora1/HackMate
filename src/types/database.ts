export type Event = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  source_url: string;
  poster_url: string | null;
  poster_aspect_ratio: number | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  location_text: string | null;
  city: string | null;
  is_online: boolean | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[] | null;
  prize_pool_text: string | null;
  organizer: string | null;
  content_hash: string;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type EventInsert = {
  title: string;
  source: string;
  source_url: string;
  content_hash: string;
  description?: string | null;
  poster_url?: string | null;
  poster_aspect_ratio?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  registration_deadline?: string | null;
  location_text?: string | null;
  city?: string | null;
  is_online?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  tags?: string[] | null;
  prize_pool_text?: string | null;
  organizer?: string | null;
  raw_payload?: Record<string, unknown> | null;
};

export type EventUpdate = Partial<EventInsert>;
