'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BrickWall, Calculator, Layers, PaintRoller, ShoppingCart, SquareStack } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { calcContrapiso, calcParede, calcPintura, calcPiso, CALC_SKUS, type CalcMode, type CalcResult } from '@/lib/calculator';
import { toCartItem } from '@/lib/cart-helpers';
import { cn, effectivePrice, formatBRL, formatQty } from '@/lib/utils';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import type { Product } from '@/types';

const modes: { id: CalcMode; label: string; icon: typeof BrickWall; hint: string }[] = [
  { id: 'parede', label: 'Parede', icon: BrickWall, hint: 'Área da parede (comprimento × altura)' },
  { id: 'contrapiso', label: 'Contrapiso', icon: Layers, hint: 'Área do piso a regularizar' },
  { id: 'piso', label: 'Piso', icon: SquareStack, hint: 'Área a revestir' },
  { id: 'pintura', label: 'Pintura', icon: PaintRoller, hint: 'Área de paredes a pintar' },
];

const m2PorCaixa = (p?: Product) => Number((p?.specs['m² por caixa'] ?? '1').replace(',', '.')) || 1;

/**
 * Calculadora de materiais: o cliente informa os m² e recebe a lista
 * (blocos, cimento, argamassa, piso ou tinta), que vai inteira para o carrinho em um clique.
 */
