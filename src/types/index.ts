export type Category =
  | 'missing_you'
  | 'i_love_you'
  | 'apology'
  | 'random'
  | 'memory'
  | 'just_because'
  | 'important';

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
}

export interface BottleProps {
  id: string;
  letter_id: string;
  /** 0..3 — glass tint / ribbon colour variant */
  bottle_style: number;
  /** 0..1 across the width of the ocean */
  initial_x: number;
  /** 0..1 from the horizon (0) towards the viewer (1) */
  initial_y: number;
  animation_speed: number;
  animation_phase: number;
}

export interface Letter {
  id: string;
  title: string;
  content: string;
  sender_id: string;
  /** null = to both of us */
  recipient_id: string | null;
  category: Category;
  created_at: string;
  is_read: boolean;
  reply_to_id: string | null;
  bottle: BottleProps;
}

export interface Draft {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: Category;
  reply_to_id: string | null;
  updated_at: string;
}

export interface NewLetterInput {
  title: string;
  content: string;
  sender_id: string;
  recipient_id: string | null;
  category: Category;
  reply_to_id: string | null;
}

export type LoadStatus = 'loading' | 'ready' | 'error';
