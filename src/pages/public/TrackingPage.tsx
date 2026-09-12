import { useMemo, useState } from "react";
import { Bike, CheckCircle2, Clock3, MapPin, Search } from "lucide-react";
import { useOrderStore } from "../../store/orderStore";
import { useMotoboyStore } from "../../store/motoboyStore";
import { formatDateTime } from "../../lib/utils";
import type { OrderStatus } from "../../types";

const steps: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Pedido recebido" },
  { status: "preparing", label: "Em preparo" },
  { status: "out_for_delivery", label: "Saiu para entrega" },
  { status: "delivered", label: "Entregue" },
];

export function TrackingPage() {
  const orders = useOrderStore((s) => s.orders);
  const motoboys = useMotoboyStore((s) => s.motoboys);
  const [code, setCode] = useState("");
  const [searchedCode, setSearchedCode] = useState("");

  const order = useMemo(
    () => orders.find((item) => item.code.toLowerCase() === searchedCode.trim().toLowerCase()),
    [orders, searchedCode],
  );
  const motoboy = order?.motoboyId ? motoboys.find((item) => item.id === order.motoboyId) : undefined;
  const currentIndex = order ? steps.findIndex((step) => step.status === order.status) : -1;

  function searchOrder(event: React.FormEvent) {
    event.preventDefault();
    setSearchedCode(code);
  }

  return (
    <main className="min-h-screen bg-[#fbf6ee] px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <p className="font-display text-3xl text-brand-orange">Rastrear pedido</p>
          <p className="mt-2 text-sm text-black/50">Informe o código recebido no atendimento.</p>
        </div>

        <form onSubmit={searchOrder} className="flex gap-2">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Ex: #0001"
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-4 py-3 outline-none focus:border-brand-orange"
            aria-label="Código do pedido"
          />
          <button className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-3 font-semibold text-white">
            <Search size={18} /> Buscar
          </button>
        </form>

        {searchedCode && !order && (
          <div className="rounded-xl bg-white p-5 text-center text-sm text-red-600 shadow-sm">
            Pedido não encontrado. Confira o código e tente novamente.
          </div>
        )}

        {order && (
          <section className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-black/40">Pedido</p>
                <h1 className="font-display text-2xl text-brand-black">{order.code}</h1>
                <p className="text-sm text-black/50">{order.customerName}</p>
              </div>
              <Clock3 className="text-brand-orange" />
            </div>

            {order.status === "cancelled" ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Este pedido foi cancelado.</p>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.status} className="flex items-center gap-3">
                    <CheckCircle2
                      size={22}
                      className={index <= currentIndex ? "text-brand-orange" : "text-black/15"}
                    />
                    <span className={index <= currentIndex ? "font-semibold text-brand-black" : "text-black/35"}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {order.status === "out_for_delivery" && (
              <div className="space-y-3 rounded-xl bg-brand-cream/35 p-4">
                <div className="flex items-center gap-2 font-semibold text-brand-black">
                  <Bike size={20} className="text-brand-orange" />
                  Entrega em andamento
                </div>
                {motoboy && <p className="text-sm">Motoboy: {motoboy.name}</p>}
                {order.trackingNote && <p className="text-sm text-black/60">{order.trackingNote}</p>}
                {order.trackingLatitude !== undefined && order.trackingLongitude !== undefined && (
                  <a
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange underline"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${order.trackingLatitude},${order.trackingLongitude}`}
                  >
                    <MapPin size={16} /> Ver localização no mapa
                  </a>
                )}
                {order.trackingUpdatedAt && (
                  <p className="text-xs text-black/40">Atualizado em {formatDateTime(order.trackingUpdatedAt)}</p>
                )}
                {!order.trackingNote && order.trackingLatitude === undefined && (
                  <p className="text-xs text-black/45">A localização ainda não foi atualizada pela loja.</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
