import { useState } from "react";
import { Award, Plus, Minus } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Form";
import { Modal } from "../components/ui/Modal";
import { useCustomerStore } from "../store/customerStore";
import { useSettingsStore } from "../store/settingsStore";
import { formatDateTime } from "../lib/utils";

export function LoyaltyPage() {
  const { customers, loyaltyTransactions, addLoyaltyPoints, redeemLoyaltyPoints } = useCustomerStore();
  const { settings, updateSettings } = useSettingsStore();

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "redeem">("add");
  const [adjustReason, setAdjustReason] = useState("");

  const sortedCustomers = [...customers].sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);

  function openAdjust(customerId: string, type: "add" | "redeem") {
    setSelectedCustomerId(customerId);
    setAdjustType(type);
    setAdjustPoints("");
    setAdjustReason("");
    setAdjustModalOpen(true);
  }

  function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId) return;
    const points = Number(adjustPoints) || 0;
    if (points <= 0) return;

    if (adjustType === "add") {
      addLoyaltyPoints(selectedCustomerId, points, adjustReason || "Ajuste manual", undefined);
    } else {
      const ok = redeemLoyaltyPoints(selectedCustomerId, points, adjustReason || "Resgate manual", undefined);
      if (!ok) {
        alert("O cliente não possui pontos suficientes para esse resgate.");
        return;
      }
    }
    setAdjustModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-brand-black">Fidelidade</h1>
        <p className="text-sm text-black/50">
          Gerencie o programa de pontos e recompensas dos clientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-black">Regras do Programa</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Pontos ganhos por R$1 gasto">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={settings.loyalty.pointsPerCurrency}
                onChange={(e) =>
                  updateSettings({
                    loyalty: {
                      ...settings.loyalty,
                      pointsPerCurrency: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </Field>
            <Field label="Valor (R$) de cada ponto ao resgatar">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={settings.loyalty.currencyPerPoint}
                onChange={(e) =>
                  updateSettings({
                    loyalty: {
                      ...settings.loyalty,
                      currencyPerPoint: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </Field>
            <Field label="Mínimo de pontos para resgate">
              <Input
                type="number"
                min="0"
                value={settings.loyalty.minPointsToRedeem}
                onChange={(e) =>
                  updateSettings({
                    loyalty: {
                      ...settings.loyalty,
                      minPointsToRedeem: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.loyalty.enabled}
              onChange={(e) =>
                updateSettings({ loyalty: { ...settings.loyalty, enabled: e.target.checked } })
              }
            />
            Programa de fidelidade ativo
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-black">Ranking de Clientes por Pontos</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-black/40">
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Telefone</th>
                <th className="pb-2 font-medium">Pontos</th>
                <th className="pb-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((c) => (
                <tr key={c.id} className="border-b border-black/5">
                  <td className="py-2 font-medium">{c.name}</td>
                  <td className="py-2 text-black/50">{c.phone}</td>
                  <td className="py-2">
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-orange">
                      <Award size={14} /> {c.loyaltyPoints}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openAdjust(c.id, "add")}>
                        <Plus size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openAdjust(c.id, "redeem")}>
                        <Minus size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-black/40">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-black">Histórico de Transações</h2>
        </CardHeader>
        <CardBody className="space-y-2 max-h-80 overflow-y-auto">
          {loyaltyTransactions
            .slice()
            .reverse()
            .map((t) => {
              const customer = customers.find((c) => c.id === t.customerId);
              return (
                <div key={t.id} className="flex items-center justify-between text-sm border-b border-black/5 pb-2">
                  <div>
                    <p className="font-medium">{customer?.name ?? "Cliente removido"}</p>
                    <p className="text-xs text-black/40">
                      {t.description} · {formatDateTime(t.createdAt)}
                    </p>
                  </div>
                  <span className={t.points >= 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                    {t.points >= 0 ? "+" : ""}
                    {t.points} pts
                  </span>
                </div>
              );
            })}
          {loyaltyTransactions.length === 0 && (
            <p className="text-sm text-black/40 text-center py-4">Nenhuma transação registrada.</p>
          )}
        </CardBody>
      </Card>

      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={adjustType === "add" ? "Adicionar Pontos" : "Resgatar Pontos"}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <Field label="Quantidade de pontos">
            <Input
              required
              type="number"
              min="1"
              value={adjustPoints}
              onChange={(e) => setAdjustPoints(e.target.value)}
            />
          </Field>
          <Field label="Motivo">
            <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAdjustModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
