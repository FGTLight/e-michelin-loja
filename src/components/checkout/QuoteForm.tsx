'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ClipboardList, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, Segmented } from '@/components/ui/Field';
import { whatsappLink } from '@/config/site';
import { useMounted } from '@/lib/hooks';
import { maskCNPJ, maskCPF, maskPhone, unitLabels } from '@/lib/utils';
import { quoteRequestSchema } from '@/lib/validators';
import { useQuoteList } from '@/store/quote';
import type { SaleUnit } from '@/types';

const contactSchema = quoteRequestSchema.omit({ items: true, lgpdConsent: true }).extend({ lgpdConsent: z.boolean() });
type ContactIn = z.input<typeof contactSchema>;

export function QuoteForm() {
  const mounted = useMounted();
  const { items, add, update, remove, clear } = useQuoteList();
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState<SaleUnit>('un');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<number | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ContactIn>({
    resolver: zodResolver(contactSchema),
    defaultValues: { personType: 'PJ', name: '', email: '', phone: '', document: '', companyName: '', city: 'Erechim', projectDescription: '', lgpdConsent: false, website: '' },
  });
  const pt = watch('personType');

  const addFree = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(qty.replace(',', '.'));
    if (desc.trim().length < 2 || !(q > 0)) return;
    add({ description: desc.trim(), quantity: q, unit });
    setDesc('');
    setQty('1');
  };

  const submit = handleSubmit(async (contact) => {
    if (!contact.lgpdConsent) return setError('Aceite a Política de Privacidade para enviar.');
    if (!items.length) return setError('Adicione ao menos um item à lista.');
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contact, lgpdConsent: true, items: items.map(({ productId, description, quantity, unit }) => ({ productId, description, quantity, unit })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível enviar.');
      clear();
      setDone(data.number);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  });

  if (!mounted) return <div className="skeleton h-96" />;

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-xl p-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-2xl">Orçamento #{done} enviado!</h2>
        <p className="mt-2 text-cimento-700">Nossa equipe responde em até 1 dia útil por e-mail e WhatsApp. Se preferir agilizar, fale direto com um vendedor.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={whatsappLink(`Olá! Acabei de enviar o orçamento #${done} pelo site.`)} target="_blank" rel="noopener noreferrer" className="btn bg-[#15803d] text-white hover:bg-[#166534]">Falar no WhatsApp</a>
          <Link href="/produtos" className="btn-outline">Continuar comprando</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <section className="card p-5 sm:p-7" aria-labelledby="list-title">
        <h2 id="list-title" className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-seguranca-600" aria-hidden /> Lista da obra</h2>
        <p className="mt-1 text-sm text-cimento-700">Adicione produtos pelo site (botão “lista de orçamento”) ou digite itens livremente.</p>

        <ul className="mt-5 divide-y divide-cimento-100">
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <motion.li key={i.key} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="flex flex-wrap items-center gap-3 py-3">
                <p className="min-w-0 flex-1 text-sm font-semibold text-petroleo-950">{i.description}{i.sku && <span className="ml-2 text-xs font-normal text-cimento-600">{i.sku}</span>}</p>
                <input type="number" min={0} step="any" aria-label={`Quantidade de ${i.description}`} className="input w-24 py-2 text-right" value={i.quantity} onChange={(e) => update(i.key, { quantity: Math.max(0.001, Number(e.target.value) || 0) })} />
                <span className="w-16 text-xs text-cimento-700">{unitLabels[i.unit].plural}</span>
                <button type="button" onClick={() => remove(i.key)} className="rounded p-2 text-cimento-600 hover:bg-red-50 hover:text-red-700" aria-label={`Remover ${i.description}`}><Trash2 className="h-4 w-4" /></button>
              </motion.li>
            ))}
          </AnimatePresence>
          {!items.length && <li className="py-6 text-center text-sm text-cimento-600">Sua lista está vazia.</li>}
        </ul>

        <form onSubmit={addFree} className="mt-4 grid grid-cols-[1fr_80px_110px_auto] gap-2 rounded-xl bg-cimento-50 p-3">
          <label className="sr-only" htmlFor="q-desc">Descrição do item</label>
          <input id="q-desc" className="input py-2" placeholder="Ex.: Brita 1 (m³)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <label className="sr-only" htmlFor="q-qty">Quantidade</label>
          <input id="q-qty" className="input py-2" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
          <label className="sr-only" htmlFor="q-unit">Unidade</label>
          <select id="q-unit" className="input py-2" value={unit} onChange={(e) => setUnit(e.target.value as SaleUnit)}>
            {Object.entries(unitLabels).map(([k, v]) => <option key={k} value={k}>{v.long}</option>)}
          </select>
          <button type="submit" className="btn-dark px-3 py-2" aria-label="Adicionar item"><Plus className="h-4 w-4" /></button>
        </form>
      </section>

      <form onSubmit={submit} noValidate className="card space-y-4 p-5 sm:p-7" aria-labelledby="contact-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="contact-title" className="text-xl">Seus dados</h2>
          <Segmented label="Tipo de cliente" value={pt} onChange={(v) => setValue('personType', v)} options={[{ value: 'PJ', label: 'Empresa' }, { value: 'PF', label: 'Pessoa física' }]} />
        </div>
        {pt === 'PJ' && <Field label="Empresa / construtora" {...register('companyName')} />}
        <Field label="Nome" required autoComplete="name" {...register('name')} error={errors.name?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail" type="email" required autoComplete="email" {...register('email')} error={errors.email?.message} />
          <Field label="WhatsApp" type="tel" required {...register('phone', { onChange: (e) => setValue('phone', maskPhone(e.target.value)) })} error={errors.phone?.message} />
          <Field label={pt === 'PJ' ? 'CNPJ' : 'CPF'} inputMode="numeric" {...register('document', { onChange: (e) => setValue('document', pt === 'PJ' ? maskCNPJ(e.target.value) : maskCPF(e.target.value)) })} />
          <Field label="Cidade da obra" {...register('city')} />
        </div>
        <label className="block">
          <span className="label">Sobre a obra (opcional)</span>
          <textarea className="input min-h-24" maxLength={2000} placeholder="Tipo de obra, prazo, necessidade de entrega fracionada…" {...register('projectDescription')} />
        </label>
        {/* honeypot invisível para bots */}
        <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register('website')} />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-petroleo-800" {...register('lgpdConsent')} />
          <span>Autorizo o uso dos meus dados para elaboração e envio deste orçamento, conforme a <Link href="/politicas/privacidade" className="font-semibold underline" target="_blank">Política de Privacidade</Link>.</span>
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button type="submit" className="btn-primary w-full text-base" disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" />} Enviar pedido de orçamento
        </button>
      </form>
    </div>
  );
}
