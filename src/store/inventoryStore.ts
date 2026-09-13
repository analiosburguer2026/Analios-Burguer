import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { InventoryItem, InventoryMovement } from "../types";

interface InventoryState {
  items: InventoryItem[];
  movements: InventoryMovement[];
  addItem: (item: Omit<InventoryItem, "id" | "updatedAt">) => void;
  updateItem: (id: string, changes: Partial<InventoryItem>) => void;
  removeItem: (id: string) => void;
  moveStock: (id: string, type: InventoryMovement["type"], quantity: number, reason: string) => void;
}

export const useInventoryStore = create<InventoryState>()(persist((set) => ({
  items: [],
  movements: [],
  addItem: (item) => set((state) => ({ items: [...state.items, { ...item, id: uuid(), updatedAt: new Date().toISOString() }] })),
  updateItem: (id, changes) => set((state) => ({ items: state.items.map((item) => item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item) })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  moveStock: (id, type, quantity, reason) => set((state) => {
    const item = state.items.find((entry) => entry.id === id);
    if (!item || quantity <= 0) return state;
    const delta = type === "entry" ? quantity : type === "exit" ? -quantity : quantity - item.quantity;
    return {
      items: state.items.map((entry) => entry.id === id ? { ...entry, quantity: Math.max(0, entry.quantity + delta), updatedAt: new Date().toISOString() } : entry),
      movements: [...state.movements, { id: uuid(), itemId: id, type, quantity, reason, createdAt: new Date().toISOString() }],
    };
  }),
}), { name: "analios-inventory" }));