export function MaterialCalculator({ products }: { products: Product[] }) {
  const bySku = useMemo(() => new Map(products.map((p) => [p.sku, p])), [products]);
  const [mode, setMode] = useState<CalcMode>('parede');
  const [area, setArea] = useState(20);
  const [bloco, setBloco] = useState<'ceramico' | 'concreto'>('ceramico');
  const [reboco, setReboco] = useState(true);
  const [espessura, setEspessura] = useState(5);
  const [tipoPiso, setTipoPiso] = useState<'porcelanato' | 'ceramico'>('porcelanato');
  const [demaos, setDemaos] = useState(2);
  const [massa, setMassa] = useState(false);
  const addMany = useCart((s) => s.addMany);
  const { fly, openCart } = useUi();
  const [added, setAdded] = useState(false);

  const result: CalcResult = useMemo(() => {
    const a = Math.max(0, Math.min(area || 0, 100_000));
    if (a <= 0) return { lines: [], notes: [] };
    switch (mode) {
      case 'parede':
        return calcParede({ area: a, bloco, reboco });
      case 'contrapiso':
        return calcContrapiso({ area: a, espessuraCm: espessura });
      case 'piso': {
        const p = bySku.get(tipoPiso === 'porcelanato' ? CALC_SKUS.porcelanato : CALC_SKUS.piso);
        return calcPiso({ area: a, tipo: tipoPiso, m2PorCaixa: m2PorCaixa(p) });
      }
      case 'pintura':
        return calcPintura({
          area: a,
          demaos,
          massa,
          precoLata18: effectivePrice(bySku.get(CALC_SKUS.tinta18) ?? { price: 289, promo_price: null, promo_ends_at: null }),
          precoGalao: effectivePrice(bySku.get(CALC_SKUS.tinta36) ?? { price: 79.9, promo_price: null, promo_ends_at: null }),
        });
    }
  }, [mode, area, bloco, reboco, espessura, tipoPiso, demaos, massa, bySku]);

  const lines = result.lines
    .map((l) => ({ ...l, product: bySku.get(l.sku) }))
    .filter((l): l is typeof l & { product: Product } => Boolean(l.product));
  const total = lines.reduce((s, l) => s + effectivePrice(l.product) * l.quantity, 0);

  const addAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    addMany(lines.map((l) => ({ item: toCartItem(l.product), quantity: l.quantity })));
    lines.slice(0, 3).forEach((l, i) => setTimeout(() => fly(l.product.images[0]?.url ?? null, e.currentTarget), i * 120));
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 900);
  };

  const pill = (active: boolean) =>
    cn('rounded-lg border-2 px-3 py-2 text-sm font-semibold transition', active ? 'border-petroleo-900 bg-petroleo-900 text-white' : 'border-cimento-200 bg-white text-petroleo-900 hover:border-petroleo-300');

  return (
    <section id="calculadora" className="bg-cimento-100 py-16 sm:py-20" aria-labelledby="calc-title">
      <div className="container">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow flex items-center gap-2"><Calculator className="h-4 w-4" aria-hidden /> Ferramenta gratuita</p>
          <h2 id="calc-title" className="section-title mt-2">Calculadora de materiais</h2>
          <p className="mt-2 text-cimento-700">Informe a metragem e descubra quanto comprar — sem sobrar, sem faltar. Depois é só mandar tudo para o carrinho.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          {/* Entrada */}
          <div className="card p-5 sm:p-7">
            <div role="tablist" aria-label="Tipo de cálculo" className="grid grid-cols-4 gap-1.5 rounded-xl bg-cimento-100 p-1.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  type="button"
                  aria-selected={mode === m.id}
                  aria-controls="calc-panel"
                  onClick={() => setMode(m.id)}
                  className={cn('relative flex flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-xs font-bold transition sm:text-sm', mode === m.id ? 'text-petroleo-950' : 'text-cimento-700 hover:text-petroleo-900')}
                >
                  {mode === m.id && <motion.span layoutId="calc-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <m.icon className="relative h-5 w-5" aria-hidden />
                  <span className="relative">{m.label}</span>
                </button>
              ))}
            </div>

            <div id="calc-panel" role="tabpanel" className="mt-6 space-y-5">
              <div>
                <label htmlFor="calc-area" className="label">{modes.find((m) => m.id === mode)!.hint}</label>
                <div className="flex items-center gap-3">
                  <input id="calc-area" type="range" min={1} max={300} value={Math.min(area, 300)} onChange={(e) => setArea(Number(e.target.value))} className="flex-1 accent-seguranca-600" aria-label="Área em metros quadrados (controle deslizante)" />
                  <div className="relative">
                    <input type="number" min={1} max={100000} inputMode="decimal" value={area} onChange={(e) => setArea(Number(e.target.value))} className="input w-28 pr-9 text-right font-bold" aria-label="Área em metros quadrados" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-cimento-600">m²</span>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                  {mode === 'parede' && (
                    <>
                      <fieldset>
                        <legend className="label">Tipo de bloco</legend>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={pill(bloco === 'ceramico')} aria-pressed={bloco === 'ceramico'} onClick={() => setBloco('ceramico')}>Tijolo cerâmico 6 furos</button>
                          <button type="button" className={pill(bloco === 'concreto')} aria-pressed={bloco === 'concreto'} onClick={() => setBloco('concreto')}>Bloco de concreto</button>
                        </div>
                      </fieldset>
                      <label className="flex items-center gap-3 text-sm font-semibold text-cimento-800">
                        <input type="checkbox" checked={reboco} onChange={(e) => setReboco(e.target.checked)} className="h-5 w-5 accent-seguranca-600" />
                        Incluir reboco nos dois lados (cimento, cal e areia)
                      </label>
                    </>
                  )}
                  {mode === 'contrapiso' && (
                    <div>
                      <label htmlFor="calc-esp" className="label">Espessura: {espessura} cm</label>
                      <input id="calc-esp" type="range" min={3} max={10} value={espessura} onChange={(e) => setEspessura(Number(e.target.value))} className="w-full accent-seguranca-600" />
                    </div>
                  )}
                  {mode === 'piso' && (
                    <fieldset>
                      <legend className="label">Revestimento</legend>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={pill(tipoPiso === 'porcelanato')} aria-pressed={tipoPiso === 'porcelanato'} onClick={() => setTipoPiso('porcelanato')}>Porcelanato 60×60</button>
                        <button type="button" className={pill(tipoPiso === 'ceramico')} aria-pressed={tipoPiso === 'ceramico'} onClick={() => setTipoPiso('ceramico')}>Cerâmico 45×45</button>
                      </div>
                    </fieldset>
                  )}
                  {mode === 'pintura' && (
                    <>
                      <fieldset>
                        <legend className="label">Demãos</legend>
                        <div className="flex gap-2">
                          {[1, 2, 3].map((d) => (
                            <button key={d} type="button" className={pill(demaos === d)} aria-pressed={demaos === d} onClick={() => setDemaos(d)}>{d} demão{d > 1 ? 's' : ''}</button>
                          ))}
                        </div>
                      </fieldset>
                      <label className="flex items-center gap-3 text-sm font-semibold text-cimento-800">
                        <input type="checkbox" checked={massa} onChange={(e) => setMassa(e.target.checked)} className="h-5 w-5 accent-seguranca-600" />
                        Incluir massa corrida
                      </label>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
              <ul className="space-y-1 border-t border-cimento-200 pt-4 text-xs text-cimento-700">
                {result.notes.map((n) => <li key={n}>• {n}</li>)}
                <li>• Estimativa com coeficientes médios. Confirme com o responsável técnico da obra.</li>
              </ul>
            </div>
          </div>

          {/* Resultado */}
          <div className="card flex flex-col overflow-hidden" aria-live="polite">
            <div className="bg-petroleo-900 px-5 py-4 sm:px-7">
              <p className="text-sm font-semibold text-petroleo-100">Você vai precisar de</p>
            </div>
            <ul className="flex-1 divide-y divide-cimento-100 px-5 sm:px-7">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.li key={`${mode}-${l.sku}`} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-4 py-3.5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cimento-100">
                      {l.product.images[0] && <Image src={l.product.images[0].url} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-extrabold text-petroleo-950">
                        <AnimatedNumber value={l.quantity} format={(v) => formatQty(Math.round(v * 2) / 2, l.product.unit)} />
                      </p>
                      <p className="truncate text-sm text-cimento-800">{l.product.name}</p>
                      <p className="text-xs text-cimento-600">{l.reason}</p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-bold text-petroleo-900">{formatBRL(effectivePrice(l.product) * l.quantity)}</p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="flex flex-col gap-3 border-t border-cimento-200 bg-cimento-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-xs text-cimento-700">Total estimado</p>
                <AnimatedNumber value={total} format={formatBRL} className="font-display text-2xl font-extrabold text-petroleo-950" />
              </div>
              <button type="button" onClick={addAll} disabled={!lines.length} className="btn-primary">
                <ShoppingCart className="h-4 w-4" aria-hidden /> {added ? 'Adicionado!' : 'Adicionar tudo ao carrinho'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
