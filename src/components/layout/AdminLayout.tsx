import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
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
} from "lucide-react";
import logoSimbolo from "../../assets/logos/logo-simbolo.png";

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
  return (
    <div className="flex min-h-screen bg-[#fbf6ee]">
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
