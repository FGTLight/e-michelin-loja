import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/account/LoginForm';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="container py-12 sm:py-16">
      <h1 className="mb-2 text-center text-3xl">Acesse sua conta</h1>
      <p className="mb-8 text-center text-cimento-700">Acompanhe pedidos, salve endereços e repita compras com um clique.</p>
      <Suspense>
        <LoginForm enabled={isSupabaseConfigured()} />
      </Suspense>
    </div>
  );
}
