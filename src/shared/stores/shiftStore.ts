import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "../utils";

export interface CashTransaction {
  id: string;
  type: "cash_in" | "cash_out";
  amount: number;
  category: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  branchId: string;
  openedBy: string; // userId
  openedByName: string;
  openedAt: string;
  closedBy?: string;
  closedByName?: string;
  closedAt?: string;
  isActive: boolean;

  // Cash tracking
  openingBalance: number; // modal awal
  totalCashIn: number; // from cash sales + manual cash in
  totalNonCash: number; // transfer, QRIS, etc.
  totalCashOut: number; // pengeluaran kecil
  expectedEndingCash: number; // calculated
  actualEndingCash?: number; // input saat tutup shift
  difference?: number; // selisih

  // Transactions during shift
  cashTransactions: CashTransaction[];

  // Order payment summary
  totalSalesFromOrders: number;
  totalCashSales: number;
  totalTransferSales: number;
  orderPaymentCount: number;
}

// Default categories for cash in/out during shift
export const CASH_IN_CATEGORIES = [
  "Setoran Manual",
  "Kas Tambahan",
  "Lain-lain",
];
export const CASH_OUT_CATEGORIES = [
  "Beli Galon",
  "Parkir",
  "Bahan Mendadak",
  "Transportasi",
  "Snack/Makan",
  "Lain-lain",
];

interface ShiftStore {
  shifts: Shift[];

  // Shift management
  openShift: (
    branchId: string,
    userId: string,
    userName: string,
    openingBalance: number,
  ) => Shift;
  closeShift: (
    shiftId: string,
    userId: string,
    userName: string,
    actualEndingCash: number,
  ) => Shift | null;
  getActiveShift: (branchId: string) => Shift | undefined;
  hasActiveShift: (branchId: string) => boolean;

  // Cash in/out during shift
  addCashTransaction: (
    shiftId: string,
    type: "cash_in" | "cash_out",
    amount: number,
    category: string,
    description: string,
    userId: string,
  ) => void;

  // Record order payment to shift
  recordOrderPayment: (
    branchId: string,
    amount: number,
    method: string,
  ) => void;

  // Query
  getShiftsByBranch: (branchId: string) => Shift[];
  getAllShifts: () => Shift[];
}

export const useShiftStore = create<ShiftStore>()(
  persist(
    (set, get) => ({
      shifts: [],

      openShift: (branchId, userId, userName, openingBalance) => {
        // Check if branch already has active shift
        if (get().hasActiveShift(branchId)) {
          throw new Error("Cabang ini sudah memiliki shift aktif");
        }

        const newShift: Shift = {
          id: generateId(),
          branchId,
          openedBy: userId,
          openedByName: userName,
          openedAt: new Date().toISOString(),
          isActive: true,
          openingBalance,
          totalCashIn: 0,
          totalNonCash: 0,
          totalCashOut: 0,
          expectedEndingCash: openingBalance,
          totalSalesFromOrders: 0,
          totalCashSales: 0,
          totalTransferSales: 0,
          orderPaymentCount: 0,
          cashTransactions: [],
        };

        set((state) => ({
          shifts: [...state.shifts, newShift],
        }));

        return newShift;
      },

      closeShift: (shiftId, userId, userName, actualEndingCash) => {
        const shift = get().shifts.find((s) => s.id === shiftId);
        if (!shift || !shift.isActive) return null;

        const expectedEndingCash =
          shift.openingBalance +
          shift.totalCashIn +
          shift.totalCashSales -
          shift.totalCashOut;

        const difference = actualEndingCash - expectedEndingCash;

        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? {
                  ...s,
                  isActive: false,
                  closedBy: userId,
                  closedByName: userName,
                  closedAt: new Date().toISOString(),
                  expectedEndingCash,
                  actualEndingCash,
                  difference,
                }
              : s,
          ),
        }));

        return get().shifts.find((s) => s.id === shiftId) || null;
      },

      getActiveShift: (branchId) => {
        return get().shifts.find((s) => s.branchId === branchId && s.isActive);
      },

      hasActiveShift: (branchId) => {
        return get().shifts.some((s) => s.branchId === branchId && s.isActive);
      },

      addCashTransaction: (
        shiftId,
        type,
        amount,
        category,
        description,
        userId,
      ) => {
        const tx: CashTransaction = {
          id: generateId(),
          type,
          amount,
          category,
          description,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          shifts: state.shifts.map((s) => {
            if (s.id !== shiftId) return s;

            const newTotalCashIn =
              type === "cash_in" ? s.totalCashIn + amount : s.totalCashIn;
            const newTotalCashOut =
              type === "cash_out" ? s.totalCashOut + amount : s.totalCashOut;

            return {
              ...s,
              cashTransactions: [...s.cashTransactions, tx],
              totalCashIn: newTotalCashIn,
              totalCashOut: newTotalCashOut,
              expectedEndingCash:
                s.openingBalance +
                newTotalCashIn +
                s.totalCashSales -
                newTotalCashOut,
            };
          }),
        }));
      },

      recordOrderPayment: (branchId, amount, method) => {
        const activeShift = get().getActiveShift(branchId);
        if (!activeShift) return;

        const isCash = method === "cash";

        set((state) => ({
          shifts: state.shifts.map((s) => {
            if (s.id !== activeShift.id) return s;

            const newCashSales = isCash
              ? s.totalCashSales + amount
              : s.totalCashSales;
            const newNonCash = !isCash
              ? s.totalNonCash + amount
              : s.totalNonCash;

            return {
              ...s,
              totalSalesFromOrders: s.totalSalesFromOrders + amount,
              totalCashSales: newCashSales,
              totalTransferSales: newNonCash,
              totalNonCash: newNonCash,
              orderPaymentCount: s.orderPaymentCount + 1,
              expectedEndingCash:
                s.openingBalance +
                s.totalCashIn +
                newCashSales -
                s.totalCashOut,
            };
          }),
        }));
      },

      getShiftsByBranch: (branchId) => {
        return get()
          .shifts.filter((s) => s.branchId === branchId)
          .sort(
            (a, b) =>
              new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
          );
      },

      getAllShifts: () => {
        return [...get().shifts].sort(
          (a, b) =>
            new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
        );
      },
    }),
    {
      name: "shift-storage",
    },
  ),
);
