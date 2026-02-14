import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Order,
  PaymentRecord,
  DpStatus,
  StatusLog,
  OrderStatus,
} from "../types";
import { generateId, generateOrderNumber } from "../utils";
import {
  MIN_DP_PERCENT,
  STATUS_TRANSITIONS,
  EXPIRED_THRESHOLD_HOURS,
} from "../constants";

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

// Helper to create a status log entry
function createStatusLog(
  orderId: string,
  fromStatus: OrderStatus | null,
  toStatus: OrderStatus,
  changedBy: string,
  note?: string,
): StatusLog {
  return {
    id: generateId(),
    orderId,
    fromStatus,
    toStatus,
    changedBy,
    note,
    createdAt: new Date().toISOString(),
  };
}

interface OrderStore {
  orders: Order[];
  addOrder: (
    order: Omit<
      Order,
      | "id"
      | "orderNumber"
      | "createdAt"
      | "updatedAt"
      | "statusLogs"
      | "isDeleted"
      | "deletedAt"
      | "deletedBy"
    >,
  ) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  softDeleteOrder: (id: string, deletedBy: string) => void;
  getOrderById: (id: string) => Order | undefined;
  getActiveOrders: () => Order[];
  getOrdersByBranch: (branchId: string) => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  assignOrderToUser: (orderId: string, userId: string) => void;
  updateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    note?: string,
  ) => boolean;
  canTransition: (orderId: string, toStatus: OrderStatus) => boolean;
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
  getStatusLogs: (orderId: string) => StatusLog[];
  isProductionReady: (orderId: string) => boolean;
  getDpStatus: (orderId: string) => DpStatus;
  checkExpiredOrders: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (orderData) => {
        const orderId = generateId();
        const initialLog = createStatusLog(
          orderId,
          null,
          orderData.status,
          orderData.createdBy,
          "Order dibuat",
        );

        const newOrder: Order = {
          ...orderData,
          id: orderId,
          orderNumber: generateOrderNumber(),
          statusLogs: [initialLog],
          isDeleted: false,
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

      softDeleteOrder: (id, deletedBy) => {
        get().updateOrder(id, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy,
          status: "cancelled",
        });
      },

      getOrderById: (id) => {
        return get().orders.find((order) => order.id === id);
      },

      getActiveOrders: () => {
        return get().orders.filter((order) => !order.isDeleted);
      },

      getOrdersByBranch: (branchId) => {
        return get().orders.filter(
          (order) => order.branchId === branchId && !order.isDeleted,
        );
      },

      getOrdersByStatus: (status) => {
        return get().orders.filter(
          (order) => order.status === status && !order.isDeleted,
        );
      },

      assignOrderToUser: (orderId, userId) => {
        get().updateOrder(orderId, { assignedTo: userId });
      },

      canTransition: (orderId, toStatus) => {
        const order = get().getOrderById(orderId);
        if (!order) return false;
        const allowed = STATUS_TRANSITIONS[order.status] || [];
        return allowed.includes(toStatus);
      },

      updateOrderStatus: (orderId, newStatus, changedBy, note) => {
        const order = get().getOrderById(orderId);
        if (!order) return false;

        // Validate transition
        const allowed = STATUS_TRANSITIONS[order.status] || [];
        if (!allowed.includes(newStatus)) {
          console.warn(
            `Invalid status transition: ${order.status} → ${newStatus}`,
          );
          return false;
        }

        // Guard: settled requires full payment
        if (newStatus === "settled" && order.remainingPayment > 0) {
          console.warn(
            `Cannot settle order ${orderId}: remaining payment ${order.remainingPayment}`,
          );
          return false;
        }

        const log = createStatusLog(
          orderId,
          order.status,
          newStatus,
          changedBy,
          note,
        );
        const updates: Partial<Order> = {
          status: newStatus,
          statusLogs: [...(order.statusLogs || []), log],
        };

        if (newStatus === "completed") {
          updates.completedAt = new Date().toISOString();
        }

        if (newStatus === "settled") {
          updates.settledAt = new Date().toISOString();
          updates.settledBy = changedBy;
        }

        get().updateOrder(orderId, updates);
        return true;
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

        const newDpStatus = computeDpStatus({
          paymentType: order.paymentType,
          total: order.total,
          paidAmount: updatedPaidAmount,
          minDpPercent: order.minDpPercent || MIN_DP_PERCENT,
        });

        const updates: Partial<Order> = {
          paidAmount: updatedPaidAmount,
          remainingPayment: updatedRemaining,
          paymentStatus: newPaymentStatus,
          dpStatus: newDpStatus,
          paymentMethod: method || order.paymentMethod,
          payments: updatedPayments,
        };

        // Auto-transition status based on payment
        let autoNote: string | undefined;
        if (newPaymentStatus === "paid" && order.status === "completed") {
          // Fully paid after completion → settled
          updates.status = "settled";
          updates.settledAt = new Date().toISOString();
          updates.settledBy = paidBy;
          autoNote = "Pelunasan otomatis → Lunas";
        } else if (
          order.status === "awaiting_payment" &&
          newPaymentStatus === "paid"
        ) {
          // Full payment from awaiting_payment → settled
          updates.status = "settled";
          updates.settledAt = new Date().toISOString();
          updates.settledBy = paidBy;
          autoNote = "Pembayaran lunas → Lunas";
        } else if (
          order.status === "awaiting_payment" &&
          (newDpStatus === "sufficient" || newDpStatus === "paid")
        ) {
          // DP sufficient from awaiting_payment → ready for production
          updates.status = "ready_production";
          autoNote = "DP cukup → Siap Produksi";
        } else if (
          order.status === "awaiting_payment" &&
          newDpStatus === "insufficient"
        ) {
          // DP insufficient from awaiting_payment → pending DP
          updates.status = "pending_dp";
          autoNote = "DP belum cukup → Menunggu DP";
        } else if (
          order.status === "pending_dp" &&
          (newDpStatus === "sufficient" || newDpStatus === "paid")
        ) {
          // DP sufficient → ready for production
          updates.status = "ready_production";
          autoNote = "DP cukup → Siap Produksi";
        } else if (
          order.status === "expired" &&
          (newDpStatus === "sufficient" || newDpStatus === "paid")
        ) {
          // Expired revived by paying DP
          updates.status = "ready_production";
          autoNote = "DP dibayar → Siap Produksi (revived)";
        }

        if (autoNote && updates.status) {
          const log = createStatusLog(
            orderId,
            order.status,
            updates.status,
            paidBy,
            autoNote,
          );
          updates.statusLogs = [...(order.statusLogs || []), log];
        }

        get().updateOrder(orderId, updates);
      },

      getOutstandingOrders: () => {
        return get()
          .getActiveOrders()
          .filter(
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

      getStatusLogs: (orderId) => {
        const order = get().getOrderById(orderId);
        return order?.statusLogs || [];
      },

      isProductionReady: (orderId) => {
        const order = get().getOrderById(orderId);
        if (!order) return false;
        if (order.paymentType === "full" && order.paymentStatus === "paid")
          return true;
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

      checkExpiredOrders: () => {
        const now = new Date();
        const orders = get().getActiveOrders();
        orders.forEach((order) => {
          if (order.status === "pending_dp") {
            const created = new Date(order.createdAt);
            const diffHours =
              (now.getTime() - created.getTime()) / (1000 * 60 * 60);
            if (diffHours >= EXPIRED_THRESHOLD_HOURS) {
              const log = createStatusLog(
                order.id,
                "pending_dp",
                "expired",
                "system",
                `Auto-expired: ${EXPIRED_THRESHOLD_HOURS} jam tanpa DP cukup`,
              );
              get().updateOrder(order.id, {
                status: "expired",
                statusLogs: [...(order.statusLogs || []), log],
              });
            }
          }
        });
      },
    }),
    {
      name: "order-storage",
    },
  ),
);
