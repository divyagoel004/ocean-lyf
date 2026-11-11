import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Feather, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import OceanBackdrop from '../../components/Ocean/OceanBackdrop';
import Bottle from '../../components/Bottle/Bottle';
import { useOcean } from '../../hooks/OceanContext';

export default function OceanPage() {
  const { letters, status, error, reload, me, nameOf, unreadIds, arrivedIds, hiddenIds, openLetter, openComposer } = useOcean();

  const onOpen = useCallback((id: string, rect: DOMRect) => openLetter(id, rect), [openLetter]);

  return (
    <motion.div
      className="ocean-page"
      initial={{ opacity: 0, scale: 1.18 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <OceanBackdrop horizon={0.42}>
        <div className="bottle-layer">
          {letters.map((l) =>
            hiddenIds.has(l.id) ? null : (
              <Bottle
                key={l.id}
                letter={l}
                mine={l.sender_id === me.id}
                senderName={nameOf(l.sender_id)}
                unread={unreadIds.has(l.id)}
                arrived={arrivedIds.has(l.id)}
                onOpen={onOpen}
              />
            ),
          )}
        </div>

        {status === 'loading' && (
          <div className="ocean-note" role="status">
            <Loader2 className="spin" size={22} aria-hidden="true" />
            <p>Gathering our bottles…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="ocean-note" role="alert">
            <WifiOff size={22} aria-hidden="true" />
            <p>The tide went out for a moment.</p>
            <small>{error}</small>
            <button type="button" className="btn ghost" onClick={reload}>
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        )}

        {status === 'ready' && letters.length === 0 && (
          <div className="ocean-note">
            <p className="lead">The ocean is quiet… for now.</p>
            <small>Release the very first bottle — it will appear on both of your screens.</small>
            <button type="button" className="btn primary" onClick={() => openComposer()}>
              <Feather size={16} /> Write the first letter
            </button>
          </div>
        )}

        {status === 'ready' && error && (
          <p className="offline-pill" role="status">
            <WifiOff size={13} /> Reconnecting…
          </p>
        )}
      </OceanBackdrop>
    </motion.div>
  );
}
