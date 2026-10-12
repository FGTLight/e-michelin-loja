import { MapPin, Store } from 'lucide-react';
import { site } from '@/config/site';
import { formatBRL, formatQty } from '@/lib/utils';
import type { Order } from '@/types';

export function OrderSummary({ order }: { order: Order }) {
  const a = order.shipping_address;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg">Itens</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="sr-only">
            <tr><th>Produto</th><th>Quantidade</th><th>Total</th></tr>
          </thead>
          <tbody className="divide-y divide-cimento-100">
            {order.order_items?.map((i) => (
              <tr key={i.id}>
                <td className="py-3 pr-3">
                  <p className="font-semibold text-petroleo-950">{i.name}</p>
                  <p className="text-xs text-cimento-600">SKU {i.sku} · {formatBRL(i.unit_price)} cada</p>
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-cimento-800">{formatQty(i.quantity, i.unit)}</td>
                <td className="py-3 text-right font-bold">{formatBRL(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-4 space-y-1.5 border-t border-cimento-200 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Desconto {order.coupon_code && `(${order.coupon_code})`}</dt><dd>− {formatBRL(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt>{order.delivery_method === 'retirada' ? 'Retirada' : 'Frete'}</dt><dd>{order.shipping_cost ? formatBRL(order.shipping_cost) : 'Grátis'}</dd></div>
          <div className="flex justify-between pt-2 text-base font-bold"><dt>Total</dt><dd>{formatBRL(order.total)}</dd></div>
        </dl>
      </div>
      <div className="card space-y-4 p-5 text-sm sm:p-6">
        <div className="flex gap-3">
          {order.delivery_method === 'retirada' ? <Store className="h-5 w-5 shrink-0 text-seguranca-600" aria-hidden /> : <MapPin className="h-5 w-5 shrink-0 text-seguranca-600" aria-hidden />}
          <div>
            <p className="font-bold text-petroleo-950">{order.delivery_method === 'retirada' ? 'Retirada na loja' : 'Entrega'}</p>
            {order.delivery_method === 'retirada' ? (
              <p className="text-cimento-800">{site.address.full}</p>
            ) : (
              a && <p className="text-cimento-800">{a.street}, {a.number}{a.complement ? ` – ${a.complement}` : ''}<br />{a.district} – {a.city}/{a.state}<br />CEP {a.cep}</p>
            )}
            {order.estimated_days ? <p className="mt-1 text-xs text-cimento-600">Prazo: até {order.estimated_days} dia(s) útil(eis) após o pagamento</p> : null}
          </div>
        </div>
        <div className="border-t border-cimento-200 pt-4">
          <p className="font-bold text-petroleo-950">Cliente</p>
          <p className="text-cimento-800">{order.customer_snapshot.company_name ?? order.customer_snapshot.name}<br />{order.customer_snapshot.email}</p>
        </div>
        {order.notes && (
          <div className="border-t border-cimento-200 pt-4">
            <p className="font-bold text-petroleo-950">Observações</p>
            <p className="text-cimento-800">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
