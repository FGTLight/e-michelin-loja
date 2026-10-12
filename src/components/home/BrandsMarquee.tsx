import Image from 'next/image';
import Link from 'next/link';
import type { Brand } from '@/types';

/**
 * Marquee infinito de marcas (CSS puro: duplica a lista e translada -50%).
 * Pausa no hover/foco; parado com prefers-reduced-motion (regra global em globals.css).
 * Sem logo cadastrado, mostra o nome da marca como wordmark — envie os logos oficiais pelo painel.
 */
export function BrandsMarquee({ brands }: { brands: Brand[] }) {
  const list = [...brands, ...brands];
  return (
    <section className="border-y border-cimento-200 bg-white py-12" aria-labelledby="brands-title">
      <div className="container mb-6 text-center">
        <p className="eyebrow">Parceiros</p>
        <h2 id="brands-title" className="mt-1 text-xl sm:text-2xl">Marcas com que trabalhamos</h2>
      </div>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <ul className="flex w-max animate-marquee gap-4 group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]">
          {list.map((b, i) => (
            <li key={`${b.id}-${i}`} aria-hidden={i >= brands.length}>
              <Link
                href={`/produtos?marca=${b.slug}`}
                tabIndex={i >= brands.length ? -1 : undefined}
                className="flex h-16 min-w-40 items-center justify-center rounded-xl border border-cimento-200 px-6 grayscale transition hover:border-seguranca-400 hover:grayscale-0"
              >
                {b.logo_url ? (
                  <Image src={b.logo_url} alt={b.name} width={120} height={40} className="h-8 w-auto object-contain" />
                ) : (
                  <span className="font-display text-lg font-extrabold uppercase tracking-tight text-petroleo-800">{b.name}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
