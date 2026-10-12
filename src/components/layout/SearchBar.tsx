'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useDebounced } from '@/lib/hooks';
import { cn, formatBRL } from '@/lib/utils';

interface Suggestion {
  products: { id: string; slug: string; name: string; price: number; image: string | null }[];
  categories: { slug: string; name: string }[];
}

const empty: Suggestion = { products: [], categories: [] };

/** Busca com autocompletar (combobox ARIA: setas, Enter e Esc) */
export function SearchBar({ className, autoFocus, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Suggestion>(empty);
  const [active, setActive] = useState(-1);
  const debounced = useDebounced(q.trim(), 200);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.length < 2) {
      setData(empty);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: Suggestion) => {
        setData(d);
        setActive(-1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const options = [
    ...data.categories.map((c) => ({ key: `c-${c.slug}`, href: `/produtos?categoria=${c.slug}` })),
    ...data.products.map((p) => ({ key: `p-${p.id}`, href: `/produto/${p.slug}` })),
  ];

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && active >= 0 && options[active]) {
      e.preventDefault();
      go(options[active].href);
    }
  };

  const showPanel = open && q.trim().length >= 2;
  const optionClass = (i: number) => cn('flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm', active === i && 'bg-petroleo-50');
  const catOffset = 0;
  const prodOffset = data.categories.length;

  return (
    <div ref={box} className={cn('relative', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) go(`/produtos?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <label htmlFor={`${id}-input`} className="sr-only">
          Buscar produtos
        </label>
        <input
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && options[active] ? `${id}-${options[active].key}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar cimento, tubo 25 mm, tinta branca…"
          className="h-12 w-full rounded-xl border-2 border-transparent bg-cimento-100 pl-4 pr-12 text-sm text-cimento-950 placeholder:text-cimento-600 transition focus:border-petroleo-600 focus:bg-white focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-petroleo-900 text-white transition hover:bg-petroleo-800"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            id={`${id}-list`}
            role="listbox"
            aria-label="Sugestões de busca"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-auto rounded-xl border border-cimento-200 bg-white p-2 shadow-lift"
          >
            {!loading && options.length === 0 && (
              <p className="px-3 py-4 text-sm text-cimento-700">
                Nenhum resultado para &quot;{q}&quot;. Tente outro termo ou{' '}
                <Link className="font-semibold text-petroleo-700 underline" href="/orcamento" onClick={() => setOpen(false)}>
                  peça um orçamento
                </Link>
                .
              </p>
            )}
            {data.categories.length > 0 && (
              <div className="mb-1 border-b border-cimento-100 pb-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-cimento-600">Categorias</p>
                {data.categories.map((c, i) => (
                  <div
                    key={c.slug}
                    id={`${id}-c-${c.slug}`}
                    role="option"
                    aria-selected={active === catOffset + i}
                    onMouseEnter={() => setActive(catOffset + i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(`/produtos?categoria=${c.slug}`);
                    }}
                    className={optionClass(catOffset + i)}
                  >
                    Ver tudo em <b>{c.name}</b>
                  </div>
                ))}
              </div>
            )}
            {data.products.length > 0 && (
              <div>
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-cimento-600">Produtos</p>
                {data.products.map((p, i) => (
                  <div
                    key={p.id}
                    id={`${id}-p-${p.id}`}
                    role="option"
                    aria-selected={active === prodOffset + i}
                    onMouseEnter={() => setActive(prodOffset + i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(`/produto/${p.slug}`);
                    }}
                    className={optionClass(prodOffset + i)}
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-cimento-100">
                      {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                    </div>
                    <span className="flex-1 leading-snug">{p.name}</span>
                    <span className="whitespace-nowrap font-bold text-petroleo-900">{formatBRL(p.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
