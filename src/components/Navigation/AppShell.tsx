import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useLetters } from '../../hooks/useLetters';
import { useAmbientSound } from '../../hooks/useAmbientSound';
import { OceanContext, type OceanContextValue } from '../../hooks/OceanContext';
import { createLetter, markLetterRead } from '../../services/letters';
import Navigation from './Navigation';
import HeartBurst from '../Animations/HeartBurst';
import BottleDrop from '../Animations/BottleDrop';
import Toasts, { type ToastItem } from '../Animations/Toasts';
import type { Letter, NewLetterInput } from '../../types';

// Heavy, not-needed-on-first-paint pieces are lazy-loaded.
const LetterReader = lazy(() => import('../Letter/LetterReader'));
const LetterComposer = lazy(() => import('../LetterComposer/LetterComposer'));

const preload = () => {
  void import('../Letter/LetterReader');
  void import('../LetterComposer/LetterComposer');
};

interface ReaderState {
  id: string;
  origin: DOMRect | null;
  intro: boolean;
}

export default function AppShell() {
  const { me, signOut } = useAuth();
  // RequireAuth guarantees `me`
  const meP = me!;
  const { letters, profiles, status, error, reload, upsert, markReadLocal, arrivedIds } = useLetters(meP.id);
  const sound = useAmbientSound();
  const navigate = useNavigate();
  const loc = useLocation();

  const [reader, setReader] = useState<ReaderState | null>(null);
  const [composer, setComposer] = useState<{ replyToId: string | null } | null>(null);
  const [launch, setLaunch] = useState<Letter | null>(null);
  const [burst, setBurst] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(preload);
    else window.setTimeout(preload, 1200);
  }, []);

  const toast = useCallback((text: string, ms = 4200) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);

  const partner = useMemo(() => profiles.find((p) => p.id !== meP.id) ?? null, [profiles, meP.id]);
  const byId = useMemo(() => new Map(letters.map((l) => [l.id, l])), [letters]);

  const nameOf = useCallback(
    (id: string | null) => {
      if (!id) return 'Both of us';
      if (id === meP.id) return meP.display_name;
      return profiles.find((p) => p.id === id)?.display_name ?? 'Mikku';
    },
    [profiles, meP],
  );

  const unreadIds = useMemo(
    () =>
      new Set(
        letters.filter((l) => !l.is_read && l.sender_id !== meP.id && (l.recipient_id === null || l.recipient_id === meP.id)).map((l) => l.id),
      ),
    [letters, meP.id],
  );

  const hiddenIds = useMemo(() => new Set(launch ? [launch.id] : []), [launch]);

  const openLetter = useCallback((id: string, origin: DOMRect | null = null) => {
    setReader({ id, origin, intro: true });
  }, []);

  const openComposer = useCallback((opts?: { replyTo?: Letter }) => {
    setReader(null);
    setComposer({ replyToId: opts?.replyTo?.id ?? null });
  }, []);

  const findRandom = useCallback(() => {
    const pool = letters.filter((l) => l.id !== reader?.id);
    if (pool.length === 0) {
      toast('The ocean is still quiet… release the first bottle ♡');
      return;
    }
    const unread = pool.filter((l) => unreadIds.has(l.id));
    const pickFrom = unread.length ? unread : pool;
    const pick = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    openLetter(pick.id, null);
  }, [letters, reader?.id, unreadIds, openLetter, toast]);

  // Mark as read when the *other* person opens it (never deletes anything).
  const openId = reader?.id;
  useEffect(() => {
    if (!openId) return;
    const l = byId.get(openId);
    if (l && l.sender_id !== meP.id && !l.is_read) {
      markLetterRead(l.id)
        .then(() => markReadLocal(l.id))
        .catch(() => undefined);
    }
  }, [openId, byId, meP.id, markReadLocal]);

  const release = useCallback(
    async (input: NewLetterInput) => {
      const letter = await createLetter(input, letters.map((l) => l.bottle));
      upsert(letter);
      setComposer(null);
      setBurst((b) => b + 1);
      if (loc.pathname === '/ocean') setLaunch(letter);
      window.setTimeout(() => toast('Your words have found their way into our ocean. ♡', 5200), 700);
      return letter;
    },
    [letters, upsert, loc.pathname, toast],
  );

  const openedLetter = reader ? byId.get(reader.id) ?? null : null;
  const replyingTo = composer?.replyToId ? byId.get(composer.replyToId) ?? null : null;

  const value: OceanContextValue = {
    me: meP,
    partner,
    profiles,
    letters,
    status,
    error,
    reload,
    arrivedIds,
    hiddenIds,
    unreadIds,
    nameOf,
    openLetter,
    openComposer,
    findRandom,
    soundOn: sound.on,
    toggleSound: sound.toggle,
    signOut: () => {
      void signOut().then(() => navigate('/', { replace: true }));
    },
  };

  return (
    <OceanContext.Provider value={value}>
      <div className="shell">
        <Navigation />
        <main className="shell-main">
          <Outlet />
        </main>

        <Suspense fallback={null}>
          <AnimatePresence>
            {openedLetter && reader && (
              <LetterReader
                key="reader"
                letter={openedLetter}
                origin={reader.origin}
                intro={reader.intro}
                fromName={nameOf(openedLetter.sender_id)}
                toName={nameOf(openedLetter.recipient_id)}
                replyTo={openedLetter.reply_to_id ? byId.get(openedLetter.reply_to_id) ?? null : null}
                replies={letters.filter((l) => l.reply_to_id === openedLetter.id)}
                onClose={() => setReader(null)}
                onReturnToOcean={() => {
                  setReader(null);
                  if (loc.pathname !== '/ocean') navigate('/ocean');
                }}
                onReply={() => openComposer({ replyTo: openedLetter })}
                onOpenLinked={(id) => setReader({ id, origin: null, intro: false })}
              />
            )}
          </AnimatePresence>
        </Suspense>

        <Suspense fallback={null}>
          <AnimatePresence>
            {composer && (
              <LetterComposer
                key={`composer-${composer.replyToId ?? 'new'}`}
                me={meP}
                partner={partner}
                replyTo={replyingTo}
                replyToName={replyingTo ? nameOf(replyingTo.sender_id) : null}
                onClose={() => setComposer(null)}
                onRelease={release}
              />
            )}
          </AnimatePresence>
        </Suspense>

        {launch && <BottleDrop key={launch.id} letter={launch} onDone={() => setLaunch(null)} />}
        <HeartBurst burstKey={burst} />
        <Toasts items={toasts} />
      </div>
    </OceanContext.Provider>
  );
}
