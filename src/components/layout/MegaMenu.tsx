'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Percent } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { Category } from '@/types';

/** Mega menu de categorias: abre no hover (com atraso) ou no clique; Esc fecha e devolve o foco. */
export function MegaMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const enter = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 120);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 180);
  };

  return (
    <div ref={wrap} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 items-center gap-2 bg-seguranca-500 px-5 text-sm font-bold text-petroleo-950 transition hover:bg-seguranca-400"
      >
        <span className="flex flex-col gap-[3px]" aria-hidden>
          <span className="h-0.5 w-4 bg-current" />
          <span className="h-0.5 w-4 bg-current" />
          <span className="h-0.5 w-3 bg-current" />
        </span>
        Todas as categorias
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            initial={{ opacity: 0, y: 10, clipPath: 'inset(0 0 100% 0 round 16px)' }}
            animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0 round 16px)' }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full z-50 mt-2 w-[min(92vw,960px)] rounded-2xl bg-white p-6 shadow-lift ring-1 ring-cimento-200"
          >
            <div className="grid grid-cols-[1fr_240px] gap-6">
              <ul className="grid grid-cols-2 gap-1">
                {categories.map((c, i) => (
                  <motion.li key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                    <motion.div initial="rest" whileHover="hover" whileFocus="hover" animate="rest">
                      <Link
                        href={`/produtos?categoria=${c.slug}`}
                        className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-petroleo-50 focus-visible:bg-petroleo-50"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-petroleo-900 text-seguranca-400 transition group-hover:bg-seguranca-500 group-hover:text-petroleo-950">
                          <CategoryIcon icon={c.icon} className="h-7 w-7" />
                        </span>
                        <span>
                          <span className="block font-display font-bold text-petroleo-950">{c.name}</span>
                          <span className="line-clamp-2 text-xs text-cimento-700">{c.description}</span>
                        </span>
                      </Link>
                    </motion.div>
                  </motion.li>
                ))}
              </ul>
              <Link href="/produtos?ofertas=1" className="group relative flex flex-col justify-end overflow-hidden rounded-xl bg-petroleo-900 p-5 text-white">
                <div className="hazard absolute inset-x-0 top-0 h-3" aria-hidden />
                <Percent className="mb-auto mt-4 h-10 w-10 text-seguranca-400 transition-transform duration-500 group-hover:rotate-12" aria-hidden />
                <p className="font-display text-2xl font-extrabold leading-tight text-white">Ofertas da semana</p>
                <p className="mt-1 text-sm text-petroleo-100">Cimento, tubos, tintas e mais com preço de obra.</p>
                <span className="mt-4 inline-flex text-sm font-bold text-seguranca-300 underline-offset-4 group-hover:underline">Ver ofertas →</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
