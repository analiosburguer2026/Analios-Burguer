import { useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Field, Input, Select, Textarea } from "../components/ui/Form";
import { usePromotionStore, isPromotionCurrentlyValid } from "../store/promotionStore";
import { useCatalogStore } from "../store/catalogStore";
import { formatDate } from "../lib/utils";
import type { Promotion, PromotionType } from "../types";

const typeLabels: Record<PromotionType, string> = {
  percentage: "Desconto percentual",
  fixed: "Desconto fixo (R$)",
  combo: "Combo especial",
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  name: "",
  description: "",
  type: "percentage" as PromotionType,
  discountValue: "",
  productIds: [] as string[],
  startDate: today,
  endDate: today,
  active: true,
};

export function PromotionsPage() {
  const { promotions, addPromotion, updatePromotion, removePromotion, togglePromotionActive } =
    usePromotionStore();
  const products = useCatalogStore((s) => s.products);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(promo: Promotion) {
    setEditingId(promo.id);
    setForm({
      name: promo.name,
      description: promo.description ?? "",
      type: promo.type,
      discountValue: String(promo.discountValue),
      productIds: promo.productIds,
      startDate: promo.startDate.slice(0, 10),
      endDate: promo.endDate.slice(0, 10),
      active: promo.active,
    });
    setModalOpen(true);
  }

  function toggleProductSelection(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((p) => p !== id)
        : [...f.productIds, id],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      discountValue: Number(form.discountValue) || 0,
      productIds: form.productIds,
      startDate: form.startDate,
      endDate: form.endDate,
      active: form.active,
    };
    if (editingId) {
      updatePromotion(editingId, payload);
    } else {
      addPromotion(payload);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-black">Promoções</h1>
          <p className="text-sm text-black/50">
            Crie e gerencie campanhas promocionais com vigência de datas
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Nova Promoção
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promo) => {
          const valid = isPromotionCurrentlyValid(promo);
          return (
            <Card key={promo.id}>
              <CardBody className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-black">{promo.name}</p>
                    <p className="text-xs text-black/40">{typeLabels[promo.type]}</p>
                  </div>
                  <Badge tone={valid ? "success" : promo.active ? "warning" : "neutral"}>
                    {valid ? "Vigente" : promo.active ? "Fora do período" : "Inativa"}
                  </Badge>
                </div>
                {promo.description && (
                  <p className="text-xs text-black/50">{promo.description}</p>
                )}
                <p className="font-display text-lg text-brand-orange">
                  {promo.type === "fixed"
                    ? `R$ ${promo.discountValue.toFixed(2)} OFF`
                    : `${promo.discountValue}% OFF`}
                </p>
                <p className="text-xs text-black/40">
                  {formatDate(promo.startDate)} até {formatDate(promo.endDate)}
                </p>
                <p className="text-xs text-black/40">
                  {promo.productIds.length === 0
                    ? "Aplica a todo o cardápio"
                    : `Aplica a ${promo.productIds.length} produto(s)`}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(promo)}>
                    <Pencil size={14} /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => togglePromotionActive(promo.id)}>
                    <Power size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Remover a promoção "${promo.name}"?`)) removePromotion(promo.id);
                    }}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {promotions.length === 0 && (
          <p className="col-span-full text-center text-sm text-black/40 py-10">
            Nenhuma promoção cadastrada ainda.
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Promoção" : "Nova Promoção"}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome da promoção">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Descrição (opcional)">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de desconto">
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as PromotionType }))
                }
              >
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
                <option value="combo">Combo especial</option>
              </Select>
            </Field>
            <Field
              label={form.type === "fixed" ? "Valor do desconto (R$)" : "Percentual de desconto (%)"}
            >
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início da vigência">
              <Input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </Field>
            <Field label="Fim da vigência">
              <Input
                required
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </Field>
          </div>
          <Field
            label="Produtos aplicáveis"
            hint="Deixe vazio para aplicar a promoção em todo o cardápio"
          >
            <div className="max-h-40 overflow-y-auto rounded-lg border border-black/10 p-2 space-y-1">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm py-0.5">
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(p.id)}
                    onChange={() => toggleProductSelection(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Promoção ativa
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? "Salvar alterações" : "Criar promoção"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
