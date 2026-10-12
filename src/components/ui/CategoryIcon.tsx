'use client';

import { motion, type Variants } from 'framer-motion';

/**
 * Ícones de categoria animados. A animação é disparada pelo variant "hover"
 * propagado do elemento pai (`<motion.a whileHover="hover" whileFocus="hover">`).
 */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const wobble: Variants = { hover: { rotate: [0, -8, 8, -4, 0], transition: { duration: 0.6 } } };
const drip: Variants = { rest: { y: 0, opacity: 1 }, hover: { y: [0, 8, 0], opacity: [1, 0, 1], transition: { duration: 0.9, repeat: Infinity } } };
const flicker: Variants = { hover: { opacity: [1, 0.3, 1, 0.6, 1], scale: [1, 1.12, 1], transition: { duration: 0.7 } } };
const hammer: Variants = { hover: { rotate: [0, -28, 6, 0], transition: { duration: 0.5, repeat: 1 } } };
const roll: Variants = { hover: { y: [0, 6, 0], transition: { duration: 0.7, repeat: Infinity } } };
const tile = (i: number): Variants => ({ hover: { scale: [1, 0.7, 1], transition: { delay: i * 0.08, duration: 0.4 } } });
const roof: Variants = { rest: { y: 0 }, hover: { y: [-6, 0], transition: { type: 'spring', stiffness: 400, damping: 12 } } };
const spin: Variants = { hover: { rotate: 90, transition: { type: 'spring', stiffness: 200, damping: 10 } } };

export function CategoryIcon({ icon, className = 'h-10 w-10' }: { icon: string | null; className?: string }) {
  const svg = (children: React.ReactNode) => (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {children}
    </svg>
  );

  switch (icon) {
    case 'cimento':
      return svg(
        <motion.g variants={wobble} style={{ originX: '50%', originY: '100%' }}>
          <path d="M15 9h18l5 30H10z" {...stroke} />
          <path d="M14 16h20" {...stroke} />
          <path d="M19 26h10M20 31h8" {...stroke} />
        </motion.g>,
      );
    case 'hidraulica':
      return svg(
        <>
          <path d="M6 14h18a6 6 0 0 1 6 6v6" {...stroke} />
          <path d="M6 20h16v6" {...stroke} />
          <path d="M26 26h8" {...stroke} />
          <motion.path variants={drip} d="M30 33c0 3 4 3 4 0s-2-5-2-5-2 2-2 5z" fill="currentColor" />
          <path d="M36 10l4 4M38 8v8M34 12h8" {...stroke} />
        </>,
      );
    case 'eletrica':
      return svg(
        <motion.path variants={flicker} d="M27 5 13 27h10l-3 16 15-23H25l4-15z" {...stroke} style={{ originX: '50%', originY: '50%' }} />,
      );
    case 'ferramentas':
      return svg(
        <motion.g variants={hammer} style={{ originX: '20%', originY: '90%' }}>
          <path d="M10 40 28 22" {...stroke} />
          <path d="M24 12l12 12 4-4-4-4 2-2-6-6-2 2-2-2z" {...stroke} />
        </motion.g>,
      );
    case 'tintas':
      return svg(
        <motion.g variants={roll}>
          <rect x="8" y="8" width="26" height="10" rx="3" {...stroke} />
          <path d="M34 13h5v9H22v6" {...stroke} />
          <rect x="19" y="28" width="6" height="13" rx="2" {...stroke} />
        </motion.g>,
      );
    case 'pisos':
      return svg(
        <>
          {[[8, 8], [26, 8], [8, 26], [26, 26]].map(([x, y], i) => (
            <motion.rect key={i} variants={tile(i)} x={x} y={y} width="14" height="14" rx="2" {...stroke} style={{ originX: `${x + 7}px`, originY: `${y + 7}px` }} />
          ))}
        </>,
      );
    case 'telhas':
      return svg(
        <>
          <motion.path variants={roof} d="M5 24 24 9l19 15" {...stroke} />
          <path d="M10 22v18h28V22" {...stroke} />
          <path d="M20 40V30h8v10" {...stroke} />
        </>,
      );
    case 'ferragens':
      return svg(
        <motion.g variants={spin} style={{ originX: '50%', originY: '50%' }}>
          <path d="M24 6 39 15v18L24 42 9 33V15z" {...stroke} />
          <circle cx="24" cy="24" r="6" {...stroke} />
        </motion.g>,
      );
    default:
      return svg(<rect x="8" y="8" width="32" height="32" rx="6" {...stroke} />);
  }
}
