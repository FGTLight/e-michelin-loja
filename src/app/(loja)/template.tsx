/**
 * Transição suave entre páginas em CSS puro: o HTML do servidor nunca fica invisível
 * esperando o JavaScript (melhor LCP) e prefers-reduced-motion zera a animação (globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
