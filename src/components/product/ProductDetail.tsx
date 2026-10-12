'use client';

import { ClipboardList, PackageCheck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { Countdown } from '@/components/home/Countdown';
import { discountPercent, formatBRL, formatQty, isPromoActive, effectivePrice, unitLabels } from '@/lib/utils';
import { useQuoteList } from '@/store/quote';
import type { Product } from '@/types';
import { AddToCartButton } from './AddToCartButton';
import { DiscountBadge, PriceTag } from './ProductCard';
import { ProductGallery } from './ProductGallery';
import { QuantitySelector } from './QuantitySelector';
import { ShippingEstimator } from './ShippingEstimator';
import { WishlistButton } from './WishlistButton';

export function ProductDetail({ product }: { product: Product }) {
  const gallery = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(product.min_qty);
  const [quoted, setQuoted] = useState(false);
  const addQuote = useQuoteList((s) => s.add);
  const promo = isPromoActive(product);
  const inStock = product.stock > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      <div className="relative">
        <ProductGallery ref={gallery} images={product.images} name={product.name} />
        <div className="pointer-events-none absolute bottom-4 right-4">
          <DiscountBadge percent={discountPercent(product)} className="px-3 py-1.5 text-base" />
        </div>
      </div>

      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            {product.brand && <p className="text-xs font-bold uppercase tracking-wider text-seguranca-700">{product.brand.name}</p>}
            <h1 className="mt-1 text-2xl leading-tight sm:text-3xl">{product.name}</h1>
            <p className="mt-2 text-xs text-cimento-600">SKU {product.sku}</p>
          </div>
          <WishlistButton product={product} className="h-11 w-11 shrink-0" />
        </div>
        {product.short_description && <p className="mt-4 text-cimento-800">{product.short_description}</p>}

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-card">
          {promo && product.promo_ends_at && (
            <div className="-mx-5 -mt-5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl bg-petroleo-900 px-5 py-3">
              <p className="text-sm font-bold text-seguranca-300">Oferta por tempo limitado</p>
              <div className="origin-right scale-75">
                <Countdown endsAt={product.promo_ends_at} />
              </div>
            </div>
          )}
          <PriceTag product={product} size="lg" />

          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-cimento-50 p-2.5">
              <dt className="text-xs text-cimento-600">Unidade de venda</dt>
              <dd className="font-semibold text-petroleo-950">{product.unit_label ?? unitLabels[product.unit].long}</dd>
            </div>
            <div className="rounded-lg bg-cimento-50 p-2.5">
              <dt className="text-xs text-cimento-600">Disponibilidade</dt>
              <dd className={inStock ? 'font-semibold text-emerald-800' : 'font-semibold text-red-700'}>
                {inStock ? (product.stock <= product.min_stock ? `Últimas ${formatQty(product.stock, product.unit)}` : 'Em estoque') : 'Esgotado'}
              </dd>
            </div>
          </dl>
          {product.min_qty > 1 && (
            <p className="mt-3 text-xs text-cimento-700">
              Venda mínima: {formatQty(product.min_qty, product.unit)}, em múltiplos de {formatQty(product.qty_step, product.unit)}.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} min={product.min_qty} step={product.qty_step} max={product.stock} unit={product.unit} />
            <AddToCartButton product={product} quantity={qty} sourceRef={gallery} label="Adicionar" openDrawer className="flex-1 py-3.5 text-base" />
          </div>
          <p className="mt-3 text-sm text-cimento-700">
            Total: <b className="text-petroleo-950">{formatBRL(effectivePrice(product) * qty)}</b>
          </p>
          <button
            type="button"
            onClick={() => {
              addQuote({ productId: product.id, sku: product.sku, description: product.name, unit: product.unit, quantity: qty });
              setQuoted(true);
            }}
            className="btn-ghost mt-2 w-full"
          >
            <ClipboardList className="h-4 w-4" aria-hidden />
            {quoted ? 'Adicionado à lista de orçamento ✓' : 'Adicionar à lista de orçamento (obras grandes)'}
          </button>
        </div>

        <div className="mt-4">
          <ShippingEstimator items={[{ productId: product.id, quantity: qty }]} />
        </div>

        <ul className="mt-5 grid gap-3 text-sm text-cimento-800 sm:grid-cols-3">
          <li className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-seguranca-600" aria-hidden /> Retire em 2h na loja</li>
          <li className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-seguranca-600" aria-hidden /> Compra 100% segura</li>
          <li className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-seguranca-600" aria-hidden /> 7 dias para desistir</li>
        </ul>
      </div>
    </div>
  );
}
