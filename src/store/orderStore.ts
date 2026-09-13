import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Order, OrderStatus, PaymentStatus } from "../types";
import { generateOrderCode } from "../lib/utils";

interface OrderState {
  orders: Order[];
  sequence: number;

  addOrder: (order: Omit<Order, "id" | "code" | "createdAt" | "updatedAt">) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updatePayment: (code: string, paymentStatus: PaymentStatus, paymentId?: string) => void;
  assignMotoboy: (id: string, motoboyId: string) => void;
  updateTracking: (
    id: string,
    tracking: Pick<Order, "trackingNote" | "trackingLatitude" | "trackingLongitude">,
  ) => void;
  removeOrder: (id: string) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      sequence: 1,

      addOrder: (order) => {
        const sequence = get().sequence;
        const newOrder: Order = {
          ...order,
          id: uuid(),
          code: generateOrderCode(sequence),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          orders: [newOrder, ...state.orders],
          sequence: state.sequence + 1,
        }));
        return newOrder;
      },

      updateOrderStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, status, updatedAt: new Date().toISOString() }
              : o,
          ),
        })),

      updatePayment: (code, paymentStatus, paymentId) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.code === code
              ? { ...order, paymentStatus, paymentId, updatedAt: new Date().toISOString() }
              : order,
          ),
        })),

      assignMotoboy: (id, motoboyId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, motoboyId, updatedAt: new Date().toISOString() }
              : o,
          ),
        })),

      updateTracking: (id, tracking) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, ...tracking, trackingUpdatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : o,
          ),
        })),

      removeOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        })),
    }),
    { name: "analios-orders" },
  ),
);
