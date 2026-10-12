import Link from 'next/link';
import { DeleteAccountButton } from '@/components/account/DeleteAccountButton';

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Dados e privacidade</h2>
      <section className="card p-6">
        <h3 className="text-lg">Baixar meus dados</h3>
        <p className="mt-1 text-sm text-cimento-700">Receba uma cópia dos seus dados cadastrais, endereços, pedidos e orçamentos em formato JSON (portabilidade, LGPD art. 18, V).</p>
        <a href="/api/conta/dados" className="btn-outline mt-4">Baixar dados</a>
      </section>
      <section className="card border border-red-200 p-6">
        <h3 className="text-lg">Excluir minha conta</h3>
        <p className="mt-1 text-sm text-cimento-700">
          Seus dados cadastrais e endereços serão anonimizados e o acesso removido. Pedidos já realizados são mantidos pelo prazo exigido pela legislação fiscal.
          Veja a <Link href="/politicas/privacidade" className="font-semibold underline">Política de Privacidade</Link>.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
