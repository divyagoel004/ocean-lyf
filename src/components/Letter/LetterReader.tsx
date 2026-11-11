import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CornerUpLeft, Feather, Waves, X } from 'lucide-react';
import BottleSvg from '../Bottle/BottleSvg';
import Paper from './Paper';
import { formatFull, letterTitle } from '../../lib/format';
import type { Letter } from '../../types';

interface Props {
  letter: Letter;
  /** Screen rectangle of the bottle that was clicked (null → rises from the bottom of the sea). */
  origin: DOMRect | null;
  /** Play the bottle → cork → paper intro. False when hopping between linked letters. */
  intro: boolean;
  fromName: string;
  toName: string;
  replyTo: Letter | null;
  replies: Letter[];
  onClose: () => void;
  onReturnToOcean: () => void;
  onReply: () => void;
  onOpenLinked: (id: string) => void;
}

type Stage = 'fly' | 'uncork' | 'rise' | 'open';

const BOTTLE_W = 280;

export default function LetterReader({
  letter,
  origin,
  intro,
  fromName,
  toName,
  replyTo,
  replies,
  onClose,
  onReturnToOcean,
  onReply,
  onOpenLinked,
}: Props) {
  const reduce = useReducedMotion();
  const skipIntro = !intro || Boolean(reduce);
  const [stage, setStage] = useState<Stage>(skipIntro ? 'open' : 'fly');

  // reset when switching to another letter
  useEffect(() => {
    setStage(skipIntro ? 'open' : 'fly');
  }, [letter.id, skipIntro]);

  // choreography: fly → uncork → rise → open
  useEffect(() => {
    if (skipIntro) return;
    const t1 = window.setTimeout(() => setStage('uncork'), 950);
    const t2 = window.setTimeout(() => setStage('rise'), 1900);
    const t3 = window.setTimeout(() => setStage('open'), 2750);
    return () => [t1, t2, t3].forEach(window.clearTimeout);
  }, [letter.id, skipIntro]);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bw = Math.min(BOTTLE_W, vw * 0.7);
  const start = origin
    ? { x: origin.left + origin.width / 2 - vw / 2, y: origin.top + origin.height / 2 - vh / 2, s: Math.max(0.2, origin.width / bw) }
    : { x: 0, y: vh * 0.45, s: 0.3 };

  const showBottle = stage !== 'open';

  return (
    <motion.div
      className="reader-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Letter: ${letterTitle(letter)}`}
    >
      <div className="reader-scrim" onClick={stage === 'open' ? onClose : () => setStage('open')} />

      {/* The bottle travelling to the centre of the screen */}
      <AnimatePresence>
        {showBottle && (
          <motion.div
            key="bottle"
            className="reader-bottle"
            style={{ width: bw }}
            initial={{ x: start.x, y: start.y, scale: start.s, rotate: -12, opacity: 0.9 }}
            animate={{
              x: 0,
              y: stage === 'rise' ? 30 : 0,
              scale: 1,
              rotate: stage === 'fly' ? [-12, 6, 0] : 0,
              opacity: 1,
            }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ duration: stage === 'fly' ? 0.95 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <BottleSvg style={letter.bottle.bottle_style} uncorked={stage === 'uncork' || stage === 'rise'} />
            {/* the rolled paper sliding out of the neck */}
            <AnimatePresence>
              {stage === 'rise' && (
                <motion.span
                  className="paper-roll"
                  initial={{ opacity: 0, y: 10, scale: 0.6, rotate: -90 }}
                  animate={{ opacity: 1, y: -150, scale: 1.1, rotate: -80 }}
                  exit={{ opacity: 0, scale: 1.6 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The unfolded letter */}
      <AnimatePresence mode="wait">
        {stage === 'open' && (
          <motion.section
            key={letter.id}
            className="reader-panel"
            initial={{ opacity: 0, scaleY: 0.06, scaleX: 0.5, y: 30 }}
            animate={{ opacity: 1, scaleY: 1, scaleX: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" className="icon-btn reader-x" onClick={onClose} aria-label="Close letter">
              <X size={18} />
            </button>

            <div className="reader-scroll">
              <Paper
                title={letter.title}
                from={fromName}
                to={toName}
                date={formatFull(letter.created_at)}
                content={letter.content}
                category={letter.category}
              />

              {(replyTo || replies.length > 0) && (
                <nav className="thread" aria-label="Letters linked to this one">
                  {replyTo && (
                    <button type="button" className="thread-link" onClick={() => onOpenLinked(replyTo.id)}>
                      <CornerUpLeft size={14} /> In reply to “{letterTitle(replyTo)}”
                    </button>
                  )}
                  {replies.map((r) => (
                    <button type="button" key={r.id} className="thread-link" onClick={() => onOpenLinked(r.id)}>
                      <Feather size={14} /> Reply: “{letterTitle(r)}”
                    </button>
                  ))}
                </nav>
              )}
            </div>

            <div className="reader-actions">
              <button type="button" className="btn ghost" onClick={onClose}>
                Close Letter
              </button>
              <button type="button" className="btn primary" onClick={onReply}>
                <Feather size={16} /> Send a Reply
              </button>
              <button type="button" className="btn ghost" onClick={onReturnToOcean}>
                <Waves size={16} /> Return to Ocean
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {stage !== 'open' && (
        <button type="button" className="skip-intro" onClick={() => setStage('open')}>
          skip
        </button>
      )}
    </motion.div>
  );
}
