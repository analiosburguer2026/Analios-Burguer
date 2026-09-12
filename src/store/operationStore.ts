import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { CashEntry, StoreTable, TableStatus } from "../types";

interface OperationState {
  tables: StoreTable[];
  cashOpen: boolean;
  cashOpeningAmount: number;
  cashEntries: CashEntry[];
  setTableStatus: (id: string, status: TableStatus, customerName?: string) => void;
  openCash: (amount: number) => void;
  closeCash: () => void;
  addCashEntry: (entry: Omit<CashEntry, "id" | "createdAt">) => void;
}

const initialTables: StoreTable[] = Array.from({ length: 12 }, (_, index) => ({
  id: `table-${index + 1}`,
  number: index + 1,
  status: "free",
}));

export const useOperationStore = create<OperationState>()(
  persist(
    (set) => ({
      tables: initialTables,
      cashOpen: false,
      cashOpeningAmount: 0,
      cashEntries: [],
      setTableStatus: (id, status, customerName) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === id
              ? {
                  ...table,
                  status,
                  customerName: status === "free" ? undefined : customerName || table.customerName,
                  openedAt: status === "free" ? undefined : table.openedAt || new Date().toISOString(),
                }
              : table,
          ),
        })),
      openCash: (amount) => set({ cashOpen: true, cashOpeningAmount: amount }),
      closeCash: () => set({ cashOpen: false }),
      addCashEntry: (entry) =>
        set((state) => ({
          cashEntries: [{ ...entry, id: uuid(), createdAt: new Date().toISOString() }, ...state.cashEntries],
        })),
    }),
    { name: "analios-operation" },
  ),
);
