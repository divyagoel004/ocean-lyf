import { memo, type CSSProperties } from 'react';
import type { Letter } from '../../types';
import BottleSvg from './BottleSvg';

interface Props {
  letter: Letter;
  mine: boolean;
  senderName: string;
  unread: boolean;
  arrived: boolean;
  onOpen: (id: string, rect: DOMRect) => void;
}

/**
 * One floating bottle. Three nested layers give each bottle its own motion:
 *   .bottle-drift  – slow horizontal wander
 *   .bottle-bob    – bobbing + rocking on the waves
 *   .bottle-btn    – the interactive glass (hover glow / scale / tooltip)
 */
function BottleInner({ letter, mine, senderName, unread, arrived, onOpen }: Props) {
  const b = letter.bottle;
  const depth = 0.72 + b.initial_y * 0.5;
  const speed = b.animation_speed;
  const phase = b.animation_phase;

  const style = {
    left: `${b.initial_x * 100}%`,
    top: `${b.initial_y * 100}%`,
    zIndex: Math.round(b.initial_y * 100) + 1,
    '--depth': depth,
    '--drift-amp': `${(1.8 + phase * 3.6).toFixed(2)}vw`,
    '--drift-dur': `${(36 / speed).toFixed(1)}s`,
    '--drift-delay': `${(-phase * 34).toFixed(1)}s`,
    '--bob-dur': `${(5.6 / speed).toFixed(1)}s`,
    '--bob-delay': `${(-phase * 7).toFixed(1)}s`,
    '--tilt': `${((phase - 0.5) * 26).toFixed(1)}deg`,
  } as CSSProperties;

  const label = mine ? 'A letter from you ♡' : `A letter from ${senderName} ♡`;

  return (
    <div className="bottle-pos" style={style}>
      <div className="bottle-drift">
        <div className={`bottle-bob${arrived ? ' arrive' : ''}`}>
          <button
            type="button"
            className="bottle-btn"
            aria-label={`${label}${unread ? ' (unread)' : ''}. Open this letter`}
            onClick={(e) => onOpen(letter.id, e.currentTarget.getBoundingClientRect())}
          >
            <span className="bottle-wake" aria-hidden="true" />
            <BottleSvg style={b.bottle_style} className="bottle-svg" />
            {unread && <span className="bottle-unread" aria-hidden="true" />}
          </button>
        </div>
        <span className="bottle-tip" role="tooltip">
          {label}
        </span>
      </div>
    </div>
  );
}

export default memo(BottleInner);
