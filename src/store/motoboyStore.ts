import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Motoboy } from "../types";

interface MotoboyState {
  motoboys: Motoboy[];
  addMotoboy: (
    motoboy: Omit<Motoboy, "id" | "createdAt" | "deliveriesCount">,
  ) => void;
  updateMotoboy: (id: string, changes: Partial<Motoboy>) => void;
  removeMotoboy: (id: string) => void;
  setMotoboyStatus: (id: string, status: Motoboy["status"]) => void;
  incrementDeliveries: (id: string) => void;
}

export const useMotoboyStore = create<MotoboyState>()(
  persist(
    (set) => ({
      motoboys: [],

      addMotoboy: (motoboy) =>
        set((state) => ({
          motoboys: [
            ...state.motoboys,
            {
              ...motoboy,
              id: uuid(),
              deliveriesCount: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateMotoboy: (id, changes) =>
        set((state) => ({
          motoboys: state.motoboys.map((m) =>
            m.id === id ? { ...m, ...changes } : m,
          ),
        })),

      removeMotoboy: (id) =>
        set((state) => ({
          motoboys: state.motoboys.filter((m) => m.id !== id),
        })),

      setMotoboyStatus: (id, status) =>
        set((state) => ({
          motoboys: state.motoboys.map((m) =>
            m.id === id ? { ...m, status } : m,
          ),
        })),

      incrementDeliveries: (id) =>
        set((state) => ({
          motoboys: state.motoboys.map((m) =>
            m.id === id
              ? { ...m, deliveriesCount: m.deliveriesCount + 1 }
              : m,
          ),
        })),
    }),
    { name: "analios-motoboys" },
  ),
);
