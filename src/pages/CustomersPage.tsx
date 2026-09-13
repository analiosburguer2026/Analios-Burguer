import { useState } from "react";
import { Plus, Pencil, Trash2, MessageCircle, Award } from "lucide-react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Field, Input, Textarea } from "../components/ui/Form";
import { useCustomerStore } from "../store/customerStore";
import { formatCurrency, formatDateTime, buildWhatsAppLink } from "../lib/utils";
import type { Customer } from "../types";
import { useOrderStore } from "../store/orderStore";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  birthDate: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  reference: "",
  notes: "",
};

export function CustomersPage() {
  const { customers, addCustomer, updateCustomer, removeCustomer } = useCustomerStore();
  const { orders, removeOrder } = useOrderStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const selectedOrders = orders.filter((order) => order.customerId === selectedCustomerId);
  const customerStats = (customerId: string) => {
    const customerOrders = orders.filter((order) => order.customerId === customerId && order.status !== "cancelled");
    return { count: customerOrders.length, total: customerOrders.reduce((sum, order) => sum + order.total, 0) };
  };

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      birthDate: customer.birthDate ?? "",
      street: customer.address?.street ?? "",
      number: customer.address?.number ?? "",
      complement: customer.address?.complement ?? "",
      neighborhood: customer.address?.neighborhood ?? "",
      city: customer.address?.city ?? "",
      reference: customer.address?.reference ?? "",
      notes: customer.notes ?? "",
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      birthDate: form.birthDate || undefined,
      address: form.street
        ? {
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            neighborhood: form.neighborhood,
            city: form.city,
            reference: form.reference || undefined,
          }
        : undefined,
      notes: form.notes || undefined,
    };

    if (editingId) {
      updateCustomer(editingId, payload);
    } else {
      addCustomer(payload);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-black">Clientes</h1>
          <p className="text-sm text-black/50">Cadastro completo de clientes</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Novo Cliente
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome ou telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-black/40">
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">Telefone</th>
                <th className="p-4 font-medium">Pontos</th>
                <th className="p-4 font-medium">Total Gasto</th>
                <th className="p-4 font-medium">Pedidos</th>
                <th className="p-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelectedCustomerId(c.id)} className="cursor-pointer border-b border-black/5 hover:bg-brand-orange/5">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-black/50">{c.phone}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-brand-orange font-semibold">
                      <Award size={14} /> {c.loyaltyPoints}
                    </span>
                  </td>
                  <td className="p-4">{formatCurrency(customerStats(c.id).total)}</td>
                  <td className="p-4">{customerStats(c.id).count}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <a
                        href={buildWhatsAppLink(c.phone, `Olá ${c.name}! Aqui é da Analio's Burguer 🍔`)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          <MessageCircle size={14} />
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Remover o cliente "${c.name}"?`)) removeCustomer(c.id);
                        }}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-black/40">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {selectedCustomer && (
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="font-semibold">Pedidos de {selectedCustomer.name}</h2><p className="text-xs text-black/50">{selectedOrders.length} pedido(s) encontrado(s)</p></div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedCustomerId(null)}>Fechar</Button>
            </div>
            <div className="space-y-2">
              {selectedOrders.map((order) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/5 p-3 text-sm">
                  <div><p className="font-semibold">{order.code} · {formatCurrency(order.total)}</p><p className="text-xs text-black/50">{formatDateTime(order.createdAt)} · {order.status}</p></div>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Excluir o pedido ${order.code}? Use apenas para pedidos de teste.`)) removeOrder(order.id); }}><Trash2 size={14} className="text-red-500" /> Excluir teste</Button>
                </div>
              ))}
              {selectedOrders.length === 0 && <p className="text-sm text-black/50">Nenhum pedido vinculado.</p>}
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Cliente" : "Novo Cliente"}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome completo">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="WhatsApp/Telefone" hint="Ex: 99999999999 (com DDD)">
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail (opcional)">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field label="Data de nascimento (opcional)">
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              />
            </Field>
          </div>

          <p className="text-sm font-semibold text-brand-black pt-2">Endereço</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rua">
              <Input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
            </Field>
            <Field label="Número">
              <Input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
            </Field>
            <Field label="Complemento">
              <Input
                value={form.complement}
                onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bairro">
              <Input
                value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
              />
            </Field>
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </Field>
          </div>
          <Field label="Ponto de referência">
            <Input
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            />
          </Field>
          <Field label="Observações">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? "Salvar alterações" : "Cadastrar cliente"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
