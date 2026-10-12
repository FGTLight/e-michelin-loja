'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, Clock, HardHat, Truck } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { site } from '@/config/site';

const perks = [
  { icon: Truck, title: 'Entrega rápida na região', text: 'Caminhão próprio: em até 1 dia útil em Erechim e até 3 dias nas cidades vizinhas.' },
  { icon: Clock, title: 'Retire em 2 horas', text: 'Compre online e retire no balcão, sem fila, no centro de Erechim.' },
  { icon: HardHat, title: 'Atendimento de quem entende', text: 'Equipe que conhece obra e ajuda a escolher o material certo.' },
  { icon: BadgeCheck, title: 'Marcas de confiança', text: 'Produtos certificados das principais fabricantes do país.' },
];

export function WhyUs() {
  const years = new Date().getFullYear() - site.foundedYear;
  const stats = [
    { value: years, suffix: '', label: 'anos de trajetória' },
    { value: site.stats.products, suffix: '+', label: 'itens em estoque' },
    { value: site.stats.customers, suffix: '+', label: 'clientes atendidos' },
    { value: site.deliveryRegion.length, suffix: '', label: 'cidades com entrega' },
  ];

  return (
    <section className="container py-16 sm:py-20" aria-labelledby="why-title">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <p className="eyebrow">Por que escolher a E Michelin</p>
          <h2 id="why-title" className="section-title mt-2">Tradição de balcão, agilidade de loja online</h2>
          <dl className="mt-8 grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border-l-4 border-seguranca-500 bg-white p-5 shadow-card">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-extrabold text-petroleo-950 sm:text-4xl">
                    <AnimatedNumber value={s.value} startOnView duration={1.8} />
                    {s.suffix}
                  </span>
                  <span className="mt-1 block text-sm text-cimento-700">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {perks.map((p, i) => (
            <motion.li
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-petroleo-900 p-6 text-white"
            >
              <p.icon className="h-9 w-9 text-seguranca-400" aria-hidden />
              <h3 className="mt-4 text-lg !text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-petroleo-100">{p.text}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
