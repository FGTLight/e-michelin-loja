'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { forwardRef, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/types';

/**
 * Galeria com miniaturas, troca animada e zoom que segue o cursor (desktop).
 * O zoom atualiza variáveis CSS direto no elemento (sem setState no mousemove), então não trava.
 */
export const ProductGallery = forwardRef<HTMLDivElement, { images: ProductImage[]; name: string }>(function ProductGallery({ images, name }, ref) {
  const [index, setIndex] = useState(0);
  const zoomBox = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const current = images[index];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = zoomBox.current;
    if (!box) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      box.style.setProperty('--zx', `${x}%`);
      box.style.setProperty('--zy', `${y}%`);
      box.dataset.zoom = 'on';
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    if (zoomBox.current) zoomBox.current.dataset.zoom = 'off';
  };

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto sm:flex-col" role="tablist" aria-label="Imagens do produto">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Imagem ${i + 1} de ${images.length}`}
                onClick={() => setIndex(i)}
                className={cn('relative block h-16 w-16 overflow-hidden rounded-lg ring-2 transition sm:h-20 sm:w-20', i === index ? 'ring-seguranca-500' : 'ring-transparent opacity-70 hover:opacity-100')}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        ref={ref}
        className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-white shadow-card"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div ref={zoomBox} data-zoom="off" className="group/zoom absolute inset-0">
          <AnimatePresence initial={false}>
            {current && (
              <motion.div
                key={current.url}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={current.url}
                  alt={current.alt ?? name}
                  fill
                  priority={index === 0}
                  sizes="(min-width:1024px) 560px, 100vw"
                  className="object-cover transition-transform duration-200 ease-out [transform-origin:var(--zx,50%)_var(--zy,50%)] group-data-[zoom=on]/zoom:scale-[1.9]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
