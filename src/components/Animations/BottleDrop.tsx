import { motion } from 'framer-motion';
import BottleSvg from '../Bottle/BottleSvg';
import type { Letter } from '../../types';

interface Props {
  letter: Letter;
  onDone: () => void;
}

/** Layout constants shared with ocean.css (.bottle-layer top/height). */
export const WATER_TOP = 0.44;
export const WATER_H = 0.5;

/**
 * Plays when a letter is released: the bottle drops into the water at the centre,
 * splashes, then floats off to its place among the others.
 */
export default function BottleDrop({ letter, onDone }: Props) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const b = letter.bottle;
  const base = vw < 640 ? 84 : 96;
  const depth = 0.72 + b.initial_y * 0.5;
  const endW = base * depth;
  const startW = base * 1.7;

  const cx = vw / 2;
  const waterY = vh * (WATER_TOP + 0.22);
  const tx = b.initial_x * vw;
  const ty = vh * (WATER_TOP + WATER_H * b.initial_y);
  const tilt = (b.animation_phase - 0.5) * 26;

  return (
    <div className="bottle-drop" aria-hidden="true">
      {[0, 0.25, 0.5].map((d) => (
        <motion.span
          key={d}
          className="splash-ring"
          style={{ left: cx, top: waterY + 14 }}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.2, 2.2, 3.4] }}
          transition={{ delay: 1.0 + d, duration: 1.6, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        className="bottle-drop-item"
        initial={{ x: cx, y: -140, rotate: -48, width: startW, opacity: 0 }}
        animate={{
          x: [cx, cx, cx, cx, tx],
          y: [-140, waterY - 14, waterY + 8, waterY - 2, ty],
          rotate: [-48, 14, -9, tilt * 0.4, tilt],
          width: [startW, startW * 0.92, startW * 0.9, startW * 0.88, endW],
          opacity: [0, 1, 1, 1, 1],
        }}
        transition={{ duration: 4.2, times: [0, 0.26, 0.34, 0.45, 1], ease: 'easeInOut' }}
        onAnimationComplete={onDone}
      >
        <BottleSvg style={b.bottle_style} />
      </motion.div>
    </div>
  );
}
