import { PHASES, type Phase, type Topic } from '../data/roadmap';

export type Status = 'todo' | 'doing' | 'done';

export interface Count { done: number; total: number; pct: number }

const count = (done: number, total: number): Count => ({ done, total, pct: total ? done / total : 0 });

export const statusOf = (c: Count): Status => (c.done === 0 ? 'todo' : c.done === c.total ? 'done' : 'doing');

export const topicCount = (t: Topic, done: Set<string>) =>
  count(t.steps.filter(s => done.has(s.id)).length, t.steps.length);

export const phaseCount = (p: Phase, done: Set<string>) => {
  let d = 0, n = 0;
  for (const t of p.topics) for (const s of t.steps) { n++; if (done.has(s.id)) d++; }
  return count(d, n);
};

export const overallCount = (done: Set<string>) => {
  let d = 0, n = 0;
  for (const p of PHASES) { const c = phaseCount(p, done); d += c.done; n += c.total; }
  return count(d, n);
};

/** Fase yang sedang dikerjakan: fase pertama yang belum selesai. */
export const currentPhaseId = (done: Set<string>) =>
  PHASES.find(p => phaseCount(p, done).pct < 1)?.id ?? PHASES[PHASES.length - 1].id;

export const findTopic = (id: string | null) => {
  if (!id) return null;
  for (const [i, p] of PHASES.entries()) {
    const t = p.topics.find(x => x.id === id);
    if (t) return { topic: t, phase: p, phaseIndex: i };
  }
  return null;
};

/** Warna cincin: Amber di awal, bergeser ke Teal saat makin penuh. */
export const ringColor = (pct: number) =>
  pct >= 1 ? 'var(--teal)' : `color-mix(in oklab, var(--teal) ${Math.round(pct * 100)}%, var(--amber))`;
