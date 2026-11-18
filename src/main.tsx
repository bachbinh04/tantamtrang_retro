import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installNoiseTexture } from './components/CRT/CRTNoise';
import './index.css';

installNoiseTexture();
document.documentElement.dataset.power = 'warming';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
