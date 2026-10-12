'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { maskCEP, onlyDigits } from '@/lib/utils';
import { addressSchema } from '@/lib/validators';
import type { Address } from '@/types';

/** Endereços salvos — operações direto no Supabase, protegidas por RLS (o usuário só altera os próprios). */
export function AddressBook({ customerId, addresses }: { customerId: string | null; addresses: Address[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');
  const sb = getSupabaseBrowser();

  const setDefault = async (id: string) => {
    await sb.from('addresses').update({ is_default: false }).eq('customer_id', customerId);
    await sb.from('addresses').update({ is_default: true }).eq('id', id);
    router.refresh();
  };
  const del = async (id: string) => {
    if (!confirm('Excluir este endereço?')) return;
    await sb.from('addresses').delete().eq('id', id);
    router.refresh();
  };
  const fillCep = async (cep: string) => {
    if (onlyDigits(cep).length !== 8) return;
    const r = await fetch(`/api/cep/${onlyDigits(cep)}`);
    if (r.ok) {
      const d = await r.json();
      setForm((f) => ({ ...f!, street: d.street, district: d.district, city: d.city, state: d.state }));
    }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) return setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? 'Dados inválidos');
    const { error: err } = await sb.from('addresses').insert({ ...parsed.data, customer_id: customerId, label: form?.label || 'Endereço', is_default: !addresses.length });
    if (err) return setError('Não foi possível salvar.');
    setForm(null);
    setError('');
    router.refresh();
  };

  if (!customerId) {
    return <div className="card p-8 text-center text-cimento-700">Seus endereços aparecem aqui automaticamente após a primeira compra.</div>;
  }

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {addresses.map((a) => (
            <motion.li key={a.id} layout exit={{ opacity: 0, scale: 0.95 }} className="card relative p-5">
              {a.is_default && <span className="absolute right-4 top-4 rounded-full bg-seguranca-100 px-2 py-0.5 text-xs font-bold text-seguranca-800">Padrão</span>}
              <p className="flex items-center gap-2 font-bold text-petroleo-950"><MapPin className="h-4 w-4 text-seguranca-600" aria-hidden /> {a.label}</p>
              <p className="mt-2 text-sm text-cimento-800">
                {a.street}, {a.number}{a.complement ? ` – ${a.complement}` : ''}<br />{a.district} – {a.city}/{a.state}<br />CEP {maskCEP(a.cep)}
              </p>
              <div className="mt-4 flex gap-2">
                {!a.is_default && (
                  <button type="button" onClick={() => setDefault(a.id!)} className="btn-ghost px-3 py-1.5 text-xs"><Star className="h-3.5 w-3.5" aria-hidden /> Tornar padrão</button>
                )}
                <button type="button" onClick={() => del(a.id!)} className="btn-ghost px-3 py-1.5 text-xs text-red-700"><Trash2 className="h-3.5 w-3.5" aria-hidden /> Excluir</button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {form ? (
        <form onSubmit={save} className="card mt-6 grid gap-4 p-5 sm:grid-cols-6" noValidate>
          <Field label="Apelido" className="sm:col-span-2" value={form.label ?? ''} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Casa, Obra…" />
          <Field label="CEP" required className="sm:col-span-2" inputMode="numeric" value={form.cep ?? ''} onChange={(e) => { const v = maskCEP(e.target.value); setForm({ ...form, cep: v }); fillCep(v); }} />
          <Field label="Número" required className="sm:col-span-2" value={form.number ?? ''} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          <Field label="Rua" required className="sm:col-span-4" value={form.street ?? ''} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <Field label="Complemento" className="sm:col-span-2" value={form.complement ?? ''} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
          <Field label="Bairro" required className="sm:col-span-2" value={form.district ?? ''} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <Field label="Cidade" required className="sm:col-span-3" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Field label="UF" required className="sm:col-span-1" maxLength={2} value={form.state ?? ''} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
          {error && <p role="alert" className="field-error sm:col-span-6">{error}</p>}
          <div className="flex gap-2 sm:col-span-6">
            <button type="submit" className="btn-primary">Salvar endereço</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-outline mt-6" onClick={() => setForm({ state: 'RS', city: 'Erechim' })}>
          <Plus className="h-4 w-4" aria-hidden /> Novo endereço
        </button>
      )}
    </div>
  );
}
