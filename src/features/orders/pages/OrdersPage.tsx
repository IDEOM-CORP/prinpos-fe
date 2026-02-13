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
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { IconEye, IconSearch } from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useUserStore } from "../../../shared/stores/userStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { formatCurrency, formatDateTime } from "../../../shared/utils";
import { IconBuildingStore } from "@tabler/icons-react";
import { ROUTES } from "../../../core/routes";
import type { Order } from "../../../shared/types";

export default function OrdersPage() {
  const navigate = useNavigate();
  const allOrders = useOrderStore((state) => state.orders);
  const users = useUserStore((state) => state.users);
  const user = useAuthStore((state) => state.user);
  const branches = useBusinessStore((state) => state.branches);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Branch filter: owner uses global filter, others see their branch only
  const branchFilteredOrders =
    user?.role === "owner" && selectedBranchId
      ? allOrders.filter((o) => o.branchId === selectedBranchId)
      : user?.role !== "owner"
        ? allOrders.filter((o) => o.branchId === user?.branchId)
        : allOrders;

  const filteredOrders = branchFilteredOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "orange";
      case "in-progress":
        return "aqua";
      case "completed":
        return "green";
      case "cancelled":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Menunggu";
      case "in-progress":
        return "Dikerjakan";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  return (
    <>
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2}>Daftar Orders</Title>
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

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group>
          <TextInput
            placeholder="Cari order..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter Status"
            data={[
              { value: "all", label: "Semua Status" },
              { value: "pending", label: "Menunggu" },
              { value: "in-progress", label: "Dikerjakan" },
              { value: "completed", label: "Selesai" },
              { value: "cancelled", label: "Dibatalkan" },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value || "all")}
            style={{ width: 200 }}
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
                <Table.Th>Status</Table.Th>
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
                      <Badge color={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
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
