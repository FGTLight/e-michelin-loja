import { NextResponse, type NextRequest } from 'next/server';
import { getCategories, getProducts } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/env';
import { clientIp, rateLimit } from '@/lib/api';
import { effectivePrice } from '@/lib/utils';

const unaccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Autocompletar: full-text (prefixo) + trigram no Postgres, com sugestões de categorias. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ products: [], categories: [] });
  if (!rateLimit(`search:${clientIp(req)}`, 60)) return NextResponse.json({ products: [], categories: [] }, { status: 429 });

  const categories = (await getCategories())
    .filter((c) => unaccent(c.name).includes(unaccent(q)))
    .slice(0, 3)
    .map((c) => ({ slug: c.slug, name: c.name }));

  let products: { id: string; slug: string; name: string; price: number; image: string | null }[];
  if (isSupabaseConfigured()) {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data } = await sb.rpc('search_products', { q, max_results: 6 });
    products = ((data ?? []) as { id: string; slug: string; name: string; price: number; promo_price: number | null; promo_ends_at: string | null; image_url: string | null }[]).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: effectivePrice({ price: Number(p.price), promo_price: p.promo_price == null ? null : Number(p.promo_price), promo_ends_at: p.promo_ends_at }),
      image: p.image_url,
    }));
  } else {
    const { items } = await getProducts({ q });
    products = items.slice(0, 6).map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: effectivePrice(p), image: p.images[0]?.url ?? null }));
  }

  return NextResponse.json({ products, categories }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}
