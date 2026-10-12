import { Clock, Facebook, Instagram, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { site, whatsappLink } from '@/config/site';
import type { Category } from '@/types';
import { Logo } from './Logo';

const payments = ['Pix', 'Visa', 'Mastercard', 'Elo', 'Hipercard', 'Amex', 'Boleto'];

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-24 bg-petroleo-950 text-petroleo-100">
      <div className="hazard h-2" aria-hidden />
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-petroleo-200">
            Materiais de construção, hidráulica, elétrica, ferramentas e tintas para a sua obra em Erechim e região.
          </p>
          <div className="mt-5 flex gap-2">
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-lg bg-white/10 p-2.5 transition hover:bg-seguranca-500 hover:text-petroleo-950">
              <Instagram className="h-5 w-5" />
            </a>
            <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-lg bg-white/10 p-2.5 transition hover:bg-seguranca-500 hover:text-petroleo-950">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>

        <nav aria-label="Categorias">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">Categorias</h2>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/produtos?categoria=${c.slug}`} className="hover:text-seguranca-300">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Institucional">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">Ajuda</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/conta" className="hover:text-seguranca-300">Minha conta e pedidos</Link></li>
            <li><Link href="/orcamento" className="hover:text-seguranca-300">Pedir orçamento</Link></li>
            <li><Link href="/politicas/trocas-e-devolucoes" className="hover:text-seguranca-300">Trocas e devoluções</Link></li>
            <li><Link href="/politicas/entrega" className="hover:text-seguranca-300">Entrega e retirada</Link></li>
            <li><Link href="/politicas/privacidade" className="hover:text-seguranca-300">Privacidade (LGPD)</Link></li>
            <li><Link href="/politicas/termos" className="hover:text-seguranca-300">Termos de uso</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">Loja</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-seguranca-400" aria-hidden />{site.address.full}</li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-seguranca-400" aria-hidden /><a href={`tel:${site.phoneE164}`} className="hover:text-seguranca-300">{site.phone}</a> · <a href={whatsappLink()} className="hover:text-seguranca-300">WhatsApp</a></li>
            <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-seguranca-400" aria-hidden />
              <span>{site.hours.map((h) => <span key={h.days} className="block">{h.days}: {h.time}</span>)}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-4 py-6 text-xs text-petroleo-200 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 font-semibold text-white">Formas de pagamento</p>
            <ul className="flex flex-wrap gap-1.5" aria-label="Formas de pagamento aceitas">
              {payments.map((p) => (
                <li key={p} className="rounded bg-white px-2 py-1 font-bold text-petroleo-950">{p}</li>
              ))}
              <li className="rounded bg-seguranca-500 px-2 py-1 font-bold text-petroleo-950">até {site.maxInstallments}x sem juros</li>
            </ul>
          </div>
          <p className="max-w-xl leading-relaxed lg:text-right">
            {site.legalName} · CNPJ {site.cnpj} · {site.address.full}. Preços e condições válidos para compras no site,
            sujeitos à disponibilidade de estoque. Direito de arrependimento de 7 dias conforme art. 49 do Código de Defesa do Consumidor.
          </p>
        </div>
      </div>
    </footer>
  );
}
