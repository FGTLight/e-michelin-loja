import 'server-only';
import type { z } from 'zod';
import { getDeliveryZones } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Order, OrderStatus, SaleUnit } from '@/types';
import { lookupCep, quoteShipping } from './shipping';
import { effectivePrice, normalizeQty, round2 } from './utils';
import type { checkoutSchema } from './validators';

export class OrderError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type DbProduct = {
  id: string; sku: string; name: string; unit: SaleUnit; price: number; promo_price: number | null; promo_ends_at: string | null;
  stock: number; min_qty: number; qty_step: number; weight_kg: number; is_active: boolean;
};

/** Recalcula preços SEMPRE a partir do banco — o preço enviado pelo navegador é ignorado. */
export async function priceCart(items: { productId: string; quantity: number }[]) {
  const db = getSupabaseAdmin();
  const ids = [...new Set(items.map((i) => i.productId))];
  const { data, error } = await db
    .from('products')
    .select('id, sku, name, unit, price, promo_price, promo_ends_at, stock, min_qty, qty_step, weight_kg, is_active')
    .in('id', ids);
  if (error) throw error;
  const products = new Map((data as DbProduct[]).map((p) => [p.id, { ...p, price: Number(p.price), promo_price: p.promo_price == null ? null : Number(p.promo_price), stock: Number(p.stock), min_qty: Number(p.min_qty), qty_step: Number(p.qty_step), weight_kg: Number(p.weight_kg) }]));

  const lines = items.map((i) => {
    const p = products.get(i.productId);
    if (!p || !p.is_active) throw new OrderError('Um dos produtos do carrinho não está mais disponível.');
    const quantity = normalizeQty(i.quantity, p.min_qty, p.qty_step);
    if (quantity > p.stock) throw new OrderError(`Estoque insuficiente para "${p.name}" (disponível: ${p.stock}).`, 409);
    const unitPrice = effectivePrice(p);
    return { product: p, quantity, unitPrice, total: round2(unitPrice * quantity) };
  });

  const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const weightKg = round2(lines.reduce((s, l) => s + l.product.weight_kg * l.quantity, 0));
  return { lines, subtotal, weightKg };
}

export async function validateCoupon(code: string, subtotal: number) {
  if (!code) return null;
  const db = getSupabaseAdmin();
  const { data: c } = await db.from('coupons').select('*').eq('code', code.toUpperCase()).eq('active', true).maybeSingle();
  const now = Date.now();
  if (!c) throw new OrderError('Cupom inválido.');
  if (c.starts_at && new Date(c.starts_at).getTime() > now) throw new OrderError('Este cupom ainda não está válido.');
  if (c.ends_at && new Date(c.ends_at).getTime() < now) throw new OrderError('Este cupom expirou.');
  if (c.max_uses != null && c.used_count >= c.max_uses) throw new OrderError('Este cupom já foi totalmente utilizado.');
  if (subtotal < Number(c.min_order_value)) {
    throw new OrderError(`Cupom válido para compras a partir de ${Number(c.min_order_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`);
  }
  const value = Number(c.value);
  const discount = c.type === 'percentual' ? round2((subtotal * value) / 100) : c.type === 'valor_fixo' ? Math.min(value, subtotal) : 0;
  return { id: c.id as string, code: c.code as string, description: c.description as string | null, discount, freeShipping: c.type === 'frete_gratis' };
}

export async function computeTotals(params: {
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  deliveryMethod: 'entrega' | 'retirada';
  city: string;
  state: string;
}) {
  const cart = await priceCart(params.items);
  const coupon = await validateCoupon(params.couponCode ?? '', cart.subtotal);
  const { options } = quoteShipping({
    zones: await getDeliveryZones(),
    city: params.city,
    state: params.state,
    subtotal: cart.subtotal,
    weightKg: cart.weightKg,
    freeShippingCoupon: coupon?.freeShipping,
  });
  const option = options.find((o) => o.method === params.deliveryMethod);
  if (!option) throw new OrderError('Ainda não entregamos neste endereço. Escolha "Retirar na loja" ou peça um orçamento de frete pelo WhatsApp.');
  const discount = coupon?.discount ?? 0;
  const total = round2(Math.max(0, cart.subtotal - discount) + option.price);
  return { ...cart, coupon, shipping: option, discount, total };
}

type CheckoutData = z.output<typeof checkoutSchema>;

async function upsertCustomer(input: CheckoutData, userId: string | null) {
  const db = getSupabaseAdmin();
  const c = input.customer;
  const row = {
    person_type: c.personType,
    name: c.name,
    email: c.email,
    phone: c.phone,
    cpf: c.personType === 'PF' ? c.cpf : null,
    cnpj: c.personType === 'PJ' ? c.cnpj : null,
    company_name: c.personType === 'PJ' ? c.companyName : null,
    state_registration: c.stateRegistration || null,
    marketing_opt_in: input.marketingOptIn,
    lgpd_consent_at: new Date().toISOString(),
  };
  if (userId) {
    const { data: existing } = await db.from('customers').select('id').eq('user_id', userId).maybeSingle();
    if (existing) {
      await db.from('customers').update(row).eq('id', existing.id);
      return existing.id as string;
    }
    const { data, error } = await db.from('customers').insert({ ...row, user_id: userId }).select('id').single();
    if (error) throw error;
    return data.id as string;
  }
  const { data, error } = await db.from('customers').insert(row).select('id').single();
  if (error) throw error;
  return data.id as string;
}

