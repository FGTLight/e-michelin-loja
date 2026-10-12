'use client';

import { animate, useInView, useMotionValue, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * Número animado (contadores e subtotal).
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
  const mv = useMotionValue(startOnView ? 0 : value);
  const [display, setDisplay] = useState(format(startOnView ? 0 : value));

  useEffect(() => mv.on('change', (v) => setDisplay(format(v))), [mv, format]);

  useEffect(() => {
    if (startOnView && !inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, inView, startOnView, reduce, duration, mv]);

  return (
    <span ref={ref} className={className} aria-live={startOnView ? undefined : 'polite'}>
      {display}
    </span>
  );
}
