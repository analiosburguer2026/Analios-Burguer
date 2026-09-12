import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Promotion } from "../types";

interface PromotionState {
  promotions: Promotion[];
  addPromotion: (promotion: Omit<Promotion, "id" | "createdAt">) => void;
  updatePromotion: (id: string, changes: Partial<Promotion>) => void;
  removePromotion: (id: string) => void;
  togglePromotionActive: (id: string) => void;
}

export const usePromotionStore = create<PromotionState>()(
  persist(
    (set) => ({
      promotions: [],

      addPromotion: (promotion) =>
        set((state) => ({
          promotions: [
            ...state.promotions,
            { ...promotion, id: uuid(), createdAt: new Date().toISOString() },
          ],
        })),

      updatePromotion: (id, changes) =>
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === id ? { ...p, ...changes } : p,
          ),
        })),

      removePromotion: (id) =>
        set((state) => ({
          promotions: state.promotions.filter((p) => p.id !== id),
        })),

      togglePromotionActive: (id) =>
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === id ? { ...p, active: !p.active } : p,
          ),
        })),
    }),
    { name: "analios-promotions" },
  ),
);

/** Retorna as promoções vigentes hoje e ativas. */
export function isPromotionCurrentlyValid(promo: Promotion): boolean {
  if (!promo.active) return false;
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);
  end.setHours(23, 59, 59, 999);
  return now >= start && now <= end;
}
