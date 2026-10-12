'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Brand, Category } from '@/types';
import { useCatalog } from './CatalogShell';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-cimento-200 py-5 first:pt-0">
      <legend className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-petroleo-950">{title}</legend>
      {children}
    </fieldset>
  );
}

export function Filters({ categories, brands }: { categories: Category[]; brands: Brand[] }) {
  const params = useSearchParams();
  const { setParams } = useCatalog();
  const categoria = params.get('categoria');
  const marcas = (params.get('marca') ?? '').split(',').filter(Boolean);
  const [min, setMin] = useState(params.get('min') ?? '');
  const [max, setMax] = useState(params.get('max') ?? '');

  useEffect(() => {
    setMin(params.get('min') ?? '');
    setMax(params.get('max') ?? '');
  }, [params]);

  const toggleBrand = (slug: string) => {
    const next = marcas.includes(slug) ? marcas.filter((m) => m !== slug) : [...marcas, slug];
    setParams({ marca: next.join(',') || null });
  };

  const check = 'h-4 w-4 rounded accent-petroleo-800';

  return (
    <div>
      <Group title="Categoria">
        <ul className="space-y-1">
          <li>
            <button type="button" onClick={() => setParams({ categoria: null })} className={cn('w-full rounded-lg px-3 py-2 text-left text-sm transition', !categoria ? 'bg-petroleo-900 font-bold text-white' : 'text-cimento-800 hover:bg-cimento-100')} aria-pressed={!categoria}>
              Todas
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setParams({ categoria: c.slug })}
                aria-pressed={categoria === c.slug}
                className={cn('w-full rounded-lg px-3 py-2 text-left text-sm transition', categoria === c.slug ? 'bg-petroleo-900 font-bold text-white' : 'text-cimento-800 hover:bg-cimento-100')}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Preço">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ min: min || null, max: max || null });
          }}
        >
          <label className="flex-1 text-xs text-cimento-700">
            Mín. (R$)
            <input type="number" min={0} inputMode="decimal" className="input mt-1 px-2.5 py-2" value={min} onChange={(e) => setMin(e.target.value)} />
          </label>
          <label className="flex-1 text-xs text-cimento-700">
            Máx. (R$)
            <input type="number" min={0} inputMode="decimal" className="input mt-1 px-2.5 py-2" value={max} onChange={(e) => setMax(e.target.value)} />
          </label>
          <button type="submit" className="btn-dark px-3 py-2.5">OK</button>
        </form>
      </Group>

      <Group title="Disponibilidade">
        <label className="flex items-center gap-2.5 text-sm text-cimento-800">
          <input type="checkbox" className={check} checked={params.get('disponivel') === '1'} onChange={(e) => setParams({ disponivel: e.target.checked ? '1' : null })} />
          Somente em estoque
        </label>
        <label className="mt-2.5 flex items-center gap-2.5 text-sm text-cimento-800">
          <input type="checkbox" className={check} checked={params.get('ofertas') === '1'} onChange={(e) => setParams({ ofertas: e.target.checked ? '1' : null })} />
          Somente ofertas
        </label>
      </Group>

      <Group title="Marca">
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {brands.map((b) => (
            <li key={b.id}>
              <label className="flex items-center gap-2.5 text-sm text-cimento-800">
                <input type="checkbox" className={check} checked={marcas.includes(b.slug)} onChange={() => toggleBrand(b.slug)} />
                {b.name}
              </label>
            </li>
          ))}
        </ul>
      </Group>

      {[...params.keys()].some((k) => k !== 'ordem' && k !== 'q') && (
        <button type="button" className="btn-ghost mt-4 w-full" onClick={() => setParams({ categoria: null, marca: null, min: null, max: null, disponivel: null, ofertas: null })}>
          Limpar filtros
        </button>
      )}
    </div>
  );
}

export function SortSelect() {
  const params = useSearchParams();
  const { setParams } = useCatalog();
  return (
    <label className="flex items-center gap-2 text-sm text-cimento-700">
      Ordenar por
      <select className="input w-auto py-2 font-semibold" value={params.get('ordem') ?? 'relevancia'} onChange={(e) => setParams({ ordem: e.target.value === 'relevancia' ? null : e.target.value })}>
        <option value="relevancia">Relevância</option>
        <option value="mais-vendidos">Mais vendidos</option>
        <option value="menor-preco">Menor preço</option>
        <option value="maior-preco">Maior preço</option>
        <option value="novidades">Novidades</option>
        <option value="nome">Nome (A–Z)</option>
      </select>
    </label>
  );
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { setParams } = useCatalog();
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <nav className="mt-10 flex justify-center gap-1.5" aria-label="Paginação">
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-cimento-600">…</span>}
          <button
            type="button"
            onClick={() => {
              setParams({ pagina: p === 1 ? null : String(p) });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-current={p === page ? 'page' : undefined}
            className={cn('h-10 min-w-10 rounded-lg px-3 text-sm font-bold transition', p === page ? 'bg-petroleo-900 text-white' : 'bg-white text-petroleo-900 ring-1 ring-cimento-200 hover:bg-petroleo-50')}
          >
            {p}
          </button>
        </span>
      ))}
    </nav>
  );
}
