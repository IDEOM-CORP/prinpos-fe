import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Business, Branch } from "../types";
import { dummyBusinesses, dummyBranches } from "../data/dummy";
import { generateId } from "../utils";

interface BusinessStore {
  businesses: Business[];
  branches: Branch[];
  initializeData: () => void;

  // Business methods
  addBusiness: (business: Omit<Business, "id" | "createdAt">) => void;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;
  getBusinessById: (id: string) => Business | undefined;

  // Branch methods
  addBranch: (branch: Omit<Branch, "id" | "createdAt">) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  getBranchById: (id: string) => Branch | undefined;
  getBranchesByBusiness: (businessId: string) => Branch[];
  getBranchesByType: (type: Branch["type"]) => Branch[];
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      businesses: [],
      branches: [],

      initializeData: () => {
        const currentBusinesses = get().businesses;
        const currentBranches = get().branches;

        if (currentBusinesses.length === 0) {
          set({ businesses: dummyBusinesses });
        }
        if (currentBranches.length === 0) {
          set({ branches: dummyBranches });
        }
      },

      // Business methods
      addBusiness: (businessData) => {
        const newBusiness: Business = {
          ...businessData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ businesses: [...state.businesses, newBusiness] }));
      },

      updateBusiness: (id, updates) => {
        set((state) => ({
          businesses: state.businesses.map((business) =>
            business.id === id ? { ...business, ...updates } : business,
          ),
        }));
      },

      deleteBusiness: (id) => {
        set((state) => ({
          businesses: state.businesses.filter((business) => business.id !== id),
          branches: state.branches.filter((branch) => branch.businessId !== id),
        }));
      },

      getBusinessById: (id) => {
        return get().businesses.find((business) => business.id === id);
      },

      // Branch methods
      addBranch: (branchData) => {
        const newBranch: Branch = {
          ...branchData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ branches: [...state.branches, newBranch] }));
      },

      updateBranch: (id, updates) => {
        set((state) => ({
          branches: state.branches.map((branch) =>
            branch.id === id ? { ...branch, ...updates } : branch,
          ),
        }));
      },

      deleteBranch: (id) => {
        set((state) => ({
          branches: state.branches.filter((branch) => branch.id !== id),
        }));
      },

      getBranchById: (id) => {
        return get().branches.find((branch) => branch.id === id);
      },

      getBranchesByBusiness: (businessId) => {
        return get().branches.filter(
          (branch) => branch.businessId === businessId,
        );
      },

      getBranchesByType: (type) => {
        return get().branches.filter((branch) => branch.type === type);
      },
    }),
    {
      name: "business-storage",
    },
  ),
);
