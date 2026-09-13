import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { CatalogPage } from "./pages/CatalogPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { LoyaltyPage } from "./pages/LoyaltyPage";
import { CustomersPage } from "./pages/CustomersPage";
import { MotoboysPage } from "./pages/MotoboysPage";
import { OrdersPage } from "./pages/OrdersPage";
import { WhatsAppPage } from "./pages/WhatsAppPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PublicMenuPage } from "./pages/public/PublicMenuPage";
import { TrackingPage } from "./pages/public/TrackingPage";
import { CustomerPortalPage } from "./pages/public/CustomerPortalPage";
import { OrderConfirmationPage } from "./pages/public/OrderConfirmationPage";
import { ReportsPage } from "./pages/ReportsPage";
import { OperationPage } from "./pages/OperationPage";
import { InventoryPage } from "./pages/InventoryPage";
import { AuthPage } from "./pages/AuthPage";
import { ProtectedAdminRoute } from "./components/layout/ProtectedAdminRoute";
import { useEffect } from "react";
import { startAdminSync } from "./lib/adminSync";
import { supabase } from "./lib/supabase";
import { useSettingsStore } from "./store/settingsStore";

function App() {
  const darkMode = useSettingsStore((state) => state.settings.darkMode ?? false);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    let stopSync: (() => void) | undefined;
    let cancelled = false;
    let starting = false;

    const startSync = () => {
      if (starting || stopSync || cancelled) return;
      starting = true;
      startAdminSync()
        .then((stop) => {
          starting = false;
          if (cancelled) stop();
          else stopSync = stop;
        })
        .catch((error) => {
          starting = false;
          console.error("Não foi possível iniciar a sincronização:", error);
        });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) startSync();
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) startSync();
        else {
          stopSync?.();
          stopSync = undefined;
        }
      },
    );

    return () => {
      cancelled = true;
      stopSync?.();
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicMenuPage />} />
        <Route path="/cardapio" element={<PublicMenuPage />} />
        <Route path="/rastreio" element={<TrackingPage />} />
        <Route path="/cliente" element={<CustomerPortalPage />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmationPage />} />
        <Route path="/login" element={<AuthPage />} />

        <Route element={<ProtectedAdminRoute />}>
          <Route path="/gestao" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="operacao" element={<OperationPage />} />
          <Route path="estoque" element={<InventoryPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="catalogo" element={<CatalogPage />} />
          <Route path="promocoes" element={<PromotionsPage />} />
          <Route path="fidelidade" element={<LoyaltyPage />} />
          <Route path="clientes" element={<CustomersPage />} />
          <Route path="motoboys" element={<MotoboysPage />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
