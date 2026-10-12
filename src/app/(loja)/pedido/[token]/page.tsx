import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { OrderSummary } from '@/components/account/OrderSummary';
import { OrderTimeline } from '@/components/account/OrderTimeline';
import { PaymentPanel } from '@/components/checkout/PaymentPanel';
import { site, whatsappLink } from '@/config/site';
import { getOrderByToken } from '@/lib/orders';
import { isSimulatedPayments } from '@/lib/payments';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { formatDate, formatOrderNumber, statusLabelFor, withdrawalDaysLeft } from '@/lib/utils';
import type { PaymentMethod } from '@/types';

export const metadata: Metadata = { title: 'Acompanhar pedido', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function OrderPage({ params, searchParams }: { params: { token: string }; searchParams: { metodo?: string } }) {
  if (!isSupabaseConfigured() || !z.string().uuid().safeParse(params.token).success) notFound();
  const order = await getOrderByToken(params.token);
  if (!order) notFound();

  const n = formatOrderNumber(order.number);
  const waiting = order.status === 'aguardando_pagamento';
  const method = (['pix', 'cartao', 'boleto'].includes(searchParams.metodo ?? '') ? searchParams.metodo : order.payment_method ?? 'pix') as PaymentMethod;
  const lastPayment = order.payments?.[0] ?? null;
  const daysLeft = withdrawalDaysLeft(order.delivered_at);

  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Pedido {n}</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl">
            {!waiting && order.status !== 'cancelado' && <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />}
            {waiting ? 'Falta pouco! Conclua o pagamento' : statusLabelFor(order.status, order.delivery_method)}
          </h1>
          <p className="mt-1 text-sm text-cimento-700">Feito em {formatDate(order.created_at, true)} · enviamos os detalhes para {order.customer_snapshot.email}</p>
        </div>
        <a href={whatsappLink(`Olá! Tenho uma dúvida sobre o pedido ${n}.`)} target="_blank" rel="noopener noreferrer" className="btn-outline">Dúvidas? WhatsApp</a>
      </header>

      <div className="card mb-6 p-5 sm:p-8">
        <OrderTimeline order={order} />
      </div>

      {waiting && (
        <div className="mb-6">
          <PaymentPanel
            token={order.public_token}
            total={order.total}
            email={order.customer_snapshot.email}
            initialMethod={method}
            existing={lastPayment}
            publicKey={process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? null}
            simulated={isSimulatedPayments()}
          />
        </div>
      )}

      <OrderSummary order={order} />

      {order.status === 'entregue' && daysLeft !== null && daysLeft > 0 && (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-petroleo-50 p-4 text-sm text-petroleo-900">
          <RotateCcw className="h-5 w-5" aria-hidden />
          Você ainda tem {daysLeft} dia(s) para exercer o direito de arrependimento (art. 49 do CDC).{' '}
          <Link href="/politicas/trocas-e-devolucoes" className="font-semibold underline">Saiba como</Link>
        </p>
      )}
      <p className="mt-8 text-center text-xs text-cimento-600">
        Guarde este link para acompanhar seu pedido. {site.name} · {site.phone}
      </p>
    </div>
  );
}
