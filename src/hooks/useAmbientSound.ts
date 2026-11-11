import { useCallback, useEffect, useRef, useState } from 'react';

interface Engine {
  ctx: AudioContext;
  master: GainNode;
}

/** Procedural ocean ambience (no audio files): filtered brown noise swelling like waves + soft foam hiss. */
export function useAmbientSound() {
  const [on, setOn] = useState(false);
  const engine = useRef<Engine | null>(null);

  const build = (): Engine => {
    const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const len = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.2;
      }
    }

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // deep swell
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 650;
    const swell = ctx.createGain();
    swell.gain.value = 0.55;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.38;
    lfo.connect(lfoGain).connect(swell.gain);
    src.connect(lp).connect(swell).connect(master);

    // foam hiss
    const src2 = ctx.createBufferSource();
    src2.buffer = buf;
    src2.loop = true;
    src2.playbackRate.value = 1.4;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 0.7;
    const hiss = ctx.createGain();
    hiss.gain.value = 0.05;
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.13;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.035;
    lfo2.connect(lfo2Gain).connect(hiss.gain);
    src2.connect(bp).connect(hiss).connect(master);

    src.start();
    src2.start(0, 1.7);
    lfo.start();
    lfo2.start();
    return { ctx, master };
  };

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      try {
        if (next && !engine.current) engine.current = build();
        const e = engine.current;
        if (e) {
          if (next && e.ctx.state === 'suspended') void e.ctx.resume();
          const t = e.ctx.currentTime;
          e.master.gain.cancelScheduledValues(t);
          e.master.gain.setValueAtTime(e.master.gain.value, t);
          e.master.gain.linearRampToValueAtTime(next ? 0.34 : 0, t + (next ? 1.8 : 0.6));
        }
      } catch {
        return false; // audio not available — stay off quietly
      }
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      engine.current?.ctx.close().catch(() => undefined);
      engine.current = null;
    },
    [],
  );

  return { on, toggle };
}
