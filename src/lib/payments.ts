import 'server-only';
import { randomUUID } from 'node:crypto';
import { site } from '@/config/site';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Order, Payment } from '@/types';
import { createPayment, isMercadoPagoConfigured, orderStatusFromPayment, splitName, type MpPayment, type MpPaymentRequest } from './mercadopago';
import { notifyOrderStatus } from './notifications';
import { getOrderById, getOrderByToken, OrderError } from './orders';
import { formatOrderNumber, maxInstallments } from './utils';
import type { PaymentInput } from './validators';

const PIX_EXPIRATION_MIN = 60 * 24; // 24h
const BOLETO_EXPIRATION_DAYS = 3;

export const isSimulatedPayments = () => !isMercadoPagoConfigured() && process.env.NODE_ENV !== 'production';

function payerFrom(order: Order, withAddress: boolean): MpPaymentRequest['payer'] {
  const c = order.customer_snapshot;
  const a = order.shipping_address;
  return {
    email: c.email,
    ...splitName(c.person_type === 'PJ' && c.company_name ? c.company_name : c.name),
    ...(c.document ? { identification: { type: c.person_type === 'PJ' ? 'CNPJ' : 'CPF', number: c.document } } : {}),
    ...(withAddress && a
      ? { address: { zip_code: a.cep, street_name: a.street, street_number: a.number, neighborhood: a.district, city: a.city, federal_unit: a.state } }
      : {}),
  };
}

/** Aplica o resultado do gateway ao pedido (idempotente: nunca "regride" um pedido já pago). */
export async function applyPaymentStatus(orderId: string, mp: Pick<MpPayment, 'id' | 'status' | 'status_detail'>) {
  const db = getSupabaseAdmin();
  await db.from('payments').update({ status: mp.status, status_detail: mp.status_detail }).eq('provider_payment_id', String(mp.id));

  const next = orderStatusFromPayment(mp.status);
  if (!next) return;
  const { data: updated } = await db
    .from('orders')
    .update({ status: next })
    .eq('id', orderId)
    .eq('status', 'aguardando_pagamento')
    .select('id');
  if (updated?.length) {
    const order = await getOrderById(orderId);
    if (order) notifyOrderStatus(order).catch((e) => console.error('[notify]', e));
  }
}

export async function startPayment(input: PaymentInput): Promise<Payment> {
  const order = await getOrderByToken(input.orderToken);
  if (!order) throw new OrderError('Pedido não encontrado.', 404);
  if (order.status !== 'aguardando_pagamento') throw new OrderError('Este pedido não está mais aguardando pagamento.', 409);

  // Reaproveita Pix/boleto pendente e ainda válido (evita gerar várias cobranças)
  const reusable = order.payments?.find(
    (p) => p.method === input.method && p.method !== 'cartao' && p.status === 'pending' && (!p.expires_at || new Date(p.expires_at).getTime() > Date.now() + 60_000),
  );
  if (reusable) return reusable;

  const db = getSupabaseAdmin();
  const description = `Pedido ${formatOrderNumber(order.number)} — ${site.name}`;
  let mp: MpPayment;
  let provider = 'mercadopago';

  if (isSimulatedPayments()) {
    // Desenvolvimento sem credenciais do Mercado Pago: cobrança simulada (ver /api/pagamentos/simular)
    provider = 'simulado';
    mp = {
      id: Date.now(),
      status: 'pending',
      status_detail: 'simulated',
      external_reference: order.id,
      transaction_amount: order.total,
      installments: input.method === 'cartao' ? input.installments : 1,
      payment_method_id: input.method,
      date_of_expiration: new Date(Date.now() + PIX_EXPIRATION_MIN * 60_000).toISOString(),
      point_of_interaction: { transaction_data: { qr_code: `00020126SIMULADO-${order.public_token}5204000053039865802BR`, qr_code_base64: '' } },
      transaction_details: { external_resource_url: `${site.url}/pedido/${order.public_token}?boleto=simulado`, digitable_line: '00190.00009 01234.567890 12345.678901 1 99990000010000' },
    };
  } else {
    if (!isMercadoPagoConfigured()) throw new OrderError('Pagamentos indisponíveis no momento.', 503);
    const base: MpPaymentRequest = {
      transaction_amount: order.total,
      description,
      external_reference: order.id,
      notification_url: `${site.url}/api/webhooks/mercadopago`,
      statement_descriptor: 'EMICHELIN',
      payment_method_id: 'pix',
      payer: payerFrom(order, input.method === 'boleto'),
      metadata: { order_number: order.number },
    };
    if (input.method === 'pix') {
      base.date_of_expiration = new Date(Date.now() + PIX_EXPIRATION_MIN * 60_000).toISOString();
    } else if (input.method === 'boleto') {
      base.payment_method_id = 'bolbradesco';
      base.date_of_expiration = new Date(Date.now() + BOLETO_EXPIRATION_DAYS * 86_400_000).toISOString();
    } else {
      const allowed = maxInstallments(order.total, site.maxInstallments, site.minInstallmentValue);
      if (input.installments > allowed) throw new OrderError(`Parcelamento máximo para este pedido: ${allowed}x.`);
      Object.assign(base, {
        payment_method_id: input.paymentMethodId,
        token: input.token,
        installments: input.installments,
        issuer_id: input.issuerId,
        payer: { ...base.payer, email: input.payer.email, identification: input.payer.identification ?? base.payer.identification },
      });
    }
    try {
      mp = await createPayment(base, `${order.id}:${input.method}:${randomUUID()}`);
    } catch (e) {
      console.error('[mercadopago]', e);
      throw new OrderError('Não foi possível processar o pagamento. Verifique os dados ou tente outra forma de pagamento.', 402);
    }
  }

  const tx = mp.point_of_interaction?.transaction_data;
  const { data: row, error } = await db
    .from('payments')
    .insert({
      order_id: order.id,
      provider,
      provider_payment_id: String(mp.id),
      method: input.method,
      status: mp.status,
      status_detail: mp.status_detail,
      amount: order.total,
      installments: mp.installments ?? 1,
      pix_qr_code: tx?.qr_code ?? null,
      pix_qr_code_base64: tx?.qr_code_base64 ?? null,
      boleto_url: mp.transaction_details?.external_resource_url ?? null,
      boleto_barcode: mp.transaction_details?.digitable_line ?? mp.barcode?.content ?? null,
      expires_at: mp.date_of_expiration,
      raw: { id: mp.id, status: mp.status, status_detail: mp.status_detail, payment_method_id: mp.payment_method_id },
    })
    .select('*')
    .single();
  if (error) throw error;

  await db.from('orders').update({ payment_method: input.method }).eq('id', order.id);
  if (mp.status === 'approved') await applyPaymentStatus(order.id, mp);

  return { ...(row as Payment), amount: Number(row.amount) };
}
