import { memo, useEffect, useRef } from 'react';

interface Props {
  /** Horizon position as a fraction of the height (0..1). */
  horizon?: number;
  /** Softer, slower waves (used behind panels). */
  calm?: boolean;
  moon?: boolean;
}

interface Star { x: number; y: number; r: number; p: number; s: number }
interface Fly { x: number; y: number; a: number; sp: number; p: number }
interface Mote { x: number; y: number; r: number; v: number; p: number }
interface HeartLight { x: number; y: number; t: number; dur: number; size: number; sway: number }

const LAYERS = 5;

/**
 * The living sea: sky, stars, moon, multi-layer waves, moon glints, plankton,
 * fireflies and drifting heart-shaped lights — one canvas, one rAF loop.
 */
function OceanCanvasInner({ horizon = 0.42, calm = false, moon = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce = reduceQuery.matches;
    const onReduce = () => {
      reduce = reduceQuery.matches;
      if (reduce) draw(0);
    };
    reduceQuery.addEventListener?.('change', onReduce);

    let w = 0;
    let h = 0;
    let hy = 0;
    let raf = 0;
    let running = true;
    let stars: Star[] = [];
    let flies: Fly[] = [];
    let motes: Mote[] = [];
    let hearts: HeartLight[] = [];
    let waterGrad: CanvasGradient;
    let layerGrads: CanvasGradient[] = [];
    let nextHeart = 2;
    let last = 0;

    const rand = Math.random;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      hy = h * horizon;

      waterGrad = ctx!.createLinearGradient(0, hy, 0, h);
      waterGrad.addColorStop(0, 'rgba(40,120,150,0.95)');
      waterGrad.addColorStop(0.35, 'rgba(14,52,96,1)');
      waterGrad.addColorStop(1, 'rgba(5,12,34,1)');

      layerGrads = [];
      const span = h - hy;
      for (let i = 0; i < LAYERS; i++) {
        const y0 = layerBase(i);
        const g = ctx!.createLinearGradient(0, y0 - 14, 0, y0 + span / LAYERS + 60);
        const k = i / (LAYERS - 1);
        const a = 0.42 + k * 0.5;
        g.addColorStop(0, `rgba(${Math.round(92 - k * 62)},${Math.round(200 - k * 120)},${Math.round(205 - k * 90)},${a})`);
        g.addColorStop(1, `rgba(${Math.round(12 - k * 4)},${Math.round(40 - k * 20)},${Math.round(84 - k * 36)},${Math.min(1, a + 0.15)})`);
        layerGrads.push(g);
      }

      const area = w * h;
      const starCount = Math.round(Math.min(220, Math.max(60, area / 9000)));
      stars = Array.from({ length: starCount }, () => ({
        x: rand() * w,
        y: rand() * hy * 0.96,
        r: 0.35 + rand() * 1.15,
        p: rand() * Math.PI * 2,
        s: 0.4 + rand() * 1.6,
      }));
      flies = Array.from({ length: w < 700 ? 9 : 16 }, () => ({
        x: rand() * w,
        y: hy * 0.55 + rand() * (h - hy * 0.55),
        a: rand() * Math.PI * 2,
        sp: 6 + rand() * 10,
        p: rand() * 10,
      }));
      motes = Array.from({ length: w < 700 ? 34 : 70 }, () => ({
        x: rand() * w,
        y: hy + rand() * (h - hy),
        r: 0.6 + rand() * 1.6,
        v: 2 + rand() * 6,
        p: rand() * 10,
      }));
      if (reduce) draw(0);
    }

    const layerBase = (i: number) => hy + Math.pow(i / LAYERS, 1.25) * (h - hy) * 0.9 + 4;

    function heartPath(x: number, y: number, s: number) {
      ctx!.beginPath();
      ctx!.moveTo(x, y + s * 0.35);
      ctx!.bezierCurveTo(x - s, y - s * 0.25, x - s * 0.55, y - s * 1.1, x, y - s * 0.45);
      ctx!.bezierCurveTo(x + s * 0.55, y - s * 1.1, x + s, y - s * 0.25, x, y + s * 0.35);
      ctx!.closePath();
    }

    function glow(x: number, y: number, r: number, color: string) {
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = g;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
    }

    function draw(t: number) {
      const c = ctx!;
      c.clearRect(0, 0, w, h);

      // ----- stars
      for (const s of stars) {
        const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
        c.fillStyle = `rgba(255,248,230,${(a * (1 - s.y / hy) * 0.9 + a * 0.1).toFixed(3)})`;
        c.beginPath();
        c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        c.fill();
      }

      // ----- moon
      const mx = w * 0.74;
      const my = hy * 0.4;
      const mr = Math.max(20, Math.min(50, Math.min(w, h) * 0.05));
      if (moon) {
        glow(mx, my, mr * 7, 'rgba(190,210,255,0.16)');
        glow(mx, my, mr * 3, 'rgba(255,244,220,0.22)');
        const mg = c.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
        mg.addColorStop(0, '#fffaf0');
        mg.addColorStop(1, '#f1e2bd');
        c.fillStyle = mg;
        c.beginPath();
        c.arc(mx, my, mr, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(200,180,140,0.16)';
        for (const [ox, oy, r] of [[-0.32, -0.1, 0.22], [0.25, 0.28, 0.16], [0.18, -0.34, 0.11], [-0.1, 0.42, 0.1]]) {
          c.beginPath();
          c.arc(mx + ox * mr, my + oy * mr, r * mr, 0, Math.PI * 2);
          c.fill();
        }
      }

      // ----- horizon haze (lavender → blush)
      const hz = c.createLinearGradient(0, hy - h * 0.2, 0, hy + 4);
      hz.addColorStop(0, 'rgba(169,155,214,0)');
      hz.addColorStop(0.7, 'rgba(169,155,214,0.18)');
      hz.addColorStop(1, 'rgba(242,184,198,0.26)');
      c.fillStyle = hz;
      c.fillRect(0, hy - h * 0.2, w, h * 0.2 + 4);

      // ----- water
      c.fillStyle = waterGrad;
      c.fillRect(0, hy, w, h - hy);

      // ----- moon glints on the water (they are drawn between the back and front waves)
      const glintRows = Math.round(Math.min(26, (h - hy) / 14));
      const drawGlints = () => {
        if (!moon) return;
        for (let j = 0; j < glintRows; j++) {
          const k = j / glintRows;
          const y = hy + 4 + Math.pow(k, 1.35) * (h - hy) * 0.78;
          const sway = Math.sin(t * 0.8 + j * 1.7) * (8 + k * 36) + Math.sin(t * 0.37 + j) * (4 + k * 14);
          const gw = (10 + k * 120) * (0.6 + 0.4 * Math.sin(t * 1.3 + j * 2.1));
          const a = (0.5 - k * 0.32) * (0.55 + 0.45 * Math.sin(t * 1.1 + j * 0.9));
          c.fillStyle = `rgba(255,244,215,${Math.max(0, a).toFixed(3)})`;
          c.beginPath();
          c.ellipse(mx + sway, y, gw, 1 + k * 1.8, 0, 0, Math.PI * 2);
          c.fill();
        }
      };

      // ----- wave layers
      const scale = Math.min(1.4, Math.max(0.7, h / 800)) * (calm ? 0.6 : 1);
      for (let i = 0; i < LAYERS; i++) {
        const y0 = layerBase(i);
        const amp = (3 + i * 3.4) * scale;
        const f1 = 0.0062 / (1 + i * 0.13);
        const f2 = 0.0135 / (1 + i * 0.1);
        const s1 = 0.5 + i * 0.2;
        const s2 = 0.8 + i * 0.16;
        const drift = i % 2 === 0 ? 1 : -1;
        c.fillStyle = layerGrads[i];
        c.beginPath();
        c.moveTo(0, h);
        for (let x = 0; x <= w + 8; x += 8) {
          const y =
            y0 +
            Math.sin(x * f1 + t * s1 * drift + i * 1.3) * amp +
            Math.sin(x * f2 - t * s2 + i * 2.1) * amp * 0.45;
          c.lineTo(x, y);
        }
        c.lineTo(w, h);
        c.closePath();
        c.fill();

        // foamy crest line
        c.strokeStyle = `rgba(210,245,245,${(0.05 + i * 0.035).toFixed(3)})`;
        c.lineWidth = 1;
        c.beginPath();
        for (let x = 0; x <= w + 8; x += 8) {
          const y =
            y0 +
            Math.sin(x * f1 + t * s1 * drift + i * 1.3) * amp +
            Math.sin(x * f2 - t * s2 + i * 2.1) * amp * 0.45;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();

        if (i === 1) drawGlints();
      }

      // ----- plankton motes rising through the water
      for (const m of motes) {
        const yy = hy + ((m.y - hy - t * m.v * 0.6) % (h - hy) + (h - hy)) % (h - hy);
        const xx = m.x + Math.sin(t * 0.4 + m.p) * 12;
        const a = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(t * 1.2 + m.p));
        c.fillStyle = `rgba(170,255,240,${a.toFixed(3)})`;
        c.beginPath();
        c.arc(xx, yy, m.r, 0, Math.PI * 2);
        c.fill();
      }

      // ----- fireflies
      for (const f of flies) {
        const ax = f.x + Math.sin(t * 0.25 + f.p) * 60 + Math.cos(f.a + t * 0.12) * f.sp * 6;
        const ay = f.y + Math.cos(t * 0.31 + f.p) * 34 + Math.sin(f.a + t * 0.1) * f.sp * 3;
        const a = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.1 + f.p * 3), 2);
        glow(ax, ay, 14, `rgba(255,224,150,${(a * 0.55).toFixed(3)})`);
        c.fillStyle = `rgba(255,246,210,${a.toFixed(3)})`;
        c.beginPath();
        c.arc(ax, ay, 1.4, 0, Math.PI * 2);
        c.fill();
      }

      // ----- heart-shaped lights
      for (const hl of hearts) {
        const k = hl.t / hl.dur;
        const a = Math.sin(Math.PI * k) * 0.75;
        const x = hl.x + Math.sin(k * 5 + hl.sway) * 14;
        const y = hl.y - k * (h * 0.28);
        glow(x, y, hl.size * 3.2, `rgba(255,186,208,${(a * 0.35).toFixed(3)})`);
        c.fillStyle = `rgba(255,214,226,${a.toFixed(3)})`;
        heartPath(x, y, hl.size);
        c.fill();
      }
    }

    function frame(now: number) {
      if (!running) return;
      const t = now / 1000;
      const dt = Math.min(0.05, last ? t - last : 0.016);
      last = t;

      nextHeart -= dt;
      if (nextHeart <= 0) {
        hearts.push({
          x: w * (0.1 + rand() * 0.8),
          y: hy + (h - hy) * (0.35 + rand() * 0.55),
          t: 0,
          dur: 7 + rand() * 4,
          size: 4 + rand() * 3,
          sway: rand() * 6,
        });
        nextHeart = 5 + rand() * 6;
      }
      for (const hl of hearts) hl.t += dt;
      hearts = hearts.filter((hl) => hl.t < hl.dur);

      draw(t);
      raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduce && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    if (reduce) draw(0);
    else raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      reduceQuery.removeEventListener?.('change', onReduce);
    };
  }, [horizon, calm, moon]);

  return <canvas ref={ref} className="ocean-canvas" aria-hidden="true" />;
}

export default memo(OceanCanvasInner);
