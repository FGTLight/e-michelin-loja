import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { bannersData, brandsData, buildProducts, categoriesData, deliveryZonesData } from '@/data/catalog';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/env';
import { effectivePrice, isPromoActive } from '@/lib/utils';
import type { Banner, Brand, Category, DeliveryZone, Product } from '@/types';

/**
 * Camada de leitura do catálogo.
 * Usa um cliente anônimo SEM cookies para que as páginas possam ser estáticas/ISR.
 * Sem Supabase configurado, cai para o catálogo local de demonstração (src/data/catalog.ts).
 */
const publicClient = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

export const PRODUCT_SELECT =
  '*, images:product_images(url, alt, sort_order), category:categories(id, slug, name), brand:brands(id, slug, name)';

export const PAGE_SIZE = 12;

export type SortKey = 'relevancia' | 'mais-vendidos' | 'menor-preco' | 'maior-preco' | 'novidades' | 'nome';

export interface ProductFilters {
  q?: string;
  categoria?: string;
  marcas?: string[];
  min?: number;
  max?: number;
  disponivel?: boolean;
  ofertas?: boolean;
  ordem?: SortKey;
  pagina?: number;
}

const unaccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

function normalize(row: Record<string, unknown>): Product {
  const p = row as unknown as Product;
  return {
    ...p,
    price: Number(p.price),
    promo_price: p.promo_price == null ? null : Number(p.promo_price),
    stock: Number(p.stock),
    min_qty: Number(p.min_qty),
    qty_step: Number(p.qty_step),
    min_stock: Number(p.min_stock),
    weight_kg: Number(p.weight_kg),
    images: [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

// ----------------------------------------------------------------------------- Demo (sem Supabase)
const demo = (() => {
  let products: Product[] | null = null;
  return () => {
    products ??= buildProducts().map((p) => ({
      ...p,
      specs: p.specs as Record<string, string>,
      category: categoriesData.find((c) => c.id === p.category_id) ?? null,
      brand: brandsData.find((b) => b.id === p.brand_id) ?? null,
    })) as Product[];
    return products;
  };
})();

function demoFilter(f: ProductFilters) {
  let list = demo().filter((p) => p.is_active);
  if (f.q) {
    const terms = unaccent(f.q.toLowerCase()).split(/\s+/).filter(Boolean);
    list = list.filter((p) => {
      const hay = unaccent(`${p.name} ${p.sku} ${p.short_description} ${p.brand?.name ?? ''}`.toLowerCase());
      return terms.every((t) => hay.includes(t));
    });
  }
  if (f.categoria) list = list.filter((p) => p.category?.slug === f.categoria);
  if (f.marcas?.length) list = list.filter((p) => p.brand && f.marcas!.includes(p.brand.slug));
  if (f.min != null) list = list.filter((p) => effectivePrice(p) >= f.min!);
  if (f.max != null) list = list.filter((p) => effectivePrice(p) <= f.max!);
  if (f.disponivel) list = list.filter((p) => p.stock > 0);
  if (f.ofertas) list = list.filter((p) => isPromoActive(p));
  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    relevancia: (a, b) => Number(b.is_featured) - Number(a.is_featured) || b.sold_count - a.sold_count,
    'mais-vendidos': (a, b) => b.sold_count - a.sold_count,
    'menor-preco': (a, b) => effectivePrice(a) - effectivePrice(b),
    'maior-preco': (a, b) => effectivePrice(b) - effectivePrice(a),
    novidades: (a, b) => b.id.localeCompare(a.id),
    nome: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
  };
  return [...list].sort(sorters[f.ordem ?? 'relevancia']);
}

// ----------------------------------------------------------------------------- Consultas
export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return categoriesData.map((c, i) => ({ ...c, sort_order: i + 1 }));
  const { data, error } = await publicClient()
    .from('categories')
    .select('id, slug, name, description, icon, sort_order')
    .eq('active', true)
    .order('sort_order');
  if (error) throw error;
  return data as Category[];
});

export const getBrands = cache(async (): Promise<Brand[]> => {
  if (!isSupabaseConfigured()) return brandsData.map((b) => ({ ...b, logo_url: null }));
  const { data, error } = await publicClient().from('brands').select('id, slug, name, logo_url').eq('active', true).order('name');
  if (error) throw error;
  return data as Brand[];
});

export async function getProducts(f: ProductFilters): Promise<{ items: Product[]; total: number }> {
  const page = Math.max(1, f.pagina ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  if (!isSupabaseConfigured()) {
    const all = demoFilter(f);
    return { items: all.slice(from, from + PAGE_SIZE), total: all.length };
  }

  const sb = publicClient();
  let query = sb.from('products').select(PRODUCT_SELECT, { count: 'exact' }).eq('is_active', true);

  if (f.q) query = query.textSearch('search_vector', unaccent(f.q), { type: 'websearch', config: 'portuguese' });
  if (f.categoria) {
    const { data: c } = await sb.from('categories').select('id').eq('slug', f.categoria).maybeSingle();
    query = query.eq('category_id', c?.id ?? '00000000-0000-0000-0000-000000000000');
  }
  if (f.marcas?.length) {
    const { data: bs } = await sb.from('brands').select('id').in('slug', f.marcas);
    query = query.in('brand_id', (bs ?? []).map((b) => b.id));
  }
  if (f.min != null) query = query.gte('price', f.min);
  if (f.max != null) query = query.lte('price', f.max);
  if (f.disponivel) query = query.gt('stock', 0);
  if (f.ofertas) {
    query = query.not('promo_price', 'is', null).or(`promo_ends_at.is.null,promo_ends_at.gt.${new Date().toISOString()}`);
  }

  switch (f.ordem) {
    case 'mais-vendidos': query = query.order('sold_count', { ascending: false }); break;
    case 'menor-preco': query = query.order('price', { ascending: true }); break;
    case 'maior-preco': query = query.order('price', { ascending: false }); break;
    case 'novidades': query = query.order('created_at', { ascending: false }); break;
    case 'nome': query = query.order('name', { ascending: true }); break;
    default: query = query.order('is_featured', { ascending: false }).order('sold_count', { ascending: false });
  }

  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { items: (data ?? []).map(normalize), total: count ?? 0 };
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!isSupabaseConfigured()) return demo().find((p) => p.slug === slug) ?? null;
  const { data, error } = await publicClient().from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data ? normalize(data) : null;
});

