import type { Letter } from '../types';

const full = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' });
const short = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const month = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

export const formatFull = (iso: string) => full.format(new Date(iso));
export const formatShort = (iso: string) => short.format(new Date(iso));
export const formatMonth = (iso: string) => month.format(new Date(iso));

export const letterTitle = (l: Pick<Letter, 'title'>) => l.title.trim() || 'A letter without a name';
