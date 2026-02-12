import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "../types";
import { generateId, generateOrderNumber } from "../utils";

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
  addPayment: (orderId: string, amount: number, method?: string) => void;
  getOutstandingOrders: () => Order[]; // Orders with partial payment
  getTotalOutstanding: () => number; // Total unpaid amount
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

      addPayment: (orderId, amount, method) => {
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

        get().updateOrder(orderId, {
          paidAmount: newPaidAmount,
          remainingPayment: Math.max(0, newRemainingPayment),
          paymentStatus: newPaymentStatus,
          paymentMethod: method || order.paymentMethod,
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
    }),
    {
      name: "order-storage",
    },
  ),
);
