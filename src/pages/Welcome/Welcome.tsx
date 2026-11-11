import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import OceanBackdrop from '../../components/Ocean/OceanBackdrop';

export default function Welcome() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    if (leaving) return;
    if (reduce) {
      navigate('/ocean');
      return;
    }
    setLeaving(true);
    window.setTimeout(() => navigate('/ocean'), 1350);
  };

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <motion.div
      className="welcome"
      animate={leaving ? { scale: 1.7, y: '-9%', opacity: 0 } : { scale: 1, y: 0, opacity: 1 }}
      transition={{ duration: 1.3, ease: [0.65, 0, 0.35, 1] }}
    >
      <OceanBackdrop horizon={0.6}>
        <div className="welcome-content">
          <motion.span className="welcome-heart" aria-hidden="true" {...rise(0.2)}>
            <Heart size={22} fill="currentColor" />
          </motion.span>
          <motion.h1 className="display" {...rise(0.5)}>
            Hii Mikku <span className="heart-glyph">♡</span>
          </motion.h1>
          <motion.p className="welcome-sub" {...rise(1.0)}>
            Somewhere between the waves and the stars, there’s a little world that belongs to us.
          </motion.p>
          <motion.p className="welcome-sub small" {...rise(1.5)}>
            I made a little world for us. Somewhere our words can float forever…
          </motion.p>
          <motion.div {...rise(2.0)}>
            <button type="button" className="btn enter" onClick={enter}>
              <span>Enter Our Little Ocean</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </motion.div>
        </div>
      </OceanBackdrop>
    </motion.div>
  );
}
