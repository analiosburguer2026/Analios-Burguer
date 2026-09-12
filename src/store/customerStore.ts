import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Customer, LoyaltyTransaction } from "../types";

interface CustomerState {
  customers: Customer[];
  loyaltyTransactions: LoyaltyTransaction[];

  addCustomer: (
    customer: Omit<
      Customer,
      "id" | "createdAt" | "updatedAt" | "loyaltyPoints" | "totalSpent" | "ordersCount"
    >,
  ) => Customer;
  updateCustomer: (id: string, changes: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;

  addLoyaltyPoints: (
    customerId: string,
    points: number,
    description: string,
    orderId?: string,
  ) => void;
  redeemLoyaltyPoints: (
    customerId: string,
    points: number,
    description: string,
    orderId?: string,
  ) => boolean;
  registerOrderStats: (customerId: string, orderTotal: number) => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      loyaltyTransactions: [],

      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: uuid(),
          loyaltyPoints: 0,
          totalSpent: 0,
          ordersCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
        return newCustomer;
      },

      updateCustomer: (id, changes) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, ...changes, updatedAt: new Date().toISOString() }
              : c,
          ),
        })),

      removeCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        })),

      addLoyaltyPoints: (customerId, points, description, orderId) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, loyaltyPoints: c.loyaltyPoints + points }
              : c,
          ),
          loyaltyTransactions: [
            ...state.loyaltyTransactions,
            {
              id: uuid(),
              customerId,
              type: "earn",
              points,
              description,
              orderId,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      redeemLoyaltyPoints: (customerId, points, description, orderId) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer || customer.loyaltyPoints < points) return false;

        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, loyaltyPoints: c.loyaltyPoints - points }
              : c,
          ),
          loyaltyTransactions: [
            ...state.loyaltyTransactions,
            {
              id: uuid(),
              customerId,
              type: "redeem",
              points: -points,
              description,
              orderId,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return true;
      },

      registerOrderStats: (customerId, orderTotal) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  totalSpent: c.totalSpent + orderTotal,
                  ordersCount: c.ordersCount + 1,
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),
    }),
    { name: "analios-customers" },
  ),
);
