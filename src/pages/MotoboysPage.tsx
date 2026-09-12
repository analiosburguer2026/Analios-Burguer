import { useState } from "react";
import { Plus, Pencil, Trash2, Bike } from "lucide-react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Field, Input, Select } from "../components/ui/Form";
import { useMotoboyStore } from "../store/motoboyStore";
import type { Motoboy, MotoboyStatus } from "../types";

const statusLabels: Record<MotoboyStatus, { label: string; tone: "success" | "warning" | "neutral" }> = {
  available: { label: "Disponível", tone: "success" },
  delivering: { label: "Em entrega", tone: "warning" },
  offline: { label: "Offline", tone: "neutral" },
};

const emptyForm = {
  name: "",
  phone: "",
  vehiclePlate: "",
  status: "available" as MotoboyStatus,
  active: true,
};

export function MotoboysPage() {
  const { motoboys, addMotoboy, updateMotoboy, removeMotoboy, setMotoboyStatus } = useMotoboyStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(motoboy: Motoboy) {
    setEditingId(motoboy.id);
    setForm({
      name: motoboy.name,
      phone: motoboy.phone,
      vehiclePlate: motoboy.vehiclePlate ?? "",
      status: motoboy.status,
      active: motoboy.active,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone,
      vehiclePlate: form.vehiclePlate || undefined,
      status: form.status,
      active: form.active,
    };
    if (editingId) {
      updateMotoboy(editingId, payload);
    } else {
      addMotoboy(payload);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-black">Motoboys</h1>
          <p className="text-sm text-black/50">Cadastro e status dos entregadores</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Novo Motoboy
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {motoboys.map((m) => {
          const status = statusLabels[m.status];
          return (
            <Card key={m.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
                      <Bike size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-black">{m.name}</p>
                      <p className="text-xs text-black/40">{m.phone}</p>
                    </div>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>
                {m.vehiclePlate && (
                  <p className="text-xs text-black/40">Placa: {m.vehiclePlate}</p>
                )}
                <p className="text-xs text-black/40">{m.deliveriesCount} entregas realizadas</p>

                <Select
                  value={m.status}
                  onChange={(e) => setMotoboyStatus(m.id, e.target.value as MotoboyStatus)}
                >
                  <option value="available">Disponível</option>
                  <option value="delivering">Em entrega</option>
                  <option value="offline">Offline</option>
                </Select>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                    <Pencil size={14} /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Remover motoboy "${m.name}"?`)) removeMotoboy(m.id);
                    }}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {motoboys.length === 0 && (
          <p className="col-span-full text-center text-sm text-black/40 py-10">
            Nenhum motoboy cadastrado ainda.
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Motoboy" : "Novo Motoboy"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome completo">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Telefone/WhatsApp">
            <Input
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="Placa do veículo (opcional)">
            <Input
              value={form.vehiclePlate}
              onChange={(e) => setForm((f) => ({ ...f, vehiclePlate: e.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MotoboyStatus }))}
            >
              <option value="available">Disponível</option>
              <option value="delivering">Em entrega</option>
              <option value="offline">Offline</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Ativo no quadro de motoboys
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? "Salvar alterações" : "Cadastrar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
