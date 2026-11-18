import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScreenHeader } from '../components/UI/ScreenHeader';
import { HintBar } from '../components/UI/HintBar';
import { SegmentBar } from '../components/UI/SegmentBar';
import { PixelAvatar } from '../components/UI/PixelAvatar';
import { useInput } from '../hooks/useInput';
import { profile } from '../data/profile';
import { triggerGlitch } from '../systems/glitch';
import { asset, pad, safeStorage } from '../lib/motion';
import { revealInContainer, scrollByPage } from '../lib/scroll';

const TABS = ['STATUS', 'SKILLS', 'GEAR', 'QUESTS', 'CONTACT'] as const;
type Tab = (typeof TABS)[number];

const rank = (v: number) => (v >= 90 ? 'S' : v >= 80 ? 'A' : v >= 70 ? 'B' : 'C');

function StatusTab() {
  const rows: [string, string][] = [
    ['NAME', profile.name],
    ['CLASS', profile.playerClass],
    ['LEVEL', String(profile.level)],
    ['ORIGIN', profile.origin],
    ['ALIGNMENT', profile.alignment],
    ['GUILD', profile.guild],
  ];
  return (
    <div className="ab-status">
      <dl className="stat-list stat-list--wide">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        <div>
          <dt>STATUS</dt>
          <dd>
            <span className="online-dot" /> ONLINE
          </dd>
        </div>
      </dl>
      <div className="ab-intro">
        {profile.intro.map((t, i) => (
          <p key={i}>
            {t}
            {i === profile.intro.length - 1 && <span className="caret">▮</span>}
          </p>
        ))}
      </div>
    </div>
  );
}

function SkillsTab() {
  return (
    <ul className="ab-skills">
      {profile.skills.map((s) => (
        <li key={s.name}>
          <div className="ab-skills__head">
            <span>{s.name}</span>
            <span className={`rank rank--${rank(s.level)}`}>{rank(s.level)}</span>
          </div>
          <SegmentBar value={s.level} segments={14} label={`${s.name} ${s.level}%`} />
          {s.note && <small>{s.note}</small>}
        </li>
      ))}
    </ul>
  );
}

