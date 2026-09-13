import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tag,
  Users,
  Bike,
  ClipboardList,
  Award,
  MessageCircle,
  Settings,
  Store,
  FileBarChart,
  Utensils,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Volume2,
} from "lucide-react";
import logoSimbolo from "../../assets/logos/logo-simbolo.png";
import { useOrderStore } from "../../store/orderStore";

const navItems = [
  { to: "/gestao", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/gestao/operacao", label: "Operação", icon: Utensils },
  { to: "/gestao/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/gestao/catalogo", label: "Catálogo", icon: UtensilsCrossed },
  { to: "/gestao/promocoes", label: "Promoções", icon: Tag },
  { to: "/gestao/fidelidade", label: "Fidelidade", icon: Award },
  { to: "/gestao/clientes", label: "Clientes", icon: Users },
  { to: "/gestao/motoboys", label: "Motoboys", icon: Bike },
  { to: "/gestao/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { to: "/gestao/configuracoes", label: "Configurações", icon: Settings },
  { to: "/gestao/relatorios", label: "Relatórios", icon: FileBarChart },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [newOrderCodes, setNewOrderCodes] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const knownOrderIds = new Set(useOrderStore.getState().orders.map((order) => order.id));
    const unsubscribe = useOrderStore.subscribe((state) => {
      const latest = state.orders.find((order) => {
        if (knownOrderIds.has(order.id)) return false;
        knownOrderIds.add(order.id);
        return order.status === "pending";
      });
      if (!latest) return;
      setNewOrderCodes((current) => [...new Set([...current, latest.code])]);
      if (latest && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Novo pedido na Analio's Burguer", {
          body: `${latest.code} · ${latest.customerName} · R$ ${latest.total.toFixed(2).replace(".", ",")}`,
        });
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (newOrderCodes.length === 0) return;
    const previousTitle = document.title;
    let visible = false;
    const titleTimer = window.setInterval(() => {
      visible = !visible;
      document.title = visible ? "🔔 NOVO PEDIDO!" : previousTitle;
    }, 900);
    const soundTimer = window.setInterval(() => {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);
    }, 4000);
    return () => {
      window.clearInterval(titleTimer);
      window.clearInterval(soundTimer);
      document.title = previousTitle;
    };
  }, [newOrderCodes.length]);

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  }

  return (
    <div className="flex min-h-screen bg-[#fbf6ee]">
      {newOrderCodes.length > 0 && (
        <div className="fixed right-5 top-5 z-[70] w-[min(380px,calc(100vw-2rem))] animate-pulse rounded-2xl border-2 border-red-500 bg-red-600 p-4 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Novo pedido recebido!</p>
              <p className="mt-1 text-sm text-white/90">{newOrderCodes.length} pedido(s) aguardando atendimento.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <NavLink to="/gestao/pedidos" onClick={() => setNewOrderCodes([])} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-600">Ver pedidos</NavLink>
                {!notificationsEnabled && typeof Notification !== "undefined" && <button type="button" onClick={enableNotifications} className="flex items-center gap-1 rounded-lg border border-white/50 px-3 py-2 text-xs font-bold"><Volume2 size={14} /> Ativar notificações</button>}
                <button type="button" onClick={() => setNewOrderCodes([])} className="rounded-lg border border-white/50 px-3 py-2 text-xs font-bold">Dispensar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-brand-black text-white transition-all ${collapsed ? "w-20" : "w-64"}`}>
        <div className={`flex items-center border-b border-white/10 px-4 py-5 ${collapsed ? "justify-center" : "gap-3"}`}>
          <img src={logoSimbolo} alt="Analio's Burguer" className="h-11 w-11 object-contain" />
          {!collapsed && <div>
            <p className="font-display text-lg leading-tight text-brand-cream">
              Analio's Burguer
            </p>
            <p className="text-xs text-white/50">Painel de Gestão</p>
          </div>}
          <button type="button" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} onClick={() => setCollapsed((value) => !value)} className={`${collapsed ? "absolute -right-3 top-6" : "ml-auto"} rounded-full bg-brand-orange p-1.5 text-white shadow`}>
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-orange text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <NavLink
            to="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-cream/90 hover:bg-white/5"
          >
            <Store size={18} />
            {!collapsed && "Ver cardápio público"}
          </NavLink>
        </div>
      </aside>

      <main className={`${collapsed ? "ml-20" : "ml-64"} flex-1 p-6 transition-all`}>
        <Outlet />
      </main>
    </div>
  );
}
