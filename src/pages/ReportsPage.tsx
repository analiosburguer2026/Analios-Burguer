import { useMemo, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Form";
import { useOrderStore } from "../store/orderStore";
import { formatCurrency } from "../lib/utils";

type Period = "day" | "week" | "month" | "year" | "custom";

function startOfPeriod(period: Period, customStart: string) {
  const now = new Date();
  if (period === "custom") return customStart ? new Date(`${customStart}T00:00:00`) : now;
  if (period === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const day = now.getDay();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1));
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

export function ReportsPage() {
  const orders = useOrderStore((state) => state.orders);
  const [period, setPeriod] = useState<Period>("day");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filtered = useMemo(() => {
    const start = startOfPeriod(period, customStart);
    const end = period === "custom" && customEnd ? new Date(`${customEnd}T23:59:59`) : new Date();
    return orders.filter((order) => {
      const date = new Date(order.createdAt);
      return date >= start && date <= end && order.status !== "cancelled";
    });
  }, [orders, period, customStart, customEnd]);

  const revenue = filtered.reduce((sum, order) => sum + order.total, 0);
  const items = filtered.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const average = filtered.length ? revenue / filtered.length : 0;

  function exportCsv() {
    const header = "Pedido,Data,Cliente,Status,Pagamento,Total\n";
    const rows = filtered.map((order) => `${order.code},"${new Date(order.createdAt).toLocaleString("pt-BR")}","${order.customerName}",${order.status},${order.paymentMethod},${order.total.toFixed(2)}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-analios-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl">Relatórios de vendas</h1><p className="text-sm text-black/50">Consulte e exporte seu desempenho.</p></div>
        <Button variant="outline" onClick={exportCsv}><Download size={16} /> Exportar CSV</Button>
      </div>
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <Field label="Período"><Select value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
            <option value="day">Diário</option><option value="week">Semanal</option><option value="month">Mensal</option><option value="year">Anual</option><option value="custom">Personalizado</option>
          </Select></Field>
          {period === "custom" && <><Field label="Data inicial"><Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></Field><Field label="Data final"><Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></Field></>}
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardBody><FileBarChart className="text-brand-orange" /><p className="mt-3 text-sm text-black/50">Faturamento</p><p className="font-display text-2xl">{formatCurrency(revenue)}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-black/50">Pedidos</p><p className="font-display text-2xl">{filtered.length}</p><p className="text-xs text-black/40">{items} itens vendidos</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-black/50">Ticket médio</p><p className="font-display text-2xl">{formatCurrency(average)}</p></CardBody></Card>
      </div>
      <Card><CardHeader><h2 className="font-semibold">Vendas no período</h2></CardHeader><CardBody className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-black/40"><th className="p-2">Pedido</th><th className="p-2">Data</th><th className="p-2">Cliente</th><th className="p-2">Pagamento</th><th className="p-2">Total</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id} className="border-b border-black/5"><td className="p-2">{order.code}</td><td className="p-2">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td><td className="p-2">{order.customerName}</td><td className="p-2">{order.paymentMethod}</td><td className="p-2 font-semibold">{formatCurrency(order.total)}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="py-8 text-center text-sm text-black/40">Nenhuma venda no período.</p>}</CardBody></Card>
    </div>
  );
}
