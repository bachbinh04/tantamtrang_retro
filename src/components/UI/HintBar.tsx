import { inputBus, type Action } from '../../systems/input';

export type HintSymbol = 'x' | 'o' | 't' | 's' | 'dpad' | 'ud' | 'lr' | 'lr1' | 'start';

const GLYPH: Record<HintSymbol, { char: string; cls: string }> = {
  x: { char: '✕', cls: 'sym sym--x' },
  o: { char: '○', cls: 'sym sym--o' },
  t: { char: '△', cls: 'sym sym--t' },
  s: { char: '□', cls: 'sym sym--s' },
  dpad: { char: '✥', cls: 'sym sym--d' },
  ud: { char: '↕', cls: 'sym sym--d' },
  lr: { char: '↔', cls: 'sym sym--d' },
  lr1: { char: 'L1·R1', cls: 'sym sym--lr' },
  start: { char: 'START', cls: 'sym sym--lr' },
};

export interface Hint {
  sym: HintSymbol;
  label: string;
  action?: Action; // clicking the hint fires this action (mouse/touch shortcut)
}

/** Bottom-of-screen button legend, PS-style. Hints with an action are clickable. */
export function HintBar({ hints }: { hints: Hint[] }) {
  return (
    <nav className="hint-bar" aria-label="Controls">
      {hints.map((h) =>
        h.action ? (
          <button key={h.label} type="button" className="hint" onClick={() => inputBus.emit(h.action!)}>
            <span className={GLYPH[h.sym].cls} aria-hidden>
              {GLYPH[h.sym].char}
            </span>
            {h.label}
          </button>
        ) : (
          <span key={h.label} className="hint">
            <span className={GLYPH[h.sym].cls} aria-hidden>
              {GLYPH[h.sym].char}
            </span>
            {h.label}
          </span>
        ),
      )}
    </nav>
  );
}
