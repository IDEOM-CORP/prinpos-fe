import { useState } from "react";
import {
  Table,
  Badge,
  Title,
  Group,
  TextInput,
  Select,
  Card,
  Text,
  ActionIcon,
  Button,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { IconEye, IconSearch, IconFilePlus } from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useUserStore } from "../../../shared/stores/userStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { formatCurrency, formatDateTime } from "../../../shared/utils";
import { IconBuildingStore } from "@tabler/icons-react";
import { ROUTES } from "../../../core/routes";
import type { Order, PaymentStatus, DpStatus } from "../../../shared/types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DATE_FILTER_OPTIONS,
} from "../../../shared/constants";

export default function OrdersPage() {
  const navigate = useNavigate();
  const allOrders = useOrderStore((state) => state.orders);
  const users = useUserStore((state) => state.users);
  const user = useAuthStore((state) => state.user);
  const branches = useBusinessStore((state) => state.branches);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Filter out soft-deleted orders
  const activeOrders = allOrders.filter((o) => !o.isDeleted);

  // Branch filter: owner uses global filter, others see their branch only
  const branchFilteredOrders =
    user?.role === "owner" && selectedBranchId
      ? activeOrders.filter((o) => o.branchId === selectedBranchId)
      : user?.role !== "owner"
        ? activeOrders.filter((o) => o.branchId === user?.branchId)
        : activeOrders;

  // Date filter helper
  const matchesDateFilter = (orderDate: string): boolean => {
    if (dateFilter === "all") return true;
    const now = new Date();
    const created = new Date(orderDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (dateFilter) {
      case "today":
        return created >= today;
      case "yesterday":
        return created >= yesterday && created < today;
      case "this_week": {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        return created >= startOfWeek;
      }
      case "this_month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return created >= startOfMonth;
      }
      default:
        return true;
    }
  };

  const filteredOrders = branchFilteredOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;
    const matchesDate = matchesDateFilter(order.createdAt);
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "green";
      case "partial":
        return "orange";
      case "unpaid":
        return "red";
      default:
        return "gray";
    }
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "Lunas";
      case "partial":
        return "DP / Cicilan";
      case "unpaid":
        return "Belum Bayar";
      default:
        return status;
    }
  };

  const getDpStatusBadge = (order: Order) => {
    const dpStatus: DpStatus = order.dpStatus || "none";
    if (order.paymentType === "full" && order.paymentStatus === "paid") {
      return null; // No DP badge needed for paid-full orders
    }
    switch (dpStatus) {
      case "paid":
        return (
          <Badge size="xs" color="green" variant="dot">
            Lunas
          </Badge>
        );
      case "sufficient":
        return (
          <Badge size="xs" color="teal" variant="dot">
            DP Cukup
          </Badge>
        );
      case "insufficient":
        return (
          <Badge size="xs" color="red" variant="dot">
            DP Kurang
          </Badge>
        );
      default:
        return null;
    }
  };

  // Build status filter options from constants
  const statusFilterData = [
    { value: "all", label: "Semua Status" },
    ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  return (
    <>
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2}>Daftar Orders</Title>
        <Group>
          {(user?.role === "designer" || user?.role === "owner") && (
            <Button
              leftSection={<IconFilePlus size={16} />}
              onClick={() => navigate(ROUTES.CREATE_ORDER)}
            >
              Buat Order
            </Button>
          )}
          {user?.role === "owner" && (
            <Select
              placeholder="Semua Cabang"
              data={[
                { value: "", label: "Semua Cabang" },
                ...branches
                  .filter((b) => user && b.businessId === user.businessId)
                  .map((b) => ({ value: b.id, label: b.name })),
              ]}
              value={selectedBranchId}
              onChange={(value) => setSelectedBranchId(value || "")}
              leftSection={<IconBuildingStore size={16} />}
              size="sm"
              style={{ width: 220 }}
              clearable={false}
              allowDeselect={false}
            />
          )}
        </Group>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group>
          <TextInput
            placeholder="Cari no. order / pelanggan..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter Status"
            data={statusFilterData}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value || "all")}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter Pembayaran"
            data={[
              { value: "all", label: "Semua Pembayaran" },
              { value: "paid", label: "Lunas" },
              { value: "partial", label: "DP / Cicilan" },
              { value: "unpaid", label: "Belum Bayar" },
            ]}
            value={paymentFilter}
            onChange={(value) => setPaymentFilter(value || "all")}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter Waktu"
            data={DATE_FILTER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            value={dateFilter}
            onChange={(value) => setDateFilter(value || "all")}
            style={{ width: 180 }}
          />
        </Group>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            Tidak ada order ditemukan
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>No. Order</Table.Th>
                <Table.Th>Pelanggan</Table.Th>
                <Table.Th>Tanggal</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Pembayaran</Table.Th>
                <Table.Th>Sisa</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Deadline</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredOrders.map((order) => {
                const createdByUser = users.find(
                  (u) => u.id === order.createdBy,
                );

                return (
                  <Table.Tr key={order.id}>
                    <Table.Td>
                      <Text fw={500}>{order.orderNumber}</Text>
                    </Table.Td>
                    <Table.Td>
                      <div>
                        <Text size="sm">{order.customerName}</Text>
                        {order.customerPhone && (
                          <Text size="xs" c="dimmed">
                            {order.customerPhone}
                          </Text>
                        )}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDateTime(order.createdAt)}</Text>
                      {createdByUser && (
                        <Text size="xs" c="dimmed">
                          oleh {createdByUser.name}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{formatCurrency(order.total)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        <Badge
                          color={getPaymentStatusColor(order.paymentStatus)}
                          size="sm"
                        >
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </Badge>
                        {getDpStatusBadge(order)}
                      </Group>
                      {order.paymentType === "dp" && order.paidAmount > 0 && (
                        <Text size="xs" c="dimmed" mt={2}>
                          DP: {formatCurrency(order.paidAmount)}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {order.remainingPayment > 0 ? (
                        <Text size="sm" fw={500} c="red">
                          {formatCurrency(order.remainingPayment)}
                        </Text>
                      ) : (
                        <Text size="sm" c="green" fw={500}>
                          —
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={ORDER_STATUS_COLORS[order.status] || "gray"}
                      >
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {order.deadline ? (
                        <Badge
                          size="sm"
                          color={
                            new Date(order.deadline).getTime() - Date.now() <
                            24 * 60 * 60 * 1000
                              ? "red"
                              : "gray"
                          }
                          variant="light"
                        >
                          {new Date(order.deadline).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="light"
                        onClick={() =>
                          navigate(ROUTES.ORDER_DETAIL.replace(":id", order.id))
                        }
                      >
                        <IconEye size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
