import type { Metadata } from 'next';
import Link from 'next/link';
import { CatalogShell } from '@/components/catalog/CatalogShell';
import { Pagination, SortSelect } from '@/components/catalog/Filters';
import { ProductCard } from '@/components/product/ProductCard';
import { getBrands, getCategories, getProducts, PAGE_SIZE, type SortKey } from '@/lib/data';
import { breadcrumbJsonLd, jsonLd } from '@/lib/seo';

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? undefined;
const num = (v: string | undefined) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === str(searchParams.categoria));
  const q = str(searchParams.q);
  const title = cat ? `${cat.name} em Erechim` : q ? `Busca: ${q}` : 'Todos os produtos';
  return {
    title,
    description: cat?.description ?? 'Catálogo completo de materiais de construção, hidráulica, elétrica, ferramentas e tintas da E Michelin e Cia.',
    alternates: { canonical: cat ? `/produtos?categoria=${cat.slug}` : '/produtos' },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function CatalogPage({ searchParams }: { searchParams: SP }) {
  const filters = {
    q: str(searchParams.q),
    categoria: str(searchParams.categoria),
    marcas: str(searchParams.marca)?.split(',').filter(Boolean),
    min: num(str(searchParams.min)),
    max: num(str(searchParams.max)),
    disponivel: str(searchParams.disponivel) === '1',
    ofertas: str(searchParams.ofertas) === '1',
    ordem: (str(searchParams.ordem) as SortKey) ?? 'relevancia',
    pagina: num(str(searchParams.pagina)) ?? 1,
  };

  const [categories, brands, { items, total }] = await Promise.all([getCategories(), getBrands(), getProducts(filters)]);
  const cat = categories.find((c) => c.slug === filters.categoria);
  const title = cat?.name ?? (filters.q ? `Resultados para “${filters.q}”` : filters.ofertas ? 'Ofertas da semana' : 'Todos os produtos');
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container py-8 sm:py-10">
      <nav aria-label="Trilha de navegação" className="mb-4 text-sm text-cimento-700">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:underline">Início</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/produtos" className="hover:underline">Produtos</Link></li>
          {cat && (
            <>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-semibold text-petroleo-900">{cat.name}</li>
            </>
          )}
        </ol>
      </nav>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {cat?.description && <p className="mt-2 max-w-2xl text-cimento-700">{cat.description}</p>}
      </header>

      <CatalogShell
        categories={categories}
        brands={brands}
        toolbar={
          <>
            <p className="text-sm text-cimento-700">
              <b className="text-petroleo-950">{total}</b> {total === 1 ? 'produto' : 'produtos'}
            </p>
            <SortSelect />
          </>
        }
      >
        {items.length ? (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {items.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} priority={i < 4} />
                </li>
              ))}
            </ul>
            <Pagination page={filters.pagina} totalPages={totalPages} />
          </>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <p className="font-display text-xl font-bold text-petroleo-950">Nenhum produto encontrado</p>
            <p className="max-w-md text-sm text-cimento-700">
              Ajuste os filtros ou envie sua lista para nossa equipe — trabalhamos com milhares de itens que ainda não estão no site.
            </p>
            <Link href="/orcamento" className="btn-primary mt-2">Pedir orçamento</Link>
          </div>
        )}
      </CatalogShell>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbJsonLd([
            { name: 'Início', path: '/' },
            { name: 'Produtos', path: '/produtos' },
            ...(cat ? [{ name: cat.name, path: `/produtos?categoria=${cat.slug}` }] : []),
          ]),
        )}
      />
    </div>
  );
}
