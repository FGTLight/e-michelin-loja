'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'emichelin-consent-v1';

/**
 * Aviso de cookies (LGPD). A loja usa apenas armazenamento essencial (carrinho, sessão).
 * Cookies opcionais (ex.: analytics) só devem ser carregados se consent === 'all'.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* navegação privada */
    }
  }, []);

  const save = (value: 'essential' | 'all') => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ value, at: new Date().toISOString() }));
    } catch {}
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label="Aviso de cookies"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl bg-white p-4 shadow-lift ring-1 ring-cimento-200 sm:bottom-5 sm:flex sm:items-center sm:gap-4 sm:p-5"
        >
          <p className="text-sm text-cimento-800">
            Usamos cookies essenciais para o carrinho e o login funcionarem. Com sua permissão, também usamos cookies de
            medição para melhorar a loja. Saiba mais na{' '}
            <Link href="/politicas/privacidade" className="font-semibold text-petroleo-800 underline">
              Política de Privacidade
            </Link>
            .
          </p>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button type="button" className="btn-outline px-4 py-2" onClick={() => save('essential')}>
              Só essenciais
            </button>
            <button type="button" className="btn-primary px-4 py-2" onClick={() => save('all')}>
              Aceitar todos
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
