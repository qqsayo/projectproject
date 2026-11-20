import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { catalogImage, products, studioImage } from '../lib/products.ts';
import { filterProducts, defaultFilters, restoreCart } from '../lib/store.ts';

test('20 distinct sneaker pages have valid product images and sources', () => {
  assert.equal(products.length, 20);
  assert.equal(new Set(products.map(product => product.id)).size, 20);
  for (const product of products) {
    assert.ok(product.variants.length);
    assert.ok(existsSync(new URL('../public' + catalogImage(product.id), import.meta.url)), product.id);
    assert.equal(new Set(product.variants.map(variant => variant.id)).size, product.variants.length);
    for (const [index, variant] of product.variants.entries()) {
      assert.ok(existsSync(new URL('../public' + variant.image, import.meta.url)), variant.image);
      for (const fullSize of [false, true]) {
        const profile = studioImage(product, index, fullSize);
        assert.ok(existsSync(new URL('../public' + profile, import.meta.url)), profile);
      }
      if (product.id !== 'air-max-1') {
        assert.ok(variant.credit?.author && variant.credit?.licenseUrl, product.id);
      }
    }
  }
});

test('new brands can be combined with price and size filters', () => {
  const results = filterProducts(products, { ...defaultFilters, brand: 'New Balance', maxPrice: 105, size: 42 });
  assert.deepEqual(results.map(product => product.id), ['new-balance-373', 'new-balance-680-v6']);
});

test('existing variants from the original five-product catalogue still restore', () => {
  const lines = [{ productId: 'air-max-97', variantId: 'archive', size: 42, quantity: 1 }];
  assert.deepEqual(restoreCart(JSON.stringify({ version: 1, lines }), products), lines);
});

