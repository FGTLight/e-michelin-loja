'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

/** Carrossel leve com scroll-snap nativo (arrasta no touch, setas no desktop, teclado via Tab). */
export function ProductCarousel({ products, label, dark = false }: { products: Product[]; label: string; dark?: boolean }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  };

  useEffect(() => {
    update();
    const el = track.current;
    el?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
  };

  const arrow = 'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-lift transition disabled:pointer-events-none disabled:opacity-0 md:flex';
  const arrowColor = dark ? 'bg-seguranca-500 text-petroleo-950 hover:bg-seguranca-400' : 'bg-white text-petroleo-950 hover:bg-petroleo-50';

  return (
    <div className="relative" role="region" aria-roledescription="carrossel" aria-label={label}>
      <button type="button" className={`${arrow} ${arrowColor} -left-4`} onClick={() => scroll(-1)} disabled={edges.start} aria-label="Produtos anteriores">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <ul ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 pt-1 sm:gap-5">
        {products.map((p) => (
          <li key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      <button type="button" className={`${arrow} ${arrowColor} -right-4`} onClick={() => scroll(1)} disabled={edges.end} aria-label="Próximos produtos">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
