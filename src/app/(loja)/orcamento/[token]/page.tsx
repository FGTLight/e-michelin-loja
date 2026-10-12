import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { site, whatsappLink } from '@/config/site';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { formatBRL, formatDate } from '@/lib/utils';
import type { SaleUnit } from '@/types';
import { formatQty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Seu orçamento', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function QuoteView({ params }: { params: { token: string } }) {
  if (!isSupabaseConfigured() || !z.string().uuid().safeParse(params.token).success) notFound();
  const { data: q } = await getSupabaseAdmin()
    .from('quotes')
    .select('*, quote_items(*), order:orders!quotes_converted_order_id_fkey(public_token)')
    .eq('public_token', params.token)
    .maybeSingle();
  if (!q) notFound();

  const answered = ['respondido', 'convertido'].includes(q.status);
  const items = (q.quote_items ?? []) as { id: string; description: string; quantity: number; unit: SaleUnit; unit_price: number | null }[];
  const subtotal = items.reduce((s, i) => s + Number(i.unit_price ?? 0) * Number(i.quantity), 0);
  const expired = q.valid_until && new Date(`${q.valid_until}T23:59:59-03:00`).getTime() < Date.now();

  return (
    <div className="container max-w-3xl py-10">
      <p className="eyebrow">Orçamento #{q.number}</p>
      <h1 className="mt-1 text-3xl">{answered ? 'Seu orçamento está pronto' : 'Recebemos sua solicitação'}</h1>
      <p className="mt-2 text-cimento-700">Solicitado em {formatDate(q.created_at, true)} por {q.company_name ?? q.name}.</p>

      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cimento-50 text-left text-xs uppercase tracking-wider text-cimento-700">
            <tr><th className="p-3">Item</th><th className="p-3">Qtd.</th>{answered && <><th className="p-3 text-right">Unitário</th><th className="p-3 text-right">Total</th></>}</tr>
          </thead>
          <tbody className="divide-y divide-cimento-100">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="p-3 font-semibold text-petroleo-950">{i.description}</td>
                <td className="p-3">{formatQty(Number(i.quantity), i.unit)}</td>
                {answered && <><td className="p-3 text-right">{formatBRL(Number(i.unit_price ?? 0))}</td><td className="p-3 text-right font-bold">{formatBRL(Number(i.unit_price ?? 0) * Number(i.quantity))}</td></>}
              </tr>
            ))}
          </tbody>
        </table>
        {answered && (
          <dl className="space-y-1 border-t border-cimento-200 p-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(subtotal)}</dd></div>
            {Number(q.discount) > 0 && <div className="flex justify-between text-emerald-800"><dt>Desconto</dt><dd>− {formatBRL(Number(q.discount))}</dd></div>}
            <div className="flex justify-between"><dt>Frete</dt><dd>{Number(q.shipping_cost) ? formatBRL(Number(q.shipping_cost)) : 'Grátis / retirada'}</dd></div>
            <div className="flex justify-between pt-2 text-lg font-bold"><dt>Total</dt><dd>{formatBRL(Number(q.total ?? 0))}</dd></div>
            {q.valid_until && <p className={expired ? 'pt-2 font-semibold text-red-700' : 'pt-2 text-cimento-700'}>{expired ? 'Orçamento expirado em' : 'Válido até'} {q.valid_until.split('-').reverse().join('/')}</p>}
          </dl>
        )}
      </div>
      {q.response_message && <p className="card mt-4 p-5 text-cimento-800">{q.response_message}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        {q.order?.public_token && <Link href={`/pedido/${q.order.public_token}`} className="btn-primary">Pagar pedido</Link>}
        {answered && !q.order && !expired && (
          <a className="btn-primary" href={whatsappLink(`Olá! Quero aprovar o orçamento #${q.number}.`)} target="_blank" rel="noopener noreferrer">Aprovar pelo WhatsApp</a>
        )}
        <a className="btn-outline" href={`tel:${site.phoneE164}`}>Ligar {site.phone}</a>
      </div>
    </div>
  );
}
