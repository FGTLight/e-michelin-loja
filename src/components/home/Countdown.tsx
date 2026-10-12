'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms / 3_600_000) % 24),
    m: Math.floor((ms / 60_000) % 60),
    s: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  const v = value.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-petroleo-950 sm:h-14 sm:w-14">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={v}
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center font-display text-xl font-extrabold tabular-nums text-white sm:text-2xl"
          >
            {v}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-petroleo-200">{label}</span>
    </div>
  );
}

/** Contador regressivo até o fim das ofertas (atualiza a cada segundo, só no cliente) */
export function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t) return <div className="h-[72px]" aria-hidden />;
  if (t.done) return <p className="font-bold text-seguranca-300">Ofertas encerradas</p>;

  return (
    <div className="flex items-start gap-1.5 sm:gap-2" role="timer" aria-label={`As ofertas terminam em ${t.d} dias, ${t.h} horas e ${t.m} minutos`}>
      <Digit value={t.d} label="dias" />
      <span className="mt-3 font-bold text-seguranca-400" aria-hidden>:</span>
      <Digit value={t.h} label="horas" />
      <span className="mt-3 font-bold text-seguranca-400" aria-hidden>:</span>
      <Digit value={t.m} label="min" />
      <span className="mt-3 font-bold text-seguranca-400" aria-hidden>:</span>
      <Digit value={t.s} label="seg" />
    </div>
  );
}
