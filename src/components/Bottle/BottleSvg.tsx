import { useId } from 'react';
import { motion } from 'framer-motion';

const PALETTE = [
  { tint: '#6ee7da', ribbon: '#f4b6c8' },
  { tint: '#79adff', ribbon: '#d9c6ff' },
  { tint: '#bfa8ff', ribbon: '#ffd9ab' },
  { tint: '#ffa8c6', ribbon: '#a9f1e7' },
];

interface Props {
  style: number;
  className?: string;
  /** undefined = static cork (floating bottles). true/false = animated cork (reader). */
  uncorked?: boolean;
}

/** A small glass bottle lying on the water: tinted glass, cork, rolled letter, ribbon + heart. */
export default function BottleSvg({ style, className, uncorked }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = PALETTE[((style % 4) + 4) % 4];

  const cork = (
    <>
      <rect x="123" y="28.5" width="15" height="13" rx="3.2" fill={`url(#cork${uid})`} />
      <path d="M126 31.5h9M126 35h9M126 38.5h9" stroke="rgba(110,70,30,.28)" strokeWidth=".8" strokeLinecap="round" />
    </>
  );

  return (
    <svg className={className} viewBox="0 0 142 72" width="100%" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`glass${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.tint} stopOpacity=".62" />
          <stop offset=".5" stopColor={p.tint} stopOpacity=".24" />
          <stop offset="1" stopColor={p.tint} stopOpacity=".46" />
        </linearGradient>
        <linearGradient id={`paper${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8e8" />
          <stop offset="1" stopColor="#ecdcb8" />
        </linearGradient>
        <linearGradient id={`cork${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcb67c" />
          <stop offset="1" stopColor="#a67b46" />
        </linearGradient>
      </defs>

      {/* rolled letter inside */}
      <g transform="rotate(-4 52 36)">
        <rect x="24" y="24" width="60" height="25" rx="12.5" fill={`url(#paper${uid})`} />
        <ellipse cx="25.5" cy="36.5" rx="5" ry="12.5" fill="#f3e6c6" stroke="rgba(150,120,70,.45)" strokeWidth=".8" />
        <ellipse cx="25.5" cy="36.5" rx="2.2" ry="6" fill="none" stroke="rgba(150,120,70,.4)" strokeWidth=".7" />
        <path d="M36 31h38M36 36h40M36 41h32" stroke="rgba(120,90,140,.38)" strokeWidth=".9" strokeLinecap="round" />
        {/* ribbon + tiny heart */}
        <rect x="56" y="22" width="6" height="29" rx="1.5" fill={p.ribbon} opacity=".95" />
        <path d="M59 27.6c-3-2-4.2-3.4-4.2-5a2.1 2.1 0 0 1 4.2-.9 2.1 2.1 0 0 1 4.2.9c0 1.6-1.2 3-4.2 5z" fill={p.ribbon} stroke="rgba(255,255,255,.7)" strokeWidth=".5" />
      </g>

      {/* glass body */}
      <path
        d="M20 14H74C90 14 94 26 108 28H122V42H108C94 44 90 56 74 56H20C12 56 8 51 8 44V26C8 19 12 14 20 14Z"
        fill={`url(#glass${uid})`}
        stroke="rgba(255,255,255,.55)"
        strokeWidth="1.2"
      />
      <rect x="119" y="26" width="6" height="18" rx="2" fill="rgba(255,255,255,.28)" stroke="rgba(255,255,255,.6)" strokeWidth="1" />

      {/* highlights */}
      <path d="M17 19.5H70" stroke="rgba(255,255,255,.8)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M17 51.5H46" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M96 30.5q8 1.6 20 1.6" stroke="rgba(255,255,255,.7)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="13" cy="30" r="1.6" fill="rgba(255,255,255,.75)" />

      {/* cork */}
      {uncorked === undefined ? (
        <g>{cork}</g>
      ) : (
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={false}
          animate={uncorked ? { x: 24, y: -20, rotate: -34, opacity: 0.0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {cork}
        </motion.g>
      )}
    </svg>
  );
}
