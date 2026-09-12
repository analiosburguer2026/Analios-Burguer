import { supabase } from "./supabase";
import { useCatalogStore } from "../store/catalogStore";
import { usePromotionStore } from "../store/promotionStore";
import { useCustomerStore } from "../store/customerStore";
import { useMotoboyStore } from "../store/motoboyStore";
import { useOrderStore } from "../store/orderStore";
import { useSettingsStore } from "../store/settingsStore";
import { useWhatsAppStore } from "../store/whatsappStore";
import { useOperationStore } from "../store/operationStore";

type AppStateKey =
  | "catalog"
  | "promotions"
  | "customers"
  | "motoboys"
  | "orders"
  | "settings"
  | "whatsapp"
  | "operation";

type AppStateData = Record<AppStateKey, Record<string, unknown>>;
type SyncRow = { key: AppStateKey; data: Record<string, unknown> };
type CustomerRegistration = { id: string; data: Record<string, unknown> };

function getState(): AppStateData {
  return {
    catalog: {
      categories: useCatalogStore.getState().categories,
      products: useCatalogStore.getState().products,
    },
    promotions: { promotions: usePromotionStore.getState().promotions },
    customers: {
      customers: useCustomerStore.getState().customers,
      loyaltyTransactions: useCustomerStore.getState().loyaltyTransactions,
    },
    motoboys: { motoboys: useMotoboyStore.getState().motoboys },
    orders: {
      orders: useOrderStore.getState().orders,
      sequence: useOrderStore.getState().sequence,
    },
    settings: { settings: useSettingsStore.getState().settings },
    whatsapp: {
      templates: useWhatsAppStore.getState().templates,
      logs: useWhatsAppStore.getState().logs,
    },
    operation: {
      tables: useOperationStore.getState().tables,
      cashOpen: useOperationStore.getState().cashOpen,
      cashOpeningAmount: useOperationStore.getState().cashOpeningAmount,
      cashEntries: useOperationStore.getState().cashEntries,
    },
  };
}

function applyState(key: AppStateKey, data: Record<string, unknown>) {
  switch (key) {
    case "catalog":
      useCatalogStore.setState(data as never);
      break;
    case "promotions":
      usePromotionStore.setState(data as never);
      break;
    case "customers":
      useCustomerStore.setState(data as never);
      break;
    case "motoboys":
      useMotoboyStore.setState(data as never);
      break;
    case "orders":
      useOrderStore.setState(data as never);
      break;
    case "settings":
      useSettingsStore.setState(data as never);
      break;
    case "whatsapp":
      useWhatsAppStore.setState(data as never);
      break;
    case "operation":
      useOperationStore.setState(data as never);
      break;
  }
}

export async function startAdminSync(): Promise<() => void> {
  const { data, error } = await supabase
    .from("app_state")
    .select("key,data")
    .order("key");

  if (error) throw error;

  const rows = (data ?? []) as SyncRow[];
  let applyingRemoteState = true;
  if (rows.length === 0) {
    await saveAllState();
  } else {
    rows.forEach((row) => applyState(row.key, row.data));
  }
  const { data: registrations, error: registrationError } = await supabase
    .from("customer_registrations")
    .select("id,data")
    .order("created_at");
  if (registrationError) throw registrationError;
  mergeCustomerRegistrations((registrations ?? []) as CustomerRegistration[]);
  applyingRemoteState = false;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  const scheduleSave = () => {
    if (stopped || applyingRemoteState) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void saveAllState();
    }, 500);
  };

  const unsubscribers = [
    useCatalogStore.subscribe(scheduleSave),
    usePromotionStore.subscribe(scheduleSave),
    useCustomerStore.subscribe(scheduleSave),
    useMotoboyStore.subscribe(scheduleSave),
    useOrderStore.subscribe(scheduleSave),
    useSettingsStore.subscribe(scheduleSave),
    useWhatsAppStore.subscribe(scheduleSave),
    useOperationStore.subscribe(scheduleSave),
  ];

  const channel = supabase
    .channel("app-state-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_state" },
      (payload) => {
        const row = (payload.new ?? payload.old) as Partial<SyncRow>;
        if (row.key && row.data) {
          applyingRemoteState = true;
          applyState(row.key, row.data);
          applyingRemoteState = false;
        }
      },
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "customer_registrations" },
      (payload) => {
        const registration = payload.new as CustomerRegistration;
        applyingRemoteState = true;
        mergeCustomerRegistrations([registration]);
        applyingRemoteState = false;
      },
    )
    .subscribe();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    void supabase.removeChannel(channel);
  };
}

function mergeCustomerRegistrations(registrations: CustomerRegistration[]) {
  const current = useCustomerStore.getState().customers;
  const additions = registrations
    .filter((registration) => !current.some((customer) => customer.id === registration.id))
    .map((registration) => registration.data as never);
  if (additions.length > 0) {
    useCustomerStore.setState({ customers: [...current, ...additions] });
  }
}

async function saveAllState() {
  const rows = Object.entries(getState()).map(([key, data]) => ({
    key,
    data,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("app_state").upsert(rows);
  if (error) console.error("Falha ao sincronizar dados com o Supabase:", error);
}
