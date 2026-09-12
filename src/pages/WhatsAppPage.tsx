import { useState } from "react";
import { Plus, Send, Pencil, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Field, Input, Textarea } from "../components/ui/Form";
import { useWhatsAppStore } from "../store/whatsappStore";
import { useCustomerStore } from "../store/customerStore";
import { useSettingsStore } from "../store/settingsStore";
import { buildWhatsAppLink, renderTemplate, formatDateTime } from "../lib/utils";
import type { WhatsAppTemplate } from "../types";

const emptyForm = { name: "", message: "" };

export function WhatsAppPage() {
  const { templates, addTemplate, updateTemplate, removeTemplate, logs, logMessage } = useWhatsAppStore();
  const customers = useCustomerStore((s) => s.customers);
  const { settings } = useSettingsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [minPoints, setMinPoints] = useState("");

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(template: WhatsAppTemplate) {
    setEditingId(template.id);
    setForm({ name: template.name, message: template.message });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateTemplate(editingId, form);
    } else {
      addTemplate(form);
    }
    setModalOpen(false);
  }

  function toggleCustomerSelection(id: string) {
    setSelectedCustomerIds((ids) =>
      ids.includes(id) ? ids.filter((c) => c !== id) : [...ids, id],
    );
  }

  function selectByMinPoints() {
    const min = Number(minPoints) || 0;
    setSelectedCustomerIds(customers.filter((c) => c.loyaltyPoints >= min).map((c) => c.id));
  }

  function sendToCustomer(customerId: string) {
    const customer = customers.find((c) => c.id === customerId);
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!customer || !template) return;

    const message = renderTemplate(template.message, {
      nome: customer.name,
      pontos: customer.loyaltyPoints,
      loja: settings.storeName,
    });

    logMessage({
      customerId: customer.id,
      customerName: customer.name,
      templateId: template.id,
      message,
    });

    window.open(buildWhatsAppLink(customer.phone, message), "_blank");
  }

  function sendToSelected() {
    if (!selectedTemplateId) {
      alert("Selecione um modelo de mensagem.");
      return;
    }
    if (selectedCustomerIds.length === 0) {
      alert("Selecione ao menos um cliente.");
      return;
    }
    // Abre uma aba do WhatsApp por cliente selecionado (fluxo manual, sem servidor).
    selectedCustomerIds.forEach((id) => sendToCustomer(id));
    setSendModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-black">WhatsApp</h1>
          <p className="text-sm text-black/50">
            Modelos de mensagem e envio via WhatsApp Web para seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSendModalOpen(true)}>
            <Send size={16} /> Enviar Mensagens
          </Button>
          <Button onClick={openNew}>
            <Plus size={16} /> Novo Modelo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardBody className="space-y-2">
              <p className="font-semibold text-brand-black">{t.name}</p>
              <p className="text-xs text-black/50 whitespace-pre-wrap">{t.message}</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                  <Pencil size={14} /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Remover modelo "${t.name}"?`)) removeTemplate(t.id);
                  }}
                >
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-black">Histórico de Envios</h2>
        </CardHeader>
        <CardBody className="space-y-2 max-h-72 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between border-b border-black/5 pb-2 text-sm">
              <div>
                <p className="font-medium">{l.customerName}</p>
                <p className="text-xs text-black/40 line-clamp-1">{l.message}</p>
              </div>
              <p className="text-xs text-black/40">{formatDateTime(l.createdAt)}</p>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-sm text-black/40 text-center py-4">Nenhuma mensagem enviada ainda.</p>
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Modelo" : "Novo Modelo de Mensagem"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome do modelo">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field
            label="Mensagem"
            hint="Use {{nome}}, {{pontos}} e {{loja}} para personalizar automaticamente"
          >
            <Textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? "Salvar alterações" : "Criar modelo"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        title="Enviar Mensagens em Massa"
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4">
          <Field label="Modelo de mensagem">
            <select
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">Selecione um modelo...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-end gap-2">
            <Field label="Selecionar clientes com pontos mínimos de">
              <Input
                type="number"
                min="0"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
              />
            </Field>
            <Button type="button" variant="outline" onClick={selectByMinPoints}>
              Aplicar filtro
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-black/10 p-2 space-y-1">
            {customers.map((c) => (
              <label key={c.id} className="flex items-center justify-between gap-2 text-sm py-1">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCustomerIds.includes(c.id)}
                    onChange={() => toggleCustomerSelection(c.id)}
                  />
                  {c.name} - {c.phone}
                </span>
                <span className="text-xs text-black/40">{c.loyaltyPoints} pts</span>
              </label>
            ))}
            {customers.length === 0 && (
              <p className="text-xs text-black/40">Nenhum cliente cadastrado.</p>
            )}
          </div>

          <p className="text-xs text-black/40">
            Ao confirmar, uma aba do WhatsApp Web será aberta para cada cliente selecionado com a
            mensagem pronta - você confirma o envio manualmente em cada conversa.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setSendModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={sendToSelected}>
              <Send size={16} /> Enviar para {selectedCustomerIds.length} cliente(s)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
