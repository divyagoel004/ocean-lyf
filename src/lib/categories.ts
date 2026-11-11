import type { Category } from '../types';

export const CATEGORIES: { value: Category; label: string; glyph: string }[] = [
  { value: 'missing_you', label: 'Missing you', glyph: '☾' },
  { value: 'i_love_you', label: 'I love you', glyph: '♡' },
  { value: 'apology', label: 'A little apology', glyph: '❀' },
  { value: 'random', label: 'Random thoughts', glyph: '✦' },
  { value: 'memory', label: 'A memory', glyph: '❖' },
  { value: 'just_because', label: 'Just because', glyph: '☁' },
  { value: 'important', label: 'Something important', glyph: '✧' },
];

export const categoryLabel = (c: Category | string) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? 'Just because';

export const categoryGlyph = (c: Category | string) =>
  CATEGORIES.find((x) => x.value === c)?.glyph ?? '♡';
