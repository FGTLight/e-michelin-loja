import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/api';
import { saveProduct } from '@/lib/admin-products';
import { requireAdmin } from '@/lib/auth';
import { productAdminSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  try {
    const saved = await saveProduct(productAdminSchema.parse(await req.json()));
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status;
    return status ? NextResponse.json({ error: (e as Error).message }, { status }) : apiError(e);
  }
}
