'use client';

import { MotionConfig } from 'framer-motion';

/** reducedMotion="user": todas as animações do Framer Motion respeitam prefers-reduced-motion */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
