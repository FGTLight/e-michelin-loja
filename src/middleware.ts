import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Ignora estáticos, imagens e o webhook (que é verificado por assinatura própria)
  matcher: ['/((?!_next/static|_next/image|images|favicon.ico|api/webhooks|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)'],
};
