import { NextResponse } from 'next/server';
import { lookupCep } from '@/lib/shipping';

/** Proxy do ViaCEP com cache de 24h (evita CORS/limites e padroniza a resposta) */
export async function GET(_: Request, { params }: { params: { cep: string } }) {
  const data = await lookupCep(params.cep);
  if (!data) return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=86400' } });
}
