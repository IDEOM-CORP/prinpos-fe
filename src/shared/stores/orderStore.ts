import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, PaymentRecord, DpStatus } from "../types";
import { generateId, generateOrderNumber } from "../utils";
import { MIN_DP_PERCENT } from "../constants";

// Helper to compute dpStatus from payment state
function computeDpStatus(order: {
  paymentType: Order["paymentType"];
  total: number;
  paidAmount: number;
  minDpPercent: number;
}): DpStatus {
  if (order.paymentType === "full") {
    return order.paidAmount >= order.total ? "paid" : "none";
  }
  if (order.paidAmount >= order.total) return "paid";
  const minDpAmount = order.total * (order.minDpPercent / 100);
  if (order.paidAmount >= minDpAmount) return "sufficient";
  if (order.paidAmount > 0) return "insufficient";
  return "none";
}

interface OrderStore {
  orders: Order[];
  addOrder: (
    order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">,
  ) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByBranch: (branchId: string) => Order[];
  getOrdersByStatus: (status: Order["status"]) => Order[];
  assignOrderToUser: (orderId: string, userId: string) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  addPayment: (
    orderId: string,
    amount: number,
    method: string,
    paidBy: string,
    note?: string,
  ) => void;
  getOutstandingOrders: () => Order[];
  getTotalOutstanding: () => number;
  getPaymentHistory: (orderId: string) => PaymentRecord[];
  isProductionReady: (orderId: string) => boolean;
  getDpStatus: (orderId: string) => DpStatus;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (orderData) => {
        const newOrder: Order = {
          ...orderData,
          id: generateId(),
          orderNumber: generateOrderNumber(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ orders: [...state.orders, newOrder] }));
        return newOrder;
      },

      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id
              ? { ...order, ...updates, updatedAt: new Date().toISOString() }
              : order,
          ),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== id),
        }));
      },

      getOrderById: (id) => {
        return get().orders.find((order) => order.id === id);
      },

      getOrdersByBranch: (branchId) => {
        return get().orders.filter((order) => order.branchId === branchId);
      },

      getOrdersByStatus: (status) => {
        return get().orders.filter((order) => order.status === status);
      },

      assignOrderToUser: (orderId, userId) => {
        get().updateOrder(orderId, { assignedTo: userId });
      },

      updateOrderStatus: (orderId, status) => {
        const updates: Partial<Order> = { status };
        if (status === "completed") {
          updates.completedAt = new Date().toISOString();
        }
        get().updateOrder(orderId, updates);
      },

      addPayment: (orderId, amount, method, paidBy, note) => {
        const order = get().getOrderById(orderId);
        if (!order) return;

        const newPaidAmount = order.paidAmount + amount;
        const newRemainingPayment = order.total - newPaidAmount;

        let newPaymentStatus: Order["paymentStatus"];
        if (newRemainingPayment <= 0) {
          newPaymentStatus = "paid";
        } else if (newPaidAmount > 0) {
          newPaymentStatus = "partial";
        } else {
          newPaymentStatus = "unpaid";
        }

        // Create payment record
        const paymentRecord: PaymentRecord = {
          id: generateId(),
          orderId,
          amount,
          method,
          note,
          paidBy,
          createdAt: new Date().toISOString(),
        };

        const updatedPayments = [...(order.payments || []), paymentRecord];
        const updatedPaidAmount = newPaidAmount;
        const updatedRemaining = Math.max(0, newRemainingPayment);

        // Recompute dpStatus
        const newDpStatus = computeDpStatus({
          paymentType: order.paymentType,
          total: order.total,
          paidAmount: updatedPaidAmount,
          minDpPercent: order.minDpPercent || MIN_DP_PERCENT,
        });

        get().updateOrder(orderId, {
          paidAmount: updatedPaidAmount,
          remainingPayment: updatedRemaining,
          paymentStatus: newPaymentStatus,
          dpStatus: newDpStatus,
          paymentMethod: method || order.paymentMethod,
          payments: updatedPayments,
        });
      },

      getOutstandingOrders: () => {
        return get().orders.filter(
          (order) =>
            order.paymentStatus === "partial" ||
            order.paymentStatus === "unpaid",
        );
      },

      getTotalOutstanding: () => {
        return get()
          .getOutstandingOrders()
          .reduce((total, order) => total + order.remainingPayment, 0);
      },

      getPaymentHistory: (orderId) => {
        const order = get().getOrderById(orderId);
        return order?.payments || [];
      },

      isProductionReady: (orderId) => {
        const order = get().getOrderById(orderId);
        if (!order) return false;
        // Full payment orders are always production-ready
        if (order.paymentType === "full" && order.paymentStatus === "paid")
          return true;
        // DP orders: check if DP meets minimum threshold
        const dpStatus =
          order.dpStatus ||
          computeDpStatus({
            paymentType: order.paymentType,
            total: order.total,
            paidAmount: order.paidAmount,
            minDpPercent: order.minDpPercent || MIN_DP_PERCENT,
          });
        return dpStatus === "sufficient" || dpStatus === "paid";
      },

      getDpStatus: (orderId) => {
        const order = get().getOrderById(orderId);
        if (!order) return "none";
        return (
          order.dpStatus ||
          computeDpStatus({
            paymentType: order.paymentType,
            total: order.total,
            paidAmount: order.paidAmount,
            minDpPercent: order.minDpPercent || MIN_DP_PERCENT,
          })
        );
      },
    }),
    {
      name: "order-storage",
    },
  ),
);
