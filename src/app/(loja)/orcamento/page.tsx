import type { Metadata } from 'next';
import { QuoteForm } from '@/components/checkout/QuoteForm';

export const metadata: Metadata = {
  title: 'Pedir orçamento para obra',
  description: 'Monte a lista de materiais da sua obra e receba um orçamento personalizado da E Michelin e Cia em até 1 dia útil.',
  alternates: { canonical: '/orcamento' },
};

export default function QuotePage() {
  return (
    <div className="container py-8 sm:py-12">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow">Para obras grandes e construtoras</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Pedir orçamento</h1>
        <p className="mt-2 text-cimento-700">Envie a lista de materiais e receba preço especial por volume, condições de pagamento e programação de entregas.</p>
      </header>
      <QuoteForm />
    </div>
  );
}
