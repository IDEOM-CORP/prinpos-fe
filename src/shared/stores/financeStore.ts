import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "../utils";

export type FinanceType = "income" | "expense";

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  amount: number;
  description: string;
  category: string;
  branchId: string;
  createdBy: string;
  createdAt: string;
  note?: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: FinanceType;
  isDefault: boolean; // Default categories cannot be deleted
}

// Default categories provided by the system
export const DEFAULT_INCOME_CATEGORIES: FinanceCategory[] = [
  { id: "inc-order", name: "Order", type: "income", isDefault: true },
  {
    id: "inc-jasa-desain",
    name: "Jasa Desain",
    type: "income",
    isDefault: true,
  },
  {
    id: "inc-jasa-lainnya",
    name: "Jasa Lainnya",
    type: "income",
    isDefault: true,
  },
  { id: "inc-lain-lain", name: "Lain-lain", type: "income", isDefault: true },
];

export const DEFAULT_EXPENSE_CATEGORIES: FinanceCategory[] = [
  {
    id: "exp-bahan-baku",
    name: "Bahan Baku",
    type: "expense",
    isDefault: true,
  },
  {
    id: "exp-operasional",
    name: "Operasional",
    type: "expense",
    isDefault: true,
  },
  { id: "exp-gaji", name: "Gaji", type: "expense", isDefault: true },
  { id: "exp-sewa", name: "Sewa", type: "expense", isDefault: true },
  {
    id: "exp-listrik-air",
    name: "Listrik & Air",
    type: "expense",
    isDefault: true,
  },
  {
    id: "exp-transportasi",
    name: "Transportasi",
    type: "expense",
    isDefault: true,
  },
  { id: "exp-marketing", name: "Marketing", type: "expense", isDefault: true },
  { id: "exp-peralatan", name: "Peralatan", type: "expense", isDefault: true },
  { id: "exp-lain-lain", name: "Lain-lain", type: "expense", isDefault: true },
];

const ALL_DEFAULTS = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

interface FinanceStore {
  entries: FinanceEntry[];
  customCategories: FinanceCategory[]; // User-added categories only

  // Entry actions
  addEntry: (entry: Omit<FinanceEntry, "id" | "createdAt">) => FinanceEntry;
  deleteEntry: (id: string) => void;

  // Category actions
  addCategory: (name: string, type: FinanceType) => FinanceCategory;
  deleteCategory: (id: string) => void;
  getCategories: (type: FinanceType) => FinanceCategory[];
  getCategoryNames: (type: FinanceType) => string[];
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      entries: [],
      customCategories: [],

      addEntry: (data) => {
        const newEntry: FinanceEntry = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          entries: [...state.entries, newEntry],
        }));
        return newEntry;
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      addCategory: (name, type) => {
        const trimmed = name.trim();
        // Check duplicate across defaults + custom
        const all = get().getCategories(type);
        const exists = all.some(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) {
          // Return existing one instead of creating duplicate
          return all.find(
            (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
          )!;
        }

        const newCat: FinanceCategory = {
          id: generateId(),
          name: trimmed,
          type,
          isDefault: false,
        };
        set((state) => ({
          customCategories: [...state.customCategories, newCat],
        }));
        return newCat;
      },

      deleteCategory: (id) => {
        // Only allow deleting non-default categories
        const cat = get().customCategories.find((c) => c.id === id);
        if (!cat || cat.isDefault) return;
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.id !== id),
        }));
      },

      getCategories: (type) => {
        const defaults = ALL_DEFAULTS.filter((c) => c.type === type);
        const custom = get().customCategories.filter((c) => c.type === type);
        return [...defaults, ...custom];
      },

      getCategoryNames: (type) => {
        return get()
          .getCategories(type)
          .map((c) => c.name);
      },
    }),
    {
      name: "finance-storage",
    },
  ),
);
