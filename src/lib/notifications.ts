import 'server-only';
import { Resend } from 'resend';
import { site, whatsappLink } from '@/config/site';
import type { Order, OrderStatus } from '@/types';
import { formatBRL, formatOrderNumber, formatQty, statusLabelFor } from './utils';

/**
 * Notificações transacionais.
 * - E-mail: Resend (RESEND_API_KEY + EMAIL_FROM com domínio verificado).
 * - WhatsApp: WhatsApp Cloud API (WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID). Fora da janela de 24h a Meta
 *   exige templates aprovados — configure WHATSAPP_TEMPLATE_* se for o caso (ver README).
 * Falhas de notificação nunca derrubam a operação principal: são registradas no log.
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? `${site.name} <pedidos@emichelin.com.br>`;
const STORE_INBOX = process.env.STORE_NOTIFICATION_EMAIL ?? site.email;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f7f6f4;font-family:Arial,Helvetica,sans-serif;color:#252321">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#123848;padding:20px 28px;color:#fff;font-size:20px;font-weight:bold">${site.name}
      <div style="height:4px;width:56px;background:#ff7210;margin-top:10px;border-radius:2px"></div></td></tr>
    <tr><td style="padding:28px"><h1 style="font-size:22px;margin:0 0 16px;color:#123848">${esc(title)}</h1>${body}</td></tr>
    <tr><td style="background:#eceae6;padding:18px 28px;font-size:12px;color:#5c5851">
      ${site.name} · ${site.address.full}<br>Tel. ${site.phone} · CNPJ ${site.cnpj}<br>
      Você tem até 7 dias após o recebimento para desistir da compra (art. 49 do CDC).</td></tr>
  </table></td></tr></table></body></html>`;
}

async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!resend) {
    console.info(`[email:dev] → ${to} | ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error('[email] falha ao enviar', e);
  }
}

export async function sendWhatsApp(toE164Digits: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.info(`[whatsapp:dev] → ${toE164Digits}: ${text.slice(0, 80)}…`);
    return;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: toE164Digits, type: 'text', text: { body: text } }),
    });
    if (!res.ok) console.error('[whatsapp] falha', res.status, await res.text());
  } catch (e) {
    console.error('[whatsapp] falha', e);
  }
}

const toBR = (phone: string) => (phone.startsWith('55') ? phone : `55${phone}`);

function itemsTable(order: Order) {
  const rows = (order.order_items ?? [])
    .map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eceae6">${esc(i.name)}<br><small style="color:#716c63">${formatQty(i.quantity, i.unit)} × ${formatBRL(i.unit_price)}</small></td>
      <td align="right" style="padding:6px 0;border-bottom:1px solid #eceae6">${formatBRL(i.total)}</td></tr>`)
    .join('');
  return `<table width="100%" style="border-collapse:collapse;font-size:14px">${rows}
    <tr><td style="padding-top:10px">Subtotal</td><td align="right" style="padding-top:10px">${formatBRL(order.subtotal)}</td></tr>
    ${order.discount ? `<tr><td>Desconto</td><td align="right">− ${formatBRL(order.discount)}</td></tr>` : ''}
    <tr><td>${order.delivery_method === 'retirada' ? 'Retirada na loja' : 'Frete'}</td><td align="right">${order.shipping_cost ? formatBRL(order.shipping_cost) : 'Grátis'}</td></tr>
    <tr><td style="font-weight:bold;font-size:16px;padding-top:6px">Total</td><td align="right" style="font-weight:bold;font-size:16px;padding-top:6px">${formatBRL(order.total)}</td></tr></table>`;
}

const orderUrl = (order: Pick<Order, 'public_token'>) => `${site.url}/pedido/${order.public_token}`;
const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#ff7210;color:#0a2530;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;display:inline-block">${label}</a></p>`;

export async function notifyOrderCreated(order: Order) {
  const n = formatOrderNumber(order.number);
  const c = order.customer_snapshot;
  await Promise.all([
    sendEmail(c.email, `Recebemos seu pedido ${n}`, layout(`Pedido ${n} recebido!`, `
      <p>Olá, ${esc(c.name.split(' ')[0])}! Recebemos seu pedido e ele está <b>aguardando pagamento</b>.</p>
      ${itemsTable(order)}${button(orderUrl(order), 'Acompanhar pedido')}`)),
    sendEmail(STORE_INBOX, `Novo pedido ${n} — ${formatBRL(order.total)}`, layout(`Novo pedido ${n}`, `
      <p><b>${esc(c.name)}</b> · ${esc(c.email)} · ${esc(c.phone)}<br>${order.delivery_method === 'retirada' ? 'Retirada na loja' : `Entrega em ${esc(order.shipping_address?.city ?? '')}`}</p>
      ${itemsTable(order)}${button(`${site.url}/admin/pedidos/${order.id}`, 'Abrir no painel')}`)),
  ]);
}

const statusMessages: Partial<Record<OrderStatus, string>> = {
  pago: 'Pagamento confirmado! Já vamos separar seus produtos.',
  em_separacao: 'Seu pedido está sendo separado no nosso depósito.',
  saiu_para_entrega: 'Seu pedido saiu para entrega e chega em breve.',
  entregue: 'Pedido entregue. Obrigado pela preferência!',
  cancelado: 'Seu pedido foi cancelado. Se tiver dúvidas, fale com a gente.',
};

export async function notifyOrderStatus(order: Order, note?: string) {
  const n = formatOrderNumber(order.number);
  const label = statusLabelFor(order.status, order.delivery_method);
  const msg =
    order.delivery_method === 'retirada' && order.status === 'saiu_para_entrega'
      ? `Seu pedido está pronto para retirada em ${site.address.street}, ${site.address.district}.`
      : (statusMessages[order.status] ?? '');
  const c = order.customer_snapshot;
  await Promise.all([
    sendEmail(c.email, `Pedido ${n}: ${label}`, layout(`Pedido ${n}: ${label}`, `
      <p>${esc(msg)}</p>${note ? `<p style="background:#f7f6f4;padding:12px;border-radius:8px">${esc(note)}</p>` : ''}
      ${button(orderUrl(order), 'Ver detalhes do pedido')}`)),
    sendWhatsApp(toBR(c.phone), `*${site.name}* — Pedido ${n}\n${label}. ${msg}${note ? `\n${note}` : ''}\n${orderUrl(order)}`),
  ]);
}

export async function notifyQuoteReceived(quote: { number: number; name: string; email: string; phone: string; city?: string | null; items: { description: string; quantity: number; unit: string }[]; project_description?: string | null; id: string }) {
  const list = quote.items.map((i) => `<li>${esc(i.description)} — ${i.quantity} ${i.unit}</li>`).join('');
  const text = `Novo orçamento #${quote.number} de ${quote.name} (${quote.phone}${quote.city ? `, ${quote.city}` : ''}) com ${quote.items.length} itens.`;
  await Promise.all([
    sendEmail(quote.email, `Recebemos sua solicitação de orçamento #${quote.number}`, layout('Orçamento recebido!', `
      <p>Olá, ${esc(quote.name.split(' ')[0])}! Nossa equipe vai analisar sua lista e responder em até 1 dia útil.</p><ul>${list}</ul>`)),
    sendEmail(STORE_INBOX, `Novo orçamento #${quote.number} — ${quote.name}`, layout(`Orçamento #${quote.number}`, `
      <p>${esc(text)}</p>${quote.project_description ? `<p><i>${esc(quote.project_description)}</i></p>` : ''}<ul>${list}</ul>
      ${button(`${site.url}/admin/orcamentos/${quote.id}`, 'Responder no painel')}
      <p><a href="${whatsappLink()}">WhatsApp da loja</a></p>`)),
    process.env.STORE_WHATSAPP_NOTIFY ? sendWhatsApp(process.env.STORE_WHATSAPP_NOTIFY, text) : Promise.resolve(),
  ]);
}

export async function notifyQuoteAnswered(quote: { number: number; name: string; email: string; phone: string; total: number; valid_until: string; response_message?: string | null; public_token: string }, orderToken?: string) {
  const link = orderToken ? `${site.url}/pedido/${orderToken}` : `${site.url}/orcamento/${quote.public_token}`;
  const body = `<p>Olá, ${esc(quote.name.split(' ')[0])}! Seu orçamento #${quote.number} está pronto.</p>
    <p style="font-size:20px"><b>Total: ${formatBRL(quote.total)}</b><br><small>Válido até ${quote.valid_until.split('-').reverse().join('/')}</small></p>
    ${quote.response_message ? `<p>${esc(quote.response_message)}</p>` : ''}${button(link, orderToken ? 'Pagar pedido' : 'Ver orçamento')}`;
  await Promise.all([
    sendEmail(quote.email, `Seu orçamento #${quote.number} — ${formatBRL(quote.total)}`, layout('Seu orçamento está pronto', body)),
    sendWhatsApp(toBR(quote.phone), `*${site.name}* — Orçamento #${quote.number}: ${formatBRL(quote.total)} (válido até ${quote.valid_until.split('-').reverse().join('/')}).\n${link}`),
  ]);
}
