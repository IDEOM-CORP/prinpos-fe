import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Item } from "../types";

interface CartStore {
  items: CartItem[];
  addItem: (
    item: Item,
    quantity?: number,
    options?: {
      width?: number;
      height?: number;
      material?: string;
      finishing?: string[];
      notes?: string;
    },
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateDimensions: (itemId: string, width: number, height: number) => void;
  updateMaterial: (itemId: string, material: string) => void;
  updateFinishing: (itemId: string, finishing: string[]) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1, options) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.item.id === item.id);

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.item.id === item.id
                  ? {
                      ...i,
                      quantity: i.quantity + quantity,
                      width: options?.width ?? i.width,
                      height: options?.height ?? i.height,
                      area:
                        options?.width && options?.height
                          ? options.width * options.height
                          : i.area,
                      material: options?.material ?? i.material,
                      finishing: options?.finishing ?? i.finishing,
                      notes: options?.notes ?? i.notes,
                    }
                  : i,
              ),
            };
          }

          const width = options?.width;
          const height = options?.height;
          const area = width && height ? width * height : undefined;

          return {
            items: [
              ...state.items,
              {
                item,
                quantity,
                width,
                height,
                area,
                material: options?.material,
                finishing: options?.finishing,
                notes: options?.notes,
              },
            ],
          };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.item.id === itemId ? { ...i, quantity } : i,
          ),
        }));
      },

      updateDimensions: (itemId, width, height) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.item.id === itemId
              ? { ...i, width, height, area: width * height }
              : i,
          ),
        }));
      },

      updateMaterial: (itemId, material) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.item.id === itemId ? { ...i, material } : i,
          ),
        }));
      },

      updateFinishing: (itemId, finishing) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.item.id === itemId ? { ...i, finishing } : i,
          ),
        }));
      },

      updateNotes: (itemId, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.item.id === itemId ? { ...i, notes } : i,
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((total, cartItem) => {
          const item = cartItem.item;
          let itemPrice = 0;

          // Calculate based on pricing model
          if (
            item.pricingModel === "area" &&
            cartItem.area &&
            item.pricePerSqm
          ) {
            // Area-based: area (m²) × price per m² × quantity
            itemPrice = cartItem.area * item.pricePerSqm * cartItem.quantity;
          } else {
            // Fixed or quantity-based: price × quantity
            itemPrice = item.price * cartItem.quantity;
          }

          return total + itemPrice;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
    },
  ),
);
