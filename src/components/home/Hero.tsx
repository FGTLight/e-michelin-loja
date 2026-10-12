'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ClipboardList, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const stages = [
  { label: 'Fundação', href: '/produtos?categoria=cimento-e-argamassa' },
  { label: 'Paredes', href: '/produtos?categoria=cimento-e-argamassa' },
  { label: 'Hidráulica e elétrica', href: '/produtos?categoria=hidraulica' },
  { label: 'Telhado', href: '/produtos?categoria=telhas' },
];

/**
 * Hero: uma casa que "se constrói" por camadas conforme o scroll
 * (fundação → paredes → tubulações → telhado), com GSAP + ScrollTrigger (scrub + pin).
 * Com prefers-reduced-motion a casa aparece pronta e não há pin.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(3);
  const [animated, setAnimated] = useState(false);

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        setAnimated(true);
        setStage(0);

        const isMobile = window.matchMedia('(max-width: 1023px)').matches;
        // Fixa o hero logo abaixo do header sticky (a barra superior do header recolhe ao rolar)
        const headerOffset = () => {
          const header = document.querySelector('header');
          const topBar = document.getElementById('header-topbar');
          return (header?.offsetHeight ?? 0) - (topBar?.offsetHeight ?? 0);
        };
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: section.current,
            start: () => `top ${headerOffset()}px`,
            invalidateOnRefresh: true,
            end: isMobile ? '+=120%' : '+=170%',
            scrub: 0.8,
            pin: true,
            anticipatePin: 1,
          },
        });

        tl.addLabel('fundacao')
          .from('.h-footing', { scaleY: 0, autoAlpha: 0, transformOrigin: '50% 0%', stagger: 0.06, duration: 0.4 })
          .from('.h-slab', { scaleX: 0, autoAlpha: 0, transformOrigin: '0% 50%', duration: 0.5 }, '-=0.2')
          .addLabel('paredes')
          .from('.h-row', { scaleY: 0, autoAlpha: 0, transformOrigin: '50% 100%', stagger: 0.09, duration: 0.25 })
          .from('.h-opening', { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%', stagger: 0.1, duration: 0.3 })
          .addLabel('tubulacao')
          .fromTo(
            '.h-pipe',
            { autoAlpha: 1, strokeDashoffset: (_: number, el: SVGPathElement) => el.getTotalLength(), strokeDasharray: (_: number, el: SVGPathElement) => el.getTotalLength() },
            { strokeDashoffset: 0, stagger: 0.12, duration: 0.7, ease: 'none' },
          )
          .from('.h-fixture', { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%', stagger: 0.08, duration: 0.25, ease: 'back.out(3)' })
          .addLabel('telhado')
          .from('.h-chimney', { scaleY: 0, autoAlpha: 0, transformOrigin: '50% 100%', duration: 0.2 })
          .from('.h-roof', { y: -260, autoAlpha: 0, duration: 0.7, ease: 'bounce.out' }, '<')
          .from('.h-tile', { opacity: 0, x: -14, stagger: 0.05, duration: 0.2 })
          .from('.h-done', { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.35, ease: 'back.out(2.5)' })
          .to({}, { duration: 0.3 }); // respiro no fim antes de soltar o pin

        const marks = ['paredes', 'tubulacao', 'telhado'].map((l) => tl.labels[l]);
        let current = 0;
        tl.eventCallback('onUpdate', () => {
          const t = tl.time();
          const s = marks.filter((m) => t >= m).length;
          if (s !== current) {
            current = s;
            setStage(s);
          }
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        setAnimated(false);
        setStage(3);
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const years = new Date().getFullYear() - site.foundedYear;

  return (
    <section
      ref={section}
      className="relative overflow-hidden bg-petroleo-950 text-white"
      aria-labelledby="hero-title"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-petroleo-600/30 blur-3xl" aria-hidden />
      <div className="container relative grid min-h-[calc(100svh-150px)] items-center gap-8 py-10 lg:grid-cols-[1fr_1.1fr] lg:py-14">
        <div>
          <p style={{ animationDelay: '0ms' }} className="animate-rise eyebrow !text-seguranca-400">Há {years} anos construindo Erechim</p>
          <h1 id="hero-title" style={{ animationDelay: '80ms' }} className="animate-rise mt-3 text-balance text-4xl !text-white sm:text-5xl xl:text-6xl">
            Tudo para a sua obra, <span className="text-seguranca-400">da fundação ao telhado.</span>
          </h1>
          <p style={{ animationDelay: '160ms' }} className="animate-rise mt-5 max-w-xl text-base leading-relaxed text-petroleo-100 sm:text-lg">
            Cimento, hidráulica, elétrica, ferramentas e tintas com preço justo, estoque de verdade e entrega rápida em Erechim e região.
          </p>
          <div style={{ animationDelay: '240ms' }} className="animate-rise mt-8 flex flex-wrap gap-3">
            <Link href="/produtos" className="btn-primary px-6 py-3.5 text-base">
              Ver produtos <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link href="/orcamento" className="btn border-2 border-white/30 px-6 py-3.5 text-base text-white hover:border-white hover:bg-white hover:text-petroleo-950">
              <ClipboardList className="h-5 w-5" aria-hidden /> Pedir orçamento
            </Link>
          </div>
          <ul style={{ animationDelay: '320ms' }} className="animate-rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-petroleo-100">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-seguranca-400" aria-hidden /> Entrega em até 1 dia útil em Erechim</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-seguranca-400" aria-hidden /> Pix, cartão em até {site.maxInstallments}x e boleto</li>
          </ul>
        </div>

        <div className="relative">
          <HouseSvg />
          <ol className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2" aria-label="Etapas da obra">
            {stages.map((s, i) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className={cn(
                    'block rounded-lg border px-2 py-2 text-center text-[11px] font-bold transition-colors duration-300 sm:text-xs',
                    i <= stage ? 'border-seguranca-500 bg-seguranca-500 text-petroleo-950' : 'border-white/20 text-petroleo-200',
                  )}
                  aria-current={i === stage ? 'step' : undefined}
                >
                  <span className="mr-1 opacity-70">{i + 1}.</span>
                  {s.label}
                </Link>
              </li>
            ))}
          </ol>
          {animated && (
            <p className="mt-3 text-center text-xs text-petroleo-200" aria-hidden>
              Role a página para construir a casa ↓
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function HouseSvg() {
  const rows = Array.from({ length: 9 }, (_, i) => 390 - i * 20);
  return (
    <svg viewBox="0 0 600 500" className="h-auto w-full" role="img" aria-label="Ilustração de uma casa sendo construída em camadas: fundação, paredes, tubulações e telhado">
      <defs>
        <pattern id="bricks" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#b5643c" />
          <path d="M0 0H40M0 20H40M20 0V20M0 20V40M40 20V40" stroke="#e9d3c0" strokeWidth="2" />
        </pattern>
        <clipPath id="roofClip">
          <polygon points="70,240 300,104 530,240" />
        </clipPath>
      </defs>

      {/* Planta (blueprint) — sempre visível, a obra é construída por cima */}
      <g fill="none" stroke="rgba(255,255,255,.28)" strokeDasharray="6 6" strokeWidth="1.5">
        <polygon points="70,240 300,104 530,240" />
        <rect x="110" y="230" width="380" height="180" />
        <rect x="90" y="410" width="420" height="20" />
        <path d="M110 470h380M110 462v16M490 462v16" strokeDasharray="0" />
      </g>
      <text x="300" y="492" textAnchor="middle" fill="rgba(255,255,255,.45)" fontSize="12" fontFamily="monospace">9,50 m</text>

      {/* Solo */}
      <rect x="0" y="430" width="600" height="70" fill="rgba(255,255,255,.04)" />
      <path d="M0 430H600" stroke="rgba(255,255,255,.35)" strokeWidth="2" />

      {/* 1. Fundação */}
      {[100, 190, 280, 370, 460].map((x) => (
        <rect key={x} className="h-footing hero-layer" x={x} y="430" width="40" height="34" fill="#a29d92" />
      ))}
      <rect className="h-slab hero-layer" x="90" y="410" width="420" height="20" rx="2" fill="#c3bfb6" />

      {/* 2. Paredes (fiadas de tijolos) */}
      {rows.map((y) => (
        <rect key={y} className="h-row hero-layer" x="110" y={y} width="380" height="20" fill="url(#bricks)" />
      ))}
      <g className="h-opening hero-layer">
        <rect x="268" y="326" width="64" height="84" fill="#0a2530" stroke="#eceae6" strokeWidth="4" />
        <circle cx="320" cy="370" r="3.5" fill="#ff8a33" />
      </g>
      {[150, 380].map((x) => (
        <g key={x} className="h-opening hero-layer">
          <rect x={x} y="272" width="72" height="58" fill="#3f9bb2" stroke="#eceae6" strokeWidth="4" />
          <path d={`M${x + 36} 272v58M${x} 301h72`} stroke="#eceae6" strokeWidth="3" />
        </g>
      ))}

      {/* 3. Hidráulica (azul) e elétrica (laranja) */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="h-pipe hero-layer" d="M470 470V356H430V246" stroke="#78bfcf" strokeWidth="7" />
        <path className="h-pipe hero-layer" d="M200 350V470" stroke="#eceae6" strokeWidth="9" />
        <path className="h-pipe hero-layer" d="M124 244H250V300" stroke="#ff8a33" strokeWidth="5" />
        <path className="h-pipe hero-layer" d="M250 244H360V318" stroke="#ff8a33" strokeWidth="5" />
      </g>
      <circle className="h-fixture hero-layer" cx="430" cy="246" r="9" fill="#78bfcf" stroke="#0a2530" strokeWidth="3" />
      <rect className="h-fixture hero-layer" x="241" y="298" width="18" height="18" rx="3" fill="#ff8a33" stroke="#0a2530" strokeWidth="3" />
      <rect className="h-fixture hero-layer" x="351" y="316" width="18" height="18" rx="3" fill="#ff8a33" stroke="#0a2530" strokeWidth="3" />
      <rect className="h-fixture hero-layer" x="190" y="344" width="20" height="10" rx="2" fill="#eceae6" />

      {/* 4. Telhado */}
      <rect className="h-chimney hero-layer" x="405" y="128" width="30" height="70" fill="#5c5851" />
      <g className="h-roof hero-layer">
        <polygon points="70,240 300,104 530,240" fill="#98360e" />
        <g clipPath="url(#roofClip)" stroke="#c04307" strokeWidth="6">
          {[140, 168, 196, 224].map((y) => (
            <path key={y} className="h-tile" d={`M60 ${y}H540`} />
          ))}
        </g>
        <rect x="60" y="236" width="480" height="10" rx="3" fill="#eceae6" />
      </g>

      {/* Obra pronta */}
      <g className="h-done hero-layer">
        <circle cx="530" cy="110" r="34" fill="#ff7210" />
        <path d="M514 110l11 11 21-22" fill="none" stroke="#0a2530" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
