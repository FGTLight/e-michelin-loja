'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { orderStatusLabels, statusLabelFor } from '@/lib/utils';
import type { DeliveryMethod, OrderStatus } from '@/types';

export function OrderStatusUpdater({ orderId, current, deliveryMethod }: { orderId: string; current: OrderStatus; deliveryMethod: DeliveryMethod }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(current);
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'cancelado' && !confirm('Cancelar o pedido? O estoque será devolvido automaticamente.')) return;
    setLoading(true);
    setMsg('');
    const res = await fetch(`/api/admin/pedidos/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note: note || undefined, notify }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(data.error ?? 'Erro ao atualizar');
    setNote('');
    setMsg(notify ? 'Status atualizado e cliente notificado.' : 'Status atualizado.');
    router.refresh();
  };

  return (
    <form onSubmit={save} className="card space-y-3 p-5">
      <h2 className="text-lg">Atualizar status</h2>
      <label className="block">
        <span className="label">Novo status</span>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} disabled={current === 'cancelado'}>
          {(Object.keys(orderStatusLabels) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{statusLabelFor(s, deliveryMethod)}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Observação para o cliente (opcional)</span>
        <textarea className="input min-h-16" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: motorista chega entre 14h e 16h." />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-petroleo-800" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        Notificar cliente por e-mail e WhatsApp
      </label>
      <button className="btn-primary w-full" disabled={loading || status === current || current === 'cancelado'}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
      </button>
      {msg && <p role="status" className="text-sm text-petroleo-800">{msg}</p>}
    </form>
  );
}
