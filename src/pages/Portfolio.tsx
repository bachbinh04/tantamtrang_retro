import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ScreenHeader } from '../components/UI/ScreenHeader';
import { HintBar } from '../components/UI/HintBar';
import { ProjectArt } from '../components/UI/ProjectArt';
import { useInput } from '../hooks/useInput';
import { categories, categoryShort, projects, type Category, type Project } from '../data/projects';
import { triggerGlitch } from '../systems/glitch';
import { sound } from '../systems/audio';
import { pad, safeStorage } from '../lib/motion';
import { revealInContainer } from '../lib/scroll';

type Filter = 'ALL' | Category;
const FILTERS: Filter[] = ['ALL', ...categories];

function useStaticFlash() {
  const [on, setOn] = useState(false);
  const t = useRef<number>();
  const fire = useCallback(() => {
    setOn(false);
    requestAnimationFrame(() => setOn(true));
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setOn(false), 280);
  }, []);
  useEffect(() => () => window.clearTimeout(t.current), []);
  return [on, fire] as const;
}

const ProjectCard = memo(function ProjectCard({
  project,
  index,
  selected,
  activated,
  onHover,
  onOpen,
}: {
  project: Project;
  index: number;
  selected: boolean;
  activated: boolean;
  onHover: (i: number) => void;
  onOpen: (i: number) => void;
}) {
  const [stat, fire] = useStaticFlash();
  useEffect(() => {
    if (selected) fire();
  }, [selected, fire]);

  return (
    <li>
      <button
        type="button"
        className={`pf-card ${selected ? 'is-selected' : ''} ${activated ? 'is-activated' : ''}`}
        onMouseEnter={() => {
          onHover(index);
          fire();
        }}
        onFocus={() => onHover(index)}
        onClick={() => onOpen(index)}
        aria-label={`${project.title}, ${project.category}, ${project.year}`}
      >
        {selected && <motion.span layoutId="pf-cursor" className="sel-frame" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
        <span className={`pf-card__thumb static-hover ${stat ? 'is-static' : ''}`}>
          <ProjectArt art={project.art} seed={project.id} src={project.thumbnail} alt="" />
        </span>
        <span className="pf-card__row">
          <span className="pf-card__no">#{pad(index + 1)}</span>
          <span>{project.year}</span>
        </span>
        <span className="pf-card__title">{project.title}</span>
        <span className="pf-card__cat">{categoryShort[project.category]}</span>
      </button>
    </li>
  );
});

export default function Portfolio() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>(() => (safeStorage.get('session', 'crt.pf.filter') as Filter) || 'ALL');
  const list = useMemo(() => (filter === 'ALL' ? projects : projects.filter((p) => p.category === filter)), [filter]);
  const [sel, setSel] = useState(() => Number(safeStorage.get('session', 'crt.pf.sel')) || 0);
  const [activated, setActivated] = useState<number | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const busy = useRef(false);
  const current = list[Math.min(sel, list.length - 1)];

  useEffect(() => {
    safeStorage.set('session', 'crt.pf.filter', filter);
    safeStorage.set('session', 'crt.pf.sel', String(sel));
  }, [filter, sel]);

  useEffect(() => {
    if (sel > list.length - 1) setSel(0);
  }, [list, sel]);

  // keep the selected card visible inside the small screen
  useEffect(() => {
    revealInContainer(gridRef.current, gridRef.current?.children[sel] as HTMLElement | undefined);
  }, [sel]);

  const open = useCallback(
    (i: number, viaPointer = false) => {
      if (busy.current || !list[i]) return;
      busy.current = true;
      setSel(i);
      setActivated(i);
      triggerGlitch(3);
      if (viaPointer) sound.play('confirm');
      window.setTimeout(() => navigate(`/portfolio/${list[i].id}`), 340);
    },
    [list, navigate],
  );

  const hover = useCallback((i: number) => {
    if (busy.current) return;
    setSel((s) => {
      if (s !== i) sound.play('static');
      return i;
    });
  }, []);
  const openViaPointer = useCallback((i: number) => open(i, true), [open]);

  const cycleFilter = (dir = 1) => {
    const i = FILTERS.indexOf(filter);
    setFilter(FILTERS[(i + dir + FILTERS.length) % FILTERS.length]);
    setSel(0);
    triggerGlitch(2);
  };

  const cols = () => {
    const kids = Array.from(gridRef.current?.children ?? []) as HTMLElement[];
    if (!kids.length) return 1;
    const top = kids[0].offsetTop;
    return Math.max(1, kids.filter((k) => k.offsetTop === top).length);
  };

  useInput((a) => {
    if (busy.current) return true;
    const n = list.length;
    switch (a) {
      case 'left':
        setSel((s) => (s - 1 + n) % n);
        return true;
      case 'right':
        setSel((s) => (s + 1) % n);
        return true;
      case 'up':
        setSel((s) => Math.max(0, s - cols()));
        return true;
      case 'down':
        setSel((s) => Math.min(n - 1, s + cols()));
        return true;
      case 'triangle':
      case 'r1':
        cycleFilter(1);
        return true;
      case 'l1':
        cycleFilter(-1);
        return true;
      case 'confirm':
      case 'start':
        open(sel);
        return true;
    }
    return false;
  });

  return (
    <div className="scr-page pf">
      <ScreenHeader crumb="MEMORY CARD ▸ SLOT 1" title="PORTFOLIO" right={<span className="px-label">{pad(list.length)} FILES</span>} />

      <div className="pf-filters" role="tablist" aria-label="Filter by category">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={f === filter}
            className={`pf-filter ${f === filter ? 'is-active' : ''}`}
            onClick={() => {
              setFilter(f);
              setSel(0);
              triggerGlitch(2);
            }}
          >
            {f === 'ALL' ? 'ALL' : categoryShort[f]}
          </button>
        ))}
      </div>

      <div className="pf-body">
        <ul className="pf-grid scr-scroll" ref={gridRef}>
          {list.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} selected={i === sel} activated={i === activated} onHover={hover} onOpen={openViaPointer} />
          ))}
        </ul>

        <aside className="pf-info panel" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {current && (
              <motion.div
                key={current.id}
                className="pf-info__inner"
                initial={{ opacity: 0, x: 8, filter: 'brightness(2)' }}
                animate={{ opacity: 1, x: 0, filter: 'brightness(1)' }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
              >
                <div className="pf-info__art">
                  <ProjectArt art={current.art} seed={current.id} src={current.thumbnail} alt={`${current.title} preview`} />
                </div>
                <p className="px-label">
                  {current.category} · {current.year}
                </p>
                <h2 className="pf-info__title">{current.title}</h2>
                <p className="pf-info__desc">{current.description}</p>
                <ul className="chips">
                  {current.tech.slice(0, 4).map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn-retro pf-info__open" onClick={() => open(sel, true)}>
                  <span className="sym sym--x">✕</span> OPEN FILE
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      <HintBar
        hints={[
          { sym: 'dpad', label: 'MOVE' },
          { sym: 'x', label: 'OPEN', action: 'confirm' },
          { sym: 't', label: 'FILTER', action: 'triangle' },
          { sym: 'o', label: 'BACK', action: 'back' },
        ]}
      />
    </div>
  );
}
