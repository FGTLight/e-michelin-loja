import { ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { ProductCarousel } from '@/components/product/ProductCarousel';
import type { Banner, Product } from '@/types';
import { Countdown } from './Countdown';

export function WeeklyDeals({ products, banner }: { products: Product[]; banner?: Banner }) {
  if (!products.length) return null;
  const endsAt =
    banner?.ends_at ??
    products.map((p) => p.promo_ends_at).filter(Boolean).sort()[0] ??
    new Date(Date.now() + 3 * 86_400_000).toISOString();

  return (
    <section className="relative overflow-hidden bg-petroleo-900 py-16 sm:py-20" aria-labelledby="deals-title">
      <div className="hazard absolute inset-x-0 top-0 h-2" aria-hidden />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-seguranca-500/20 blur-3xl" aria-hidden />
      <div className="container relative">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow flex items-center gap-2 !text-seguranca-400">
              <Flame className="h-4 w-4" aria-hidden /> {banner?.title ?? 'Ofertas da semana'}
            </p>
            <h2 id="deals-title" className="section-title mt-2 !text-white">
              Preço de obra, só até domingo
            </h2>
            <p className="mt-2 max-w-xl text-petroleo-100">{banner?.subtitle ?? 'Descontos especiais em itens selecionados enquanto durarem os estoques.'}</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="text-xs font-bold uppercase tracking-wider text-petroleo-200">Termina em</p>
            <Countdown endsAt={endsAt} />
          </div>
        </div>
        <ProductCarousel products={products} label="Ofertas da semana" dark />
        <Link href={banner?.link_url ?? '/produtos?ofertas=1'} className="mt-4 inline-flex items-center gap-2 font-bold text-seguranca-300 hover:text-seguranca-200">
          {banner?.cta_label ?? 'Ver todas as ofertas'} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
