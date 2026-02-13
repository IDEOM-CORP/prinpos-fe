import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "../types";
import { generateId } from "../utils";
import { ITEM_CATEGORIES } from "../constants";

interface CategoryStore {
  categories: Category[];
  initializeCategories: () => void;
  addCategory: (category: Omit<Category, "id" | "createdAt">) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryNames: () => string[];
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      categories: [],

      initializeCategories: () => {
        const current = get().categories;
        if (current.length === 0) {
          const defaultCategories: Category[] = ITEM_CATEGORIES.map(
            (name, index) => ({
              id: `cat-${index + 1}`,
              name,
              description: "",
              businessId: "org-1",
              createdAt: "2024-01-01T00:00:00.000Z",
            }),
          );
          set({ categories: defaultCategories });
        }
      },

      addCategory: (categoryData) => {
        const newCategory: Category = {
          ...categoryData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat,
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        }));
      },

      getCategoryById: (id) => {
        return get().categories.find((cat) => cat.id === id);
      },

      getCategoryNames: () => {
        return get().categories.map((cat) => cat.name);
      },
    }),
    {
      name: "category-storage",
    },
  ),
);
