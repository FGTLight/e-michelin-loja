'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useUi } from '@/store/ui';

/**
 * Camada global da animação "voar para o carrinho".
 * A imagem sai do card/galeria e faz um arco (x linear, y com easing diferente) até o ícone do carrinho.
 * Usa apenas transform/opacity → roda a 60 fps na GPU.
 */
export function FlyToCartLayer() {
  const { flying, land } = useUi();

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <AnimatePresence>
        {flying.map((f) => {
          const size = Math.min(f.from.w, f.from.h, 140);
          const startX = f.from.x + f.from.w / 2 - size / 2;
          const startY = f.from.y + f.from.h / 2 - size / 2;
          return (
            <motion.div
              key={f.id}
              className="absolute left-0 top-0 overflow-hidden rounded-2xl bg-white shadow-lift ring-4 ring-seguranca-500"
              style={{ width: size, height: size }}
              initial={{ x: startX, y: startY, scale: 1, opacity: 1, rotate: 0 }}
              animate={{
                x: f.to.x - size / 2,
                y: [startY, startY - 80, f.to.y - size / 2],
                scale: 0.12,
                opacity: [1, 1, 0.6],
                rotate: 25,
              }}
              transition={{
                duration: 0.75,
                x: { duration: 0.75, ease: [0.45, 0, 0.55, 1] },
                y: { duration: 0.75, times: [0, 0.35, 1], ease: ['easeOut', 'easeIn'] },
              }}
              onAnimationComplete={() => land(f.id)}
            >
              {f.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.image} alt="" className="h-full w-full object-cover" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
