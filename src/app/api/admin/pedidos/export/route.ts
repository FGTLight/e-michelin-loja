import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { formatOrderNumber, orderStatusLabels } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const cell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // Neutraliza fórmulas (CSV injection) e escapa aspas
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Exporta pedidos filtrados em CSV (separador ";" e BOM UTF-8 para abrir direto no Excel) */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const sp = req.nextUrl.searchParams;
  let q = getSupabaseServer()
    .from('orders')
    .select('number, created_at, status, delivery_method, payment_method, subtotal, discount, shipping_cost, total, coupon_code, customer_snapshot, shipping_address, order_items(sku, name, quantity, unit_price)')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (sp.get('status')) q = q.eq('status', sp.get('status')!);
  if (sp.get('de')) q = q.gte('created_at', `${sp.get('de')}T00:00:00-03:00`);
  if (sp.get('ate')) q = q.lte('created_at', `${sp.get('ate')}T23:59:59-03:00`);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'Falha ao exportar' }, { status: 500 });

  const header = ['Pedido', 'Data', 'Status', 'Cliente', 'Documento', 'E-mail', 'Telefone', 'Entrega', 'Cidade', 'Pagamento', 'Itens', 'Subtotal', 'Desconto', 'Frete', 'Total', 'Cupom'];
  const rows = (data ?? []).map((o) => {
    const c = o.customer_snapshot as { name: string; company_name?: string; document: string; email: string; phone: string };
    const items = (o.order_items as { sku: string; quantity: number }[]).map((i) => `${i.sku} x${Number(i.quantity)}`).join(' | ');
    const brl = (n: unknown) => Number(n).toFixed(2).replace('.', ',');
    return [
      formatOrderNumber(o.number), new Date(o.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), orderStatusLabels[o.status as OrderStatus],
      c.company_name ?? c.name, c.document, c.email, c.phone, o.delivery_method, (o.shipping_address as { city?: string } | null)?.city ?? '',
      o.payment_method ?? '', items, brl(o.subtotal), brl(o.discount), brl(o.shipping_cost), brl(o.total), o.coupon_code ?? '',
    ].map(cell).join(';');
  });
  const csv = '﻿' + [header.map(cell).join(';'), ...rows].join('\r\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
