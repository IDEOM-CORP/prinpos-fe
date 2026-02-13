import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dummyCustomers } from "../data/dummy";
import { generateId } from "../utils";
import type { Customer } from "../types";

interface CustomerStore {
  customers: Customer[];
  initializeCustomers: () => void;
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],

      initializeCustomers: () => {
        const current = get().customers;
        if (current.length === 0) {
          console.log("Initializing customers with dummy data...");
          set({ customers: dummyCustomers });
        }
      },

      addCustomer: (customerData) => {
        const newCustomer: Customer = {
          ...customerData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));
        return newCustomer;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id);
      },
    }),
    {
      name: "customer-storage",
    },
  ),
);
