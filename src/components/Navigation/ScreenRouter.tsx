import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { inputBus } from '../../systems/input';
import { triggerGlitch } from '../../systems/glitch';
import { sound } from '../../systems/audio';
import { showOSD } from '../../systems/osd';
import { toggleSoundWithOSD } from '../../systems/actions';
import { pad } from '../../lib/motion';
import { GlitchTransition } from '../Effects/GlitchTransition';
import Home from '../../pages/Home';
import Portfolio from '../../pages/Portfolio';
import ProjectDetail from '../../pages/ProjectDetail';
import About from '../../pages/About';
import MyStory from '../../pages/MyStory';

const CHANNELS: { match: (p: string) => boolean; ch: number; name: string }[] = [
  { match: (p) => p === '/', ch: 3, name: 'MAIN MENU' },
  { match: (p) => p.startsWith('/portfolio/'), ch: 4, name: 'FILE VIEWER' },
  { match: (p) => p.startsWith('/portfolio'), ch: 4, name: 'PORTFOLIO' },
  { match: (p) => p.startsWith('/about'), ch: 5, name: 'PLAYER DATA' },
  { match: (p) => p.startsWith('/story'), ch: 6, name: 'MY STORY' },
];

function parentOf(path: string) {
  if (path.startsWith('/portfolio/')) return '/portfolio';
  return '/';
}

/** Routes live INSIDE the tube. Every route change is a channel switch. */
export function ScreenRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    triggerGlitch(4);
    sound.play('transition');
    const ch = CHANNELS.find((c) => c.match(location.pathname));
    if (ch) showOSD(`CH ${pad(ch.ch)}`, { sub: ch.name, ms: 1400 });
  }, [location.pathname]);

  // Global defaults when a page doesn't consume an action.
  useEffect(() => {
    inputBus.setFallback((a) => {
      if (a === 'back') {
        if (location.pathname === '/') return true;
        navigate(parentOf(location.pathname));
        return true;
      }
      if (a === 'select' || a === 'square') {
        toggleSoundWithOSD();
        return true;
      }
      return false;
    });
    return () => inputBus.setFallback(null);
  }, [location.pathname, navigate]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <GlitchTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<ProjectDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/story" element={<MyStory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GlitchTransition>
    </AnimatePresence>
  );
}
