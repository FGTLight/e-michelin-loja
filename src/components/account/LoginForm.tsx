'use client';

import { Loader2, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Field, Segmented } from '@/components/ui/Field';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Mode = 'entrar' | 'cadastrar' | 'link';

export function LoginForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/conta';
  const [mode, setMode] = useState<Mode>('entrar');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enabled) return setMsg({ type: 'err', text: 'Login indisponível no modo demonstração (configure o Supabase).' });
    setLoading(true);
    setMsg(null);
    const sb = getSupabaseBrowser();
    const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    try {
      if (mode === 'entrar') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error('E-mail ou senha incorretos.');
        router.replace(next);
        router.refresh();
      } else if (mode === 'cadastrar') {
        if (password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: redirect } });
        if (error) throw error;
        setMsg({ type: 'ok', text: 'Conta criada! Confirme pelo link que enviamos para o seu e-mail.' });
      } else {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
        if (error) throw error;
        setMsg({ type: 'ok', text: 'Enviamos um link de acesso para o seu e-mail.' });
      }
    } catch (err) {
      setMsg({ type: 'err', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 p-6 sm:p-8" noValidate>
      <Segmented<Mode>
        label="Forma de acesso"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setMsg(null);
        }}
        options={[{ value: 'entrar', label: 'Entrar' }, { value: 'cadastrar', label: 'Criar conta' }, { value: 'link', label: 'Link por e-mail' }]}
      />
      {mode === 'cadastrar' && <Field label="Nome completo" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />}
      <Field label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode !== 'link' && (
        <Field
          label="Senha"
          type="password"
          autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={mode === 'cadastrar' ? 'Mínimo de 8 caracteres' : undefined}
        />
      )}
      {msg && (
        <p role={msg.type === 'err' ? 'alert' : 'status'} className={msg.type === 'err' ? 'rounded-lg bg-red-50 p-3 text-sm text-red-800' : 'rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900'}>
          {msg.text}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'link' && <Mail className="h-4 w-4" aria-hidden />}
        {mode === 'entrar' ? 'Entrar' : mode === 'cadastrar' ? 'Criar conta' : 'Enviar link de acesso'}
      </button>
      <p className="text-center text-xs text-cimento-600">Ao criar uma conta você concorda com a Política de Privacidade (LGPD).</p>
    </form>
  );
}
