'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { euro, products } from '@/lib/products';
import { defaultFilters, filterProducts, type Filters } from '@/lib/store';
import { ProductGrid } from './product-grid';

const brands = [...new Set(products.map(item => item.brand))].sort();
const styles = [...new Set(products.map(item => item.style))].sort();
const sizes = [...new Set(products.flatMap(item => item.sizes))].sort((a, b) => a - b);
const priceCaps = [100, 125, 150, 175, 200];

export function Catalog() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const visible = filterProducts(products, filters);
  const active = Object.values(filters).some(Boolean);

  return <section id="collection" className="catalog catalog-page section" aria-labelledby="catalog-title">
    <header className="catalog-heading">
      <h1 id="catalog-title">The Collection</h1>
      <p>{products.length} sneakers from the court, the track and the terrace.</p>
    </header>
    <div className="filter-bar">
      <div className="filters" role="group" aria-label="Collection filters">
        <Filter label="Brand" value={filters.brand} onChange={brand => setFilters(current => ({ ...current, brand }))} options={brands.map(label => [label, label])} />
        <Filter label="EU size" value={filters.size || ''} onChange={size => setFilters(current => ({ ...current, size: Number(size) }))} options={sizes.map(size => [String(size), String(size)])} />
        <Filter label="Price" value={filters.maxPrice || ''} onChange={maxPrice => setFilters(current => ({ ...current, maxPrice: Number(maxPrice) }))} options={priceCaps.map(price => [String(price), 'Up to ' + euro.format(price)])} />
        <Filter label="Style" value={filters.style} onChange={style => setFilters(current => ({ ...current, style }))} options={styles.map(label => [label, label])} />
      </div>
      <div className="filter-result">
        <p className="micro" role="status">{visible.length} {visible.length === 1 ? 'model' : 'models'}</p>
        {active && <button className="text-button" onClick={() => setFilters(defaultFilters)}>Reset filters</button>}
      </div>
    </div>
    {visible.length ? <ProductGrid items={visible} /> : <p className="no-results">No sneakers match these filters.</p>}
  </section>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string | number; onChange: (value: string) => void; options: string[][] }) {
  return <label className="filter">
    <span className="sr-only">{label}</span>
    <select value={value} onChange={event => onChange(event.target.value)}>
      <option value="">{label}</option>
      {options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
    </select>
    <ChevronDown size={14} aria-hidden="true" />
  </label>;
}
