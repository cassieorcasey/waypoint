import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import type { Phase, Topic } from '../data/roadmap';
import { topicCount } from '../lib/stats';
import { NOTES } from '../content';
import { readingMinutes } from '../lib/markdown';
import { Markdown } from './Markdown';
import { Ring } from './Ring';
import { ArrowUpRight, Check, Close, Globe, Play } from './icons';

interface Props {
  data: { topic: Topic; phase: Phase; phaseIndex: number } | null;
  done: Set<string>;
  isDesktop: boolean;
  onClose: () => void;
  onStep: (id: string, value: boolean) => void;
}

/**
 * Panel topik: slide-over kanan di laptop, bottom sheet di iPhone.
 * Non-modal, jadi peta di belakangnya tetap bisa diketuk dan ikut berubah saat langkah dicentang.
 */
export function TopicSheet({ data, done, isDesktop, onClose, onStep }: Props) {
  // Simpan isi terakhir supaya panel tidak kosong selama animasi menutup.
  const [shown, setShown] = useState(data);
  useEffect(() => { if (data) setShown(data); }, [data]);
  const view = data ?? shown;

  return (
    <Drawer.Root
      open={!!data}
      onOpenChange={o => { if (!o) onClose(); }}
      direction={isDesktop ? 'right' : 'bottom'}
      modal={false}
    >
      <Drawer.Portal>
        <Drawer.Content
          className={`sheet ${isDesktop ? 'sheet-right' : 'sheet-bottom'}`}
          style={isDesktop ? ({ '--initial-transform': 'calc(100% + 16px)' } as CSSProperties) : undefined}
          aria-describedby={undefined}
        >
          {!isDesktop && <div className="sheet-handle" aria-hidden="true" />}
          {view && <SheetBody key={view.topic.id} {...view} done={done} onStep={onStep} />}
          <Drawer.Close className="sheet-close" aria-label="Tutup panel"><Close /></Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

type Tab = 'langkah' | 'materi';

function SheetBody({ topic, phase, phaseIndex, done, onStep }: { topic: Topic; phase: Phase; phaseIndex: number; done: Set<string>; onStep: Props['onStep'] }) {
  const c = topicCount(topic, done);
  const note = NOTES[topic.id];
  const [tab, setTab] = useState<Tab>('langkah');
  const scroller = useRef<HTMLDivElement>(null);
  const show = note ? tab : 'langkah';

  function pick(next: Tab) {
    setTab(next);
    scroller.current?.scrollTo({ top: 0 });
  }

  return (
    <div className="sheet-scroll" ref={scroller}>
      <header className="sheet-head">
        <p className="sheet-eyebrow"><strong>Fase {phaseIndex + 1}</strong> · {phase.title}</p>
        <Drawer.Title className="sheet-title">{topic.title}</Drawer.Title>
        <div className="sheet-progress">
          <Ring size={28} stroke={4} pct={c.pct} />
          <span>{c.done === c.total ? 'Semua langkah selesai' : `${c.done} dari ${c.total} langkah selesai`}</span>
        </div>
      </header>

      {note && (
        <div className="tabs" role="tablist" aria-label="Isi topik">
          <button type="button" role="tab" id="tab-langkah" aria-selected={show === 'langkah'} aria-controls="panel-langkah"
            className={`tab${show === 'langkah' ? ' on' : ''}`} onClick={() => pick('langkah')}>
            Langkah
          </button>
          <button type="button" role="tab" id="tab-materi" aria-selected={show === 'materi'} aria-controls="panel-materi"
            className={`tab${show === 'materi' ? ' on' : ''}`} onClick={() => pick('materi')}>
            Materi <span className="tab-meta">· {readingMinutes(note)} mnt</span>
          </button>
        </div>
      )}

      {show === 'materi' && note ? (
        <div role="tabpanel" id="panel-materi" aria-labelledby="tab-materi" className="sheet-section">
          <Markdown source={note} />
        </div>
      ) : (
        <div role={note ? 'tabpanel' : undefined} id="panel-langkah" aria-labelledby={note ? 'tab-langkah' : undefined}>
      <section className="sheet-section">
        <h3>Langkah</h3>
        <ul className="steps">
          {topic.steps.map(s => {
            const on = done.has(s.id);
            return (
              <li key={s.id}>
                <button type="button" role="checkbox" aria-checked={on} className={`step${on ? ' on' : ''}`} onClick={() => onStep(s.id, !on)}>
                  <motion.span
                    className="tick"
                    initial={false}
                    animate={{ scale: on ? [1, 1.24, 1] : 1 }}
                    transition={{ duration: 0.32, ease: [0.3, 1.4, 0.5, 1] }}
                  >
                    {on && <Check size={13} />}
                  </motion.span>
                  <span className="step-text">{s.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {topic.sources.length > 0 && (
        <section className="sheet-section">
          <h3>Sumber belajar</h3>
          <ul className="sources">
            {topic.sources.map(src => (
              <li key={src.url + src.title}>
                <a className="source" href={src.url} target="_blank" rel="noopener noreferrer">
                  <span className={`pill ${src.kind}`}>
                    {src.kind === 'youtube' ? <Play /> : <Globe />}
                    {src.kind === 'youtube' ? 'YouTube' : 'Web'}
                    <ArrowUpRight />
                  </span>
                  <span className="source-title">{src.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
        </div>
      )}
    </div>
  );
}
