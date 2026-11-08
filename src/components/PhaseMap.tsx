import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PHASES, type Phase } from '../data/roadmap';
import { phaseCount, ringColor, statusOf, topicCount } from '../lib/stats';
import { useWidth } from '../lib/hooks';
import { Ring } from './Ring';
import { Check } from './icons';

// Pegas. ζ = damping / (2·√(stiffness·mass)).
const BLOOM = { type: 'spring', stiffness: 260, damping: 26 } as const; // ζ ≈ 0,8: mekar, sedikit membal
const CLOSE = { type: 'spring', stiffness: 380, damping: 39 } as const; // ζ ≈ 1: menutup tanpa membal
const SETTLE = { type: 'spring', stiffness: 300, damping: 35 } as const; // ζ ≈ 1: tinggi baris, redup

const ROW_H = 104;
const CY = ROW_H / 2; // pusat node fase di dalam baris
const NODE = 72;
// Posisi gelembung relatif ke pusat node: zig-zag ke kanan bawah, bebas dari label fase.
const ZIGZAG: [number, number][] = [[128, 96], [236, 152], [128, 208], [236, 264]];

interface Props {
  done: Set<string>;
  openPhase: string | null;
  activeTopic: string | null;
  isDesktop: boolean;
  onTogglePhase: (id: string) => void;
  onTopic: (id: string) => void;
}

export function PhaseMap({ done, openPhase, activeTopic, isDesktop, onTogglePhase, onTopic }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const nodeX = isDesktop ? 56 : 40;
  const d = isDesktop ? 112 : 96;
  const sx = Math.max(0.78, Math.min(isDesktop ? 1.9 : 1.08, (width - nodeX - d / 2 - 8) / 236));
  const sy = isDesktop ? 1.25 : 1;

  return (
    <div className="map" ref={ref} role="list">
      {width > 0 && PHASES.map((p, i) => (
        <PhaseRow
          key={p.id} phase={p} index={i} done={done}
          prevComplete={i > 0 && phaseCount(PHASES[i - 1], done).pct >= 1}
          isLast={i === PHASES.length - 1}
          open={openPhase === p.id} dim={openPhase !== null && openPhase !== p.id}
          activeTopic={activeTopic} geo={{ nodeX, d, sx, sy }}
          onToggle={() => onTogglePhase(p.id)} onTopic={onTopic}
        />
      ))}
    </div>
  );
}

interface RowProps {
  phase: Phase; index: number; done: Set<string>; prevComplete: boolean; isLast: boolean;
  open: boolean; dim: boolean; activeTopic: string | null;
  geo: { nodeX: number; d: number; sx: number; sy: number };
  onToggle: () => void; onTopic: (id: string) => void;
}

function PhaseRow({ phase, index, done, prevComplete, isLast, open, dim, activeTopic, geo, onToggle, onTopic }: RowProps) {
  const rowRef = useRef<HTMLElement>(null);
  const first = useRef(true);
  const { nodeX, d, sx, sy } = geo;
  const pc = phaseCount(phase, done);
  const complete = pc.pct >= 1;
  const targets = phase.topics.map((_, k) => ({ x: ZIGZAG[k % 4][0] * sx, y: ZIGZAG[k % 4][1] * sy + Math.floor(k / 4) * 224 * sy }));
  const openH = CY + Math.max(...targets.map(t => t.y)) + d / 2 + 24;
  const height = open ? openH : ROW_H;

  // Fase yang dibuka digulir ke atas layar (langsung saat pertama, halus setelahnya).
  useEffect(() => {
    if (!open || !rowRef.current) return;
    const el = rowRef.current;
    const instant = first.current;
    first.current = false;
    if (instant && index === 0) return;
    const top = el.getBoundingClientRect().top;
    if (instant || top < 0 || top > innerHeight * 0.45) {
      requestAnimationFrame(() => el.scrollIntoView({ block: 'start', behavior: instant ? 'auto' : 'smooth' }));
    }
  }, [open, index]);
  useEffect(() => { if (!open) first.current = false; }, [open]);

  const headId = `fase-${phase.id}`;
  return (
    <motion.section
      ref={rowRef} role="listitem" aria-labelledby={headId}
      className={`row${open ? ' is-open' : ''}`}
      initial={false} animate={{ height }} transition={SETTLE}
    >
      {index > 0 && <span className={`seg${prevComplete ? ' lit' : ''}`} style={{ left: nodeX, top: 0, height: CY }} />}
      {!isLast && <span className={`seg${complete ? ' lit' : ''}`} style={{ left: nodeX, top: CY, bottom: 0 }} />}

      <svg className="links" aria-hidden="true">
        <AnimatePresence>
          {open && phase.topics.map((t, k) => {
            const { x, y } = targets[k];
            const st = statusOf(topicCount(t, done));
            return (
              <motion.path
                key={t.id}
                className={`link ${st}`}
                d={`M ${nodeX} ${CY} C ${nodeX} ${CY + y * 0.9}, ${nodeX + x * 0.3} ${CY + y}, ${nodeX + x} ${CY + y}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1, transition: { ...BLOOM, delay: k * 0.045 } }}
                exit={{ pathLength: 0, opacity: 0, transition: CLOSE }}
              />
            );
          })}
        </AnimatePresence>
      </svg>

      <motion.button
        type="button" id={headId} className={`phase${complete ? ' complete' : ''}`}
        aria-expanded={open}
        style={{ left: nodeX - NODE / 2, top: CY - NODE / 2, transformOrigin: `${NODE / 2}px ${NODE / 2}px` }}
        initial={false}
        animate={{ scale: dim ? 0.85 : 1, opacity: dim ? 0.4 : 1 }}
        transition={SETTLE}
        whileTap={{ scale: dim ? 0.82 : 0.96 }}
        onClick={onToggle}
      >
        <span className="phase-node">
          <Ring size={NODE} stroke={7} pct={pc.pct} />
          <span className="phase-num" style={complete ? { color: ringColor(1) } : undefined}>
            {complete ? <Check size={22} /> : index + 1}
          </span>
        </span>
        <span className="phase-label">
          <strong>{phase.title}</strong>
          <span>Fase {index + 1} · {phase.topics.length} topik · {pc.done}/{pc.total} langkah</span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && phase.topics.map((t, k) => {
          const c = topicCount(t, done);
          const st = statusOf(c);
          const active = activeTopic === t.id;
          return (
            <motion.button
              key={t.id} type="button" data-topic={t.id}
              className={`bubble ${st}${active ? ' active' : ''}`}
              aria-pressed={active}
              aria-label={`${t.title}, ${c.done} dari ${c.total} langkah`}
              style={{ left: nodeX - d / 2, top: CY - d / 2, width: d, height: d }}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
              animate={{ x: targets[k].x, y: targets[k].y, scale: 1, opacity: 1, transition: { ...BLOOM, delay: k * 0.045 } }}
              exit={{ x: 0, y: 0, scale: 0.3, opacity: 0, transition: CLOSE }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onTopic(t.id)}
            >
              {st === 'doing' && <Ring className="bubble-ring" size={d} stroke={3} pct={c.pct} />}
              {st === 'done' && <span className="bubble-check"><Check size={13} /></span>}
              <span className="bubble-title">{t.title}</span>
              <span className="bubble-count">{c.done}/{c.total}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.section>
  );
}