/** Clientes logados ganham o endereço do checkout salvo na conta (sem duplicar CEP + número). */
async function saveAddress(customerId: string, a: CheckoutData['address']) {
  const db = getSupabaseAdmin();
  const { data: existing } = await db.from('addresses').select('id, cep, number').eq('customer_id', customerId);
  if (existing?.some((e) => e.cep === a.cep && e.number === a.number)) return;
  await db.from('addresses').insert({ customer_id: customerId, ...a, label: existing?.length ? 'Obra' : 'Principal', is_default: !existing?.length });
}

export async function createOrder(input: CheckoutData, userId: string | null) {
  const db = getSupabaseAdmin();
  // A zona de entrega é decidida pela cidade oficial do CEP (ViaCEP); o texto digitado só vale se o CEP for desconhecido
  const official = await lookupCep(input.address.cep);
  const totals = await computeTotals({
    items: input.items,
    couponCode: input.couponCode,
    deliveryMethod: input.deliveryMethod,
    city: official?.city ?? input.address.city,
    state: official?.state ?? input.address.state,
  });

  const customerId = await upsertCustomer(input, userId);
  if (userId) await saveAddress(customerId, input.address);
  if (totals.coupon) {
    const { error } = await db.rpc('consume_coupon', { p_coupon_id: totals.coupon.id });
    if (error) throw new OrderError('Este cupom acabou de esgotar.');
  }

  const c = input.customer;
  const { data: order, error } = await db
    .from('orders')
    .insert({
      customer_id: customerId,
      user_id: userId,
      delivery_method: input.deliveryMethod,
      delivery_zone_id: totals.shipping.zoneId,
      shipping_address: input.address,
      customer_snapshot: {
        name: c.name, email: c.email, phone: c.phone, person_type: c.personType,
        document: c.personType === 'PF' ? c.cpf : c.cnpj, company_name: c.companyName || null,
        state_registration: c.stateRegistration || null,
      },
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping_cost: totals.shipping.price,
      total: totals.total,
      coupon_id: totals.coupon?.id ?? null,
      coupon_code: totals.coupon?.code ?? null,
      notes: input.notes || null,
      estimated_days: totals.shipping.days,
    })
    .select('id, public_token, number')
    .single();
  if (error) throw error;

  const { error: itemsError } = await db.from('order_items').insert(
    totals.lines.map((l) => ({
      order_id: order.id, product_id: l.product.id, sku: l.product.sku, name: l.product.name,
      unit: l.product.unit, unit_price: l.unitPrice, quantity: l.quantity,
    })),
  );

  const { error: stockError } = itemsError
    ? { error: itemsError }
    : await db.rpc('reserve_stock', { p_items: totals.lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })) });

  if (stockError) {
    // Compensação: desfaz o pedido e devolve o uso do cupom
    await db.from('orders').delete().eq('id', order.id);
    if (totals.coupon) {
      const { data: cp } = await db.from('coupons').select('used_count').eq('id', totals.coupon.id).single();
      if (cp) await db.from('coupons').update({ used_count: Math.max(0, cp.used_count - 1) }).eq('id', totals.coupon.id);
    }
    if (stockError.message?.includes('ESTOQUE_INSUFICIENTE')) throw new OrderError('Um item acabou de esgotar. Revise o carrinho.', 409);
    throw stockError;
  }

  const full = await getOrderByToken(order.public_token as string);
  return full!;
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const { data } = await getSupabaseAdmin()
    .from('orders')
    .select('*, order_items(*), order_status_history(status, note, created_at), payments(*)')
    .eq('public_token', token)
    .maybeSingle();
  return data ? normalizeOrder(data) : null;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data } = await getSupabaseAdmin()
    .from('orders')
    .select('*, order_items(*), order_status_history(status, note, created_at), payments(*)')
    .eq('id', id)
    .maybeSingle();
  return data ? normalizeOrder(data) : null;
}

export function normalizeOrder(o: Record<string, unknown>): Order {
  const order = o as unknown as Order;
  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping_cost: Number(order.shipping_cost),
    total: Number(order.total),
    order_items: (order.order_items ?? []).map((i) => ({ ...i, unit_price: Number(i.unit_price), quantity: Number(i.quantity), total: Number(i.total) })),
    order_status_history: [...(order.order_status_history ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    payments: [...(order.payments ?? [])].map((p) => ({ ...p, amount: Number(p.amount) })).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await getSupabaseAdmin().from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}
