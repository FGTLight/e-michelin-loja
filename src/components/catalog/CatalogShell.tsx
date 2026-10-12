'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { ProductGridSkeleton } from '@/components/product/ProductSkeleton';
import type { Brand, Category } from '@/types';
import { Filters } from './Filters';

interface Ctx {
  pending: boolean;
  setParams: (patch: Record<string, string | null>) => void;
}

const CatalogContext = createContext<Ctx>({ pending: false, setParams: () => {} });
export const useCatalog = () => useContext(CatalogContext);

/**
 * Casca client do catálogo: centraliza a atualização da URL (filtros = estado compartilhável)
 * e mostra skeletons enquanto a nova página é renderizada no servidor.
 */
export function CatalogShell({
  categories,
  brands,
  toolbar,
  children,
}: {
  categories: Category[];
  brands: Brand[];
  toolbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!pending) {
      setShowSkeleton(false);
      return;
    }
    const t = setTimeout(() => setShowSkeleton(true), 180);
    return () => clearTimeout(t);
  }, [pending]);

  useEffect(() => setDrawer(false), [params]);

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v == null || v === '' ? next.delete(k) : next.set(k, v)));
    if (!('pagina' in patch)) next.delete('pagina');
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const activeCount = ['categoria', 'marca', 'min', 'max', 'disponivel', 'ofertas'].filter((k) => params.get(k)).length;

  return (
    <CatalogContext.Provider value={{ pending, setParams }}>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-36">
            <Filters categories={categories} brands={brands} />
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="btn-outline px-4 py-2 lg:hidden" onClick={() => setDrawer(true)}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filtros
              {activeCount > 0 && <span className="rounded-full bg-seguranca-500 px-1.5 text-xs text-petroleo-950">{activeCount}</span>}
            </button>
            {toolbar}
          </div>
          <div aria-busy={pending} aria-live="polite">
            {showSkeleton ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <motion.div
                key={params.toString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: pending ? 0.6 : 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {children}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-petroleo-950/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg">Filtros</h2>
                <button type="button" onClick={() => setDrawer(false)} className="rounded-lg p-2 hover:bg-cimento-100" aria-label="Fechar filtros">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Filters categories={categories} brands={brands} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </CatalogContext.Provider>
  );
}
