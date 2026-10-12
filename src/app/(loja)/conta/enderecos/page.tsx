import { AddressBook } from '@/components/account/AddressBook';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { Address } from '@/types';

export default async function AddressesPage() {
  const user = await getCurrentUser();
  const { data: customer } = await getSupabaseServer()
    .from('customers')
    .select('id, addresses(*)')
    .eq('user_id', user!.id)
    .maybeSingle();
  const addresses = ((customer?.addresses ?? []) as Address[]).sort((a, b) => Number(b.is_default) - Number(a.is_default));
  return (
    <div>
      <h2 className="mb-6 text-2xl">Endereços salvos</h2>
      <AddressBook customerId={customer?.id ?? null} addresses={addresses} />
    </div>
  );
}
