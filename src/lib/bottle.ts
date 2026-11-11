import type { BottleProps } from '../types';

/** Stable 32-bit hash (FNV-1a). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = Omit<BottleProps, 'id' | 'letter_id'>;

/**
 * Deterministic bottle look derived from the letter id. Used if the bottle_properties
 * row hasn't arrived yet (real-time race) or is missing, so every device agrees.
 */
export function fallbackBottle(letterId: string): BottleProps {
  const r = mulberry32(hashString(letterId));
  return {
    id: `fallback-${letterId}`,
    letter_id: letterId,
    bottle_style: Math.floor(r() * 4),
    initial_x: 0.07 + r() * 0.86,
    initial_y: 0.06 + r() * 0.86,
    animation_speed: 0.65 + r() * 0.8,
    animation_phase: r(),
  };
}

/** Pick a free-ish spot in the water so new bottles don't pile on top of old ones. */
export function newBottleProps(existing: BottleProps[]): Props {
  const best = { score: -1, x: 0.5, y: 0.5 };
  for (let i = 0; i < 18; i++) {
    const x = 0.07 + Math.random() * 0.86;
    const y = 0.06 + Math.random() * 0.86;
    let nearest = Infinity;
    for (const b of existing) {
      const d = Math.hypot((b.initial_x - x) * 1.7, b.initial_y - y);
      if (d < nearest) nearest = d;
    }
    if (nearest > best.score) {
      best.score = nearest;
      best.x = x;
      best.y = y;
    }
  }
  return {
    bottle_style: Math.floor(Math.random() * 4),
    initial_x: Number(best.x.toFixed(4)),
    initial_y: Number(best.y.toFixed(4)),
    animation_speed: Number((0.65 + Math.random() * 0.8).toFixed(3)),
    animation_phase: Number(Math.random().toFixed(4)),
  };
}
