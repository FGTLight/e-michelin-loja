import StoreLayout from './(loja)/layout';
import StoreNotFound from './(loja)/not-found';

/** 404 global (URLs que não casam com nenhuma rota) com o layout da loja */
export default function NotFound() {
  return (
    <StoreLayout>
      <StoreNotFound />
    </StoreLayout>
  );
}
