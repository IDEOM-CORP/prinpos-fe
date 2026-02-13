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
}

export const useItemStore = create<ItemStore>()(
  persist(
    (set, get) => ({
      items: [],

      initializeItems: () => {
        const currentItems = get().items;

        // Check if items need migration (missing new fields or stale structure)
        const needsMigration =
          currentItems.length > 0 &&
          currentItems.some(
            (item) =>
              !item.pricingModel ||
              item.isActive === undefined ||
              !item.sku ||
              item.costPrice === undefined ||
              // Check finishing options missing pricingType
              (item.finishingOptions &&
                item.finishingOptions.length > 0 &&
                !(item.finishingOptions[0] as Record<string, unknown>)
                  .pricingType) ||
              (item as unknown as Record<string, unknown>)["stock"] !==
                undefined,
          );

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
    }),
    {
      name: "item-storage",
    },
  ),
);
