/**
 * Transição suave entre páginas em CSS puro: o HTML do servidor nunca fica invisível
 * esperando o JavaScript (melhor LCP) e prefers-reduced-motion zera a animação (globals.css).
 * ⚠️ Não use transform/filter/will-change aqui: criariam um containing block e o pin do hero
 * (position: fixed) deixaria de funcionar — a tela ficava branca no meio do scroll.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
