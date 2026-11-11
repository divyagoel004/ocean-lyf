import { supabase } from '../lib/supabase';
import { fallbackBottle, newBottleProps } from '../lib/bottle';
import type { BottleProps, Draft, Letter, NewLetterInput, Profile } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(row: any): Letter {
  const { bottle_properties, ...rest } = row;
  const b: BottleProps | undefined = Array.isArray(bottle_properties) ? bottle_properties[0] : bottle_properties;
  return { ...rest, bottle: b ?? fallbackBottle(rest.id) } as Letter;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchLetters(): Promise<Letter[]> {
  const { data, error } = await supabase
    .from('letters')
    .select('*, bottle_properties(*)')
    .order('created_at', { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function fetchLetter(id: string): Promise<Letter | null> {
  const { data, error } = await supabase
    .from('letters')
    .select('*, bottle_properties(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

/** Saves the letter, then its bottle. The bottle is best-effort: a deterministic fallback exists. */
export async function createLetter(input: NewLetterInput, existingBottles: BottleProps[]): Promise<Letter> {
  const { data: row, error } = await supabase
    .from('letters')
    .insert({
      title: input.title.trim(),
      content: input.content,
      sender_id: input.sender_id,
      recipient_id: input.recipient_id,
      category: input.category,
      reply_to_id: input.reply_to_id,
    })
    .select('*')
    .single();
  if (error) throw error;

  const props = newBottleProps(existingBottles);
  const { data: bottle } = await supabase
    .from('bottle_properties')
    .insert({ letter_id: row.id, ...props })
    .select('*')
    .single();

  return { ...(row as any), bottle: (bottle as BottleProps) ?? { ...fallbackBottle(row.id), ...props } } as Letter;
}

export async function markLetterRead(id: string): Promise<void> {
  const { error } = await supabase.rpc('mark_letter_read', { p_letter_id: id });
  if (error) throw error;
}

/* ------------------------------- drafts -------------------------------- */

export async function fetchDraft(userId: string, replyToId: string | null): Promise<Draft | null> {
  let q = supabase.from('drafts').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1);
  q = replyToId ? q.eq('reply_to_id', replyToId) : q.is('reply_to_id', null);
  const { data, error } = await q;
  if (error) throw error;
  return (data?.[0] as Draft | undefined) ?? null;
}

export async function saveDraft(d: {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  reply_to_id: string | null;
}): Promise<Draft> {
  const payload = { ...d, updated_at: new Date().toISOString() };
  const { data, error } = d.id
    ? await supabase.from('drafts').update(payload).eq('id', d.id).select('*').single()
    : await supabase
        .from('drafts')
        .insert({ ...payload, id: undefined })
        .select('*')
        .single();
  if (error) throw error;
  return data as Draft;
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase.from('drafts').delete().eq('id', id);
  if (error) throw error;
}
