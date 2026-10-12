'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, ShoppingCart, Trash2, Truck, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useMounted } from '@/lib/hooks';
import { formatBRL, unitLabels } from '@/lib/utils';
import { cartSubtotal, useCart } from '@/store/cart';
import { useQuoteList } from '@/store/quote';
import { useUi } from '@/store/ui';

const FREE_SHIPPING_ERECHIM = 500;

export function CartDrawer() {
  const { cartOpen, closeCart } = useUi();
  const { items, setQuantity, remove } = useCart();
  const addToQuote = useQuoteList((s) => s.add);
  const mounted = useMounted();
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const subtotal = cartSubtotal(items);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_ERECHIM);

  // Foco preso no painel, Esc fecha, foco volta para quem abriu
  useEffect(() => {
    if (!cartOpen) return;
    lastFocus.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('button')?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input');
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      lastFocus.current?.focus();
    };
  }, [cartOpen, closeCart]);

  const toQuote = () => {
    items.forEach((i) => addToQuote({ productId: i.productId, sku: i.sku, description: i.name, unit: i.unit, quantity: i.quantity }));
    closeCart();
    router.push('/orcamento');
  };

  return (
    <AnimatePresence>
      {cartOpen && mounted && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-petroleo-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-cimento-200 px-5 py-4">
              <h2 id="cart-title" className="flex items-center gap-2 text-xl">
                <ShoppingCart className="h-5 w-5 text-seguranca-600" aria-hidden /> Seu carrinho
                <span className="rounded-full bg-cimento-100 px-2 py-0.5 text-xs font-bold text-cimento-800">{items.length}</span>
              </h2>
              <button type="button" onClick={closeCart} className="rounded-lg p-2 hover:bg-cimento-100" aria-label="Fechar carrinho">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="rounded-full bg-cimento-100 p-6">
                  <ShoppingCart className="h-10 w-10 text-cimento-600" aria-hidden />
                </motion.div>
                <p className="font-display text-lg font-bold text-petroleo-950">Seu carrinho está vazio</p>
                <p className="text-sm text-cimento-700">Que tal começar pelos mais vendidos ou usar a calculadora de materiais?</p>
                <Link href="/produtos" onClick={closeCart} className="btn-primary">
                  Ver produtos
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-cimento-100 bg-petroleo-50 px-5 py-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-petroleo-900">
                    <Truck className="h-4 w-4" aria-hidden />
                    {progress >= 1
                      ? 'Você ganhou frete grátis para Erechim!'
                      : `Faltam ${formatBRL(FREE_SHIPPING_ERECHIM - subtotal)} para frete grátis em Erechim`}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-petroleo-100">
                    <motion.div className="h-full rounded-full bg-seguranca-500" animate={{ width: `${progress * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                  </div>
                </div>

                <motion.ul layoutScroll className="flex-1 divide-y divide-cimento-100 overflow-y-auto px-5">
                  <AnimatePresence initial={false} mode="popLayout">
                    {items.map((i) => (
                      <motion.li
                        key={i.productId}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60, transition: { duration: 0.18 } }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-3 overflow-hidden py-4"
                      >
                        <Link href={`/produto/${i.slug}`} onClick={closeCart} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cimento-100">
                          {i.image && <Image src={i.image} alt={i.name} fill sizes="80px" className="object-cover" />}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/produto/${i.slug}`} onClick={closeCart} className="line-clamp-2 text-sm font-semibold leading-snug text-petroleo-950 hover:underline">
                              {i.name}
                            </Link>
                            <button type="button" onClick={() => remove(i.productId)} className="rounded p-1 text-cimento-600 hover:bg-red-50 hover:text-red-700" aria-label={`Remover ${i.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-xs text-cimento-700">
                            {formatBRL(i.price)} / {i.unitLabel ?? unitLabels[i.unit].long}
                          </p>
                          <div className="flex items-center justify-between">
                            <QuantitySelector size="sm" value={i.quantity} onChange={(v) => setQuantity(i.productId, v)} min={i.minQty} step={i.qtyStep} max={i.stock} unit={i.unit} />
                            <AnimatedNumber value={i.price * i.quantity} format={formatBRL} className="font-bold text-petroleo-950" />
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>

                <div className="border-t border-cimento-200 p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-cimento-700">Subtotal</span>
                    <AnimatedNumber value={subtotal} format={formatBRL} className="font-display text-2xl font-extrabold text-petroleo-950" />
                  </div>
                  <p className="mb-4 mt-1 text-xs text-cimento-600">Frete e cupom calculados no checkout. Retirada na loja grátis.</p>
                  <Link href="/checkout" onClick={closeCart} className="btn-primary w-full text-base">
                    Finalizar compra
                  </Link>
                  <button type="button" onClick={toQuote} className="btn-ghost mt-2 w-full">
                    <ClipboardList className="h-4 w-4" aria-hidden /> Transformar em pedido de orçamento
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
