import { useMemo } from "react";
import {
  ClipboardList,
  DollarSign,
  Users,
  Award,
  TrendingUp,
  Banknote,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useOrderStore } from "../store/orderStore";
import { useCustomerStore } from "../store/customerStore";
import { formatCurrency, formatDateTime } from "../lib/utils";
import { useOperationStore } from "../store/operationStore";
import { Button } from "../components/ui/Button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const statusLabels: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  pending: { label: "Pendente", tone: "warning" },
  preparing: { label: "Preparando", tone: "info" },
  out_for_delivery: { label: "Em entrega", tone: "info" },
  delivered: { label: "Entregue", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

function isSameDay(iso: string, date: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
}

export function DashboardPage() {
  const orders = useOrderStore((s) => s.orders);
  const customers = useCustomerStore((s) => s.customers);
  const tables = useOperationStore((s) => s.tables);
  const cashOpen = useOperationStore((s) => s.cashOpen);
  const cashOpeningAmount = useOperationStore((s) => s.cashOpeningAmount);
  const cashEntries = useOperationStore((s) => s.cashEntries);

  const today = new Date();

  const todayOrders = useMemo(
    () => orders.filter((o) => isSameDay(o.createdAt, today) && o.status !== "cancelled"),
    [orders],
  );

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayCashBalance =
    cashOpeningAmount +
    cashEntries
      .filter((entry) => isSameDay(entry.createdAt, today))
      .reduce((sum, entry) => (entry.type === "withdrawal" ? sum - entry.amount : sum + entry.amount), 0);

  const last7DaysData = useMemo(() => {
    const days: { date: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const total = orders
        .filter((o) => isSameDay(o.createdAt, d) && o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total, 0);
      days.push({
        date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total,
      });
    }
    return days;
  }, [orders]);

  const recentOrders = orders.slice(0, 6);

  const stats = [
    {
      label: "Pedidos Hoje",
      value: todayOrders.length,
      icon: ClipboardList,
      color: "text-brand-orange bg-brand-orange/10",
    },
    {
      label: "Faturamento Hoje",
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
      color: "text-green-700 bg-green-100",
    },
    {
      label: "Clientes Cadastrados",
      value: customers.length,
      icon: Users,
      color: "text-blue-700 bg-blue-100",
    },
    {
      label: "Pontos de Fidelidade Ativos",
      value: customers.reduce((sum, c) => sum + c.loyaltyPoints, 0),
      icon: Award,
      color: "text-amber-700 bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-brand-black">Dashboard</h1>
        <p className="text-sm text-black/50">Visão geral da Analio's Burguer</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon size={22} />
              </div>

              <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-brand-black">Operação da loja</h2>
                    <p className="text-xs text-black/50">Acompanhe mesas e caixa diretamente no painel de gestão.</p>
                  </div>
                  <Link to="/gestao/operacao">
                    <Button variant="outline">Abrir operação</Button>
                  </Link>
                </CardHeader>
                <CardBody className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-xl bg-brand-orange/10 p-4">
                    <UsersRound className="text-brand-orange" size={22} />
                    <div><p className="text-xs text-black/50">Mesas ocupadas</p><p className="font-semibold">{tables.filter((table) => table.status === "occupied").length}/{tables.length}</p></div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
                    <Banknote className="text-green-700" size={22} />
                    <div><p className="text-xs text-black/50">Caixa hoje</p><p className="font-semibold">{formatCurrency(todayCashBalance)}</p></div>
                  </div>
                  <div className="rounded-xl bg-black/[0.03] p-4"><p className="text-xs text-black/50">Status do caixa</p><p className={`font-semibold ${cashOpen ? "text-green-700" : "text-red-600"}`}>{cashOpen ? "Aberto" : "Fechado"}</p></div>
                </CardBody>
              </Card>
              <div>
                <p className="text-xs text-black/50">{stat.label}</p>
                <p className="font-display text-xl text-brand-black">{stat.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-orange" />
            <h2 className="font-semibold text-brand-black">Faturamento (últimos 7 dias)</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#bc3a08"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-brand-black">Pedidos Recentes</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {recentOrders.length === 0 && (
              <p className="text-sm text-black/40">Nenhum pedido ainda.</p>
            )}
            {recentOrders.map((order) => {
              const status = statusLabels[order.status];
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-black/5 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {order.code} · {order.customerName}
                    </p>
                    <p className="text-xs text-black/40">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
