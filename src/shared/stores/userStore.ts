import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";
import { dummyUsers } from "../data/dummy";
import { generateId } from "../utils";

interface UserStore {
  users: User[];
  initializeUsers: () => void;
  addUser: (user: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  getUsersByBranch: (branchId: string) => User[];
  getUsersByRole: (role: User["role"]) => User[];
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [],

      initializeUsers: () => {
        const currentUsers = get().users;
        if (currentUsers.length === 0) {
          set({ users: dummyUsers });
        }
      },

      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ users: [...state.users, newUser] }));
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...updates } : user,
          ),
        }));
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },

      getUserById: (id) => {
        return get().users.find((user) => user.id === id);
      },

      getUsersByBranch: (branchId) => {
        return get().users.filter((user) => user.branchId === branchId);
      },

      getUsersByRole: (role) => {
        return get().users.filter((user) => user.role === role);
      },
    }),
    {
      name: "user-storage",
    },
  ),
);
