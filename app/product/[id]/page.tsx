import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product-detail';
import { products } from '@/lib/products';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return products.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = products.find(item => item.id === id);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = products.find(item => item.id === id);
  if (!product) notFound();
  return <ProductDetail key={product.id} product={product} />;
}
