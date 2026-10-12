'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn, formatDate, orderStatusFlow, statusLabelFor } from '@/lib/utils';
import type { Order } from '@/types';

/** Linha do tempo de status do pedido (rastreamento) */
export function OrderTimeline({ order }: { order: Pick<Order, 'status' | 'delivery_method' | 'order_status_history'> }) {
  const history = order.order_status_history ?? [];
  const when = (s: string) => history.filter((h) => h.status === s).at(-1)?.created_at;

  if (order.status === 'cancelado') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-900">
        <X className="h-6 w-6" aria-hidden />
        <div>
          <p className="font-bold">Pedido cancelado</p>
          {when('cancelado') && <p className="text-sm">{formatDate(when('cancelado')!, true)}</p>}
        </div>
      </div>
    );
  }

  const current = orderStatusFlow.indexOf(order.status);
  return (
    <ol className="grid gap-4 sm:grid-cols-5 sm:gap-2" aria-label="Andamento do pedido">
      {orderStatusFlow.map((s, i) => {
        const done = i <= current;
        const date = when(s);
        return (
          <li key={s} className="relative flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2" aria-current={i === current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12 }}
                className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', done ? 'bg-seguranca-500 text-petroleo-950' : 'bg-cimento-200 text-cimento-600')}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
                {i === current && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-seguranca-400" aria-hidden />}
              </motion.span>
              {i < orderStatusFlow.length - 1 && (
                <span className="mx-2 hidden h-1 flex-1 overflow-hidden rounded bg-cimento-200 sm:block">
                  <motion.span className="block h-full bg-seguranca-500" initial={{ width: 0 }} animate={{ width: i < current ? '100%' : 0 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }} />
                </span>
              )}
            </div>
            <div>
              <p className={cn('text-sm font-bold', done ? 'text-petroleo-950' : 'text-cimento-600')}>{statusLabelFor(s, order.delivery_method)}</p>
              {date && <p className="text-xs text-cimento-600">{formatDate(date, true)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
