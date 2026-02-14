import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Material } from "../types/material";

interface MaterialState {
  materials: Material[];
  addMaterial: (m: Material) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: [],
      addMaterial: (m) => set({ materials: [...get().materials, m] }),
      updateMaterial: (id, m) =>
        set({
          materials: get().materials.map((mat) =>
            mat.id === id ? { ...mat, ...m } : mat,
          ),
        }),
      deleteMaterial: (id) =>
        set({ materials: get().materials.filter((mat) => mat.id !== id) }),
    }),
    { name: "material-storage" },
  ),
);
