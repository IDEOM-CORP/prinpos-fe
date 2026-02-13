import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BranchFilterStore {
  selectedBranchId: string; // "" means "Semua Cabang"
  setSelectedBranchId: (branchId: string) => void;
  reset: () => void;
}

export const useBranchFilterStore = create<BranchFilterStore>()(
  persist(
    (set) => ({
      selectedBranchId: "",

      setSelectedBranchId: (branchId: string) => {
        set({ selectedBranchId: branchId });
      },

      reset: () => {
        set({ selectedBranchId: "" });
      },
    }),
    {
      name: "branch-filter-storage",
    },
  ),
);
