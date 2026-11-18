import { useEffect, useRef, useState, type RefObject } from 'react';
import { motion } from 'framer-motion';
import { ScreenHeader } from '../components/UI/ScreenHeader';
import { HintBar } from '../components/UI/HintBar';
import { ProjectArt } from '../components/UI/ProjectArt';
import { useInput } from '../hooks/useInput';
import { levels } from '../data/timeline';
import type { ArtPattern } from '../data/projects';
import { triggerGlitch } from '../systems/glitch';
import { sound } from '../systems/audio';
import { asset, pad, prefersReducedMotion, safeStorage } from '../lib/motion';
import { scrollByPage } from '../lib/scroll';

type Mode = 'map' | 'loading' | 'stage';

const NODE_Y = [64, 30, 60, 26, 50];
const nodePos = (i: number) => ({ x: 10 + (i * 80) / Math.max(1, levels.length - 1), y: NODE_Y[i % NODE_Y.length] });

const STAGE_ART: { pattern: ArtPattern; colors: [string, string, string] }[] = [
  { pattern: 'blocks', colors: ['#14102a', '#9D5BFF', '#75F5FF'] },
  { pattern: 'grid', colors: ['#0b1226', '#168DFF', '#75F5FF'] },
  { pattern: 'waves', colors: ['#120b22', '#F15C9C', '#9D5BFF'] },
  { pattern: 'terrain', colors: ['#100c1d', '#F15C9C', '#ffb36b'] },
  { pattern: 'sun', colors: ['#1a0f2e', '#F15C9C', '#75F5FF'] },
];

