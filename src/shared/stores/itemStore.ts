import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dummyItems } from "../data/dummy";
import { generateId } from "../utils";
import type { Item } from "../types";

interface ItemStore {
  items: Item[];
  initializeItems: () => void;
  addItem: (item: Omit<Item, "id" | "createdAt">) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  getItemById: (id: string) => Item | undefined;
  updateStock: (id: string, quantity: number) => void;
}

export const useItemStore = create<ItemStore>()(
  persist(
    (set, get) => ({
      items: [],

      initializeItems: () => {
        const currentItems = get().items;

        // Check if items need migration (missing pricingModel field)
        const needsMigration =
          currentItems.length > 0 &&
          currentItems.some((item) => !item.pricingModel);

        if (currentItems.length === 0 || needsMigration) {
          console.log("Initializing items with new data structure...");
          set({ items: dummyItems });
        }
      },

      addItem: (itemData) => {
        const newItem: Item = {
          ...itemData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ items: [...state.items, newItem] }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item,
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      getItemById: (id) => {
        return get().items.find((item) => item.id === id);
      },

      updateStock: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, stock: item.stock + quantity } : item,
          ),
        }));
      },
    }),
    {
      name: "item-storage",
    },
  ),
);
