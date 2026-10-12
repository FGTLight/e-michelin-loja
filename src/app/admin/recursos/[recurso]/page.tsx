import { notFound } from 'next/navigation';
import { ResourceManager } from '@/components/admin/ResourceManager';
import { isResourceKey, resources } from '@/lib/admin-resources';
import { getSupabaseServer } from '@/lib/supabase/server';

export function generateMetadata({ params }: { params: { recurso: string } }) {
  return { title: isResourceKey(params.recurso) ? resources[params.recurso].title : 'Painel' };
}

export default async function ResourcePage({ params }: { params: { recurso: string } }) {
  if (!isResourceKey(params.recurso)) notFound();
  const cfg = resources[params.recurso];
  const { data } = await getSupabaseServer().from(cfg.table).select('*').order(cfg.order, { ascending: cfg.order !== 'created_at' });
  return <ResourceManager resource={params.recurso} rows={(data ?? []) as (Record<string, unknown> & { id: string })[]} />;
}
