'use client';

import { initMercadoPago } from '@mercadopago/sdk-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Barcode, Check, Copy, CreditCard, ExternalLink, Loader2, QrCode } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn, formatBRL, formatDate, maxInstallments } from '@/lib/utils';
import type { Payment, PaymentMethod } from '@/types';

// O Brick de cartão carrega o SDK do Mercado Pago só quando necessário
const CardPayment = dynamic(() => import('@mercadopago/sdk-react').then((m) => m.CardPayment), {
  ssr: false,
  loading: () => <div className="skeleton h-72" />,
});

let mpReady = false;

type PaymentView = Pick<Payment, 'method' | 'status' | 'status_detail' | 'pix_qr_code' | 'pix_qr_code_base64' | 'boleto_url' | 'boleto_barcode' | 'expires_at'>;

interface Props {
  token: string;
  total: number;
  email: string;
  initialMethod: PaymentMethod;
  existing: PaymentView | null;
  publicKey: string | null;
  simulated: boolean;
}

export function PaymentPanel({ token, total, email, initialMethod, existing, publicKey, simulated }: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [payment, setPayment] = useState<PaymentView | null>(existing?.method === initialMethod ? existing : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const requested = useRef<Set<PaymentMethod>>(new Set());

  if (publicKey && !mpReady && typeof window !== 'undefined') {
    initMercadoPago(publicKey, { locale: 'pt-BR' });
    mpReady = true;
  }

  const request = async (m: PaymentMethod, body: Record<string, unknown> = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: m, orderToken: token, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao gerar o pagamento');
      setPayment(data);
      if (data.status === 'approved') router.refresh();
      if (data.status === 'rejected') setError('Pagamento recusado pelo emissor. Confira os dados ou use outro cartão/forma de pagamento.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Pix e boleto são gerados automaticamente ao escolher o método
  useEffect(() => {
    if (method === 'cartao' || requested.current.has(method)) return;
    if (payment?.method === method) return;
    requested.current.add(method);
    request(method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  // Acompanha a confirmação (webhook) enquanto aguarda
  useEffect(() => {
    const id = setInterval(async () => {
      const r = await fetch(`/api/pedidos/${token}`, { cache: 'no-store' });
      if (r.ok && (await r.json()).status !== 'aguardando_pagamento') router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [token, router]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'pix' as const, label: 'Pix', icon: QrCode },
    { id: 'cartao' as const, label: 'Cartão', icon: CreditCard },
    { id: 'boleto' as const, label: 'Boleto', icon: Barcode },
  ];
  const shown = payment?.method === method ? payment : null;

  return (
    <section className="card overflow-hidden" aria-labelledby="pay-title">
      <div className="border-b border-cimento-200 p-5 sm:px-8">
        <h2 id="pay-title" className="text-xl">Pagamento · {formatBRL(total)}</h2>
        {simulated && <p className="mt-1 text-xs font-semibold text-amber-800">Ambiente de desenvolvimento: cobranças simuladas (sem Mercado Pago configurado).</p>}
      </div>
      <div role="tablist" aria-label="Forma de pagamento" className="flex border-b border-cimento-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={method === t.id}
            onClick={() => setMethod(t.id)}
            className={cn('relative flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold transition', method === t.id ? 'text-petroleo-950' : 'text-cimento-600 hover:text-petroleo-900')}
          >
            <t.icon className="h-4 w-4" aria-hidden /> {t.label}
            {method === t.id && <motion.span layoutId="pay-tab" className="absolute inset-x-0 bottom-0 h-1 bg-seguranca-500" />}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-8" role="tabpanel" aria-live="polite">
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
        <AnimatePresence mode="wait">
          <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {loading && method !== 'cartao' && (
              <div className="flex flex-col items-center gap-3 py-10 text-cimento-700">
                <Loader2 className="h-8 w-8 animate-spin text-petroleo-700" /> Gerando {method === 'pix' ? 'QR Code Pix' : 'boleto'}…
              </div>
            )}

            {method === 'pix' && shown?.pix_qr_code && !loading && (
              <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
                <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-white p-2 ring-1 ring-cimento-200">
                  {shown.pix_qr_code_base64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`data:image/png;base64,${shown.pix_qr_code_base64}`} alt="QR Code Pix para pagamento" className="h-full w-full" />
                  ) : (
                    <QrCode className="h-32 w-32 text-cimento-400" aria-label="QR Code simulado" />
                  )}
                </div>
                <div>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-cimento-800">
                    <li>Abra o app do seu banco e escolha <b>Pix → Ler QR Code</b> ou <b>Pix Copia e Cola</b>.</li>
                    <li>Confira o valor de <b>{formatBRL(total)}</b> e confirme.</li>
                    <li>Pronto! A confirmação aparece aqui automaticamente.</li>
                  </ol>
                  <label className="label mt-4" htmlFor="pix-code">Pix Copia e Cola</label>
                  <div className="flex gap-2">
                    <input id="pix-code" readOnly value={shown.pix_qr_code} className="input truncate font-mono text-xs" onFocus={(e) => e.target.select()} />
                    <button type="button" onClick={() => copy(shown.pix_qr_code!)} className="btn-primary shrink-0 px-4">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  {shown.expires_at && <p className="mt-2 text-xs text-cimento-600">Válido até {formatDate(shown.expires_at, true)}</p>}
                </div>
              </div>
            )}

            {method === 'boleto' && shown?.boleto_url && !loading && (
              <div>
                <p className="text-sm text-cimento-800">Pague em qualquer banco, lotérica ou app. A compensação leva até 2 dias úteis e o pedido é separado após a confirmação.</p>
                {shown.boleto_barcode && (
                  <>
                    <label className="label mt-4" htmlFor="boleto-code">Linha digitável</label>
                    <div className="flex gap-2">
                      <input id="boleto-code" readOnly value={shown.boleto_barcode} className="input font-mono text-xs" />
                      <button type="button" onClick={() => copy(shown.boleto_barcode!)} className="btn-outline shrink-0 px-4">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar
                      </button>
                    </div>
                  </>
                )}
                <a href={shown.boleto_url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4">
                  <ExternalLink className="h-4 w-4" aria-hidden /> Abrir boleto
                </a>
                {shown.expires_at && <p className="mt-2 text-xs text-cimento-600">Vencimento: {formatDate(shown.expires_at)}</p>}
              </div>
            )}

            {method === 'cartao' &&
              (publicKey ? (
                <CardPayment
                  initialization={{ amount: total, payer: { email } }}
                  customization={{
                    paymentMethods: { maxInstallments: maxInstallments(total) },
                    visual: { style: { theme: 'default', customVariables: { baseColor: '#123848' } } },
                  }}
                  onSubmit={async (data) => {
                    await request('cartao', {
                      token: data.token,
                      installments: data.installments,
                      paymentMethodId: data.payment_method_id,
                      issuerId: data.issuer_id,
                      payer: { email: data.payer.email, identification: data.payer.identification },
                    });
                  }}
                  onError={(e) => console.error('[CardPayment]', e)}
                />
              ) : (
                <div className="rounded-xl bg-cimento-50 p-5 text-sm text-cimento-800">
                  <p>Configure <code>NEXT_PUBLIC_MP_PUBLIC_KEY</code> para exibir o formulário seguro de cartão do Mercado Pago.</p>
                  {simulated && (
                    <button type="button" className="btn-dark mt-4" disabled={loading} onClick={() => request('cartao', { token: 'simulated-card-token', installments: 1, paymentMethodId: 'visa', payer: { email } })}>
                      Simular cartão
                    </button>
                  )}
                </div>
              ))}
          </motion.div>
        </AnimatePresence>

        {simulated && (
          <button
            type="button"
            className="btn-outline mt-6 w-full border-dashed"
            onClick={async () => {
              await fetch('/api/pagamentos/simular', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderToken: token }) });
              router.refresh();
            }}
          >
            Simular pagamento aprovado (dev)
          </button>
        )}
      </div>
    </section>
  );
}
