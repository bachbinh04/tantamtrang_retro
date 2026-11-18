/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT ME — portfolio "save files".
 *  `thumbnail` / `screenshots` accept image URLs (put files in /public).
 *  When omitted, a procedural CRT-style artwork is generated from `art`.
 * ─────────────────────────────────────────────────────────────
 */
export type Category = 'Web Development' | 'UI/UX Design' | 'Creative Development' | 'Personal Projects';

export type ArtPattern = 'grid' | 'sun' | 'waves' | 'blocks' | 'orbit' | 'terrain';

export interface Project {
  id: string;
  title: string;
  category: Category;
  year: number;
  role: string;
  description: string;
  overview: string;
  objectives: string[];
  process: { step: string; detail: string }[];
  tech: string[];
  thumbnail?: string;
  screenshots?: string[];
  liveUrl?: string;
  githubUrl?: string;
  art: { pattern: ArtPattern; colors: [string, string, string] };
}

export const categories: Category[] = ['Web Development', 'UI/UX Design', 'Creative Development', 'Personal Projects'];

export const categoryShort: Record<Category, string> = {
  'Web Development': 'WEB',
  'UI/UX Design': 'UI/UX',
  'Creative Development': 'CREATIVE',
  'Personal Projects': 'PERSONAL',
};

