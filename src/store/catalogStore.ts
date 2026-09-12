import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Category, Product } from "../types";
import { seedCategories, seedProducts } from "../lib/seedData";

interface CatalogState {
  categories: Category[];
  products: Product[];

  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  removeCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;

  addProduct: (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ) => void;
  updateProduct: (id: string, changes: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  adjustPrice: (id: string, newPrice: number) => void;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      categories: seedCategories,
      products: seedProducts,

      addCategory: (name) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { id: uuid(), name, order: state.categories.length + 1 },
          ],
        })),

      updateCategory: (id, name) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, name } : c,
          ),
        })),

      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      reorderCategories: (categories) => set({ categories }),

      addProduct: (product) =>
        set((state) => ({
          products: [
            ...state.products,
            {
              ...product,
              id: uuid(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateProduct: (id, changes) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, ...changes, updatedAt: new Date().toISOString() }
              : p,
          ),
        })),

      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      toggleProductActive: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, active: !p.active } : p,
          ),
        })),

      adjustPrice: (id, newPrice) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  basePrice: newPrice,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        })),
    }),
    { name: "analios-catalog" },
  ),
);
