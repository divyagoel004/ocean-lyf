import { createContext, useContext } from 'react';
import type { Letter, LoadStatus, Profile } from '../types';

export interface OceanContextValue {
  me: Profile;
  partner: Profile | null;
  profiles: Profile[];
  letters: Letter[];
  status: LoadStatus;
  error: string | null;
  reload: () => void;
  arrivedIds: Set<string>;
  hiddenIds: Set<string>;
  unreadIds: Set<string>;
  nameOf: (id: string | null) => string;
  openLetter: (id: string, origin?: DOMRect | null) => void;
  openComposer: (opts?: { replyTo?: Letter }) => void;
  findRandom: () => void;
  soundOn: boolean;
  toggleSound: () => void;
  signOut: () => void;
}

export const OceanContext = createContext<OceanContextValue | null>(null);

export function useOcean() {
  const ctx = useContext(OceanContext);
  if (!ctx) throw new Error('useOcean must be used inside <AppShell>');
  return ctx;
}
