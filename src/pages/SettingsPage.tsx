import { useRef } from "react";
import { Download, Upload, Save, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Form";
import type { StoreSettings } from "../types";
import { useSettingsStore } from "../store/settingsStore";
import { supabase } from "../lib/supabase";

const STORAGE_KEYS = [
  "analios-catalog",
  "analios-promotions",
  "analios-customers",
  "analios-motoboys",
  "analios-orders",
  "analios-settings",
  "analios-whatsapp",
];

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  function handleExport() {
    const backup: Record<string, unknown> = {};
    STORAGE_KEYS.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) backup[key] = JSON.parse(raw);
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analios-burguer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        Object.entries(data).forEach(([key, value]) => {
          if (STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
        alert("Backup restaurado com sucesso! A página será recarregada.");
        window.location.reload();
      } catch {
        alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
  }

  async function handleSignOutEverywhere() {
    const confirmed = window.confirm(
      "Isso encerrará a sessão da gestão em todos os dispositivos. Continuar?",
    );
    if (!confirmed) return;

    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      alert(`Não foi possível encerrar as sessões: ${error.message}`);
      return;
    }
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-brand-black">Configurações</h1>
        <p className="text-sm text-black/50">Dados da loja, entrega e backup local</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-black">Dados da Loja</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome da loja">
              <Input
                value={settings.storeName}
                onChange={(e) => updateSettings({ storeName: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp da loja" hint="Formato: 5599999999999 (código do país + DDD + número)">
              <Input
                value={settings.whatsappNumber}
                onChange={(e) => updateSettings({ whatsappNumber: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Formas de atendimento">
            <Select
              value={settings.serviceMode ?? "both"}
              onChange={(e) => updateSettings({ serviceMode: e.target.value as StoreSettings["serviceMode"] })}
            >
              <option value="delivery">Somente entrega</option>
              <option value="pickup">Somente retirada na loja</option>
              <option value="both">Entrega e retirada na loja</option>
            </Select>
          </Field>
          <Field label="Aviso destacado no cardápio" hint="Deixe vazio para não exibir. Ex.: Hoje tem promoção de combo!">
            <Input
              value={settings.announcementText ?? ""}
              onChange={(e) => updateSettings({ announcementText: e.target.value })}
              placeholder="Mensagem importante para os clientes"
            />
          </Field>
          <Field label="Endereço">
            <Input value={settings.address} onChange={(e) => updateSettings({ address: e.target.value })} />
          </Field>
          <Field label="Horário de funcionamento">
            <Input
              value={settings.openingHours}
              onChange={(e) => updateSettings({ openingHours: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Taxa de entrega (R$)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={settings.deliveryFee}
                onChange={(e) => updateSettings({ deliveryFee: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Entrega grátis acima de (R$)" hint="Deixe 0 para desativar">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={settings.freeDeliveryAbove ?? 0}
                onChange={(e) => updateSettings({ freeDeliveryAbove: Number(e.target.value) || undefined })}
              />
            </Field>
          </div>
          <p className="flex items-center gap-2 text-xs text-green-700">
            <Save size={14} /> As alterações são salvas automaticamente no armazenamento local.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-black">Backup e Restauração</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-black/50">
            Todos os dados do sistema (catálogo, clientes, pedidos, motoboys, promoções e
            configurações) são armazenados localmente no seu navegador. Faça backups
            frequentes para não perder informações.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download size={16} /> Exportar backup (.json)
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <Upload size={16} /> Importar backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-black">Segurança da gestão</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-black/50">
            Encerre a sessão administrativa neste dispositivo e revogue as sessões dos
            demais dispositivos.
          </p>
          <Button variant="outline" onClick={handleSignOutEverywhere}>
            <LogOut size={16} /> Deslogar de todos os dispositivos
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
