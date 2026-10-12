'use client';

import { Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toCartItem } from '@/lib/cart-helpers';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import type { Product } from '@/types';

/** Repete um pedido com preços e estoque ATUAIS (itens indisponíveis são ignorados e avisados). */
export function RepeatOrderButton({ items }: { items: { productId: string; quantity: number }[] }) {
  const addMany = useCart((s) => s.addMany);
  const openCart = useUi((s) => s.openCart);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const repeat = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produtos?ids=${items.map((i) => i.productId).join(',')}`);
      const { products } = (await res.json()) as { products: Product[] };
      const available = products.filter((p) => p.stock > 0);
      addMany(available.map((p) => ({ item: toCartItem(p), quantity: items.find((i) => i.productId === p.id)!.quantity })));
      const missing = items.length - available.length;
      setMsg(missing ? `${missing} ${missing === 1 ? 'item indisponível não foi adicionado' : 'itens indisponíveis não foram adicionados'}.` : '');
      openCart();
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={repeat} disabled={loading || !items.length} className="btn-primary px-4 py-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" aria-hidden />} Repetir pedido
      </button>
      {msg && <span className="mt-1 text-xs text-amber-800">{msg}</span>}
    </span>
  );
}
