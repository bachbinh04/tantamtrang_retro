import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { pad } from '../../lib/motion';

interface Props {
  index: number;
  label: string;
  meta: string;
  /** the item's own neon colour */
  color: string;
  selected: boolean;
  activated: boolean;
  onHover: (i: number) => void;
  onActivate: (i: number) => void;
}

export const MenuItem = memo(function MenuItem({ index, label, meta, color, selected, activated, onHover, onActivate }: Props) {
  const [glitching, setGlitching] = useState(false);
  const timer = useRef<number>();
  const raf = useRef<number>();

  const fire = () => {
    setGlitching(false);
    cancelAnimationFrame(raf.current!);
    raf.current = requestAnimationFrame(() => setGlitching(true));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setGlitching(false), 260);
  };

  // Distort the label briefly whenever it becomes selected (keyboard, pad or mouse).
  useEffect(() => {
    if (selected) fire();
  }, [selected]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      cancelAnimationFrame(raf.current!);
    },
    [],
  );

  return (
    <li>
      <button
        type="button"
        className={['menu-item', selected && 'is-selected', glitching && 'is-hover-glitch', activated && 'is-activated'].filter(Boolean).join(' ')}
        style={{ '--c': color } as CSSProperties}
        aria-current={selected ? 'true' : undefined}
        onMouseEnter={() => {
          onHover(index);
          if (selected) fire();
        }}
        onFocus={() => !selected && onHover(index)}
        onClick={() => onActivate(index)}
      >
        {selected && <motion.span layoutId="menu-cursor" className="menu-item__bar" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
        <span className="menu-item__arrow" aria-hidden>
          ▶
        </span>
        <span className="menu-item__index" aria-hidden>
          {pad(index + 1)}
        </span>
        <span className="menu-item__label glitch-text" data-text={label}>
          {label}
        </span>
        <span className="menu-item__meta">{meta}</span>
      </button>
    </li>
  );
});
