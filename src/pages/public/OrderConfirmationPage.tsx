import { Link, useSearchParams } from "react-router-dom";

export function OrderConfirmationPage() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const orderCode = params.get("pedido");
  const approved = status === "success";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbf6ee] px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm">
        <p className="font-display text-3xl text-brand-orange">
          {approved ? "Pagamento aprovado!" : status === "pending" ? "Pagamento pendente" : "Pagamento não concluído"}
        </p>
        <p className="mt-3 text-sm text-black/60">
          {approved
            ? "Seu pedido foi recebido. Acompanhe o preparo pelo código abaixo."
            : "Você pode voltar ao cardápio e tentar novamente ou falar com a loja."}
        </p>
        {orderCode && <p className="mt-4 font-semibold">Pedido: {orderCode}</p>}
        <div className="mt-6 flex gap-2">
          <Link to="/" className="flex-1 rounded-lg bg-brand-orange px-4 py-3 font-semibold text-white">
            Voltar ao cardápio
          </Link>
          {orderCode && (
            <Link to={`/rastreio?codigo=${encodeURIComponent(orderCode)}`} className="flex-1 rounded-lg border border-brand-orange px-4 py-3 font-semibold text-brand-orange">
              Rastrear
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
