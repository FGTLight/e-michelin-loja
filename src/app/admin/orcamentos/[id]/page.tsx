import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuoteResponder } from '@/components/admin/QuoteResponder';
import { getSupabaseServer } from '@/lib/supabase/server';
import { formatDate, maskPhone } from '@/lib/utils';
import type { SaleUnit } from '@/types';

export default async function AdminQuotePage({ params }: { params: { id: string } }) {
  const sb = getSupabaseServer();
  const { data: q } = await sb.from('quotes').select('*, quote_items(*, product:products(price, promo_price, promo_ends_at, stock))').eq('id', params.id).maybeSingle();
  if (!q) notFound();
  // Marca como "em análise" ao abrir pela primeira vez
  if (q.status === 'novo') await sb.from('quotes').update({ status: 'em_analise' }).eq('id', q.id);

  type Item = { id: string; description: string; sku: string | null; quantity: number; unit: SaleUnit; unit_price: number | null; product: { price: number; promo_price: number | null; promo_ends_at: string | null; stock: number } | null };
  const items = (q.quote_items as Item[]).map((i) => ({
    id: i.id,
    description: i.description,
    sku: i.sku,
    quantity: Number(i.quantity),
    unit: i.unit,
    stock: i.product ? Number(i.product.stock) : null,
    // Sugere o preço atual do catálogo quando ainda não foi precificado
    unit_price: i.unit_price != null ? Number(i.unit_price) : i.product ? Number(i.product.price) : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orcamentos" className="text-sm text-cimento-700 hover:underline">← Orçamentos</Link>
        <h1 className="text-2xl sm:text-3xl">Orçamento #{q.number}</h1>
        <p className="text-sm text-cimento-700">Recebido em {formatDate(q.created_at, true)} · status: <b>{q.status.replace('_', ' ')}</b></p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <QuoteResponder
          quoteId={q.id}
          status={q.status}
          items={items}
          initial={{
            discount: Number(q.discount ?? 0),
            shipping_cost: Number(q.shipping_cost ?? 0),
            valid_until: q.valid_until ?? new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
            response_message: q.response_message ?? '',
            admin_notes: q.admin_notes ?? '',
          }}
          convertedOrderId={q.converted_order_id}
        />
        <aside className="card h-fit space-y-2 p-5 text-sm">
          <h2 className="text-lg">Solicitante</h2>
          <p><b>{q.company_name ?? q.name}</b>{q.company_name && <><br />{q.name}</>}</p>
          <p>{q.email}<br />{maskPhone(q.phone)}</p>
          {q.document && <p>Documento: {q.document}</p>}
          {q.city && <p>Cidade da obra: {q.city}</p>}
          {q.project_description && <p className="rounded-lg bg-cimento-50 p-3 italic">{q.project_description}</p>}
          <a href={`https://wa.me/55${q.phone}`} target="_blank" rel="noopener noreferrer" className="btn mt-2 w-full bg-[#15803d] px-4 py-2 text-white hover:bg-[#166534]">WhatsApp</a>
        </aside>
      </div>
    </div>
  );
}
