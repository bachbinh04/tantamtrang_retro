import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ThreeStage } from './components/Scene/ThreeStage';
import { HUD } from './components/Scene/HUD';
import { AudioManager } from './components/Audio/AudioManager';
import { IntroScreen } from './components/Effects/IntroScreen';
import { CinematicIntro } from './components/Effects/CinematicIntro';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

export default function App() {
  useKeyboardNavigation();

  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <main className="scene">
          <ThreeStage />
        </main>
        <HUD />
        <AudioManager />
        <CinematicIntro />
        <IntroScreen />
      </MotionConfig>
    </BrowserRouter>
  );
}
