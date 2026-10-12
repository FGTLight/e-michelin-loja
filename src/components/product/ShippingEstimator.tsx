'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Store, Truck } from 'lucide-react';
import { useState } from 'react';
import { formatBRL, maskCEP, onlyDigits } from '@/lib/utils';
import type { ShippingOption } from '@/types';

export function ShippingEstimator({ items }: { items: { productId: string; quantity: number }[] }) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ options: ShippingOption[]; city: string; outOfArea: boolean } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onlyDigits(cep).length !== 8) return setError('Digite um CEP válido.');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/frete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cep, items }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível calcular.');
      setResult({ options: data.options, city: `${data.address.city}/${data.address.state}`, outOfArea: data.outOfArea });
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-cimento-200 p-4">
      <form onSubmit={submit} className="flex items-end gap-2">
        <label className="flex-1">
          <span className="label">Calcular frete e prazo</span>
          <input className="input" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} aria-invalid={Boolean(error)} aria-describedby="frete-msg" />
        </label>
        <button type="submit" className="btn-dark px-4 py-2.5" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calcular'}
        </button>
      </form>
      <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-petroleo-700 underline">Não sei meu CEP</a>
      <div id="frete-msg" aria-live="polite">
        {error && <p className="field-error">{error}</p>}
        <AnimatePresence>
          {result && (
            <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2 overflow-hidden">
              <li className="text-xs text-cimento-700">Para {result.city}:</li>
              {result.options.map((o) => (
                <li key={o.label} className="flex items-start gap-3 rounded-lg bg-cimento-50 p-3 text-sm">
                  {o.method === 'retirada' ? <Store className="mt-0.5 h-4 w-4 text-petroleo-700" aria-hidden /> : <Truck className="mt-0.5 h-4 w-4 text-petroleo-700" aria-hidden />}
                  <span className="flex-1">
                    <b className="block text-petroleo-950">{o.label}</b>
                    <span className="text-xs text-cimento-700">{o.description}</span>
                  </span>
                  <b className={o.price === 0 ? 'text-emerald-700' : 'text-petroleo-950'}>{o.price === 0 ? 'Grátis' : formatBRL(o.price)}</b>
                </li>
              ))}
              {result.outOfArea && <li className="text-xs text-cimento-700">Ainda não entregamos nesta cidade. Fale conosco pelo WhatsApp para frete especial.</li>}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
