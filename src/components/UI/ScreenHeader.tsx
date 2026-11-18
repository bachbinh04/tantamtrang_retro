import type { ReactNode } from 'react';

export function ScreenHeader({ crumb, title, right }: { crumb: string; title: string; right?: ReactNode }) {
  return (
    <header className="scr-header">
      <div className="min-w-0">
        <p className="px-label">{crumb}</p>
        <h1 className="scr-title glitch-text">{title}</h1>
      </div>
      {right && <div className="scr-header__right">{right}</div>}
    </header>
  );
}
