import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Finishing } from "../types/finishing";

interface FinishingState {
  finishings: Finishing[];
  addFinishing: (f: Finishing) => void;
  updateFinishing: (id: string, f: Partial<Finishing>) => void;
  deleteFinishing: (id: string) => void;
}

export const useFinishingStore = create<FinishingState>()(
  persist(
    (set, get) => ({
      finishings: [],
      addFinishing: (f) => set({ finishings: [...get().finishings, f] }),
      updateFinishing: (id, f) =>
        set({
          finishings: get().finishings.map((fin) =>
            fin.id === id ? { ...fin, ...f } : fin,
          ),
        }),
      deleteFinishing: (id) =>
        set({ finishings: get().finishings.filter((fin) => fin.id !== id) }),
    }),
    { name: "finishing-storage" },
  ),
);
