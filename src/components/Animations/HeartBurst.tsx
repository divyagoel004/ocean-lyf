import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

/** A little shower of hearts floating up from the bottom of the screen. Re-mount with a new `burstKey` to replay. */
export default function HeartBurst({ burstKey }: { burstKey: number }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 360,
        drift: (Math.random() - 0.5) * 120,
        delay: Math.random() * 0.7,
        size: 12 + Math.random() * 18,
        dur: 2.6 + Math.random() * 1.6,
        hue: Math.random() > 0.5 ? '#f2b8c6' : '#ffe3ec',
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstKey],
  );

  if (!burstKey) return null;
  return (
    <div className="heart-burst" aria-hidden="true">
      {hearts.map((h) => (
        <motion.span
          key={`${burstKey}-${h.id}`}
          className="heart-burst-item"
          initial={{ opacity: 0, y: 0, x: h.x, scale: 0.4 }}
          animate={{ opacity: [0, 1, 1, 0], y: -window.innerHeight * 0.55, x: h.x + h.drift, scale: [0.4, 1, 1.1, 0.9] }}
          transition={{ duration: h.dur, delay: h.delay, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
        >
          <Heart size={h.size} fill={h.hue} color={h.hue} strokeWidth={1} />
        </motion.span>
      ))}
    </div>
  );
}
