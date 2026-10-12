import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCarousel } from '@/components/product/ProductCarousel';
import { ProductDetail } from '@/components/product/ProductDetail';
import { getAllProductSlugs, getProductBySlug, getRelatedProducts } from '@/lib/data';
import { breadcrumbJsonLd, jsonLd, productJsonLd } from '@/lib/seo';
import { effectivePrice } from '@/lib/utils';

// ISR: páginas de produto geradas no build e revalidadas a cada hora (ou sob demanda pelo painel)
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProductBySlug(params.slug);
  if (!p) return { title: 'Produto não encontrado' };
  const description = `${p.short_description ?? p.name} Compre em Erechim com entrega rápida ou retire na loja.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: {
      type: 'website',
      title: p.name,
      description,
      images: p.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt ?? p.name })),
    },
    other: {
      'product:price:amount': effectivePrice(p).toFixed(2),
      'product:price:currency': 'BRL',
      'product:availability': p.stock > 0 ? 'in stock' : 'out of stock',
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  const specs = Object.entries(product.specs ?? {});
  const dims = [product.length_cm, product.width_cm, product.height_cm];

  return (
    <div className="container py-8 sm:py-10">
      <nav aria-label="Trilha de navegação" className="mb-6 text-sm text-cimento-700">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:underline">Início</Link></li>
          <li aria-hidden>/</li>
          {product.category && (
            <>
              <li><Link href={`/produtos?categoria=${product.category.slug}`} className="hover:underline">{product.category.name}</Link></li>
              <li aria-hidden>/</li>
            </>
          )}
          <li aria-current="page" className="line-clamp-1 font-semibold text-petroleo-900">{product.name}</li>
        </ol>
      </nav>

      <ProductDetail product={product} />

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="desc-title" className="card p-6 sm:p-8">
          <h2 id="desc-title" className="text-xl">Descrição</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-cimento-800">{product.description}</p>
        </section>
        <section aria-labelledby="spec-title" className="card p-6 sm:p-8">
          <h2 id="spec-title" className="text-xl">Especificações técnicas</h2>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-cimento-100">
              {specs.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-cimento-700">{k}</th>
                  <td className="py-2.5 text-right font-semibold text-petroleo-950">{v}</td>
                </tr>
              ))}
              {product.weight_kg > 0 && (
                <tr>
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-cimento-700">Peso</th>
                  <td className="py-2.5 text-right font-semibold text-petroleo-950">{product.weight_kg.toLocaleString('pt-BR')} kg</td>
                </tr>
              )}
              {dims.every(Boolean) && (
                <tr>
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-cimento-700">Dimensões (C × L × A)</th>
                  <td className="py-2.5 text-right font-semibold text-petroleo-950">{dims.map((d) => d!.toLocaleString('pt-BR')).join(' × ')} cm</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-title">
          <h2 id="related-title" className="section-title mb-6">Quem comprou também levou</h2>
          <ProductCarousel products={related} label="Quem comprou também levou" />
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(productJsonLd(product))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbJsonLd([
            { name: 'Início', path: '/' },
            ...(product.category ? [{ name: product.category.name, path: `/produtos?categoria=${product.category.slug}` }] : []),
            { name: product.name, path: `/produto/${product.slug}` },
          ]),
        )}
      />
    </div>
  );
}
