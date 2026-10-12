import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { revalidateCatalog } from '@/lib/admin-products';
import { apiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import { importRowSchema } from '@/lib/validators';

/**
 * Importação em massa (CSV/Excel já convertido em JSON no navegador).
 * - SKU existente → atualiza apenas as colunas presentes (ex.: só preço e estoque).
 * - SKU novo → cria o produto (exige nome e preço).
 * Cada linha é validada no servidor; erros são devolvidos por linha.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  try {
    const { rows } = z.object({ rows: z.array(z.record(z.unknown())).min(1).max(5000) }).parse(await req.json());
    const sb = getSupabaseServer();
    const [{ data: cats }, { data: brands }, { data: existing }] = await Promise.all([
      sb.from('categories').select('id, slug, name'),
      sb.from('brands').select('id, slug, name'),
      sb.from('products').select('id, sku'),
    ]);
    const find = (list: { id: string; slug: string; name: string }[] | null, v?: string) =>
      v ? list?.find((x) => x.slug === slugify(v) || x.name.toLowerCase() === v.toLowerCase())?.id : undefined;
    const bySku = new Map((existing ?? []).map((p) => [p.sku as string, p.id as string]));

    const result = { created: 0, updated: 0, errors: [] as { row: number; sku?: string; error: string }[] };
    for (const [i, raw] of rows.entries()) {
      const parsed = importRowSchema.safeParse(raw);
      if (!parsed.success) {
        result.errors.push({ row: i + 2, sku: String(raw.sku ?? ''), error: Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => `${k}: ${v?.[0]}`).join('; ') });
        continue;
      }
      const r = parsed.data;
      const patch: Record<string, unknown> = {};
      if (r.name) patch.name = r.name;
      if (r.price != null) patch.price = r.price;
      if (r.promo_price !== undefined) patch.promo_price = r.promo_price;
      if (r.stock != null) patch.stock = r.stock;
      if (r.unit) patch.unit = r.unit;
      if (r.weight_kg != null) patch.weight_kg = r.weight_kg;
      if (r.short_description) patch.short_description = r.short_description;
      if (r.category) patch.category_id = find(cats, r.category) ?? null;
      if (r.brand) patch.brand_id = find(brands, r.brand) ?? null;

      const id = bySku.get(r.sku);
      if (id) {
        const { error } = await sb.from('products').update(patch).eq('id', id);
        if (error) result.errors.push({ row: i + 2, sku: r.sku, error: error.message });
        else result.updated++;
      } else {
        if (!r.name || r.price == null) {
          result.errors.push({ row: i + 2, sku: r.sku, error: 'Produto novo exige nome e preço' });
          continue;
        }
        const { data, error } = await sb.from('products').insert({ ...patch, sku: r.sku, slug: `${slugify(r.name)}-${slugify(r.sku)}` }).select('id').single();
        if (error) result.errors.push({ row: i + 2, sku: r.sku, error: error.message });
        else {
          result.created++;
          bySku.set(r.sku, data.id);
        }
      }
    }
    revalidateCatalog();
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