function WorldMap({ sel, onSelect, onEnter }: { sel: number; onSelect: (i: number) => void; onEnter: (i: number) => void }) {
  const lv = levels[sel];
  const pts = levels.map((_, i) => nodePos(i));
  return (
    <div className="scr-page st">
      <ScreenHeader
        crumb="WORLD 1 ▸ MY STORY"
        title="SELECT STAGE"
        right={
          <span className="px-label">
            {levels.filter((l) => l.status === 'cleared').length}/{levels.length} CLEARED
          </span>
        }
      />
      <div className="st-map">
        <svg className="st-map__path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} />
        </svg>
        {levels.map((l, i) => {
          const p = pts[i];
          return (
            <button
              key={l.id}
              type="button"
              className={`st-node ${i === sel ? 'is-selected' : ''} st-node--${l.status}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onMouseEnter={() => onSelect(i)}
              onFocus={() => onSelect(i)}
              onClick={() => onEnter(i)}
              aria-label={`Level ${l.number}: ${l.title} (${l.year})`}
            >
              {i === sel && (
                <motion.span layoutId="st-player" className="st-player" aria-hidden transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
                  <span>▼</span>
                </motion.span>
              )}
              <span className="st-node__tile">{pad(l.number)}</span>
              <span className="st-node__year">{l.year}</span>
            </button>
          );
        })}
      </div>

      <div className="st-info panel">
        <div className="min-w-0">
          <p className="px-label">
            LEVEL {pad(lv.number)} · {lv.year} · {lv.status === 'cleared' ? 'CLEARED ✓' : 'IN PROGRESS'}
          </p>
          <h2 className="st-info__title">{lv.title}</h2>
          <p className="st-info__teaser">{lv.teaser}</p>
        </div>
        <button type="button" className="btn-retro" onClick={() => onEnter(sel)}>
          <span className="sym sym--x">✕</span> ENTER
        </button>
      </div>

      <HintBar
        hints={[
          { sym: 'lr', label: 'MOVE' },
          { sym: 'x', label: 'ENTER STAGE', action: 'confirm' },
          { sym: 'o', label: 'MENU', action: 'back' },
        ]}
      />
    </div>
  );
}

function Loading({ index }: { index: number }) {
  const lv = levels[index];
  return (
    <div className="st-loading" role="status">
      <p className="px-label">NOW LOADING</p>
      <h2 className="st-loading__stage">STAGE {pad(lv.number)}</h2>
      <p className="st-loading__name">{lv.title}</p>
      <div className="st-loading__bar">
        <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.85, ease: [0.6, 0, 0.3, 1] }} />
      </div>
      <p className="st-loading__tip">{lv.tip}</p>
    </div>
  );
}

function Stage({ index, scrollRef }: { index: number; scrollRef: RefObject<HTMLDivElement> }) {
  const lv = levels[index];
  return (
    <motion.div className="scr-page st-stage" initial={{ opacity: 0, scaleY: 0.96 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ duration: 0.25 }}>
      <ScreenHeader crumb={`STAGE ${pad(lv.number)} / ${pad(levels.length)}`} title={`LV ${pad(lv.number)} — ${lv.title}`} right={<span className="tag">{lv.year}</span>} />
      <div className="scr-scroll st-stage__body" ref={scrollRef} tabIndex={0}>
        <div className="st-stage__art">
          {lv.image ? (
            <img src={asset(lv.image)} alt={lv.title} loading="lazy" />
          ) : (
            <ProjectArt art={STAGE_ART[index % STAGE_ART.length]} seed={lv.id} alt={`${lv.title} scene`} />
          )}
          <span className="st-stage__year">{lv.year}</span>
        </div>
        <div className="st-stage__story">
          {lv.story.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
        <div className="st-achievements panel">
          <p className="px-label">ACHIEVEMENTS UNLOCKED</p>
          <ul>
            {lv.milestones.map((m, i) => (
              <motion.li key={m} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }}>
                <span className="st-trophy" aria-hidden>
                  ★
                </span>
                {m}
              </motion.li>
            ))}
          </ul>
        </div>
        {lv.status === 'current' && (
          <p className="st-continue">
            TO BE CONTINUED<span className="caret">▮</span>
          </p>
        )}
      </div>
      <HintBar
        hints={[
          { sym: 'lr', label: 'PREV/NEXT', action: 'right' },
          { sym: 'ud', label: 'SCROLL' },
          { sym: 'o', label: 'WORLD MAP', action: 'back' },
        ]}
      />
    </motion.div>
  );
}

export default function MyStory() {
  const [mode, setMode] = useState<Mode>('map');
  const [sel, setSel] = useState(() => Math.min(levels.length - 1, Number(safeStorage.get('session', 'crt.story')) || 0));
  const timer = useRef<number>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => safeStorage.set('session', 'crt.story', String(sel)), [sel]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const enter = (i: number) => {
    if (i < 0 || i >= levels.length) return;
    setSel(i);
    setMode('loading');
    triggerGlitch(3);
    sound.play('loading');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => {
        setMode('stage');
        triggerGlitch(2);
      },
      prefersReducedMotion() ? 250 : 1000,
    );
  };

  const select = (i: number) => {
    if (i === sel) return;
    setSel(i);
    sound.play('move');
  };

  useInput((a) => {
    if (mode === 'loading') return true;
    if (mode === 'map') {
      switch (a) {
        case 'left':
        case 'up':
          setSel((s) => Math.max(0, s - 1));
          return true;
        case 'right':
        case 'down':
          setSel((s) => Math.min(levels.length - 1, s + 1));
          return true;
        case 'confirm':
        case 'start':
          enter(sel);
          return true;
      }
      return false;
    }
    switch (a) {
      case 'left':
      case 'l1':
        if (sel > 0) enter(sel - 1);
        return true;
      case 'right':
      case 'r1':
        if (sel < levels.length - 1) enter(sel + 1);
        return true;
      case 'up':
        scrollByPage(scrollRef.current, -1);
        return true;
      case 'down':
        scrollByPage(scrollRef.current, 1);
        return true;
      case 'back':
        setMode('map');
        triggerGlitch(3);
        return true;
      case 'confirm':
      case 'start':
        if (sel < levels.length - 1) enter(sel + 1);
        return true;
    }
    return false;
  });

  if (mode === 'loading') return <Loading index={sel} />;
  if (mode === 'stage') return <Stage key={sel} index={sel} scrollRef={scrollRef} />;
  return <WorldMap sel={sel} onSelect={select} onEnter={enter} />;
}
