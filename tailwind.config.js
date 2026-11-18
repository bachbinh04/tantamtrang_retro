/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#080B14',
        navy: '#10182B',
        cyan: { crt: '#75F5FF' },
        electric: '#168DFF',
        neon: '#9D5BFF',
        magenta: '#F15C9C',
        phosphor: '#E8FFFF',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        term: ['VT323', 'monospace'],
      },
    },
  },
  plugins: [],
};
