import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { InventoryItem } from "../types";

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, "id" | "updatedAt">) => void;
  updateItem: (id: string, changes: Partial<InventoryItem>) => void;
  removeItem: (id: string) => void;
}

export const useInventoryStore = create<InventoryState>()(persist((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, { ...item, id: uuid(), updatedAt: new Date().toISOString() }] })),
  updateItem: (id, changes) => set((state) => ({ items: state.items.map((item) => item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item) })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}), { name: "analios-inventory" }));
