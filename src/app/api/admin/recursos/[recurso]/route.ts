import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { revalidateCatalog } from '@/lib/admin-products';
import { isResourceKey, resources } from '@/lib/admin-resources';
import { apiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

type Ctx = { params: { recurso: string } };

async function guard(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };
  if (!isResourceKey(params.recurso)) return { error: NextResponse.json({ error: 'Recurso inválido' }, { status: 404 }) };
  const id = req.nextUrl.searchParams.get('id');
  if (id && !z.string().uuid().safeParse(id).success) return { error: NextResponse.json({ error: 'ID inválido' }, { status: 400 }) };
  return { cfg: resources[params.recurso], id };
}

const friendly = (e: { code?: string; message?: string }) =>
  e.code === '23505' ? 'Já existe um registro com este código/slug.' : e.code === '23503' ? 'Registro em uso por outros dados; desative em vez de excluir.' : null;

export async function POST(req: NextRequest, ctx: Ctx) {
  const g = await guard(req, ctx);
  if ('error' in g) return g.error;
  try {
    const data = g.cfg.schema.parse(await req.json()) as Record<string, unknown>;
    const { error } = await getSupabaseServer().from(g.cfg.table).insert(data);
    if (error) return NextResponse.json({ error: friendly(error) ?? 'Erro ao salvar' }, { status: 400 });
    revalidateCatalog();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const g = await guard(req, ctx);
  if ('error' in g) return g.error;
  if (!g.id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  try {
    const data = g.cfg.schema.parse(await req.json()) as Record<string, unknown>;
    delete data.used_count; // contador de uso de cupom é controlado pelo sistema
    const { error } = await getSupabaseServer().from(g.cfg.table).update(data).eq('id', g.id);
    if (error) return NextResponse.json({ error: friendly(error) ?? 'Erro ao salvar' }, { status: 400 });
    revalidateCatalog();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const g = await guard(req, ctx);
  if ('error' in g) return g.error;
  if (!g.id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  const { error } = await getSupabaseServer().from(g.cfg.table).delete().eq('id', g.id);
  if (error) return NextResponse.json({ error: friendly(error) ?? 'Erro ao excluir' }, { status: 400 });
  revalidateCatalog();
  return NextResponse.json({ ok: true });
}
