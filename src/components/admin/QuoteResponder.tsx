'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatBRL, formatQty, round2 } from '@/lib/utils';
import type { SaleUnit } from '@/types';

interface Item { id: string; description: string; sku: string | null; quantity: number; unit: SaleUnit; unit_price: number; stock: number | null }
interface Initial { discount: number; shipping_cost: number; valid_until: string; response_message: string; admin_notes: string }

export function QuoteResponder({ quoteId, status, items, initial, convertedOrderId }: { quoteId: string; status: string; items: Item[]; initial: Initial; convertedOrderId: string | null }) {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, number>>(Object.fromEntries(items.map((i) => [i.id, i.unit_price])));
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const locked = status === 'convertido' || status === 'recusado';

  const subtotal = round2(items.reduce((s, i) => s + (prices[i.id] ?? 0) * i.quantity, 0));
  const total = round2(Math.max(0, subtotal - form.discount) + form.shipping_cost);

  const send = async (action: 'responder' | 'converter' | 'recusar') => {
    if (action === 'converter' && !confirm('Converter em pedido? O estoque dos itens do catálogo será reservado e o cliente receberá o link de pagamento.')) return;
    setLoading(action);
    setMsg('');
    const res = await fetch(`/api/admin/orcamentos/${quoteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, action, items: items.map((i) => ({ id: i.id, unit_price: prices[i.id] ?? 0 })) }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) return setMsg(data.error ?? 'Erro');
    setMsg(action === 'converter' ? 'Pedido criado e cliente notificado.' : action === 'responder' ? 'Resposta enviada ao cliente.' : 'Orçamento recusado.');
    router.refresh();
  };

  return (
    <div className="card p-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-cimento-700">
            <tr><th className="py-2">Item</th><th className="py-2">Qtd.</th><th className="py-2">Unitário (R$)</th><th className="py-2 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-cimento-100">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="py-2.5 pr-3">
                  <p className="font-semibold text-petroleo-950">{i.description}</p>
                  <p className="text-xs text-cimento-600">{i.sku ? `SKU ${i.sku}` : 'Item avulso'}{i.stock != null && ` · estoque ${i.stock}`}</p>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-3">{formatQty(i.quantity, i.unit)}</td>
                <td className="py-2.5 pr-3">
                  <input type="number" min={0} step="0.01" disabled={locked} aria-label={`Preço unitário de ${i.description}`} className="input w-28 py-1.5" value={prices[i.id] ?? 0} onChange={(e) => setPrices({ ...prices, [i.id]: Number(e.target.value) })} />
                </td>
                <td className="py-2.5 text-right font-semibold">{formatBRL((prices[i.id] ?? 0) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label><span className="label">Desconto (R$)</span><input type="number" min={0} step="0.01" className="input" disabled={locked} value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} /></label>
        <label><span className="label">Frete (R$)</span><input type="number" min={0} step="0.01" className="input" disabled={locked} value={form.shipping_cost} onChange={(e) => setForm({ ...form, shipping_cost: Number(e.target.value) })} /></label>
        <label><span className="label">Válido até</span><input type="date" className="input" disabled={locked} value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></label>
        <label className="sm:col-span-3"><span className="label">Mensagem ao cliente</span><textarea className="input min-h-20" disabled={locked} value={form.response_message} onChange={(e) => setForm({ ...form, response_message: e.target.value })} placeholder="Condições de pagamento, prazo de entrega…" /></label>
        <label className="sm:col-span-3"><span className="label">Notas internas</span><textarea className="input min-h-16" value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} /></label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-cimento-200 pt-5">
        <p className="text-sm">Subtotal {formatBRL(subtotal)} · <span className="font-display text-2xl font-extrabold text-petroleo-950">{formatBRL(total)}</span></p>
        {convertedOrderId ? (
          <Link href={`/admin/pedidos/${convertedOrderId}`} className="btn-dark">Ver pedido gerado</Link>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost text-red-700" disabled={locked || !!loading} onClick={() => send('recusar')}>Recusar</button>
            <button type="button" className="btn-outline" disabled={locked || !!loading} onClick={() => send('responder')}>{loading === 'responder' && <Loader2 className="h-4 w-4 animate-spin" />} Enviar resposta</button>
            <button type="button" className="btn-primary" disabled={locked || !!loading} onClick={() => send('converter')}>{loading === 'converter' && <Loader2 className="h-4 w-4 animate-spin" />} Converter em pedido</button>
          </div>
        )}
      </div>
      {msg && <p role="status" className="mt-3 text-sm text-petroleo-800">{msg}</p>}
    </div>
  );
}
