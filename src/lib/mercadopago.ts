import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Integração com a API de Pagamentos do Mercado Pago (v1/payments) via REST.
 * - Pix: retorna QR Code (base64) e código copia e cola.
 * - Boleto: retorna URL do boleto e linha digitável.
 * - Cartão: o token é gerado no navegador pelo Card Payment Brick (dados do cartão nunca passam pelo servidor).
 * Docs: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
 */

const API = 'https://api.mercadopago.com';

export const isMercadoPagoConfigured = () => Boolean(process.env.MP_ACCESS_TOKEN);

export interface MpPayer {
  email: string;
  first_name?: string;
  last_name?: string;
  identification?: { type: 'CPF' | 'CNPJ' | string; number: string };
  address?: { zip_code: string; street_name: string; street_number: string; neighborhood: string; city: string; federal_unit: string };
}

export interface MpPaymentRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  external_reference: string;
  payer: MpPayer;
  installments?: number;
  token?: string;
  issuer_id?: string | number;
  date_of_expiration?: string;
  notification_url?: string;
  statement_descriptor?: string;
  metadata?: Record<string, unknown>;
}

export interface MpPayment {
  id: number;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  installments: number;
  payment_method_id: string;
  date_of_expiration: string | null;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } };
  transaction_details?: { external_resource_url?: string; barcode?: { content?: string }; digitable_line?: string };
  barcode?: { content?: string };
}

async function mp<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.idempotencyKey ? { 'X-Idempotency-Key': init.idempotencyKey } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { message?: string }).message ?? res.statusText;
    throw new Error(`Mercado Pago ${res.status}: ${msg}`);
  }
  return body as T;
}

export const createPayment = (req: MpPaymentRequest, idempotencyKey: string) =>
  mp<MpPayment>('/v1/payments', { method: 'POST', body: JSON.stringify(req), idempotencyKey });

export const getPayment = (id: string | number) => mp<MpPayment>(`/v1/payments/${id}`);

/**
 * Verifica a assinatura `x-signature` dos webhooks.
 * Manifesto: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` assinado com HMAC-SHA256 (MP_WEBHOOK_SECRET).
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export function verifyWebhookSignature(params: { xSignature: string | null; xRequestId: string | null; dataId: string | null }) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !params.xSignature || !params.dataId) return false;

  const parts = Object.fromEntries(
    params.xSignature.split(',').map((p) => {
      const [k, ...v] = p.trim().split('=');
      return [k, v.join('=')];
    }),
  ) as { ts?: string; v1?: string };
  if (!parts.ts || !parts.v1) return false;

  // Rejeita notificações muito antigas (replay) — tolerância de 10 minutos
  const tsMs = parts.ts.length > 10 ? Number(parts.ts) : Number(parts.ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 10 * 60 * 1000) return false;

  const id = /^[a-z0-9]+$/i.test(params.dataId) ? params.dataId.toLowerCase() : params.dataId;
  let manifest = `id:${id};`;
  if (params.xRequestId) manifest += `request-id:${params.xRequestId};`;
  manifest += `ts:${parts.ts};`;

  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(parts.v1, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Mapeia o status do pagamento para o status do pedido */
export function orderStatusFromPayment(status: MpPayment['status']) {
  if (status === 'approved') return 'pago' as const;
  // Cartão recusado não cancela o pedido: o cliente pode tentar de novo.
  if (status === 'cancelled' || status === 'refunded' || status === 'charged_back') return 'cancelado' as const;
  return null;
}

export function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first_name: parts[0] ?? '', last_name: parts.slice(1).join(' ') || parts[0] || '' };
}
