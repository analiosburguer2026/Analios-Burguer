import { useEffect, useMemo, useState } from "react";
import { Award, ClipboardList, LogIn, LogOut, UserPlus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useCustomerStore } from "../../store/customerStore";
import { useOrderStore } from "../../store/orderStore";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import type { Customer } from "../../types";

export function CustomerPortalPage() {
  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const removeCustomer = useCustomerStore((state) => state.removeCustomer);
  const orders = useOrderStore((state) => state.orders);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [sessionPhone, setSessionPhone] = useState("");
  const [remoteCustomer, setRemoteCustomer] = useState<Customer | null>(null);
  const [sessionCustomerId, setSessionCustomerId] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("analios-customer-id") || "" : "",
  );
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const customer = useMemo(
    () =>
      remoteCustomer ??
      customers.find(
        (item) =>
          item.id === (sessionPhone || sessionCustomerId) ||
          item.phone.replace(/\D/g, "") === sessionPhone.replace(/\D/g, ""),
      ),
    [customers, remoteCustomer, sessionCustomerId, sessionPhone],
  );
  const customerOrders = orders.filter((order) => order.customerId === customer?.id);

  useEffect(() => {
    const savedPhone = sessionStorage.getItem("analios-customer-phone");
    if (!savedPhone || remoteCustomer) return;
    supabase.rpc("find_customer_by_phone", { p_phone: savedPhone }).then(({ data }) => {
      if (!data) return;
      const found = data as Customer;
      setRemoteCustomer(found);
      setSessionPhone(found.phone);
    });
  }, [remoteCustomer]);

  async function deleteAccount() {
    if (!customer) return;
    const confirmed = window.confirm(
      "Excluir sua conta removerá seu cadastro, pontos e acesso a esta área. Seus pedidos históricos poderão permanecer para fins fiscais. Continuar?",
    );
    if (!confirmed) return;

    const { data, error: deletionError } = await supabase.rpc("delete_customer_account", {
      p_customer_id: customer.id,
      p_phone: customer.phone,
    });
    if (deletionError || !data) {
      window.alert("Não foi possível excluir a conta agora. Tente novamente.");
      return;
    }
    removeCustomer(customer.id);
    sessionStorage.removeItem("analios-customer-id");
    sessionStorage.removeItem("analios-customer-phone");
    setSessionPhone("");
    setSessionCustomerId("");
    setRemoteCustomer(null);
    window.alert("Sua conta foi excluída.");
  }

  async function accessAccount(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const normalized = phone.replace(/\D/g, "");
    setLoading(true);
    const localCustomer = customers.find((item) => item.phone.replace(/\D/g, "") === normalized);
    const { data: remoteCustomer, error: lookupError } = await supabase.rpc("find_customer_by_phone", {
      p_phone: phone,
    });
    setLoading(false);
    if (lookupError) {
      setError("Não foi possível consultar seu cadastro. Tente novamente.");
      return;
    }
    const found = localCustomer ?? remoteCustomer;
    if (!found) {
      setError("Telefone não encontrado. Faça seu cadastro abaixo.");
      setRegistering(true);
      return;
    }
    if (!localCustomer) {
      useCustomerStore.setState((state) => ({
        customers: [...state.customers, found],
      }));
    }
    setSessionPhone(found.phone);
    setSessionCustomerId(found.id);
    setRemoteCustomer(found);
    sessionStorage.setItem("analios-customer-id", found.id);
    sessionStorage.setItem("analios-customer-phone", found.phone);
  }

  async function registerAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Informe nome e telefone com DDD.");
      return;
    }
    const created = addCustomer({ name: name.trim(), phone });
    const { error: syncError } = await supabase.from("customer_registrations").upsert({
      id: created.id,
      data: created,
    });
    if (syncError) {
      setError("Cadastro salvo neste dispositivo, mas não foi possível sincronizá-lo. Tente novamente.");
      return;
    }
    setSessionPhone(created.phone);
    setSessionCustomerId(created.id);
    setRemoteCustomer(created);
    sessionStorage.setItem("analios-customer-id", created.id);
    sessionStorage.setItem("analios-customer-phone", created.phone);
    setError("");
  }

  if (customer) {
    return (
      <main className="min-h-screen bg-[#fbf6ee] px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-3xl text-brand-orange">Olá, {customer.name}!</p>
              <p className="text-sm text-black/50">{customer.phone}</p>
            </div>
            <button
              onClick={() => {
                setSessionPhone("");
                setSessionCustomerId("");
                setRemoteCustomer(null);
                sessionStorage.removeItem("analios-customer-id");
                sessionStorage.removeItem("analios-customer-phone");
              }}
              className="flex items-center gap-1 text-sm text-black/50"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-brand-orange p-5 text-white">
              <Award size={24} />
              <p className="mt-3 text-sm opacity-80">Pontos disponíveis</p>
              <p className="font-display text-3xl">{customer.loyaltyPoints}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <ClipboardList size={24} className="text-brand-orange" />
              <p className="mt-3 text-sm text-black/50">Total em pedidos</p>
              <p className="font-display text-2xl">{formatCurrency(customer.totalSpent)}</p>
            </div>
          </div>
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Meus pedidos</h2>
            <div className="space-y-3">
              {customerOrders.map((order) => (
                <Link key={order.id} to={`/rastreio?codigo=${encodeURIComponent(order.code)}`} className="block rounded-lg border border-black/5 p-3 hover:border-brand-orange">
                  <div className="flex justify-between">
                    <span className="font-semibold">{order.code}</span>
                    <span className="text-brand-orange">{formatCurrency(order.total)}</span>
                  </div>
                  <p className="text-xs text-black/45">{formatDateTime(order.createdAt)} · {order.status}</p>
                </Link>
              ))}
              {customerOrders.length === 0 && <p className="text-sm text-black/45">Nenhum pedido vinculado ainda.</p>}
            </div>
          </section>
          <Link to={returnTo} className="block rounded-lg bg-brand-orange px-4 py-3 text-center font-semibold text-white">
            Voltar ao cardápio
          </Link>
          <button
            type="button"
            onClick={deleteAccount}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600"
          >
            <Trash2 size={16} /> Excluir minha conta
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf6ee] px-4 py-10">
      <div className="mx-auto max-w-md space-y-5">
        <div className="text-center">
          <p className="font-display text-3xl text-brand-orange">Área do cliente</p>
          <p className="mt-2 text-sm text-black/50">Acesse com seu telefone para consultar pontos e pedidos.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <form onSubmit={accessAccount} className="space-y-4">
            <label className="block text-sm font-medium">Número de telefone</label>
            <input className="w-full rounded-lg border border-black/10 px-3 py-2" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(00) 00000-0000" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-3 font-semibold text-white disabled:opacity-60">
            <LogIn size={17} /> {loading ? "Consultando..." : "Acessar"}
            </button>
          </form>
          <button onClick={() => { setRegistering(!registering); setError(""); }} className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-brand-orange">
            <UserPlus size={16} /> {registering ? "Já tenho cadastro" : "Quero me cadastrar"}
          </button>
          {registering && (
            <form onSubmit={registerAccount} className="mt-4 space-y-3 border-t border-black/5 pt-4">
              <label className="block text-sm font-medium">Seu nome</label>
              <input className="w-full rounded-lg border border-black/10 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
              <button className="w-full rounded-lg bg-brand-wine px-4 py-3 font-semibold text-white">Criar cadastro</button>
            </form>
          )}
        </div>
        <Link to={returnTo} className="block text-center text-sm text-brand-orange underline">Voltar ao cardápio</Link>
      </div>
    </main>
  );
}