export const projects: Project[] = [
  {
    id: 'neon-ledger',
    title: 'Neon Ledger',
    category: 'Web Development',
    year: 2025,
    role: 'Full-stack developer',
    description: 'A real-time finance dashboard for small studios with live cashflow forecasting.',
    overview:
      'Neon Ledger turns messy spreadsheets into a live, glanceable dashboard. Invoices, expenses and forecasts stream in over WebSockets so the whole team sees the same numbers at the same time.',
    objectives: [
      'Replace a 14-tab spreadsheet with one screen',
      'Sub-second updates for every connected client',
      'Make forecasting understandable for non-accountants',
    ],
    process: [
      { step: 'Research', detail: 'Interviewed five studio owners and mapped their monthly money rituals.' },
      { step: 'Prototype', detail: 'Paper, then Figma, then a clickable prototype tested with real numbers.' },
      { step: 'Build', detail: 'ASP.NET Core API with SignalR, React front-end with optimistic updates.' },
      { step: 'Ship', detail: 'Dockerised deploy, onboarding flow and a CSV import wizard.' },
    ],
    tech: ['React', 'TypeScript', 'ASP.NET Core', 'SignalR', 'PostgreSQL', 'Docker'],
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com/',
    art: { pattern: 'grid', colors: ['#10182B', '#168DFF', '#75F5FF'] },
  },
  {
    id: 'afterglow-ui',
    title: 'Afterglow UI Kit',
    category: 'UI/UX Design',
    year: 2024,
    role: 'Product designer',
    description: 'A synth-wave design system with 120+ components and motion guidelines.',
    overview:
      'Afterglow is a design system built for nighttime apps — music players, streaming tools and dashboards. Every component ships with dark-first tokens, motion specs and accessibility notes.',
    objectives: ['Consistent dark-mode contrast (WCAG AA)', 'Motion that guides rather than decorates', 'Tokens that map 1:1 to code'],
    process: [
      { step: 'Audit', detail: 'Collected 300 screenshots of night-mode products and graded their contrast.' },
      { step: 'Tokens', detail: 'Built a colour ramp system around perceptual lightness.' },
      { step: 'Components', detail: 'Designed and documented 120 components in Figma.' },
      { step: 'Handoff', detail: 'Exported tokens to CSS variables and a Tailwind preset.' },
    ],
    tech: ['Figma', 'Tokens Studio', 'Storybook', 'Tailwind'],
    liveUrl: 'https://example.com',
    art: { pattern: 'sun', colors: ['#1a0f2e', '#F15C9C', '#9D5BFF'] },
  },
  {
    id: 'signal-garden',
    title: 'Signal Garden',
    category: 'Creative Development',
    year: 2024,
    role: 'Creative developer',
    description: 'A generative audio-reactive garden that grows from your microphone input.',
    overview:
      'Signal Garden listens. Every sound you make plants a seed; louder sounds grow taller stems, higher pitches bloom brighter flowers. Built as an installation piece and later released for the web.',
    objectives: ['Hold 60 FPS on a mid-range laptop', 'Feel alive with zero instructions', 'Run fully offline for exhibitions'],
    process: [
      { step: 'Sketch', detail: 'Explored L-systems and audio FFT bands in p5.js.' },
      { step: 'Engine', detail: 'Ported to WebGL with instanced geometry for thousands of stems.' },
      { step: 'Tuning', detail: 'Playtested at a local gallery night and tuned growth curves.' },
    ],
    tech: ['Three.js', 'WebGL', 'Web Audio API', 'GLSL', 'Vite'],
    githubUrl: 'https://github.com/',
    art: { pattern: 'waves', colors: ['#06141a', '#2fe0b0', '#75F5FF'] },
  },
  {
    id: 'pixel-post',
    title: 'Pixel Post',
    category: 'Personal Projects',
    year: 2023,
    role: 'Solo developer',
    description: 'A tiny social network where every post is a 32x32 pixel drawing.',
    overview:
      'Pixel Post is a love letter to constraint. No text posts, no photos — just a 32x32 canvas and a 16-colour palette. It became a small, kind community of a few hundred daily artists.',
    objectives: ['Make drawing on a phone feel good', 'Keep the feed calm — no infinite scroll', 'Moderation that scales with one person'],
    process: [
      { step: 'Canvas', detail: 'Built a touch-first pixel editor with undo history and mirroring.' },
      { step: 'Feed', detail: 'Daily issues instead of an endless feed.' },
      { step: 'Community', detail: 'Weekly prompts and a simple report-and-hide moderation flow.' },
    ],
    tech: ['React', 'Node.js', 'SQLite', 'Canvas API', 'PWA'],
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com/',
    art: { pattern: 'blocks', colors: ['#140b22', '#ffcc4d', '#F15C9C'] },
  },
  {
    id: 'orbital-docs',
    title: 'Orbital Docs',
    category: 'Web Development',
    year: 2023,
    role: 'Front-end lead',
    description: 'Documentation platform with instant search and interactive code playgrounds.',
    overview:
      'Orbital Docs is a docs framework for API-heavy products. Every code sample is runnable in place, search is instant and typo-tolerant, and pages load in under 300ms.',
    objectives: ['Instant client-side search', 'Runnable examples without a backend', 'Lighthouse 100 across the board'],
    process: [
      { step: 'Architecture', detail: 'Static-first MDX pipeline with incremental builds.' },
      { step: 'Search', detail: 'Pre-built search index shipped as a compressed binary.' },
      { step: 'Playgrounds', detail: 'Sandboxed iframes with a tiny in-browser bundler.' },
    ],
    tech: ['Next.js', 'MDX', 'TypeScript', 'Web Workers'],
    liveUrl: 'https://example.com',
    art: { pattern: 'orbit', colors: ['#0b0f24', '#9D5BFF', '#75F5FF'] },
  },
  {
    id: 'lowpoly-hike',
    title: 'Low-Poly Hike',
    category: 'Creative Development',
    year: 2022,
    role: 'Designer & developer',
    description: 'A meditative browser walking game across procedurally generated hills.',
    overview:
      'A ten-minute walk through a low-poly world that is different every time. No enemies, no score — just weather, sound and a sunset at the end.',
    objectives: ['Procedural terrain with art direction', 'Run on phones as well as desktops', 'A complete experience in ten minutes'],
    process: [
      { step: 'Worldgen', detail: 'Layered simplex noise with hand-tuned biome palettes.' },
      { step: 'Mood', detail: 'Dynamic weather and a generative ambient soundtrack.' },
      { step: 'Polish', detail: 'Performance passes for mobile GPUs, adaptive resolution.' },
    ],
    tech: ['Three.js', 'TypeScript', 'Tone.js', 'Blender'],
    githubUrl: 'https://github.com/',
    art: { pattern: 'terrain', colors: ['#120c1f', '#F15C9C', '#ffb36b'] },
  },
];