export async function getBestSellers(limit = 8): Promise<Product[]> {
  return (await getProducts({ ordem: 'mais-vendidos' })).items.slice(0, limit);
}

export async function getWeeklyDeals(limit = 10): Promise<Product[]> {
  if (!isSupabaseConfigured()) return demoFilter({ ofertas: true }).slice(0, limit);
  const { data, error } = await publicClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .not('promo_price', 'is', null)
    .gt('promo_ends_at', new Date().toISOString())
    .order('promo_ends_at')
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!isSupabaseConfigured()) return demo().filter((p) => ids.includes(p.id));
  const { data, error } = await publicClient().from('products').select(PRODUCT_SELECT).in('id', ids).eq('is_active', true);
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  if (!isSupabaseConfigured()) return deliveryZonesData.map((z) => ({ ...z, cities: [...z.cities] }));
  const { data } = await publicClient().from('delivery_zones').select('*').eq('active', true).order('sort_order');
  return (data ?? []).map((z) => ({
    ...z,
    base_price: Number(z.base_price),
    price_per_kg: Number(z.price_per_kg),
    free_above: z.free_above == null ? null : Number(z.free_above),
    max_weight_kg: z.max_weight_kg == null ? null : Number(z.max_weight_kg),
  })) as DeliveryZone[];
}

export async function getProductsBySkus(skus: string[]): Promise<Product[]> {
  if (!isSupabaseConfigured()) return demo().filter((p) => skus.includes(p.sku));
  const { data, error } = await publicClient().from('products').select(PRODUCT_SELECT).in('sku', skus).eq('is_active', true);
  if (error) throw error;
  return (data ?? []).map(normalize);
}

/**
 * "Quem comprou também levou": produtos que aparecem nos mesmos pedidos.
 * Sem histórico suficiente, completa com os mais vendidos da mesma categoria.
 */
export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    const same = demo().filter((p) => p.id !== product.id && p.category_id === product.category_id);
    const others = demo().filter((p) => p.id !== product.id && p.category_id !== product.category_id);
    return [...same, ...others.sort((a, b) => b.sold_count - a.sold_count)].slice(0, limit);
  }
  const sb = publicClient();
  const related: Product[] = [];
  try {
    // Leitura de order_items exige service role: feita só se a chave existir.
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { getSupabaseAdmin } = await import('@/lib/supabase/admin');
      const admin = getSupabaseAdmin();
      const { data: orders } = await admin.from('order_items').select('order_id').eq('product_id', product.id).limit(200);
      const orderIds = [...new Set((orders ?? []).map((o) => o.order_id as string))];
      if (orderIds.length) {
        const { data: items } = await admin.from('order_items').select('product_id').in('order_id', orderIds).neq('product_id', product.id);
        const freq = new Map<string, number>();
        (items ?? []).forEach((i) => i.product_id && freq.set(i.product_id as string, (freq.get(i.product_id as string) ?? 0) + 1));
        const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
        if (top.length) {
          const { data } = await sb.from('products').select(PRODUCT_SELECT).in('id', top).eq('is_active', true);
          related.push(...(data ?? []).map(normalize).sort((a, b) => top.indexOf(a.id) - top.indexOf(b.id)));
        }
      }
    }
  } catch {
    /* recomendação é opcional — segue com o fallback */
  }
  if (related.length < limit) {
    const { data } = await sb
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('category_id', product.category_id ?? '')
      .neq('id', product.id)
      .order('sold_count', { ascending: false })
      .limit(limit);
    for (const p of (data ?? []).map(normalize)) if (!related.some((r) => r.id === p.id)) related.push(p);
  }
  return related.slice(0, limit);
}

export async function getAllProductSlugs(): Promise<{ slug: string; updated_at?: string }[]> {
  if (!isSupabaseConfigured()) return demo().map((p) => ({ slug: p.slug }));
  const { data } = await publicClient().from('products').select('slug, updated_at').eq('is_active', true);
  return (data ?? []) as { slug: string; updated_at?: string }[];
}

export async function getActiveBanners(placement: string): Promise<Banner[]> {
  if (!isSupabaseConfigured()) {
    return bannersData
      .filter((b) => b.placement === placement)
      .map((b) => ({ ...b, ends_at: new Date(Date.now() + 6 * 86_400_000).toISOString() }));
  }
  const { data } = await publicClient().from('banners').select('*').eq('placement', placement).order('sort_order');
  return (data ?? []) as Banner[];
}
