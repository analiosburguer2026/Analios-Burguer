import { useState } from "react";
import { Package, Plus, Trash2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Form";
import { useInventoryStore } from "../store/inventoryStore";

export function InventoryPage() {
  const { items, addItem, updateItem, removeItem, moveStock } = useInventoryStore();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("un");
  const [quantity, setQuantity] = useState("0");
  const [minimumQuantity, setMinimumQuantity] = useState("0");
  const [costPerUnit, setCostPerUnit] = useState("0");

  function createItem(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    addItem({ name: name.trim(), unit, quantity: Number(quantity) || 0, minimumQuantity: Number(minimumQuantity) || 0, costPerUnit: Number(costPerUnit) || 0, active: true });
    setName("");
    setQuantity("0");
    setMinimumQuantity("0");
    setCostPerUnit("0");
  }

  return <div className="space-y-6">
    <div><h1 className="font-display text-3xl text-brand-black">Estoque</h1><p className="text-sm text-black/50">Controle de insumos, custos e alertas de estoque baixo</p></div>
    <Card><CardHeader><h2 className="font-semibold">Cadastrar insumo</h2></CardHeader><CardBody><form onSubmit={createItem} className="grid gap-3 md:grid-cols-5">
      <Input placeholder="Ex.: Pão brioche" value={name} onChange={(e) => setName(e.target.value)} />
      <Select value={unit} onChange={(e) => setUnit(e.target.value)}><option value="un">Unidade</option><option value="kg">Kg</option><option value="g">Gramas</option><option value="l">Litros</option><option value="ml">ml</option></Select>
      <Input type="number" min="0" step="0.01" placeholder="Quantidade" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <Input type="number" min="0" step="0.01" placeholder="Mínimo" value={minimumQuantity} onChange={(e) => setMinimumQuantity(e.target.value)} />
      <Button type="submit"><Plus size={16} /> Adicionar</Button>
    </form></CardBody></Card>
    <Card><CardHeader><h2 className="flex items-center gap-2 font-semibold"><Package size={18} /> Insumos cadastrados</h2></CardHeader><CardBody><div className="mb-2 grid grid-cols-[1fr_120px_120px_120px_auto] gap-3 px-3 text-xs font-bold uppercase text-black/50"><span>Item / status</span><span>Quantidade atual</span><span>Estoque mínimo</span><span>Custo unitário</span><span>Ações</span></div><div className="space-y-3">
      {items.map((item) => {
        const low = item.quantity <= item.minimumQuantity;
        return <div key={item.id} className={`grid items-center gap-3 rounded-xl border p-3 md:grid-cols-[1fr_120px_120px_120px_auto] ${low ? "border-red-400 bg-red-50" : "border-black/10"}`}>
          <div><p className="font-semibold">{item.name}</p><p className="text-xs text-black/50">{low ? "Estoque baixo" : "Estoque normal"}</p></div>
          <Input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })} />
          <Input type="number" min="0" step="0.01" value={item.minimumQuantity} onChange={(e) => updateItem(item.id, { minimumQuantity: Number(e.target.value) || 0 })} />
          <Input type="number" min="0" step="0.01" value={item.costPerUnit} onChange={(e) => updateItem(item.id, { costPerUnit: Number(e.target.value) || 0 })} aria-label={`Custo de ${item.name}`} />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { const value = Number(window.prompt(`Quantidade de entrada para ${item.name}`)); if (value > 0) moveStock(item.id, "entry", value, "Entrada manual"); }} className="text-green-700" aria-label={`Entrada de ${item.name}`}><ArrowDownToLine size={18} /></button>
            <button type="button" onClick={() => { const value = Number(window.prompt(`Quantidade de saída para ${item.name}`)); if (value > 0) moveStock(item.id, "exit", value, "Saída manual"); }} className="text-orange-700" aria-label={`Saída de ${item.name}`}><ArrowUpFromLine size={18} /></button>
            <button type="button" onClick={() => removeItem(item.id)} className="text-red-600" aria-label={`Excluir ${item.name}`}><Trash2 size={18} /></button>
          </div>
        </div>;
      })}
      {items.length === 0 && <p className="py-8 text-center text-sm text-black/50">Nenhum insumo cadastrado.</p>}
    </div></CardBody></Card>
  </div>;
}
