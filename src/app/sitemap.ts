import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { getAllProductSlugs, getCategories } from '@/lib/data';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProductSlugs(), getCategories()]);
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${site.url}/produtos`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site.url}/orcamento`, changeFrequency: 'monthly', priority: 0.6 },
    ...categories.map((c) => ({ url: `${site.url}/produtos?categoria=${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site.url}/produto/${p.slug}`, lastModified: p.updated_at ? new Date(p.updated_at) : now, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...['trocas-e-devolucoes', 'entrega', 'privacidade', 'termos'].map((s) => ({ url: `${site.url}/politicas/${s}`, changeFrequency: 'yearly' as const, priority: 0.3 })),
  ];
}
