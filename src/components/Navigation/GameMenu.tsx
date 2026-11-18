import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuItem } from './MenuItem';
import { useInput } from '../../hooks/useInput';
import { triggerGlitch } from '../../systems/glitch';
import { sound } from '../../systems/audio';
import { safeStorage } from '../../lib/motion';

export interface MenuEntry {
  label: string;
  path: string;
  meta: string;
  color: string;
}

const KEY = 'crt.menu';

/** Vertical PS-style main menu. Pad / keyboard / mouse / touch all drive the same selection. */
export function GameMenu({ items }: { items: MenuEntry[] }) {
  const navigate = useNavigate();
  const n = items.length;
  const [sel, setSel] = useState(() => Math.min(n - 1, Math.max(0, Number(safeStorage.get('session', KEY)) || 0)));
  const [activated, setActivated] = useState<number | null>(null);
  const busy = useRef(false);
  const timer = useRef<number>();

  useEffect(() => safeStorage.set('session', KEY, String(sel)), [sel]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const activate = useCallback(
    (i: number, viaPointer = false) => {
      if (busy.current) return;
      busy.current = true;
      setSel(i);
      setActivated(i);
      triggerGlitch(3);
      if (viaPointer) sound.play('confirm');
      timer.current = window.setTimeout(() => navigate(items[i].path), 380);
    },
    [items, navigate],
  );

  const hover = useCallback((i: number) => {
    if (busy.current) return;
    setSel(i);
    triggerGlitch(2);
    sound.play('static');
  }, []);

  const onActivate = useCallback((i: number) => activate(i, true), [activate]);

  useInput((a) => {
    if (busy.current) return true;
    switch (a) {
      case 'up':
        setSel((s) => (s - 1 + n) % n);
        return true;
      case 'down':
        setSel((s) => (s + 1) % n);
        return true;
      case 'confirm':
      case 'start':
        activate(sel);
        return true;
      case 'back':
        triggerGlitch(1);
        return true;
    }
    return false;
  });

  return (
    <ul className="menu" role="menu" aria-label="Main menu">
      {items.map((it, i) => (
        <MenuItem key={it.path} index={i} label={it.label} meta={it.meta} color={it.color} selected={i === sel} activated={i === activated} onHover={hover} onActivate={onActivate} />
      ))}
    </ul>
  );
}
