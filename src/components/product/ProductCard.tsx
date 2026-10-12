'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { site } from '@/config/site';
import { cn, discountPercent, effectivePrice, formatBRL, isPromoActive, maxInstallments, unitLabels } from '@/lib/utils';
import type { Product } from '@/types';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';

export function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  if (!percent) return null;
  return (
    <motion.span
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: -8 }}
      whileHover={{ rotate: 0, scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 400, damping: 14 }}
      className={cn('inline-flex items-center rounded-md bg-seguranca-500 px-2 py-1 font-display text-xs font-extrabold text-petroleo-950 shadow-sm', className)}
    >
      -{percent}%
    </motion.span>
  );
}

export function PriceTag({ product, size = 'md' }: { product: Product; size?: 'md' | 'lg' }) {
  const price = effectivePrice(product);
  const promo = isPromoActive(product);
  const n = maxInstallments(price, site.maxInstallments, site.minInstallmentValue);
  return (
    <div>
      {promo && <p className="text-xs text-cimento-600 line-through">{formatBRL(product.price)}</p>}
      <p className={cn('font-display font-extrabold text-petroleo-950', size === 'lg' ? 'text-4xl' : 'text-xl')}>
        {formatBRL(price)}
        <span className={cn('ml-1 font-sans font-medium text-cimento-600', size === 'lg' ? 'text-base' : 'text-xs')}>
          /{product.unit_label ?? unitLabels[product.unit].long}
        </span>
      </p>
      {n > 1 && <p className="text-xs text-cimento-700">ou {n}x de {formatBRL(price / n)} sem juros</p>}
    </div>
  );
}

/**
 * Card de produto: zoom suave da imagem no hover e botão "Adicionar" que entra com slide.
 * Em telas de toque (sem hover) o botão fica sempre visível.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = useRef<HTMLDivElement>(null);
  const pct = discountPercent(product);
  const low = product.stock > 0 && product.stock <= product.min_stock;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-cimento-200/60 transition-shadow duration-300 hover:shadow-lift">
      <Link href={`/produto/${product.slug}`} className="flex flex-1 flex-col focus-visible:ring-0" aria-label={product.name}>
        <div ref={img} className="relative aspect-square overflow-hidden bg-cimento-100">
          {product.images[0] && (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt ?? product.name}
              fill
              priority={priority}
              sizes="(min-width:1280px) 280px, (min-width:768px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <DiscountBadge percent={pct} />
            {product.stock <= 0 && <span className="rounded-md bg-cimento-900 px-2 py-1 text-xs font-bold text-white">Esgotado</span>}
            {low && <span className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold text-seguranca-800 ring-1 ring-seguranca-200">Últimas unidades</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4 pb-20 sm:pb-4">
          {product.brand && <p className="text-[11px] font-bold uppercase tracking-wider text-cimento-600">{product.brand.name}</p>}
          <h3 className="line-clamp-2 font-sans text-sm font-semibold leading-snug text-petroleo-950">{product.name}</h3>
          <div className="mt-auto pt-1">
            <PriceTag product={product} />
          </div>
        </div>
      </Link>

      <WishlistButton product={product} className="absolute right-3 top-3" />

      {/* Botão que desliza para cima no hover (desktop) e fica fixo no mobile */}
      <div className="absolute inset-x-0 bottom-0 p-3 transition-all duration-300 ease-out sm:translate-y-full sm:opacity-0 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
        <AddToCartButton product={product} sourceRef={img} className="w-full py-2.5" />
      </div>
    </article>
  );
}
