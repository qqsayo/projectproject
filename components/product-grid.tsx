import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { catalogImage, euro, type Product } from '@/lib/products';

export function ProductGrid({ items }: { items: readonly Product[] }) {
  return <ul className="product-grid">
    {items.map(product => <li key={product.id}>
      <Link className="product-card" href={'/product/' + product.id + '/'}>
        <div className="card-image">
          <Image src={catalogImage(product.id)} alt="" width={720} height={520}
            sizes="(max-width: 700px) 46vw, (max-width: 1040px) 30vw, 22vw" />
        </div>
        <div className="card-text">
          <div><p className="micro">{product.brand}</p><h3>{product.name}</h3></div>
          <div className="card-end"><span className="price">{euro.format(product.price)}</span><ArrowUpRight size={17} aria-hidden="true" /></div>
        </div>
      </Link>
    </li>)}
  </ul>;
}

