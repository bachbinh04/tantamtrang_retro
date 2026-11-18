import { useEffect, useState } from 'react';
import { GameMenu, type MenuEntry } from '../components/Navigation/GameMenu';
import { HintBar } from '../components/UI/HintBar';
import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { levels } from '../data/timeline';
import { pad } from '../lib/motion';

const MENU: MenuEntry[] = [
  { label: 'PORTFOLIO', path: '/portfolio', meta: `${pad(projects.length)} SAVE FILES`, color: '#2ff3ff' }, // electric cyan
  { label: 'ABOUT', path: '/about', meta: 'PLAYER DATA', color: '#ff3fa4' }, // hot magenta
  { label: 'MY STORY', path: '/story', meta: `${pad(levels.length)} LEVELS`, color: '#ffc62e' }, // arcade gold
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span>
      {pad(now.getHours())}
      <span className="caret-colon">:</span>
      {pad(now.getMinutes())}
    </span>
  );
}

function Cube() {
  return (
    <div className="scr-cube-wrap" aria-hidden>
      <div className="scr-cube">
        {['front', 'back', 'left', 'right', 'top', 'bottom'].map((f) => (
          <span key={f} className={`scr-cube__face scr-cube__face--${f}`} />
        ))}
        <div className="scr-cube scr-cube--core">
          {['front', 'back', 'left', 'right', 'top', 'bottom'].map((f) => (
            <span key={f} className={`scr-cube__face scr-cube__face--${f}`} />
          ))}
        </div>
      </div>
      <div className="scr-cube-shadow" />
    </div>
  );
}

const TICKER = 'SIGNAL LOCKED ◆ CH 03 ◆ INSERT MEMORY CARD ◆ ALL SYSTEMS NOMINAL ◆ THANK YOU FOR PLAYING ◆ ';

export default function Home() {
  return (
    <div className="scr-page home">
      <div className="scr-horizon" aria-hidden>
        <div className="scr-grid" />
      </div>

      <header className="scr-topbar">
        <span className="px-label">◆ NOVA-OS 1.97</span>
        <span className="px-label hidden sm:inline">MEMORY CARD ▣ SLOT 1</span>
        <span className="px-label">
          <Clock />
        </span>
      </header>

      <div className="home-body">
        <div className="home-left">
          <p className="px-label home-kicker">PLAYER SELECT // PRESS ✕</p>
          <h1 className="home-title glitch-text" data-text={profile.name}>
            {profile.name}
          </h1>
          <p className="home-sub">{profile.title}</p>
          <GameMenu items={MENU} />
        </div>
        <div className="home-right">
          <Cube />
          <p className="px-label home-signal">
            SIGNAL <span className="blink">▲</span> LOCKED
          </p>
        </div>
      </div>

      <div className="scr-marquee" aria-hidden>
        <div className="scr-marquee__track">
          <span>{TICKER}</span>
          <span>{TICKER}</span>
        </div>
      </div>

      <HintBar
        hints={[
          { sym: 'ud', label: 'MOVE' },
          { sym: 'x', label: 'SELECT', action: 'confirm' },
          { sym: 's', label: 'SOUND', action: 'square' },
        ]}
      />
    </div>
  );
}
