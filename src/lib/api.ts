import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { OrderError } from './orders';

/** Resposta de erro padronizada — nunca vaza detalhes internos ao cliente. */
export function apiError(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json({ error: 'Dados inválidos', issues: e.flatten().fieldErrors }, { status: 422 });
  }
  if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error('[api]', e);
  return NextResponse.json({ error: 'Erro inesperado. Tente novamente em instantes.' }, { status: 500 });
}

/** Rate limit simples em memória (por instância). Em produção prefira Upstash/Redis. */
const hits = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'local';
