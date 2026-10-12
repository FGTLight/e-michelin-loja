import 'server-only';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabase/server';
import { slugify } from './utils';
import type { productAdminSchema } from './validators';

type Input = z.output<typeof productAdminSchema>;

/** Grava produto + imagens com a sessão do admin (RLS) e revalida as páginas ISR afetadas. */
export async function saveProduct(input: Input, id?: string) {
  const sb = getSupabaseServer();
  const { images, ...fields } = input;
  const row = {
    ...fields,
    slug: fields.slug || slugify(fields.name),
    short_description: fields.short_description || null,
    description: fields.description || null,
    unit_label: fields.unit_label || null,
    category_id: fields.category_id ?? null,
    brand_id: fields.brand_id ?? null,
    promo_ends_at: fields.promo_ends_at ?? null,
  };
  const { data, error } = id
    ? await sb.from('products').update(row).eq('id', id).select('id, slug').single()
    : await sb.from('products').insert(row).select('id, slug').single();
  if (error) {
    if (error.code === '23505') throw Object.assign(new Error('SKU ou slug já cadastrado.'), { status: 409 });
    throw error;
  }
  await sb.from('product_images').delete().eq('product_id', data.id);
  if (images.length) {
    await sb.from('product_images').insert(images.map((im, i) => ({ product_id: data.id, url: im.url, alt: im.alt ?? fields.name, sort_order: i })));
  }
  revalidateCatalog(data.slug as string);
  return data as { id: string; slug: string };
}

export function revalidateCatalog(slug?: string) {
  revalidatePath('/');
  revalidatePath('/produtos');
  if (slug) revalidatePath(`/produto/${slug}`);
}
