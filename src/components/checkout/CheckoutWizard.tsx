'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Barcode, Check, CreditCard, Loader2, Lock, QrCode, Store, Tag, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Field, Segmented } from '@/components/ui/Field';
import { useMounted } from '@/lib/hooks';
import { cn, formatBRL, formatQty, maskCEP, maskCNPJ, maskCPF, maskPhone, onlyDigits, round2 } from '@/lib/utils';
import { addressSchema, customerSchema } from '@/lib/validators';
import { cartSubtotal, useCart } from '@/store/cart';
import type { PaymentMethod, ShippingOption } from '@/types';

type CustomerIn = z.input<typeof customerSchema>;
type CustomerOut = z.output<typeof customerSchema>;
type AddressIn = z.input<typeof addressSchema>;
type AddressOut = z.output<typeof addressSchema>;

const steps = ['Seus dados', 'Endereço', 'Entrega', 'Pagamento'] as const;

export interface CheckoutDefaults {
  customer?: Partial<CustomerIn>;
  address?: Partial<AddressIn>;
}

export function CheckoutWizard({ defaults, demo }: { defaults: CheckoutDefaults; demo: boolean }) {
  const mounted = useMounted();
  const router = useRouter();
  const { items, couponCode, setCoupon, clear } = useCart();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [customer, setCustomer] = useState<CustomerOut | null>(null);
  const [address, setAddress] = useState<AddressOut | null>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [shipping, setShipping] = useState<ShippingOption | null>(null);
  const [coupon, setCouponState] = useState<{ code: string; discount: number; freeShipping: boolean; description: string | null } | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cartSubtotal(items);
  const discount = coupon?.discount ?? 0;
  const shippingCost = shipping ? (coupon?.freeShipping && shipping.method === 'entrega' ? 0 : shipping.price) : 0;
  const total = round2(Math.max(0, subtotal - discount) + shippingCost);
  const cartPayload = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) return <div className="skeleton h-96" />;
  if (!items.length) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <h1 className="text-2xl">Seu carrinho está vazio</h1>
        <p className="mt-2 text-cimento-700">Adicione produtos para finalizar a compra.</p>
        <Link href="/produtos" className="btn-primary mt-6">Ver produtos</Link>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!customer || !address || !shipping) return;
    if (!consent) return setError('Para continuar, aceite a Política de Privacidade e os Termos.');
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          address,
          deliveryMethod: shipping.method,
          couponCode: coupon?.code ?? '',
          notes,
          items: cartPayload,
          lgpdConsent: true,
          marketingOptIn: marketing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível criar o pedido.');
      clear();
      router.push(`/pedido/${data.token}?metodo=${method}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <Stepper step={step} onGo={(n) => n < step && go(n)} />
        {demo && (
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <b>Modo demonstração:</b> navegue por todas as etapas; para gravar pedidos reais configure o Supabase (README).
          </p>
        )}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="card p-5 sm:p-8"
            >
              {step === 0 && (
                <CustomerStep
                  defaults={customer ?? defaults.customer}
                  onNext={(c) => {
                    setCustomer(c);
                    go(1);
                  }}
                />
              )}
              {step === 1 && (
                <AddressStep
                  defaults={address ?? defaults.address}
                  onBack={() => go(0)}
                  onNext={(a) => {
                    if (address?.cep !== a.cep) setShipping(null);
                    setAddress(a);
                    go(2);
                  }}
                />
              )}
              {step === 2 && address && (
                <DeliveryStep
                  cep={address.cep}
                  city={address.city}
                  state={address.state}
                  items={cartPayload}
                  options={options}
                  setOptions={setOptions}
                  selected={shipping}
                  onSelect={setShipping}
                  onBack={() => go(1)}
                  onNext={() => shipping && go(3)}
                />
              )}
              {step === 3 && (
                <div>
                  <h2 className="text-xl">Forma de pagamento</h2>
                  <p className="mt-1 text-sm text-cimento-700">O pagamento é processado com segurança pelo Mercado Pago.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Forma de pagamento">
                    {([
                      { id: 'pix', label: 'Pix', desc: 'Aprovação na hora', icon: QrCode },
                      { id: 'cartao', label: 'Cartão de crédito', desc: 'Em até 10x sem juros', icon: CreditCard },
                      { id: 'boleto', label: 'Boleto', desc: 'Compensa em até 2 dias úteis', icon: Barcode },
                    ] as const).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={method === m.id}
                        onClick={() => setMethod(m.id)}
                        className={cn('relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition', method === m.id ? 'border-petroleo-800 bg-petroleo-50' : 'border-cimento-200 hover:border-petroleo-300')}
                      >
                        <m.icon className="h-6 w-6 text-petroleo-800" aria-hidden />
                        <span className="font-bold text-petroleo-950">{m.label}</span>
                        <span className="text-xs text-cimento-700">{m.desc}</span>
                        {method === m.id && (
                          <motion.span layoutId="pay-check" className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-seguranca-500">
                            <Check className="h-4 w-4 text-petroleo-950" />
                          </motion.span>
                        )}
                      </button>
                    ))}
                  </div>

                  <label className="mt-6 block">
                    <span className="label">Observações (opcional)</span>
                    <textarea className="input min-h-20" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: entregar pela rua dos fundos, portão azul." />
                  </label>

                  <div className="mt-5 space-y-3 rounded-xl bg-cimento-50 p-4 text-sm">
                    <label className="flex items-start gap-3">
                      <input type="checkbox" className="mt-0.5 h-5 w-5 accent-petroleo-800" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                      <span>
                        Li e aceito a <Link href="/politicas/privacidade" target="_blank" className="font-semibold underline">Política de Privacidade</Link>, os{' '}
                        <Link href="/politicas/termos" target="_blank" className="font-semibold underline">Termos de Uso</Link> e a{' '}
                        <Link href="/politicas/trocas-e-devolucoes" target="_blank" className="font-semibold underline">Política de Trocas</Link>. Meus dados serão usados para processar e entregar o pedido (LGPD, art. 7º, V).
                      </span>
                    </label>
                    <label className="flex items-start gap-3">
                      <input type="checkbox" className="mt-0.5 h-5 w-5 accent-petroleo-800" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                      <span>Quero receber ofertas por e-mail e WhatsApp (opcional, cancele quando quiser).</span>
                    </label>
                  </div>

                  {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}

                  <div className="mt-6 flex flex-wrap justify-between gap-3">
                    <button type="button" className="btn-ghost" onClick={() => go(2)}>Voltar</button>
                    <button type="button" className="btn-primary px-8 text-base" disabled={submitting} onClick={placeOrder}>
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" aria-hidden />}
                      Finalizar pedido · {formatBRL(total)}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Resumo */}
      <aside className="lg:sticky lg:top-32 lg:self-start" aria-label="Resumo do pedido">
        <div className="card p-5">
          <h2 className="text-lg">Resumo</h2>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.productId} className="flex gap-3 text-sm">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-cimento-100">
                  {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-snug text-petroleo-950">{i.name}</p>
                  <p className="text-xs text-cimento-600">{formatQty(i.quantity, i.unit)}</p>
                </div>
                <p className="font-semibold">{formatBRL(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <CouponBox
            applied={coupon}
            initial={couponCode}
            items={cartPayload}
            onApply={(c) => {
              setCouponState(c);
              setCoupon(c?.code ?? '');
            }}
          />
          <dl className="mt-4 space-y-2 border-t border-cimento-200 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Desconto ({coupon?.code})</dt><dd>− {formatBRL(discount)}</dd></div>}
            <div className="flex justify-between">
              <dt>{shipping?.method === 'retirada' ? 'Retirada na loja' : 'Frete'}</dt>
              <dd>{shipping ? (shippingCost === 0 ? 'Grátis' : formatBRL(shippingCost)) : 'Calcule na etapa 3'}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-cimento-200 pt-3">
              <dt className="font-bold">Total</dt>
              <dd className="font-display text-2xl font-extrabold text-petroleo-950">{formatBRL(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex items-center gap-2 text-xs text-cimento-600"><Lock className="h-3.5 w-3.5" aria-hidden /> Ambiente seguro · valores conferidos no servidor</p>
        </div>
      </aside>
    </div>
  );
}

function Stepper({ step, onGo }: { step: number; onGo: (n: number) => void }) {
  return (
    <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Etapas do checkout">
      {steps.map((s, i) => (
        <li key={s}>
          <button type="button" onClick={() => onGo(i)} disabled={i >= step} className="w-full text-left disabled:cursor-default" aria-current={i === step ? 'step' : undefined}>
            <div className="h-1.5 overflow-hidden rounded-full bg-cimento-200">
              <motion.div className="h-full bg-seguranca-500" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
            </div>
            <span className={cn('mt-2 flex items-center gap-1.5 text-xs font-bold sm:text-sm', i <= step ? 'text-petroleo-950' : 'text-cimento-600')}>
              <span className={cn('hidden h-5 w-5 items-center justify-center rounded-full text-[11px] sm:flex', i < step ? 'bg-petroleo-900 text-white' : i === step ? 'bg-seguranca-500 text-petroleo-950' : 'bg-cimento-200')}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function CustomerStep({ defaults, onNext }: { defaults?: Partial<CustomerIn>; onNext: (c: CustomerOut) => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CustomerIn>({
    resolver: zodResolver(customerSchema),
    defaultValues: { personType: 'PF', name: '', email: '', phone: '', cpf: '', cnpj: '', companyName: '', stateRegistration: '', ...defaults },
  });
  const pt = watch('personType');

  return (
    <form onSubmit={handleSubmit((d) => onNext(d as unknown as CustomerOut))} noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">Seus dados</h2>
        <Segmented
          label="Tipo de cliente"
          value={pt}
          onChange={(v) => setValue('personType', v)}
          options={[{ value: 'PF', label: 'Pessoa física' }, { value: 'PJ', label: 'Empresa / construtora' }]}
        />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {pt === 'PJ' && (
          <>
            <Field label="Razão social" required autoComplete="organization" className="sm:col-span-2" {...register('companyName')} error={errors.companyName?.message} />
            <Field label="CNPJ" required inputMode="numeric" {...register('cnpj', { onChange: (e) => setValue('cnpj', maskCNPJ(e.target.value)) })} error={errors.cnpj?.message} />
            <Field label="Inscrição estadual" hint="Opcional — informe se for contribuinte" {...register('stateRegistration')} />
          </>
        )}
        <Field label={pt === 'PJ' ? 'Nome do responsável' : 'Nome completo'} required autoComplete="name" className="sm:col-span-2" {...register('name')} error={errors.name?.message} />
        <Field label="E-mail" type="email" required autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Field label="Celular / WhatsApp" type="tel" required autoComplete="tel-national" {...register('phone', { onChange: (e) => setValue('phone', maskPhone(e.target.value)) })} error={errors.phone?.message} />
        {pt === 'PF' && <Field label="CPF" required inputMode="numeric" {...register('cpf', { onChange: (e) => setValue('cpf', maskCPF(e.target.value)) })} error={errors.cpf?.message} hint="Necessário para a nota fiscal" />}
      </div>
      <div className="mt-8 flex justify-end">
        <button type="submit" className="btn-primary px-8">Continuar</button>
      </div>
    </form>
  );
}

function AddressStep({ defaults, onBack, onNext }: { defaults?: Partial<AddressIn>; onBack: () => void; onNext: (a: AddressOut) => void }) {
  const { register, handleSubmit, setValue, setFocus, formState: { errors } } = useForm<AddressIn>({
    resolver: zodResolver(addressSchema),
    defaultValues: { cep: '', street: '', number: '', complement: '', district: '', city: '', state: 'RS' as AddressIn['state'], reference: '', ...defaults },
  });
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const lookup = async (cep: string) => {
    if (onlyDigits(cep).length !== 8) return;
    setLoading(true);
    setCepError('');
    try {
      const res = await fetch(`/api/cep/${onlyDigits(cep)}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setValue('street', d.street, { shouldValidate: Boolean(d.street) });
      setValue('district', d.district, { shouldValidate: Boolean(d.district) });
      setValue('city', d.city, { shouldValidate: true });
      setValue('state', d.state, { shouldValidate: true });
      setFocus(d.street ? 'number' : 'street');
    } catch {
      setCepError('CEP não encontrado. Preencha o endereço manualmente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit((d) => onNext(d as unknown as AddressOut))} noValidate>
      <h2 className="text-xl">Endereço</h2>
      <p className="mt-1 text-sm text-cimento-700">Usado para entrega e para a nota fiscal (também se você retirar na loja).</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Field
            label="CEP"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            {...register('cep', {
              onChange: (e) => {
                const v = maskCEP(e.target.value);
                setValue('cep', v);
                if (onlyDigits(v).length === 8) lookup(v);
              },
            })}
            error={errors.cep?.message ?? cepError}
          />
          {loading && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-petroleo-700" aria-label="Buscando CEP" />}
        </div>
        <Field label="Rua" required autoComplete="address-line1" className="sm:col-span-4" {...register('street')} error={errors.street?.message} />
        <Field label="Número" required className="sm:col-span-2" {...register('number')} error={errors.number?.message} />
        <Field label="Complemento" autoComplete="address-line2" className="sm:col-span-4" {...register('complement')} />
        <Field label="Bairro" required className="sm:col-span-2" {...register('district')} error={errors.district?.message} />
        <Field label="Cidade" required autoComplete="address-level2" className="sm:col-span-3" {...register('city')} error={errors.city?.message} />
        <Field label="UF" required maxLength={2} autoComplete="address-level1" className="sm:col-span-1" {...register('state', { setValueAs: (v: string) => v.toUpperCase() })} error={errors.state?.message} />
        <Field label="Ponto de referência" className="sm:col-span-6" {...register('reference')} />
      </div>
      <div className="mt-8 flex justify-between">
        <button type="button" className="btn-ghost" onClick={onBack}>Voltar</button>
        <button type="submit" className="btn-primary px-8">Continuar</button>
      </div>
    </form>
  );
}

function DeliveryStep({
  cep, city, state, items, options, setOptions, selected, onSelect, onBack, onNext,
}: {
  cep: string;
  city: string;
  state: string;
  items: { productId: string; quantity: number }[];
  options: ShippingOption[];
  setOptions: (o: ShippingOption[]) => void;
  selected: ShippingOption | null;
  onSelect: (o: ShippingOption) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [outOfArea, setOutOfArea] = useState(false);
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch('/api/frete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: itemsKey ? JSON.stringify({ cep, city, state, items: JSON.parse(itemsKey) }) : '{}' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? 'Erro ao calcular o frete');
        if (!alive) return;
        setOptions(d.options);
        setOutOfArea(d.outOfArea);
        if (!selected) onSelect(d.options[0]);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, city, state, itemsKey]);

  return (
    <div>
      <h2 className="text-xl">Entrega ou retirada</h2>
      <div className="mt-6 space-y-3" role="radiogroup" aria-label="Opções de entrega" aria-busy={loading}>
        {loading && [0, 1].map((i) => <div key={i} className="skeleton h-20" />)}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {!loading &&
          options.map((o) => {
            const active = selected?.label === o.label;
            return (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(o)}
                className={cn('flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition', active ? 'border-petroleo-800 bg-petroleo-50' : 'border-cimento-200 hover:border-petroleo-300')}
              >
                <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-petroleo-800' : 'border-cimento-400')}>
                  {active && <motion.span layoutId="ship-dot" className="h-2.5 w-2.5 rounded-full bg-petroleo-800" />}
                </span>
                {o.method === 'retirada' ? <Store className="h-6 w-6 shrink-0 text-seguranca-600" aria-hidden /> : <Truck className="h-6 w-6 shrink-0 text-seguranca-600" aria-hidden />}
                <span className="flex-1">
                  <b className="block text-petroleo-950">{o.label}</b>
                  <span className="text-sm text-cimento-700">{o.description}</span>
                </span>
                <b className={o.price === 0 ? 'text-emerald-700' : 'text-petroleo-950'}>{o.price === 0 ? 'Grátis' : formatBRL(o.price)}</b>
              </button>
            );
          })}
        {!loading && outOfArea && (
          <p className="text-sm text-cimento-700">Ainda não entregamos no seu CEP. Você pode retirar na loja ou pedir um frete especial pelo WhatsApp.</p>
        )}
      </div>
      <div className="mt-8 flex justify-between">
        <button type="button" className="btn-ghost" onClick={onBack}>Voltar</button>
        <button type="button" className="btn-primary px-8" disabled={!selected || loading} onClick={onNext}>Continuar</button>
      </div>
    </div>
  );
}

function CouponBox({
  applied, initial, items, onApply,
}: {
  applied: { code: string; discount: number; freeShipping: boolean; description: string | null } | null;
  initial: string;
  items: { productId: string; quantity: number }[];
  onApply: (c: { code: string; discount: number; freeShipping: boolean; description: string | null } | null) => void;
}) {
  const [code, setCode] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cupom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, items }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Cupom inválido');
      onApply(d);
    } catch (err) {
      setError((err as Error).message);
      onApply(null);
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
        <span className="flex items-center gap-2"><Tag className="h-4 w-4" aria-hidden /> <b>{applied.code}</b> aplicado</span>
        <button type="button" className="text-xs font-semibold underline" onClick={() => onApply(null)}>Remover</button>
      </div>
    );
  }
  return (
    <form onSubmit={apply} className="mt-4">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="coupon">Cupom de desconto</label>
        <input id="coupon" className="input py-2 uppercase" placeholder="Cupom de desconto" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} aria-invalid={Boolean(error)} />
        <button type="submit" className="btn-outline px-4 py-2" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}</button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  );
}
