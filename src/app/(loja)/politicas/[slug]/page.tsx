import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';

/**
 * Políticas da loja. ⚠️ Modelos de referência — revise com o jurídico/contabilidade antes de publicar.
 */
type Section = { h: string; p: string[] };
const policies: Record<string, { title: string; intro: string; sections: Section[] }> = {
  'trocas-e-devolucoes': {
    title: 'Trocas e devoluções',
    intro: `Queremos que você compre com tranquilidade. Esta política segue o Código de Defesa do Consumidor (Lei nº 8.078/1990).`,
    sections: [
      { h: 'Direito de arrependimento (7 dias)', p: [
        'Para compras feitas pelo site, você pode desistir em até 7 (sete) dias corridos contados do recebimento do produto ou da retirada na loja, sem precisar justificar (art. 49 do CDC).',
        'O produto deve ser devolvido sem sinais de uso, na embalagem original sempre que possível, acompanhado da nota fiscal. O valor pago, incluindo o frete, é integralmente reembolsado.',
        `Para solicitar, fale com a gente pelo telefone ${site.phone}, pelo WhatsApp ou pelo e-mail ${site.email}, informando o número do pedido.`,
      ] },
      { h: 'Produtos com defeito', p: [
        'Produtos não duráveis têm 30 dias e duráveis 90 dias para reclamação de vícios aparentes (art. 26 do CDC). Fazemos a troca, o conserto ou a devolução do valor, conforme o caso e a análise do fabricante.',
      ] },
      { h: 'Itens que exigem atenção', p: [
        'Materiais vendidos a granel (areia, brita), cortados sob medida (cabos por metro) ou tintas preparadas sob encomenda (cor personalizada) só podem ser trocados em caso de defeito, pois não podem ser revendidos. O direito de arrependimento das compras online é sempre respeitado nos termos da lei.',
        'Sacos de cimento e argamassa devem estar lacrados e sem umidade.',
      ] },
      { h: 'Reembolso', p: [
        'Pix e boleto: reembolso por Pix em até 5 dias úteis após o recebimento do produto devolvido. Cartão: estorno solicitado à operadora no mesmo prazo, podendo aparecer em até duas faturas.',
      ] },
    ],
  },
  entrega: {
    title: 'Entrega e retirada',
    intro: 'Entregamos com frota própria em Erechim e cidades da região. Você também pode retirar na loja.',
    sections: [
      { h: 'Prazos', p: ['Erechim: até 1 dia útil após a confirmação do pagamento. Região: de 2 a 3 dias úteis, conforme a cidade.', 'Pedidos com itens a granel ou muito volumosos podem ser agendados com a equipe.'] },
      { h: 'Frete', p: ['Calculado pelo CEP e pelo peso total dos produtos. Cada região tem um valor mínimo de compra para frete grátis, informado no carrinho.'] },
      { h: 'Retirada na loja', p: [`Grátis, em ${site.address.full}. O pedido fica pronto em até ${site.pickupReadyHours} horas após a confirmação do pagamento; avisamos por e-mail e WhatsApp. Apresente documento com foto ou o número do pedido.`] },
      { h: 'Recebimento', p: ['Confira os produtos na entrega. Descarga até o portão/calçada do endereço; acesso para caminhão é necessário para materiais pesados.'] },
    ],
  },
  privacidade: {
    title: 'Política de Privacidade',
    intro: `Esta política explica como a ${site.legalName} (CNPJ ${site.cnpj}) trata seus dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).`,
    sections: [
      { h: 'Dados que coletamos', p: ['Cadastro e pedidos: nome, e-mail, telefone, CPF ou CNPJ, razão social, inscrição estadual e endereço.', 'Pagamento: processado pelo Mercado Pago. Não armazenamos dados de cartão — o cartão é tokenizado diretamente no ambiente do Mercado Pago.', 'Navegação: cookies essenciais (carrinho, sessão). Cookies de medição apenas com o seu consentimento.'] },
      { h: 'Para que usamos', p: ['Processar, faturar e entregar pedidos e orçamentos (execução de contrato — art. 7º, V).', 'Cumprir obrigações legais e fiscais, como emissão de nota fiscal (art. 7º, II).', 'Enviar ofertas por e-mail ou WhatsApp, somente se você autorizar (consentimento — art. 7º, I). Você pode cancelar a qualquer momento.'] },
      { h: 'Compartilhamento', p: ['Somente com parceiros necessários à operação: Mercado Pago (pagamentos), Supabase (hospedagem do banco de dados), Resend (e-mails transacionais), Meta/WhatsApp (mensagens) e transportadoras, quando aplicável. Não vendemos seus dados.'] },
      { h: 'Seus direitos', p: ['Confirmar e acessar seus dados, corrigir, solicitar anonimização ou eliminação, portabilidade e revogar consentimentos (art. 18). Na área "Minha conta → Dados e privacidade" você baixa seus dados e pode excluir a conta.', `Encarregado (DPO): ${site.email}.`] },
      { h: 'Retenção e segurança', p: ['Mantemos os dados pelo tempo necessário às finalidades acima e pelos prazos legais (ex.: 5 anos para documentos fiscais). Usamos criptografia em trânsito, controle de acesso por perfil e políticas de segurança no banco de dados (RLS).'] },
    ],
  },
  termos: {
    title: 'Termos de uso',
    intro: `Ao comprar no site da ${site.name} você concorda com estes termos.`,
    sections: [
      { h: 'Preços e estoque', p: ['Os preços do site valem para compras online e podem mudar sem aviso. O valor final é confirmado no checkout e calculado no servidor. Em caso de erro evidente de preço, o pedido pode ser cancelado com reembolso integral.'] },
      { h: 'Pagamento', p: ['Aceitamos Pix, cartão de crédito (parcelado conforme valor mínimo da parcela) e boleto. O pedido é separado após a confirmação do pagamento. Pix e boletos não pagos no prazo são cancelados automaticamente.'] },
      { h: 'Orçamentos', p: ['Orçamentos têm validade indicada no documento e estão sujeitos à disponibilidade de estoque na data da aprovação.'] },
      { h: 'Foro', p: ['Fica eleito o foro do domicílio do consumidor para dirimir quaisquer questões.'] },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = policies[params.slug];
  return p ? { title: p.title, alternates: { canonical: `/politicas/${params.slug}` } } : {};
}

export default function PolicyPage({ params }: { params: { slug: string } }) {
  const p = policies[params.slug];
  if (!p) notFound();
  return (
    <article className="container max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Políticas da loja</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{p.title}</h1>
      <p className="mt-4 text-lg text-cimento-800">{p.intro}</p>
      {p.sections.map((s) => (
        <section key={s.h} className="mt-8">
          <h2 className="text-xl">{s.h}</h2>
          {s.p.map((t) => <p key={t} className="mt-3 leading-relaxed text-cimento-800">{t}</p>)}
        </section>
      ))}
      <nav className="mt-12 flex flex-wrap gap-2 border-t border-cimento-200 pt-6 text-sm" aria-label="Outras políticas">
        {Object.entries(policies).filter(([k]) => k !== params.slug).map(([k, v]) => (
          <Link key={k} href={`/politicas/${k}`} className="btn-ghost px-3 py-1.5">{v.title}</Link>
        ))}
      </nav>
      <p className="mt-6 text-xs text-cimento-600">Última atualização: outubro de 2026.</p>
    </article>
  );
}
