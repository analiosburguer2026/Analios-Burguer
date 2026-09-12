import { useMemo, useState } from "react";
import { Plus, Trash2, MessageCircle, ClipboardList, MapPin } from "lucide-react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Field, Input, Select, Textarea } from "../components/ui/Form";
import { useCatalogStore } from "../store/catalogStore";
import { useCustomerStore } from "../store/customerStore";
import { useMotoboyStore } from "../store/motoboyStore";
import { useOrderStore } from "../store/orderStore";
import { usePromotionStore, isPromotionCurrentlyValid } from "../store/promotionStore";
import { useSettingsStore } from "../store/settingsStore";
import { formatCurrency, formatDateTime, buildWhatsAppLink } from "../lib/utils";
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "../types";
import { v4 as uuid } from "uuid";

const statusFlow: OrderStatus[] = ["pending", "preparing", "out_for_delivery", "delivered"];

const statusLabels: Record<OrderStatus, { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  pending: { label: "Pendente", tone: "warning" },
  preparing: { label: "Preparando", tone: "info" },
  out_for_delivery: { label: "Em entrega", tone: "info" },
  delivered: { label: "Entregue", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

const typeLabels: Record<OrderType, string> = {
  delivery: "Delivery",
  pickup: "Retirada",
  local: "Consumo local",
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  pix: "Pix",
};

interface CartLine {
  productId: string;
  productName: string;
  sizeLabel?: string;
  unitPrice: number;
  quantity: number;
}

export function OrdersPage() {
  const products = useCatalogStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const addCustomer = useCustomerStore((s) => s.addCustomer);
  const addLoyaltyPoints = useCustomerStore((s) => s.addLoyaltyPoints);
  const registerOrderStats = useCustomerStore((s) => s.registerOrderStats);
  const motoboys = useMotoboyStore((s) => s.motoboys);
  const { orders, addOrder, updateOrderStatus, assignMotoboy, updateTracking } = useOrderStore();
  const promotions = usePromotionStore((s) => s.promotions);
  const { settings } = useSettingsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [promotionId, setPromotionId] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingNote, setTrackingNote] = useState("");
  const [trackingLatitude, setTrackingLatitude] = useState("");
  const [trackingLongitude, setTrackingLongitude] = useState("");

  const validPromotions = promotions.filter(isPromotionCurrentlyValid);

  const filteredOrders = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter],
  );

  function addToCart(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((c) => {
      const existing = c.find((l) => l.productId === productId && !l.sizeLabel);
      if (existing) {
        return c.map((l) =>
          l.productId === productId && !l.sizeLabel ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...c,
        {
          productId,
          productName: product.name,
          unitPrice: product.basePrice,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(index: number) {
    setCart((c) => c.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, quantity: number) {
    if (quantity < 1) return;
    setCart((c) => c.map((l, i) => (i === index ? { ...l, quantity } : l)));
  }

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const selectedPromotion = validPromotions.find((p) => p.id === promotionId);
  const discount = useMemo(() => {
    if (!selectedPromotion) return 0;
    if (selectedPromotion.type === "fixed") return Math.min(selectedPromotion.discountValue, subtotal);
    if (selectedPromotion.type === "percentage")
      return subtotal * (selectedPromotion.discountValue / 100);
    return 0;
  }, [selectedPromotion, subtotal]);

  const deliveryFee =
    orderType === "delivery"
      ? settings.freeDeliveryAbove && subtotal - discount >= settings.freeDeliveryAbove
        ? 0
        : settings.deliveryFee
      : 0;

  const total = Math.max(subtotal - discount + deliveryFee, 0);
  const pointsEarned = settings.loyalty.enabled
    ? Math.floor(total * settings.loyalty.pointsPerCurrency)
    : 0;

  function resetForm() {
    setCart([]);
    setCustomerId("");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setOrderType("delivery");
    setPaymentMethod("pix");
    setPromotionId("");
    setNotes("");
  }

  function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Adicione ao menos um produto ao pedido.");
      return;
    }

    let finalCustomerId = customerId;
    let customerName = "Cliente balcão";
    let customerPhone = "";
    let customerAddress = undefined;

    if (customerId) {
      const c = customers.find((cu) => cu.id === customerId);
      if (c) {
        customerName = c.name;
        customerPhone = c.phone;
        customerAddress = c.address;
      }
    } else if (newCustomerName && newCustomerPhone) {
      const created = addCustomer({ name: newCustomerName, phone: newCustomerPhone });
      finalCustomerId = created.id;
      customerName = created.name;
      customerPhone = created.phone;
    }

    const items: OrderItem[] = cart.map((l) => ({
      id: uuid(),
      productId: l.productId,
      productName: l.productName,
      sizeLabel: l.sizeLabel,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    }));

    const order = addOrder({
      customerId: finalCustomerId || undefined,
      customerName,
      customerPhone,
      items,
      type: orderType,
      address: customerAddress,
      status: "pending",
      paymentMethod,
      subtotal,
      discount,
      deliveryFee,
      total,
      promotionId: selectedPromotion?.id,
      pointsEarned,
      pointsRedeemed: 0,
      notes: notes || undefined,
    });

    if (finalCustomerId) {
      registerOrderStats(finalCustomerId, total);
      if (pointsEarned > 0) {
        addLoyaltyPoints(finalCustomerId, pointsEarned, `Compra ${order.code}`, order.id);
      }
    }

    resetForm();
    setModalOpen(false);
  }

  function nextStatus(order: Order): OrderStatus | null {
    const idx = statusFlow.indexOf(order.status);
    if (idx === -1 || idx === statusFlow.length - 1) return null;
    return statusFlow[idx + 1];
  }

  function openTracking(order: Order) {
    setTrackingOrder(order);
    setTrackingNote(order.trackingNote ?? "");
    setTrackingLatitude(order.trackingLatitude?.toString() ?? "");
    setTrackingLongitude(order.trackingLongitude?.toString() ?? "");
  }

  function saveTracking(event: React.FormEvent) {
    event.preventDefault();
    if (!trackingOrder) return;
    updateTracking(trackingOrder.id, {
      trackingNote: trackingNote || undefined,
      trackingLatitude: trackingLatitude ? Number(trackingLatitude) : undefined,
      trackingLongitude: trackingLongitude ? Number(trackingLongitude) : undefined,
    });
    setTrackingOrder(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-black">Pedidos</h1>
          <p className="text-sm text-black/50">Ponto de venda e acompanhamento de pedidos</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Novo Pedido
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "preparing", "out_for_delivery", "delivered", "cancelled"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                statusFilter === s
                  ? "bg-brand-orange text-white"
                  : "bg-white text-black/50 border border-black/10"
              }`}
            >
              {s === "all" ? "Todos" : statusLabels[s].label}
            </button>
          ),
        )}
      </div>

      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const status = statusLabels[order.status];
          const next = nextStatus(order);
          const motoboy = motoboys.find((m) => m.id === order.motoboyId);
          return (
            <Card key={order.id}>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-brand-black">{order.code}</p>
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <Badge tone="neutral">{typeLabels[order.type]}</Badge>
                    </div>
                    <p className="text-sm text-black/60">{order.customerName} · {order.customerPhone}</p>
                    <p className="text-xs text-black/40">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg text-brand-orange">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-black/40">{paymentLabels[order.paymentMethod]}</p>
                  </div>
                </div>

                <ul className="text-sm text-black/70 space-y-0.5">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.productName}
                      {item.sizeLabel ? ` (${item.sizeLabel})` : ""} - {formatCurrency(item.unitPrice * item.quantity)}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {order.type === "delivery" && (
                    <Select
                      value={order.motoboyId ?? ""}
                      onChange={(e) => assignMotoboy(order.id, e.target.value)}
                      className="max-w-[200px]"
                    >
                      <option value="">Atribuir motoboy...</option>
                      {motoboys.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </Select>
                  )}
                  {motoboy && <Badge tone="info">{motoboy.name}</Badge>}

                  {next && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, next)}>
                      Avançar para "{statusLabels[next].label}"
                    </Button>
                  )}
                  {order.status === "out_for_delivery" && (
                    <Button size="sm" variant="outline" onClick={() => openTracking(order)}>
                      <MapPin size={14} /> Atualizar rastreio
                    </Button>
                  )}
                  {order.status !== "cancelled" && order.status !== "delivered" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                    >
                      Cancelar
                    </Button>
                  )}
                  {order.customerPhone && (
                    <a
                      href={buildWhatsAppLink(
                        order.customerPhone,
                        `Olá ${order.customerName}, seu pedido ${order.code} na Analio's Burguer está: ${status.label}.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <MessageCircle size={14} /> WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-black/30">
            <ClipboardList size={40} />
            <p>Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>

      <Modal
        open={!!trackingOrder}
        onClose={() => setTrackingOrder(null)}
        title={`Rastreio ${trackingOrder?.code ?? ""}`}
      >
        <form onSubmit={saveTracking} className="space-y-4">
          <Field label="Mensagem para o cliente" hint="Ex: Motoboy está chegando ao bairro.">
            <Input value={trackingNote} onChange={(event) => setTrackingNote(event.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <Input
                type="number"
                step="any"
                value={trackingLatitude}
                onChange={(event) => setTrackingLatitude(event.target.value)}
                placeholder="-23.5505"
              />
            </Field>
            <Field label="Longitude">
              <Input
                type="number"
                step="any"
                value={trackingLongitude}
                onChange={(event) => setTrackingLongitude(event.target.value)}
                placeholder="-46.6333"
              />
            </Field>
          </div>
          <p className="text-xs text-black/45">
            A latitude e longitude criam um link do Google Maps para o cliente. Nesta versão, a posição é atualizada manualmente pela gestão.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setTrackingOrder(null)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar rastreio</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Pedido" maxWidthClass="max-w-3xl">
        <form onSubmit={handleCreateOrder} className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-brand-black mb-2">Produtos</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-lg border border-black/10 p-2 md:grid-cols-3">
              {products.filter((p) => p.active).map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => addToCart(p.id)}
                  className="rounded-lg border border-black/10 px-2 py-2 text-left text-xs hover:border-brand-orange hover:bg-brand-orange/5"
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="text-brand-orange">{formatCurrency(p.basePrice)}</p>
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {cart.map((line, index) => (
                <div key={index} className="flex items-center justify-between gap-2 rounded-lg bg-brand-cream/30 px-3 py-2 text-sm">
                  <span className="flex-1">{line.productName}</span>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateQuantity(index, Number(e.target.value))}
                    className="w-14 rounded border border-black/10 px-1 py-0.5 text-center"
                  />
                  <span className="w-20 text-right">{formatCurrency(line.unitPrice * line.quantity)}</span>
                  <button type="button" onClick={() => removeFromCart(index)}>
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-xs text-black/40">Clique nos produtos acima para adicionar ao pedido.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente cadastrado (opcional)">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Cliente avulso / novo</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo de pedido">
              <Select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)}>
                <option value="delivery">Delivery</option>
                <option value="pickup">Retirada</option>
                <option value="local">Consumo local</option>
              </Select>
            </Field>
          </div>

          {!customerId && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome (cliente novo)">
                <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
              </Field>
              <Field label="Telefone (cliente novo)">
                <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Forma de pagamento">
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <option value="pix">Pix</option>
                <option value="cash">Dinheiro</option>
                <option value="credit">Cartão de Crédito</option>
                <option value="debit">Cartão de Débito</option>
              </Select>
            </Field>
            <Field label="Promoção (opcional)">
              <Select value={promotionId} onChange={(e) => setPromotionId(e.target.value)}>
                <option value="">Nenhuma</option>
                {validPromotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Observações">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <div className="rounded-lg bg-brand-cream/30 p-4 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>
            <div className="flex justify-between"><span>Taxa de entrega</span><span>{formatCurrency(deliveryFee)}</span></div>
            <div className="flex justify-between font-display text-lg text-brand-orange border-t border-black/10 pt-1 mt-1">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
            {settings.loyalty.enabled && (
              <p className="text-xs text-black/40">Pontos a ganhar: {pointsEarned}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Finalizar Pedido</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
