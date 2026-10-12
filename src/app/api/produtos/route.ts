import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getProductsByIds } from '@/lib/data';

/** Dados atuais de produtos por ID (usado em "repetir pedido" para trazer preços e estoque de hoje) */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') ?? '').split(',').filter((id) => z.string().uuid().safeParse(id).success).slice(0, 100);
  if (!ids.length) return NextResponse.json({ products: [] });
  return NextResponse.json({ products: await getProductsByIds(ids) });
}
