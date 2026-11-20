'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, ArrowDownRight, ArrowRight } from 'lucide-react';
import { useMemo, useRef } from 'react';

const Viewer = dynamic(() => import('./viewer'), {
  ssr: false,
  loading: () => <p className="hero-loading micro" role="status">Loading 3D model…</p>,
});

const chapters = [
  { title: 'AIR JORDAN 1', note: 'Air Jordan 1', detail: '1985 silhouette / 3D model' },
  { title: 'DETAIL', note: 'Leather & laces', detail: 'Get closer to the upper' },
  { title: 'IN MOTION', note: 'Full rotation', detail: 'See the pair from every side' },
  { title: 'COURT DNA', note: 'High-top profile', detail: 'A closer look at the shape' },
] as const;

export function Hero({ active, prepare }: { active: boolean; prepare: boolean }) {
  const timeline = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const hero = useMemo(() => ({ timeline, stage }), []);

  return <section className="hero-timeline" aria-labelledby="hero-title" ref={timeline}>
    <div className="hero" data-chapter="0" ref={stage}>
      <h1 className="sr-only" id="hero-title">Air Jordan 1 in 3D</h1>
      <div className="hero-headings" aria-hidden="true">
        {chapters.map((chapter, i) => <span key={chapter.title} className={'chapter-' + i}>{chapter.title}</span>)}
        <span className="chapter-exploded">CONSTRUCTION</span>
      </div>
      <Image className="hero-poster" src="/media/jordan-entry.webp" alt="Air Jordan 1 model preview" width={1450} height={1000} sizes="85vw" preload={active} />
      {prepare && <Viewer hero={hero} active={active} />}
      <div className="hero-bottom">
        <div className="hero-spec">
          <div className="chapter-exploded"><strong>Air Jordan 1</strong><span className="micro">Laced upper / overlays / insole / sole</span></div>
          {chapters.map((chapter, i) => <div key={chapter.note} className={'chapter-' + i}>
            <strong>{chapter.note}</strong><span className="micro">{chapter.detail}</span>
          </div>)}
        </div>
        <Link href="/credits/" className="hero-credit micro">Model by makoto · CC BY 4.0</Link>
        <Link href="/collection/" className="button hero-cta">Explore collection <ArrowRight size={19} /></Link>
      </div>
      <div className="hero-ruler">
        <span /><a href="#collection" aria-label="Skip scroll presentation and go to collection"><ArrowDown size={17} /></a><span />
      </div>
      <span className="hero-side micro"><ArrowDownRight size={13} /> Scroll to explore</span>
    </div>
  </section>;
}




