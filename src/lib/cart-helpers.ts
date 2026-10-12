import type { CartItem, Product } from '@/types';
import { effectivePrice } from './utils';

export const toCartItem = (p: Product): Omit<CartItem, 'quantity'> => ({
  productId: p.id,
  slug: p.slug,
  sku: p.sku,
  name: p.name,
  image: p.images[0]?.url ?? null,
  unit: p.unit,
  unitLabel: p.unit_label,
  price: effectivePrice(p),
  minQty: p.min_qty,
  qtyStep: p.qty_step,
  stock: p.stock,
  weightKg: p.weight_kg,
});
