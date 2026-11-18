import { useEffect } from 'react';
import { inputBus, type Action } from '../systems/input';

const KEYMAP: Record<string, Action> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  Enter: 'confirm',
  ' ': 'confirm',
  x: 'confirm',
  Escape: 'back',
  Backspace: 'back',
  o: 'back',
  t: 'triangle',
  q: 'l1',
  e: 'r1',
  Shift: 'select',
};

/** Global keyboard → input bus bridge. */
export function useKeyboardNavigation() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const action = KEYMAP[key];
      if (!action) return;
      // Let real links open with Enter so external links stay keyboard-accessible.
      if (key === 'Enter' && target?.closest('a[href]')) return;
      e.preventDefault();
      if (e.repeat && (action === 'confirm' || action === 'back')) return;
      inputBus.emit(action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
