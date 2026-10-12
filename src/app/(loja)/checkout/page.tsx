import type { Metadata } from 'next';
import { CheckoutWizard, type CheckoutDefaults } from '@/components/checkout/CheckoutWizard';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { maskCEP, maskCNPJ, maskCPF, maskPhone } from '@/lib/utils';

export const metadata: Metadata = { title: 'Finalizar compra', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const defaults: CheckoutDefaults = {};
  const user = await getCurrentUser();
  if (user) {
    const sb = getSupabaseServer();
    const { data: c } = await sb.from('customers').select('*, addresses(*)').eq('user_id', user.id).maybeSingle();
    defaults.customer = c
      ? {
          personType: c.person_type,
          name: c.name,
          email: c.email,
          phone: maskPhone(c.phone ?? ''),
          cpf: maskCPF(c.cpf ?? ''),
          cnpj: maskCNPJ(c.cnpj ?? ''),
          companyName: c.company_name ?? '',
          stateRegistration: c.state_registration ?? '',
        }
      : { email: user.email ?? '', name: (user.user_metadata?.full_name as string) ?? '' };
    const addr = (c?.addresses ?? []).find((a: { is_default: boolean }) => a.is_default) ?? c?.addresses?.[0];
    if (addr) defaults.address = { ...addr, cep: maskCEP(addr.cep), complement: addr.complement ?? '', reference: addr.reference ?? '' };
  }

  return (
    <div className="container py-8 sm:py-12">
      <h1 className="mb-8 text-3xl">Finalizar compra</h1>
      <CheckoutWizard defaults={defaults} demo={!isSupabaseConfigured()} />
    </div>
  );
}
