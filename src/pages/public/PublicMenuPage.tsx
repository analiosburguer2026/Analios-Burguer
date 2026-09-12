import { useEffect, useMemo, useState } from "react";
import { MessageCircle, MapPin, Clock, ShoppingBag, X, Search, SlidersHorizontal, Phone, Megaphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCatalogStore } from "../../store/catalogStore";
import { usePromotionStore, isPromotionCurrentlyValid } from "../../store/promotionStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useCustomerStore } from "../../store/customerStore";
import { formatCurrency, buildWhatsAppLink } from "../../lib/utils";
import logoOriginal from "../../assets/logos/logo-original.png";
import { useOrderStore } from "../../store/orderStore";
import type { Address, OrderType, PaymentMethod } from "../../types";
import { supabase } from "../../lib/supabase";

interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export function PublicMenuPage() {
  const { categories, products } = useCatalogStore();
  const promotions = usePromotionStore((s) => s.promotions);
  const { settings } = useSettingsStore();
  const serviceMode = settings.serviceMode ?? "both";
  const customers = useCustomerStore((state) => state.customers);
  const addOrder = useOrderStore((state) => state.addOrder);
  const registerOrderStats = useCustomerStore((state) => state.registerOrderStats);
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>(
    serviceMode === "pickup" ? "pickup" : "delivery",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [address, setAddress] = useState<Address>({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const validPromotions = promotions.filter(isPromotionCurrentlyValid);
  const headerAnnouncement =
    settings.announcementText?.trim() ||
    (validPromotions.length > 0
      ? `Promoção: ${validPromotions[0].name}${validPromotions[0].description ? ` - ${validPromotions[0].description}` : ""}`
      : "");

  useEffect(() => {
    let active = true;
    supabase
      .from("app_state")
      .select("key,data")
      .in("key", ["catalog", "promotions", "settings"])
      .then(({ data, error }) => {
        if (error || !active) return;
        for (const row of data ?? []) {
          const state = row.data as Record<string, unknown>;
          if (row.key === "catalog") useCatalogStore.setState(state as never);
          if (row.key === "promotions") usePromotionStore.setState(state as never);
          if (row.key === "settings") useSettingsStore.setState(state as never);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const activeProducts = products.filter((p) => {
    if (!p.active) return false;
    const matchesSearch =
      !normalizedSearch ||
      p.name.toLowerCase().includes(normalizedSearch) ||
      p.description.toLowerCase().includes(normalizedSearch);
    return matchesSearch && (categoryFilter === "all" || p.categoryId === categoryFilter);
  });
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  function promotionForProduct(productId: string) {
    return validPromotions.find(
      (p) => p.productIds.length === 0 || p.productIds.includes(productId),
    );
  }

  function priceWithPromotion(price: number, productId: string) {
    const promo = promotionForProduct(productId);
    if (!promo) return price;
    if (promo.type === "fixed") return Math.max(price - promo.discountValue, 0);
    if (promo.type === "percentage") return price * (1 - promo.discountValue / 100);
    return price;
  }

  function addToCart(productId: string, name: string, price: number) {
    setCart((c) => {
      const existing = c.find((l) => l.productId === productId);
      if (existing) {
        return c.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...c, { productId, name, price, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((c) => {
      const existing = c.find((l) => l.productId === productId);
      if (existing && existing.quantity > 1) {
        return c.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity - 1 } : l));
      }
      return c.filter((l) => l.productId !== productId);
    });
  }

  const total = useMemo(() => cart.reduce((sum, l) => sum + l.price * l.quantity, 0), [cart]);
  const totalItems = cart.reduce((sum, l) => sum + l.quantity, 0);
  const deliveryFee =
    orderType === "delivery" && !(settings.freeDeliveryAbove && total >= settings.freeDeliveryAbove)
      ? settings.deliveryFee
      : 0;
  const orderTotal = total + deliveryFee;

  function openCheckout() {
    if (cart.length === 0) return;
    const customerId = sessionStorage.getItem("analios-customer-id");
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) {
      window.alert("Para realizar um pedido, faça seu cadastro ou entre na Área do cliente.");
      navigate("/cliente?returnTo=/");
      return;
    }
    setCheckoutOpen(true);
  }

  function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    const customerId = sessionStorage.getItem("analios-customer-id");
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) {
      setCheckoutOpen(false);
      navigate("/cliente?returnTo=/");
      return;
    }
    if (orderType === "delivery" && (!address.street || !address.number || !address.neighborhood || !address.city)) {
      window.alert("Informe rua, número, bairro e cidade para a entrega.");
      return;
    }

    const newOrder = addOrder({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: cart.map((line) => ({
        id: crypto.randomUUID(),
        productId: line.productId,
        productName: line.name,
        quantity: line.quantity,
        unitPrice: line.price,
      })),
      type: orderType,
      address: orderType === "delivery" ? address : undefined,
      status: "pending",
      paymentMethod,
      subtotal: total,
      discount: 0,
      deliveryFee,
      total: orderTotal,
      pointsEarned: Math.floor(orderTotal * settings.loyalty.pointsPerCurrency),
      pointsRedeemed: 0,
    });
    registerOrderStats(customer.id, orderTotal);
    const lines = cart.map((l) => `- ${l.quantity}x ${l.name} (${formatCurrency(l.price * l.quantity)})`);
    const message = [
      `Olá! Gostaria de fazer o seguinte pedido na ${settings.storeName}:`,
      "",
      ...lines,
      "",
      `Total: ${formatCurrency(orderTotal)}`,
      `Pedido: ${newOrder.code}`,
      `Pagamento: ${paymentMethod === "pix" ? "PIX" : paymentMethod}`,
    ].join("\n");
    if (paymentMethod === "pix" || paymentMethod === "credit" || paymentMethod === "debit") {
      void supabase.functions
        .invoke("create-payment", {
          body: {
            orderId: newOrder.code,
            items: newOrder.items.map((item) => ({
              title: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
            })),
            total: orderTotal,
            payerEmail: customer.email,
          },
        })
        .then(({ data, error }) => {
          if (error || !data?.checkoutUrl) {
            window.alert("Não foi possível abrir o pagamento. O pedido foi criado; fale com a loja pelo WhatsApp.");
            return;
          }
          window.location.assign(data.checkoutUrl);
        });
    } else {
      window.open(buildWhatsAppLink(settings.whatsappNumber, message), "_blank");
    }
    setCart([]);
    setCheckoutOpen(false);
    window.alert(
      paymentMethod === "cash"
        ? `Pedido ${newOrder.code} criado! A loja receberá sua solicitação pelo WhatsApp.`
        : `Pedido ${newOrder.code} criado! Você será direcionado ao Mercado Pago.`,
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf6ee] pb-28">
      <header className="bg-brand-black text-white">
        {headerAnnouncement && (
          <div className={`flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-bold ${settings.announcementTone === "orange" ? "bg-brand-orange" : "bg-red-600"}`}>
            <Megaphone size={18} /> {headerAnnouncement}
          </div>
        )}
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-center">
          <img src={logoOriginal} alt={settings.storeName} className="h-32 object-contain" />
          <p className="font-display text-3xl text-brand-cream">{settings.storeName}</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {settings.address}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {settings.openingHours}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <a
              href={buildWhatsAppLink(settings.whatsappNumber, `Olá! Preciso de ajuda com meu pedido na ${settings.storeName}.`)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              <MessageCircle size={16} /> Falar no WhatsApp
            </a>
            <a
              href={`tel:+${settings.whatsappNumber}`}
              className="flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <Phone size={16} /> Ligar para a loja
            </a>
          </div>
          <Link
            to="/rastreio"
            className="rounded-lg border border-brand-cream/50 px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-cream/10"
          >
            Rastrear meu pedido
          </Link>
          <Link
            to="/cliente"
            className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Área do cliente
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        <div className="sticky top-2 z-20 rounded-2xl bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search size={17} className="absolute left-3 top-3 text-black/40" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar no cardápio..."
                className="w-full rounded-lg border border-black/10 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-orange"
              />
            </label>
            <label className="flex items-center gap-2 sm:min-w-56">
              <SlidersHorizontal size={17} className="text-brand-orange" />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
              >
                <option value="all">Todas as categorias</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
          </div>
          {(search || categoryFilter !== "all") && (
            <button
              type="button"
              onClick={() => { setSearch(""); setCategoryFilter("all"); }}
              className="mt-2 text-xs font-semibold text-brand-orange"
            >
              Limpar filtros
            </button>
          )}
        </div>
        {sortedCategories.map((category) => {
          const categoryProducts = activeProducts.filter((p) => p.categoryId === category.id);
          if (categoryProducts.length === 0) return null;
          return (
            <section key={category.id}>
              <h2 className="font-display text-2xl text-brand-orange mb-4">{category.name}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {categoryProducts.map((product) => {
                  const promo = promotionForProduct(product.id);
                  const finalPrice = priceWithPromotion(product.basePrice, product.id);
                  return (
                    <div
                      key={product.id}
                      className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm border border-black/5"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-cream/50">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-brand-black">{product.name}</p>
                        <p className="text-xs text-black/50 line-clamp-2">{product.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            {promo ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-black/30 line-through">
                                  {formatCurrency(product.basePrice)}
                                </span>
                                <span className="font-display text-brand-orange">
                                  {formatCurrency(finalPrice)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-display text-brand-orange">
                                {formatCurrency(finalPrice)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(product.id, product.name, finalPrice)}
                            className="rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-orange-light"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-4 shadow-2xl">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 max-w-md">
              {cart.map((l) => (
                <span
                  key={l.productId}
                  className="flex items-center gap-2 rounded-full bg-brand-cream/60 px-3 py-1 text-xs"
                >
                  {l.quantity}x {l.name}
                  <button
                    onClick={() => removeFromCart(l.productId)}
                    className="font-bold text-brand-orange"
                  >
                    -
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-lg text-brand-black">
                {totalItems} item(s) · {formatCurrency(total)}
              </span>
              <button
                onClick={openCheckout}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                <ShoppingBag size={16} /> Finalizar pedido
              </button>
            </div>
          </div>
        </div>
      )}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <form onSubmit={submitOrder} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-brand-black">Finalizar pedido</h2>
              <button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Fechar"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["delivery", "pickup"] as const)
                .filter((type) => serviceMode === "both" || serviceMode === type)
                .map((type) => (
                <button key={type} type="button" onClick={() => setOrderType(type)}
                  className={`rounded-lg border px-3 py-2 text-sm ${orderType === type ? "border-brand-orange bg-brand-orange text-white" : "border-black/10"}`}>
                  {type === "delivery" ? "Receber em casa" : "Retirar na loja"}
                </button>
              ))}
            </div>
            {orderType === "delivery" && (
              <div className="grid grid-cols-2 gap-3">
                {(["street", "number", "neighborhood", "city"] as const).map((field) => (
                  <input key={field} required placeholder={{ street: "Rua", number: "Número", neighborhood: "Bairro", city: "Cidade" }[field]}
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm" value={address[field]}
                    onChange={(event) => setAddress({ ...address, [field]: event.target.value })} />
                ))}
              </div>
            )}
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="pix">PIX (confirmar pelo WhatsApp)</option>
              <option value="cash">Dinheiro</option>
              <option value="credit">Cartão de crédito na entrega</option>
              <option value="debit">Cartão de débito na entrega</option>
            </select>
            <div className="rounded-lg bg-brand-cream/40 p-3 text-sm">
              <p>Subtotal: {formatCurrency(total)}</p>
              <p>Entrega: {deliveryFee ? formatCurrency(deliveryFee) : "Grátis"}</p>
              <p className="mt-1 font-semibold">Total: {formatCurrency(orderTotal)}</p>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white">
              <MessageCircle size={17} /> Confirmar e enviar pedido
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
