import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowDownCircle, ArrowUpCircle, Banknote, ClipboardList, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Form";
import { useOperationStore } from "../store/operationStore";
import { useOrderStore } from "../store/orderStore";
import { useCatalogStore } from "../store/catalogStore";
import { formatCurrency } from "../lib/utils";
import type { CashEntryType } from "../types";

export function OperationPage() {
  const { tables, cashOpen, cashOpeningAmount, cashEntries, setTableStatus, setTableCount, openCash, closeCash, addCashEntry } =
    useOperationStore();
  const orders = useOrderStore((state) => state.orders);
  const addOrder = useOrderStore((state) => state.addOrder);
  const products = useCatalogStore((state) => state.products);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState("1");
  const [openingAmount, setOpeningAmount] = useState("0");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entryType, setEntryType] = useState<CashEntryType>("deposit");

  const todayEntries = cashEntries.filter((entry) => new Date(entry.createdAt).toDateString() === new Date().toDateString());
  const cashBalance = useMemo(
    () =>
      cashOpeningAmount +
      todayEntries.reduce((sum, entry) => (entry.type === "withdrawal" ? sum - entry.amount : sum + entry.amount), 0),
    [cashOpeningAmount, todayEntries],
  );
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const tableOrders = orders.filter((order) => order.tableId === selectedTableId && order.status !== "cancelled");

  function addTableOrder(event: FormEvent) {
    event.preventDefault();
    if (!selectedTable || !selectedProductId) return;
    const product = products.find((item) => item.id === selectedProductId);
    const quantity = Math.max(1, Number(productQuantity) || 1);
    if (!product) return;
    const subtotal = product.basePrice * quantity;
    addOrder({
      customerName: selectedTable.customerName || "Cliente da mesa",
      customerPhone: "",
      items: [{ id: crypto.randomUUID(), productId: product.id, productName: product.name, quantity, unitPrice: product.basePrice }],
      type: "local",
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      status: "pending",
      paymentMethod: "cash",
      subtotal,
      discount: 0,
      deliveryFee: 0,
      total: subtotal,
      pointsEarned: 0,
      pointsRedeemed: 0,
    });
    setSelectedProductId("");
    setProductQuantity("1");
  }

  function handleCashEntry(event: FormEvent) {
    event.preventDefault();
    const amount = Number(entryAmount);
    if (!amount || !entryDescription.trim()) return;
    addCashEntry({ type: entryType, description: entryDescription.trim(), amount });
    setEntryAmount("");
    setEntryDescription("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-black">Operação</h1>
          <p className="text-sm text-black/50">Mesas, comandas e controle do caixa</p>
        </div>
        <Link to="/gestao/pedidos"><Button><ClipboardList size={16} /> Abrir PDV / Pedidos</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardBody><Users className="text-brand-orange" /><p className="mt-2 text-sm text-black/50">Mesas ocupadas</p><p className="font-display text-3xl">{tables.filter((table) => table.status === "occupied").length}/{tables.length}</p></CardBody></Card>
        <Card><CardBody><Banknote className="text-brand-orange" /><p className="mt-2 text-sm text-black/50">Caixa hoje</p><p className="font-display text-3xl">{formatCurrency(cashBalance)}</p></CardBody></Card>
        <Card><CardBody><ClipboardList className="text-brand-orange" /><p className="mt-2 text-sm text-black/50">Pedidos em aberto</p><p className="font-display text-3xl">{orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length}</p></CardBody></Card>
      </div>

      <Card>
        <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Mesas e comandas</h2><span className="text-xs text-black/50">Abra e feche comandas individualmente</span></div><label className="flex items-center gap-2 text-sm">Quantidade de mesas<Input className="w-20" type="number" min="1" max="100" value={tables.length} onChange={(event) => setTableCount(Number(event.target.value))} /></label></div></CardHeader>
        <CardBody className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`rounded-xl border p-4 text-center transition ${
                table.status === "occupied" ? "border-brand-orange bg-brand-orange text-white" : "border-black/10 bg-white hover:border-brand-orange"
              }`}
            >
              <p className="text-xs opacity-70">Mesa</p><p className="font-display text-2xl">{table.number}</p>
              <p className="mt-1 text-xs">{table.status === "occupied" ? "Comanda aberta" : "Comanda fechada"}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {table.status === "occupied" && (
                  <button type="button" onClick={() => setSelectedTableId(table.id)} className="rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-brand-orange">
                    Novo pedido
                  </button>
                )}
                <button type="button" onClick={() => { setSelectedTableId(table.id); setTableStatus(table.id, table.status === "free" ? "occupied" : "free", table.status === "free" ? "Atendimento" : undefined); }} className="rounded-md bg-black/10 px-2 py-1 text-xs font-semibold">
                  {table.status === "occupied" ? "Fechar comanda" : "Abrir comanda"}
                </button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {selectedTable && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Novo pedido · Mesa {selectedTable.number}</h2>
            <p className="text-xs text-black/50">Este pedido será vinculado somente à comanda, sem cadastro de cliente.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <form onSubmit={addTableOrder} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
              <Select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                <option value="">Selecione um produto</option>
                {products.filter((product) => product.active).map((product) => <option key={product.id} value={product.id}>{product.name} - {formatCurrency(product.basePrice)}</option>)}
              </Select>
              <Input type="number" min="1" value={productQuantity} onChange={(event) => setProductQuantity(event.target.value)} />
              <Button type="submit">Lançar pedido</Button>
            </form>
            {tableOrders.length === 0 ? <p className="text-sm text-black/50">Nenhum item lançado nesta comanda.</p> : tableOrders.map((order) => <div key={order.id} className="flex justify-between border-b border-black/5 py-2 text-sm"><span>{order.code} · {order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</span><strong>{formatCurrency(order.total)}</strong></div>)}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><div className="flex items-center justify-between"><h2 className="font-semibold">Caixa</h2><span className={`text-xs font-semibold ${cashOpen ? "text-green-700" : "text-red-600"}`}>{cashOpen ? "Caixa aberto" : "Caixa fechado"}</span></div></CardHeader>
        <CardBody className="space-y-4">
          {!cashOpen ? (
            <div className="flex flex-wrap items-end gap-3"><label className="text-sm">Fundo de caixa (R$)<Input type="number" min="0" step="0.01" value={openingAmount} onChange={(event) => setOpeningAmount(event.target.value)} /></label><Button onClick={() => openCash(Number(openingAmount) || 0)}>Abrir caixa</Button></div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Saldo estimado: <strong>{formatCurrency(cashBalance)}</strong></p><Button variant="outline" onClick={closeCash}>Fechar caixa</Button></div>
          )}
          <form onSubmit={handleCashEntry} className="grid gap-3 sm:grid-cols-[160px_1fr_140px_auto]">
            <Select value={entryType} onChange={(event) => setEntryType(event.target.value as CashEntryType)}><option value="deposit">Entrada</option><option value="withdrawal">Sangria</option><option value="adjustment">Ajuste</option></Select>
            <Input placeholder="Descrição" value={entryDescription} onChange={(event) => setEntryDescription(event.target.value)} />
            <Input type="number" min="0" step="0.01" placeholder="Valor" value={entryAmount} onChange={(event) => setEntryAmount(event.target.value)} />
            <Button type="submit"><ArrowUpCircle size={16} /> Registrar</Button>
          </form>
          <div className="space-y-2">{todayEntries.slice(0, 8).map((entry) => <div key={entry.id} className="flex items-center justify-between border-b border-black/5 py-2 text-sm"><span className="flex items-center gap-2">{entry.type === "withdrawal" ? <ArrowDownCircle size={15} className="text-red-500" /> : <ArrowUpCircle size={15} className="text-green-600" />}{entry.description}</span><strong>{entry.type === "withdrawal" ? "-" : "+"}{formatCurrency(entry.amount)}</strong></div>)}</div>
        </CardBody>
      </Card>
    </div>
  );
}
