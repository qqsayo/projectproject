import test from 'node:test';
import assert from 'node:assert/strict';
import { addLine, changeQuantity, filterProducts, restoreCart, subtotal } from '../lib/store.ts';

const product = { id: 'air', brand: 'Nike', style: 'Running', price: 150, sizes: [40, 42], variants: [{ id: 'red' }, { id: 'blue' }] };
const red = { productId: 'air', variantId: 'red', size: 42 };
const blue = { ...red, variantId: 'blue' };

test('a color and size identify a line, and totals use current product data', () => {
  const cart = [red, red, blue].reduce(addLine, []);
  assert.equal(cart.length, 2);
  assert.equal(cart[0].quantity, 2);
  assert.equal(subtotal(cart, [product]), 450);
  assert.deepEqual(changeQuantity(changeQuantity(cart, red, -1), red, -1), [{ ...blue, quantity: 1 }]);
});

test('restore validates products, sizes, variants and quantities and merges duplicates', () => {
  const payload = { version: 1, lines: [
    { ...red, quantity: 30 }, { ...red, quantity: 2 },
    { ...blue, quantity: 1.5 }, { ...red, size: 45, quantity: 1 },
    { ...red, variantId: 'removed', quantity: 1 }, null
  ] };
  assert.deepEqual(restoreCart(JSON.stringify(payload), [product]), [{ ...red, quantity: 9 }]);
  assert.deepEqual(restoreCart('invalid JSON', [product]), []);
});

test('filters combine brand, price, style and size with inclusive ceiling', () => {
  const filters = { brand: 'Nike', size: 42, maxPrice: 150, style: 'Running' };
  assert.deepEqual(filterProducts([product], filters), [product]);
  for (const invalid of [{ brand: 'adidas' }, { size: 41 }, { maxPrice: 149 }, { style: 'Court' }]) {
    assert.deepEqual(filterProducts([product], { ...filters, ...invalid }), []);
  }
});

