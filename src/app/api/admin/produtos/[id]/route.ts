import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/api';
import { revalidateCatalog, saveProduct } from '@/lib/admin-products';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { productAdminSchema } from '@/lib/validators';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  try {
    return NextResponse.json(await saveProduct(productAdminSchema.parse(await req.json()), params.id));
  } catch (e) {
    const status = (e as { status?: number }).status;
    return status ? NextResponse.json({ error: (e as Error).message }, { status }) : apiError(e);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { data, error } = await getSupabaseServer().from('products').delete().eq('id', params.id).select('slug').single();
  if (error) return apiError(error);
  revalidateCatalog(data.slug);
  return NextResponse.json({ ok: true });
}
