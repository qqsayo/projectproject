import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ProductGrid } from '@/components/product-grid';
import { products } from '@/lib/products';
import { Studio } from '@/components/studio';

export default function Home() {
  return <>
    <section id="collection" className="section collection-preview" aria-labelledby="collection-preview-title">
      <div className="section-title">
        <h2 id="collection-preview-title">The Collection</h2>
        <Link className="underlink" href="/collection/">View all {products.length} sneakers <ArrowUpRight size={16} /></Link>
      </div>
      <ProductGrid items={products.slice(0, 4)} />
    </section>
    <section id="featured" className="section featured" aria-labelledby="featured-title">
      <div className="section-title"><h2 id="featured-title">Featured drops</h2></div>
      <div className="drop-layout">
        <div className="drop-image">
          <span aria-hidden="true">’87</span>
          <Image src="/media/air-angle.webp" alt="Air Max 1 campaign visualization in University Red" width={1200} height={650} sizes="(max-width: 760px) 100vw, 70vw" />
        </div>
        <div className="drop-text">
          <p className="micro">Nike / University Red</p>
          <h3>Air made<br />visible.</h3>
          <p>First released in 1987, the Air Max 1 put its cushioning on display. The University Red colorway frames the shape in suede, mesh and a single line of red.</p>
          <Link href="/product/air-max-1/" className="underlink">View Air Max 1 <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </section>
    <Studio />
    <section id="story" className="section story" aria-labelledby="story-title">
      <div className="story-copy">
        <p className="micro">Our story</p>
        <h2 id="story-title">Objects<br />in motion.</h2>
        <p>PROJECT 1 is a study of the shoes that outlived their original purpose. Look closely at the cut of an upper, the geometry of a sole or the placement of a stitch. That’s where a silhouette earns its place in the archive.</p>
        <Link className="underlink" href="/collection/">Explore the archive <ArrowRight size={16} /></Link>
      </div>
      <Image className="story-image" src="/media/macro.webp" width={1100} height={760} alt="Editorial close-up of red suede, white mesh and contrasting stitching" sizes="(max-width: 760px) 100vw, 58vw" />
    </section>
  </>;
}


