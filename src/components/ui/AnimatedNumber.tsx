'use client';

import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * Número animado (contadores e subtotal).
 * O valor é escrito direto no DOM a cada frame — sem re-render do React — para não travar
 * quando há vários números animando juntos (carrinho, calculadora).
 * - `startOnView`: só começa quando entra na tela (seção "Por que nos escolher").
 * - Com prefers-reduced-motion o valor final aparece direto.
 */
export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString('pt-BR'),
  duration = 0.5,
  startOnView = false,
  className,
}: {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  startOnView?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const current = useRef(startOnView ? 0 : value);
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const el = ref.current;
    if (!el || (startOnView && !inView)) return;
    if (reduce || current.current === value) {
      current.current = value;
      el.textContent = formatRef.current(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v;
        el.textContent = formatRef.current(v);
      },
    });
    return () => controls.stop();
  }, [value, inView, startOnView, reduce, duration]);

  return (
    <span ref={ref} className={className} aria-live={startOnView ? undefined : 'polite'}>
      {format(startOnView ? 0 : value)}
    </span>
  );
}
