import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { WhatsAppLogEntry, WhatsAppTemplate } from "../types";
import { seedWhatsAppTemplates } from "../lib/seedData";

interface WhatsAppState {
  templates: WhatsAppTemplate[];
  logs: WhatsAppLogEntry[];

  addTemplate: (template: Omit<WhatsAppTemplate, "id" | "createdAt">) => void;
  updateTemplate: (id: string, changes: Partial<WhatsAppTemplate>) => void;
  removeTemplate: (id: string) => void;

  logMessage: (entry: Omit<WhatsAppLogEntry, "id" | "createdAt">) => void;
}

export const useWhatsAppStore = create<WhatsAppState>()(
  persist(
    (set) => ({
      templates: seedWhatsAppTemplates,
      logs: [],

      addTemplate: (template) =>
        set((state) => ({
          templates: [
            ...state.templates,
            { ...template, id: uuid(), createdAt: new Date().toISOString() },
          ],
        })),

      updateTemplate: (id, changes) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...changes } : t,
          ),
        })),

      removeTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      logMessage: (entry) =>
        set((state) => ({
          logs: [
            { ...entry, id: uuid(), createdAt: new Date().toISOString() },
            ...state.logs,
          ],
        })),
    }),
    { name: "analios-whatsapp" },
  ),
);
