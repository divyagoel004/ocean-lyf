import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchLetter, fetchLetters, fetchProfiles } from '../services/letters';
import type { Letter, LoadStatus, Profile } from '../types';

const byDate = (a: Letter, b: Letter) => a.created_at.localeCompare(b.created_at);

/**
 * Loads every letter + both profiles and keeps them live via Supabase Realtime.
 * Re-syncs when the network comes back or the tab becomes visible again.
 */
export function useLetters(meId: string) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(new Set());
  const alive = useRef(true);

  const upsert = useCallback((letter: Letter) => {
    setLetters((prev) => {
      const i = prev.findIndex((l) => l.id === letter.id);
      if (i === -1) return [...prev, letter].sort(byDate);
      const next = prev.slice();
      next[i] = letter;
      return next;
    });
  }, []);

  const markReadLocal = useCallback((id: string) => {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, is_read: true } : l)));
  }, []);

  const clearArrived = useCallback((id: string) => {
    setArrivedIds((prev) => {
      if (!prev.has(id)) return prev;
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const [l, p] = await Promise.all([fetchLetters(), fetchProfiles()]);
      if (!alive.current) return;
      setLetters(l);
      setProfiles(p);
      setStatus('ready');
      setError(null);
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : 'Could not reach the ocean.');
      setStatus((s) => (s === 'ready' ? 'ready' : 'error')); // keep showing what we have if we already loaded
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();

    const pullOne = async (id: string, announce: boolean) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const l = await fetchLetter(id);
          if (!alive.current || !l) return;
          upsert(l);
          if (announce && l.sender_id !== meId) {
            setArrivedIds((prev) => new Set(prev).add(l.id));
            window.setTimeout(() => clearArrived(l.id), 6000);
          }
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
        }
      }
    };

    let wasDown = false;
    const channel = supabase
      .channel(`our-ocean-${meId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'letters' }, (p) => {
        const id = (p.new as { id: string }).id;
        // small delay so the bottle_properties row (inserted right after) is usually there too
        window.setTimeout(() => pullOne(id, true), 450);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'letters' }, (p) => {
        const row = p.new as Partial<Letter> & { id: string };
        setLetters((prev) => prev.map((l) => (l.id === row.id ? { ...l, ...row, bottle: l.bottle } : l)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'letters' }, (p) => {
        const id = (p.old as { id?: string }).id;
        if (id) setLetters((prev) => prev.filter((l) => l.id !== id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bottle_properties' }, (p) => {
        const id = ((p.new as { letter_id?: string }).letter_id ?? (p.old as { letter_id?: string }).letter_id) as
          | string
          | undefined;
        if (id) pullOne(id, false);
      })
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          if (wasDown) load(); // catch up on anything missed while disconnected
          wasDown = false;
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
          wasDown = true;
        }
      });

    const resync = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('online', load);
    document.addEventListener('visibilitychange', resync);

    return () => {
      alive.current = false;
      window.removeEventListener('online', load);
      document.removeEventListener('visibilitychange', resync);
      supabase.removeChannel(channel);
    };
  }, [meId, load, upsert, clearArrived]);

  return { letters, profiles, status, error, reload: load, upsert, markReadLocal, arrivedIds, clearArrived };
}
