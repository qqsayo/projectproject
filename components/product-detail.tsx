'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, Expand, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { euro, studioImage, type Product } from '@/lib/products';
import { useAddToCart } from './store-shell';

export function ProductDetail({ product }: { product: Product }) {
  const [variantIndex, setVariantIndex] = useState(0);
  const [size, setSize] = useState<number>();
  const [zoom, setZoom] = useState(false);
  const zoomDialog = useRef<HTMLDialogElement>(null);
  const sizeGroup = useRef<HTMLDivElement>(null);
  const [sizeError, setSizeError] = useState(false);
  const add = useAddToCart();
  const variant = product.variants[variantIndex];
  const profileAlt = product.name + ' — ' + variant.name + ', side profile';

  function addSelection() {
    if (!size) {
      setSizeError(true);
      sizeGroup.current?.querySelector('button')?.focus();
      return;
    }
    add({ productId: product.id, variantId: variant.id, size });
  }

  return <main className="product-page section" id="main">
    <Link href="/collection/" className="back-link"><ArrowLeft size={16} /> Collection</Link>
    <div className="product-layout">
      <section aria-label="Product gallery" className="product-gallery">
        <div className="gallery-image gallery-profile">
          <h2 className="gallery-label micro">Studio profile</h2>
          <Image className="gallery-art" key={variant.id} src={studioImage(product, variantIndex)} width={1500} height={750} sizes="(max-width: 830px) 100vw, 60vw" alt={profileAlt} priority />
          <button type="button" className="icon-button gallery-zoom" aria-label="Open 4K studio profile" aria-haspopup="dialog" onClick={() => {
            zoomDialog.current?.showModal();
            setZoom(true);
          }}><Expand size={20} /></button>
        </div>
        <dialog ref={zoomDialog} className="gallery-dialog" aria-label={profileAlt} onClose={() => setZoom(false)} onClick={event => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}>
          {zoom && <div className="gallery-image gallery-profile gallery-enlarged">
            <Image className="gallery-art" src={studioImage(product, variantIndex, true)} width={3840} height={1920} sizes="95vw" alt={profileAlt} />
          </div>}
          <button type="button" className="icon-button gallery-zoom" aria-label="Close 4K studio profile" onClick={() => zoomDialog.current?.close()}><X size={22} /></button>
        </dialog>
      </section>
      <section className="product-copy" aria-labelledby="product-name">
        <p className="micro">{[product.brand, product.style, product.year].filter(Boolean).join(' / ')}</p>
        <h1 id="product-name">{product.name}</h1>
        <p className="product-price">{euro.format(product.price)}</p>
        <p className="product-description">{product.description}</p>
        <div className="product-options">
          <p><strong>Color</strong> {variant.name}</p>
          <div className="swatches" role="group" aria-label="Color">
            {product.variants.map((option, index) => <button type="button" className="swatch" key={option.id} style={{ '--swatch': option.color } as React.CSSProperties} aria-pressed={variantIndex === index} aria-label={option.name} title={option.name} onClick={() => setVariantIndex(index)} />)}
          </div>
        </div>
        <div className="product-options">
          <p id="size-label"><strong>EU size</strong> {size ?? ''}</p>
          <div className="sizes" role="group" aria-labelledby="size-label" ref={sizeGroup}>
            {product.sizes.map(option => <button key={option} type="button" aria-label={'EU ' + option} aria-pressed={option === size} onClick={() => { setSize(option); setSizeError(false); }}>{option}</button>)}
          </div>
          {sizeError && <p className="size-error" role="alert">Select a size to add this pair.</p>}
        </div>
        <button type="button" className="button fill add-button" onClick={addSelection}>Add to bag <ArrowRight size={20} /></button>
        <Link href="/#study" className="underlink product-studio-link">Explore the 3D Studio <ArrowUpRight size={15} /></Link>
      </section>
    </div>
  </main>;
}




