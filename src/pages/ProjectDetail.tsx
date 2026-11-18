import { useRef, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Github } from 'lucide-react';
import { ScreenHeader } from '../components/UI/ScreenHeader';
import { HintBar, type Hint } from '../components/UI/HintBar';
import { ProjectArt } from '../components/UI/ProjectArt';
import { useInput } from '../hooks/useInput';
import { categoryShort, projects } from '../data/projects';
import { pad } from '../lib/motion';
import { scrollByPage } from '../lib/scroll';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dt-section">
      <h2 className="dt-section__title">
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const idx = projects.findIndex((p) => p.id === id);
  const p = projects[idx];

  const go = (dir: 1 | -1) => {
    const next = projects[(idx + dir + projects.length) % projects.length];
    navigate(`/portfolio/${next.id}`, { replace: true });
  };

  useInput((a) => {
    if (!p) return false;
    switch (a) {
      case 'up':
        scrollByPage(scrollRef.current, -1);
        return true;
      case 'down':
        scrollByPage(scrollRef.current, 1);
        return true;
      case 'left':
      case 'l1':
        go(-1);
        return true;
      case 'right':
      case 'r1':
        go(1);
        return true;
      case 'confirm':
      case 'start':
        if (p.liveUrl) window.open(p.liveUrl, '_blank', 'noopener,noreferrer');
        return true;
    }
    return false;
  });

  if (!p) return <Navigate to="/portfolio" replace />;

  const shots = p.screenshots?.length ? p.screenshots : [undefined, undefined, undefined];
  const hints: Hint[] = [
    { sym: 'ud', label: 'SCROLL' },
    { sym: 'lr', label: 'PREV/NEXT', action: 'right' },
    ...(p.liveUrl ? [{ sym: 'x', label: 'LIVE DEMO', action: 'confirm' } as Hint] : []),
    { sym: 'o', label: 'BACK', action: 'back' },
  ];

  return (
    <div className="scr-page dt">
      <ScreenHeader
        crumb={`MEMORY CARD ▸ FILE ${pad(idx + 1)}/${pad(projects.length)}`}
        title={p.title}
        right={<span className="tag">{categoryShort[p.category]}</span>}
      />

      <div className="scr-scroll dt-scroll" ref={scrollRef} tabIndex={0} aria-label={`${p.title} details`}>
        <div className="dt-hero">
          <div className="dt-hero__art">
            <ProjectArt art={p.art} seed={p.id} src={p.thumbnail} alt={`${p.title} cover`} />
            <span className="dt-hero__badge">FILE {pad(idx + 1)}</span>
          </div>
          <div className="dt-hero__facts panel">
            <dl className="stat-list">
              <div>
                <dt>YEAR</dt>
                <dd>{p.year}</dd>
              </div>
              <div>
                <dt>ROLE</dt>
                <dd>{p.role}</dd>
              </div>
              <div>
                <dt>TYPE</dt>
                <dd>{p.category}</dd>
              </div>
            </dl>
            <p className="dt-hero__desc">{p.description}</p>
            <div className="dt-links">
              {p.liveUrl && (
                <a className="btn-retro" href={p.liveUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size="1em" /> LIVE DEMO
                </a>
              )}
              {p.githubUrl && (
                <a className="btn-retro btn-retro--ghost" href={p.githubUrl} target="_blank" rel="noreferrer">
                  <Github size="1em" /> SOURCE
                </a>
              )}
            </div>
          </div>
        </div>

        <Section title="OVERVIEW">
          <p className="dt-text">{p.overview}</p>
        </Section>

        <Section title="OBJECTIVES">
          <ul className="dt-objectives">
            {p.objectives.map((o) => (
              <li key={o}>
                <span className="dt-check" aria-hidden>
                  ■
                </span>
                {o}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="DESIGN PROCESS">
          <ol className="dt-process">
            {p.process.map((s, i) => (
              <li key={s.step}>
                <span className="dt-process__no">{pad(i + 1)}</span>
                <div>
                  <b>{s.step}</b>
                  <p>{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="TECH STACK">
          <ul className="chips">
            {p.tech.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="SCREENSHOTS">
          <div className="dt-shots">
            {shots.map((src, i) => (
              <figure key={i} className="dt-shot">
                <ProjectArt art={p.art} seed={p.id} variant={i + 1} src={src} alt={`${p.title} screenshot ${i + 1}`} />
                <figcaption>SCREEN {pad(i + 1)}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <p className="dt-end">— END OF FILE —</p>
      </div>

      <HintBar hints={hints} />
    </div>
  );
}