function GearTab() {
  const total = profile.inventory.reduce((n, g) => n + g.items.length, 0);
  return (
    <div className="ab-gear">
      <p className="px-label">
        INVENTORY {pad(total)}/{pad(24)}
      </p>
      {profile.inventory.map((g) => (
        <div key={g.group} className="ab-gear__group">
          <p className="ab-gear__label">{g.group}</p>
          <ul className="ab-gear__slots">
            {g.items.map((it) => (
              <li key={it} className="slot">
                {it}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function QuestsTab() {
  return (
    <ul className="ab-quests">
      {profile.quests.map((q) => (
        <li key={q.title}>
          <div className="ab-quests__head">
            <b>{q.title}</b>
            <span className={`tag tag--${q.status === 'ACTIVE' ? 'active' : q.status === 'COMPLETE' ? 'done' : 'side'}`}>{q.status}</span>
          </div>
          <p className="ab-quests__meta">
            {q.place} · {q.years}
          </p>
          <p>{q.detail}</p>
        </li>
      ))}
    </ul>
  );
}

function ContactTab({ sel, onSelect }: { sel: number; onSelect: (i: number) => void }) {
  return (
    <ul className="ab-contact" role="list">
      <li className="px-label ab-contact__intro">SEND A MESSAGE TO PLAYER ONE</li>
      {profile.contact.map((c, i) => (
        <li key={c.label}>
          <a
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className={`ab-contact__item ${i === sel ? 'is-selected' : ''}`}
            onMouseEnter={() => onSelect(i)}
            onFocus={() => onSelect(i)}
          >
            <span className="ab-contact__arrow">▶</span>
            <span className="ab-contact__label">{c.label}</span>
            <span className="ab-contact__value">{c.value}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function About() {
  const [tab, setTab] = useState<Tab>(() => (safeStorage.get('session', 'crt.about.tab') as Tab) || 'STATUS');
  const [contactSel, setContactSel] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    safeStorage.set('session', 'crt.about.tab', tab);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  useEffect(() => {
    if (tab !== 'CONTACT') return;
    const items = scrollRef.current?.querySelectorAll<HTMLElement>('.ab-contact__item');
    revealInContainer(scrollRef.current, items?.[contactSel]);
  }, [contactSel, tab]);

  const switchTab = (dir: 1 | -1) => {
    const i = TABS.indexOf(tab);
    setTab(TABS[(i + dir + TABS.length) % TABS.length]);
    triggerGlitch(2);
  };

  useInput((a) => {
    switch (a) {
      case 'left':
      case 'l1':
        switchTab(-1);
        return true;
      case 'right':
      case 'r1':
        switchTab(1);
        return true;
      case 'up':
        if (tab === 'CONTACT') setContactSel((s) => (s - 1 + profile.contact.length) % profile.contact.length);
        else scrollByPage(scrollRef.current, -1);
        return true;
      case 'down':
        if (tab === 'CONTACT') setContactSel((s) => (s + 1) % profile.contact.length);
        else scrollByPage(scrollRef.current, 1);
        return true;
      case 'confirm':
      case 'start': {
        if (tab !== 'CONTACT') {
          setTab('CONTACT');
          return true;
        }
        const c = profile.contact[contactSel];
        if (c.href.startsWith('http')) window.open(c.href, '_blank', 'noopener,noreferrer');
        else window.location.href = c.href;
        return true;
      }
    }
    return false;
  });

  return (
    <div className="scr-page ab">
      <ScreenHeader crumb="SYSTEM ▸ PLAYER DATA" title="PLAYER PROFILE" right={<span className="px-label">SAVE 01</span>} />

      <div className="ab-body">
        <aside className="ab-card panel">
          <div className="ab-portrait">
            {profile.portrait ? <img src={asset(profile.portrait)} alt={profile.name} loading="lazy" /> : <PixelAvatar />}
            <span className="ab-portrait__badge">{profile.handle}</span>
          </div>
          <div className="ab-card__id">
            <p className="ab-card__name">{profile.name}</p>
            <p className="px-label">{profile.playerClass}</p>
          </div>
          <div className="ab-card__lv">
            <span>LV {profile.level}</span>
            <SegmentBar value={profile.xp} segments={10} tone="purple" label="Experience" />
          </div>
          {profile.stats.map((s) => (
            <div key={s.label} className="ab-card__stat">
              <span>{s.label}</span>
              <SegmentBar value={s.value} segments={10} tone={s.label === 'CAFFEINE' ? 'magenta' : 'green'} label={s.label} />
            </div>
          ))}
        </aside>

        <section className="ab-main">
          <nav className="ab-tabs" role="tablist" aria-label="Profile sections">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={t === tab}
                className={`ab-tab ${t === tab ? 'is-active' : ''}`}
                onClick={() => {
                  if (t !== tab) {
                    setTab(t);
                    triggerGlitch(2);
                  }
                }}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="ab-panel panel scr-scroll" ref={scrollRef} tabIndex={0}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
              >
                {tab === 'STATUS' && <StatusTab />}
                {tab === 'SKILLS' && <SkillsTab />}
                {tab === 'GEAR' && <GearTab />}
                {tab === 'QUESTS' && <QuestsTab />}
                {tab === 'CONTACT' && <ContactTab sel={contactSel} onSelect={setContactSel} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      <HintBar
        hints={[
          { sym: 'lr', label: 'TAB', action: 'right' },
          { sym: 'ud', label: tab === 'CONTACT' ? 'CHOOSE' : 'SCROLL' },
          { sym: 'x', label: tab === 'CONTACT' ? 'OPEN' : 'CONTACT', action: 'confirm' },
          { sym: 'o', label: 'BACK', action: 'back' },
        ]}
      />
    </div>
  );
}
