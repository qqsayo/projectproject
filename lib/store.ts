export type Selection = { productId: string; variantId: string; size: number };
export type Line = Selection & { quantity: number };
type Item = { id: string; price: number; sizes: readonly number[]; variants: readonly { id: string }[] };
export type Filters = { brand: string; size: number; maxPrice: number; style: string };

export const defaultFilters: Filters = { brand: '', size: 0, maxPrice: 0, style: '' };
export const limit = 9;

export function lineKey(line: Selection) {
  return [line.productId, line.variantId, line.size].join(':');
}

export function addLine(lines: Line[], selection: Selection) {
  if (lines.some(line => lineKey(line) === lineKey(selection))) return changeQuantity(lines, selection, 1);
  return [...lines, { ...selection, quantity: 1 }];
}

export function changeQuantity(lines: Line[], selection: Selection, delta: number) {
  return lines.map(line => lineKey(line) === lineKey(selection)
    ? { ...line, quantity: Math.min(limit, line.quantity + delta) }
    : line).filter(line => line.quantity > 0);
}

export function subtotal(lines: Line[], products: readonly Item[]) {
  return lines.reduce((total, line) => total + (products.find(item => item.id === line.productId)?.price ?? 0) * line.quantity, 0);
}

export function restoreCart(raw: string | null, products: readonly Item[]): Line[] {
  try {
    const data: unknown = JSON.parse(raw ?? 'null');
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 ||
        !('lines' in data) || !Array.isArray(data.lines)) return [];
    const restored = new Map<string, Line>();
    for (const candidate of data.lines.slice(0, 500) as unknown[]) {
      if (!candidate || typeof candidate !== 'object') continue;
      const { productId, variantId, size, quantity } = candidate as Partial<Line>;
      const item = products.find(product => product.id === productId);
      if (!item || typeof variantId !== 'string' || !item.variants.some(variant => variant.id === variantId) ||
          typeof size !== 'number' || !item.sizes.includes(size) || typeof quantity !== 'number' ||
          !Number.isSafeInteger(quantity) || quantity < 1) continue;
      const line: Line = { productId: item.id, variantId, size, quantity };
      const key = lineKey(line);
      restored.set(key, { ...line, quantity: Math.min(limit, quantity + (restored.get(key)?.quantity ?? 0)) });
    }
    return [...restored.values()];
  } catch {
    return [];
  }
}

export function filterProducts<T extends Item & { brand: string; style: string }>(products: readonly T[], filters: Filters) {
  return products.filter(item => (!filters.brand || filters.brand === item.brand) &&
    (!filters.style || filters.style === item.style) &&
    (!filters.size || item.sizes.includes(filters.size)) &&
    (!filters.maxPrice || item.price <= filters.maxPrice));
}
