import { useState } from "react";
import {
  Table,
  Badge,
  Button,
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
import { formatCurrency, formatDateTime } from "../../../shared/utils";
import { ROUTES } from "../../../core/routes";
import type { Order } from "../../../shared/types";

export default function OrdersPage() {
  const navigate = useNavigate();
  const orders = useOrderStore((state) => state.orders);
  const users = useUserStore((state) => state.users);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = orders.filter((order) => {
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
        return "blue";
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
      <Title order={2} mb="xl">
        Daftar Orders
      </Title>

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
