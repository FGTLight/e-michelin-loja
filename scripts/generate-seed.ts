/**
 * Gera supabase/seed.sql a partir de src/data/catalog.ts (fonte única dos dados de exemplo).
 * Uso: npm run db:seed:generate   (Node >= 22.18)
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  bannersData, brandsData, buildProducts, categoriesData, couponsData, deliveryZonesData, rawProducts,
} from '../src/data/catalog.ts';

const q = (v: unknown): string => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `array[${v.map(q).join(', ')}]::text[]`;
  if (typeof v === 'object') return `${q(JSON.stringify(v))}::jsonb`;
  return `'${String(v).split("'").join("''")}'`;
};

const out: string[] = [
  '-- =============================================================================',
  '-- Dados de exemplo — gerado por scripts/generate-seed.ts (não edite à mão)',
  '-- Execute DEPOIS de schema.sql. É idempotente (upsert).',
  '-- =============================================================================',
  'begin;',
  '',
];

out.push('insert into public.categories (id, slug, name, description, icon, sort_order) values');
out.push(categoriesData.map((c, i) => `  (${[c.id, c.slug, c.name, c.description, c.icon].map(q).join(', ')}, ${i + 1})`).join(',\n'));
out.push('on conflict (id) do update set slug = excluded.slug, name = excluded.name, description = excluded.description, icon = excluded.icon, sort_order = excluded.sort_order;\n');

out.push('insert into public.brands (id, slug, name) values');
out.push(brandsData.map((b) => `  (${[b.id, b.slug, b.name].map(q).join(', ')})`).join(',\n'));
out.push('on conflict (id) do update set slug = excluded.slug, name = excluded.name;\n');

const products = buildProducts();
const cols = [
  'id', 'sku', 'slug', 'name', 'short_description', 'description', 'category_id', 'brand_id', 'price', 'promo_price',
  'unit', 'unit_label', 'min_qty', 'qty_step', 'stock', 'min_stock', 'weight_kg', 'length_cm', 'width_cm', 'height_cm',
  'specs', 'is_featured', 'sold_count',
] as const;

out.push(`insert into public.products (${cols.join(', ')}, promo_ends_at) values`);
out.push(products.map((p, i) => {
  const days = rawProducts[i].promoDays;
  const ends = p.promo_price && days ? `now() + interval '${days} days'` : 'null';
  const values = cols.map((c) => (c === 'unit' ? `${q(p[c])}::public.sale_unit` : q(p[c])));
  return `  (${values.join(', ')}, ${ends})`;
}).join(',\n'));
out.push(`on conflict (id) do update set ${cols.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ')}, promo_ends_at = excluded.promo_ends_at;\n`);

out.push(`delete from public.product_images where product_id in (${products.map((p) => q(p.id)).join(', ')});`);
out.push('insert into public.product_images (product_id, url, alt, sort_order) values');
out.push(products.flatMap((p) => p.images.map((im) => `  (${[p.id, im.url, im.alt, im.sort_order].map(q).join(', ')})`)).join(',\n') + ';\n');

out.push('insert into public.delivery_zones (id, name, cities, state, base_price, price_per_kg, free_above, max_weight_kg, delivery_days, sort_order) values');
out.push(deliveryZonesData.map((z) =>
  `  (${[z.id, z.name, z.cities, z.state, z.base_price, z.price_per_kg, z.free_above, z.max_weight_kg, z.delivery_days, z.sort_order].map(q).join(', ')})`).join(',\n'));
out.push('on conflict (id) do update set name = excluded.name, cities = excluded.cities, base_price = excluded.base_price, price_per_kg = excluded.price_per_kg, free_above = excluded.free_above, max_weight_kg = excluded.max_weight_kg, delivery_days = excluded.delivery_days;\n');

out.push('insert into public.coupons (code, description, type, value, min_order_value, max_uses) values');
out.push(couponsData.map((c) =>
  `  (${[c.code, c.description].map(q).join(', ')}, ${q(c.type)}::public.coupon_type, ${[c.value, c.min_order_value, c.max_uses].map(q).join(', ')})`).join(',\n'));
out.push('on conflict (code) do nothing;\n');

out.push('insert into public.banners (id, title, subtitle, image_url, link_url, cta_label, placement, sort_order, ends_at) values');
out.push(bannersData.map((b) =>
  `  (${[b.id, b.title, b.subtitle, b.image_url, b.link_url, b.cta_label, b.placement, b.sort_order].map(q).join(', ')}, now() + interval '6 days')`).join(',\n'));
out.push('on conflict (id) do update set title = excluded.title, subtitle = excluded.subtitle, ends_at = excluded.ends_at;\n');

out.push('commit;');
writeFileSync(join(import.meta.dirname, '..', 'supabase', 'seed.sql'), out.join('\n') + '\n');
console.log(`✔ supabase/seed.sql gerado (${products.length} produtos)`);
