import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreSettings } from "../types";
import { seedSettings } from "../lib/seedData";

interface SettingsState {
  settings: StoreSettings;
  updateSettings: (changes: Partial<StoreSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: seedSettings,
      updateSettings: (changes) =>
        set((state) => ({ settings: { ...state.settings, ...changes } })),
    }),
    { name: "analios-settings" },
  ),
);
