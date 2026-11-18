/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT ME — everything shown on the ABOUT screen lives here.
 * ─────────────────────────────────────────────────────────────
 */
export interface Skill {
  name: string;
  level: number; // 0–100
  note?: string;
}

export interface Quest {
  title: string;
  place: string;
  years: string;
  status: 'COMPLETE' | 'ACTIVE' | 'SIDE QUEST';
  detail: string;
}

export interface ContactChannel {
  label: string;
  value: string;
  href: string;
}

export const profile = {
  /** Shown on the black intro screen before the room loads. */
  siteTitle: 'TANTAMTRANG',
  /**
   * Optional: a pre-rendered cinematic (e.g. made with an AI video tool) to play after the
   * title card instead of the in-browser camera fly-in. Put the file in /public and set
   * e.g. '/cinematic.mp4'. Leave empty to use the live 3D fly-in.
   */
  cinematicVideo: '' as string,
  name: 'PLAYER ONE',
  handle: 'P1',
  title: 'Developer / Designer',
  playerClass: 'DEVELOPER / DESIGNER',
  level: 24,
  xp: 72, // % towards next level
  origin: 'Earth, Sector 7',
  alignment: 'Chaotic Creative',
  guild: 'Freelance / Open to work',
  /** Optional: put a real photo in /public and set e.g. '/me.jpg'. Falls back to the pixel avatar. */
  portrait: '' as string,
  intro: [
    'A developer who never quite stopped playing games — I just started building the worlds instead.',
    'I design and engineer interfaces that feel tactile, fast and a little bit strange. Comfortable from pixels to pipelines: React on the front, ASP.NET Core on the back, and a sketchbook somewhere in between.',
  ],
  stats: [
    { label: 'FOCUS', value: 86 },
    { label: 'CREATIVITY', value: 92 },
    { label: 'CAFFEINE', value: 64 },
  ],
  skills: [
    { name: 'React', level: 92, note: 'Hooks, motion, architecture' },
    { name: 'TypeScript', level: 88, note: 'Strict mode enjoyer' },
    { name: 'JavaScript', level: 90, note: 'ES2024, DOM, Web APIs' },
    { name: 'ASP.NET Core', level: 76, note: 'REST APIs, EF Core' },
    { name: 'UI / UX', level: 84, note: 'Figma to production' },
    { name: 'Creative Dev', level: 80, note: 'WebGL, GSAP, shaders' },
  ] as Skill[],
  inventory: [
    { group: 'FRONTEND', items: ['React', 'TypeScript', 'Vite', 'Next.js', 'Tailwind', 'Framer Motion', 'GSAP'] },
    { group: 'BACKEND', items: ['ASP.NET Core', 'C#', 'Node.js', 'SQL Server', 'PostgreSQL', 'REST'] },
    { group: 'TOOLS', items: ['Figma', 'Git', 'Docker', 'Blender', 'Aseprite', 'VS Code'] },
  ],
  quests: [
    {
      title: 'B.Sc. Software Engineering',
      place: 'University of Somewhere',
      years: '2022 — 2026',
      status: 'ACTIVE',
      detail: 'Core track in software architecture, HCI and distributed systems.',
    },
    {
      title: 'Interaction Design Certificate',
      place: 'Online Academy',
      years: '2023',
      status: 'COMPLETE',
      detail: 'Prototyping, usability testing and motion design fundamentals.',
    },
    {
      title: 'Game Jam Survivor x3',
      place: 'Global Game Jam',
      years: '2021 — 2024',
      status: 'SIDE QUEST',
      detail: '48 hours, too little sleep, three small games shipped.',
    },
  ] as Quest[],
  contact: [
    { label: 'EMAIL', value: 'hello@example.com', href: 'mailto:hello@example.com' },
    { label: 'GITHUB', value: 'github.com/your-handle', href: 'https://github.com/' },
    { label: 'LINKEDIN', value: 'linkedin.com/in/your-handle', href: 'https://www.linkedin.com/' },
  ] as ContactChannel[],
};
