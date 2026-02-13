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
            // Area-based: area × price per area unit × quantity
            itemPrice = cartItem.area * item.pricePerSqm * cartItem.quantity;
          } else if (
            item.pricingModel === "tiered" &&
            item.tiers &&
            item.tiers.length > 0
          ) {
            // Tiered: find tier for current quantity
            let unitPrice = item.price;
            for (const tier of item.tiers) {
              if (
                cartItem.quantity >= tier.minQty &&
                (tier.maxQty === null || cartItem.quantity <= tier.maxQty)
              ) {
                unitPrice = tier.price;
                break;
              }
            }
            // Fallback to last tier if qty exceeds all
            const lastTier = item.tiers[item.tiers.length - 1];
            if (lastTier && lastTier.maxQty === null) {
              if (cartItem.quantity >= lastTier.minQty) {
                unitPrice = lastTier.price;
              }
            }
            itemPrice = unitPrice * cartItem.quantity;
          } else {
            // Fixed: price × quantity
            itemPrice = item.price * cartItem.quantity;
          }

          // Add finishing costs
          if (
            cartItem.finishing &&
            cartItem.finishing.length > 0 &&
            item.finishingOptions
          ) {
            const finishingCost = cartItem.finishing.reduce((sum, fName) => {
              const opt = item.finishingOptions?.find(
                (fo) => fo.name === fName,
              );
              return sum + (opt?.price || 0);
            }, 0);
            itemPrice += finishingCost * cartItem.quantity;
          }

          // Add setup fee (one-time per item type)
          if (item.setupFee) {
            itemPrice += item.setupFee;
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
