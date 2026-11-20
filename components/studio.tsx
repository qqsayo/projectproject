'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Box, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const Viewer = dynamic(() => import('./viewer'), {
  ssr: false,
  loading: () => <p className="viewer-status" role="status">Opening 3D studio…</p>,
});

export function Studio() {
  const [active, setActive] = useState(false);
  const launch = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) (active ? close : launch).current?.focus();
  }, [active]);
  return <section id="study" className="section studio" aria-labelledby="studio-title">
    <div className="section-title"><h2 id="studio-title">3D Studio</h2><p>Footwear form in three dimensions.</p></div>
    <div className="studio-stage">
      <div className="studio-poster"><Image src="/media/study.webp" width={1200} height={640} alt="Studio preview of the Shopify sneaker study" sizes="100vw" /></div>
      {active ? <>
        <button ref={close} className="icon-button viewer-close" aria-label="Close 3D viewer" onClick={() => setActive(false)}><X size={21} /></button>
        <Viewer />
      </> : <button ref={launch} className="button studio-launch" onClick={() => { opened.current = true; setActive(true); }}><Box size={19} /> Open 3D viewer</button>}
    </div>
    <div className="studio-credit"><span className="micro">Interactive sneaker study</span><a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe">© 2021 Shopify / CC BY 4.0</a></div>
  </section>;
}


