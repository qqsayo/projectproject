import type { Metadata } from 'next';
import { Catalog } from '@/components/catalog';

export const metadata: Metadata = {
  title: 'Sneaker collection',
  description: 'Explore 20 sneaker silhouettes from PROJECT 1 and filter by brand, EU size, price and style.',
};

export default function CollectionPage() {
  return <main id="main"><Catalog /></main>;
}
