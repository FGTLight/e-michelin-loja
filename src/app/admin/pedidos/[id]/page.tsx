import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderSummary } from '@/components/account/OrderSummary';
import { OrderTimeline } from '@/components/account/OrderTimeline';
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater';
import { normalizeOrder } from '@/lib/orders';
import { getSupabaseServer } from '@/lib/supabase/server';
import { formatBRL, formatDate, formatOrderNumber, maskCNPJ, maskCPF, maskPhone } from '@/lib/utils';

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const { data } = await getSupabaseServer()
    .from('orders')
    .select('*, order_items(*), order_status_history(status, note, created_at), payments(*)')
    .eq('id', params.id)
    .maybeSingle();
  if (!data) notFound();
  const order = normalizeOrder(data);
  const c = order.customer_snapshot;
  const n = formatOrderNumber(order.number);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/pedidos" className="text-sm text-cimento-700 hover:underline">← Pedidos</Link>
          <h1 className="text-2xl sm:text-3xl">Pedido {n}</h1>
          <p className="text-sm text-cimento-700">{formatDate(order.created_at, true)}</p>
        </div>
        <a
          href={`https://wa.me/55${c.phone}?text=${encodeURIComponent(`Olá, ${c.name.split(' ')[0]}! Aqui é da E Michelin e Cia, sobre o pedido ${n}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-[#15803d] px-4 py-2 text-white hover:bg-[#166534]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp do cliente
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="card p-5 sm:p-6"><OrderTimeline order={order} /></div>
          <OrderSummary order={order} />
        </div>
        <div className="space-y-6">
          <OrderStatusUpdater orderId={order.id} current={order.status} deliveryMethod={order.delivery_method} />
          <section className="card p-5 text-sm">
            <h2 className="text-lg">Cliente</h2>
            <dl className="mt-3 space-y-1.5">
              <div><dt className="inline text-cimento-600">Tipo: </dt><dd className="inline font-semibold">{c.person_type === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}</dd></div>
              {c.company_name && <div><dt className="inline text-cimento-600">Razão social: </dt><dd className="inline font-semibold">{c.company_name}</dd></div>}
              <div><dt className="inline text-cimento-600">{c.person_type === 'PJ' ? 'CNPJ' : 'CPF'}: </dt><dd className="inline font-semibold">{c.person_type === 'PJ' ? maskCNPJ(c.document) : maskCPF(c.document)}</dd></div>
              <div><dt className="inline text-cimento-600">Nome: </dt><dd className="inline">{c.name}</dd></div>
              <div><dt className="inline text-cimento-600">E-mail: </dt><dd className="inline">{c.email}</dd></div>
              <div><dt className="inline text-cimento-600">Telefone: </dt><dd className="inline">{maskPhone(c.phone)}</dd></div>
            </dl>
          </section>
          <section className="card p-5 text-sm">
            <h2 className="text-lg">Pagamentos</h2>
            {order.payments?.length ? (
              <ul className="mt-3 divide-y divide-cimento-100">
                {order.payments.map((p) => (
                  <li key={p.id} className="py-2">
                    <p className="font-semibold uppercase">{p.method} · {p.status}</p>
                    <p className="text-xs text-cimento-600">{formatBRL(p.amount)}{p.installments > 1 ? ` em ${p.installments}x` : ''} · MP #{p.provider_payment_id} · {formatDate(p.created_at, true)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-cimento-600">Nenhuma cobrança gerada.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
