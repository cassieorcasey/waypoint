import { motion } from 'motion/react';
import { ringColor } from '../lib/stats';

const SETTLE = { type: 'spring', stiffness: 220, damping: 30 } as const; // ζ ≈ 1, berhenti rapi

/** Cincin progres bergaya Activity Rings: track redup, isi menyala, ujung membulat. */
export function Ring({ size, stroke, pct, className }: { size: number; stroke: number; pct: number; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = ringColor(pct);
  return (
    <svg className={className} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={false}
        animate={{ strokeDashoffset: c * (1 - pct), opacity: pct > 0 ? 1 : 0 }}
        transition={SETTLE}
        style={{ filter: pct > 0 ? 'var(--ring-glow)' : 'none', color }}
      />
    </svg>
  );
}
