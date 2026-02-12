import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";
import { dummyUsers } from "../data/dummy";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const user = dummyUsers.find(
          (u) => u.email === email && u.password === password,
        );

        if (user) {
          const token = `dummy-token-${user.id}`;
          set({ user, token, isAuthenticated: true });
          return { success: true };
        }

        return { success: false, message: "Email atau password salah" };
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
