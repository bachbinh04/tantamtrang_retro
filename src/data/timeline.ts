/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT ME — the MY STORY world map. One entry = one level.
 * ─────────────────────────────────────────────────────────────
 */
export interface Level {
  id: string;
  number: number;
  title: string;
  year: string;
  teaser: string;
  story: string[];
  milestones: string[];
  image?: string; // optional, put in /public
  status: 'cleared' | 'current';
  tip: string; // shown on the loading screen
}

export const levels: Level[] = [
  {
    id: 'beginning',
    number: 1,
    title: 'The Beginning',
    year: '2009',
    teaser: 'A hand-me-down console and a TV that hummed.',
    story: [
      'It started with a second-hand console plugged into a TV that buzzed when you turned it on. I spent more time in the options menus than in the games themselves.',
      'Somewhere between memory card screens and blinking cursors, I got curious about how any of it worked.',
    ],
    milestones: ['First game finished', 'First memory card filled', 'Took apart a controller (and put it back)'],
    status: 'cleared',
    tip: "TIP: Every menu is somebody's design decision.",
  },
  {
    id: 'discovery',
    number: 2,
    title: 'Discovery',
    year: '2016',
    teaser: 'View source. Everything changed.',
    story: [
      'A school project needed a website. I right-clicked "View Source" on a page I loved and realised the web was made of text anyone could write.',
      'I rebuilt my favourite sites from scratch, badly, over and over again.',
    ],
    milestones: ['First HTML page', 'First CSS animation', 'Discovered the dev tools'],
    status: 'cleared',
    tip: 'TIP: Copying is how you learn the shape of things.',
  },
  {
    id: 'learning',
    number: 3,
    title: 'Learning',
    year: '2020',
    teaser: 'Algorithms by day, game jams by night.',
    story: [
      'Formal study arrived: data structures, systems, the maths behind the magic. At night I joined game jams to keep the fun alive.',
      'Learned that shipping something small beats planning something huge.',
    ],
    milestones: ['Started CS degree', 'First game jam entry', 'Learned React & TypeScript'],
    status: 'cleared',
    tip: 'TIP: Finish things. Then make them better.',
  },
  {
    id: 'building',
    number: 4,
    title: 'Building',
    year: '2023',
    teaser: 'Real users, real bugs, real joy.',
    story: [
      'Freelance work and internships turned side projects into products with real people using them. Learned to listen to users, write tests and deploy on a Friday (once).',
      'Fell for the space where design and engineering overlap.',
    ],
    milestones: ['First paid client', 'Shipped an ASP.NET Core API to production', '1,000 users on a side project'],
    status: 'cleared',
    tip: "TIP: Users don't read. They play.",
  },
  {
    id: 'current',
    number: 5,
    title: 'Current Status',
    year: 'NOW',
    teaser: 'Building worlds you can click on.',
    story: [
      'Today I build interfaces that feel like objects — tactile, responsive, a little nostalgic. This TV is one of them.',
      'Looking for a team that cares about craft as much as I do. Next level: unknown. Press START.',
    ],
    milestones: ['Open to new opportunities', 'Exploring WebGL & creative tooling', 'Writing about interaction design'],
    status: 'current',
    tip: 'TIP: Save often.',
  },
];
