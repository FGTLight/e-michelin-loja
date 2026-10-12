'use client';

import { useState } from 'react';

export function DeleteAccountButton() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle');
  const remove = async () => {
    setStep('loading');
    const res = await fetch('/api/conta/dados', { method: 'DELETE' });
    if (res.ok) window.location.href = '/';
    else setStep('confirm');
  };
  if (step === 'idle') {
    return <button type="button" className="btn mt-4 border-2 border-red-700 text-red-700 hover:bg-red-50" onClick={() => setStep('confirm')}>Solicitar exclusão</button>;
  }
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-3">
      <p className="text-sm font-semibold text-red-900">Tem certeza? Esta ação não pode ser desfeita.</p>
      <button type="button" className="btn bg-red-700 px-4 py-2 text-white hover:bg-red-800" disabled={step === 'loading'} onClick={remove}>Sim, excluir</button>
      <button type="button" className="btn-ghost px-4 py-2" onClick={() => setStep('idle')}>Cancelar</button>
    </div>
  );
}
