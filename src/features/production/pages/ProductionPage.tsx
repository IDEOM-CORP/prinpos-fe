import { useState } from "react";
import {
  Card,
  Badge,
  Text,
  Stack,
  Group,
  Button,
  Title,
  Select,
  Grid,
  Divider,
  Paper,
  Progress,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconClock, IconLock, IconCash } from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useUserStore } from "../../../shared/stores/userStore";
import { formatCurrency, formatDateTime } from "../../../shared/utils";
import { MIN_DP_PERCENT } from "../../../shared/constants";
import type { Order, DpStatus } from "../../../shared/types";

export default function ProductionPage() {
  const orders = useOrderStore((state) => state.orders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const assignOrderToUser = useOrderStore((state) => state.assignOrderToUser);
  const isProductionReady = useOrderStore((state) => state.isProductionReady);
  const user = useAuthStore((state) => state.user);
  const users = useUserStore((state) => state.users);

  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  if (!user) return null;

  const productionUsers = users.filter((u) => u.role === "produksi");
  const productionOrders = orders.filter((o) => o.status !== "cancelled");

  const filteredOrders = productionOrders.filter((o) => {
    if (selectedStatus === "all") return true;
    return o.status === selectedStatus;
  });

  const handleStatusUpdate = (orderId: string, status: Order["status"]) => {
    updateOrderStatus(orderId, status);
    notifications.show({
      title: "Status Diupdate",
      message: "Status order berhasil diupdate",
      color: "green",
    });
  };

  const handleAssign = (orderId: string, userId: string | null) => {
    if (userId) {
      assignOrderToUser(orderId, userId);
      notifications.show({
        title: "Order Diassign",
        message: "Order berhasil diassign ke staff produksi",
        color: "green",
      });
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "orange";
      case "in-progress":
        return "aqua";
      case "completed":
        return "green";
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
      <Group justify="space-between" mb="xl">
        <Title order={2}>Produksi</Title>
        <Select
          placeholder="Filter Status"
          data={[
            { value: "all", label: "Semua" },
            { value: "pending", label: "Menunggu" },
            { value: "in-progress", label: "Dikerjakan" },
            { value: "completed", label: "Selesai" },
          ]}
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value || "all")}
          style={{ width: 200 }}
        />
      </Group>

      <Grid>
        {filteredOrders.length === 0 ? (
          <Grid.Col span={12}>
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Text c="dimmed" ta="center">
                Tidak ada order untuk produksi
              </Text>
            </Card>
          </Grid.Col>
        ) : (
          filteredOrders.map((order) => {
            const assignedUser = order.assignedTo
              ? users.find((u) => u.id === order.assignedTo)
              : null;
            const canStartProduction = isProductionReady(order.id);
            const dpStatus: DpStatus = order.dpStatus || "none";
            const minDpAmount =
              order.total * ((order.minDpPercent || MIN_DP_PERCENT) / 100);
            const paymentProgress =
              order.total > 0 ? (order.paidAmount / order.total) * 100 : 0;

            return (
              <Grid.Col key={order.id} span={{ base: 12, md: 6 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <div>
                        <Text fw={700} size="lg">
                          {order.orderNumber}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {formatDateTime(order.createdAt)}
                        </Text>
                      </div>
                      <Group gap="xs">
                        <Badge color={getStatusColor(order.status)} size="lg">
                          {getStatusLabel(order.status)}
                        </Badge>
                      </Group>
                    </Group>

                    {/* DP Status Indicator */}
                    {order.paymentType === "dp" && (
                      <Paper
                        p="sm"
                        bg={canStartProduction ? "teal.0" : "red.0"}
                        style={{ borderRadius: 8 }}
                      >
                        <Group justify="space-between" mb={4}>
                          <Group gap="xs">
                            {canStartProduction ? (
                              <IconCash
                                size={16}
                                color="var(--mantine-color-teal-6)"
                              />
                            ) : (
                              <IconLock
                                size={16}
                                color="var(--mantine-color-red-6)"
                              />
                            )}
                            <Text
                              size="xs"
                              fw={600}
                              c={canStartProduction ? "teal.7" : "red.7"}
                            >
                              {dpStatus === "paid"
                                ? "Lunas"
                                : dpStatus === "sufficient"
                                  ? "DP Cukup"
                                  : `DP Kurang — Butuh min ${formatCurrency(minDpAmount)}`}
                            </Text>
                          </Group>
                          <Text size="xs" fw={600}>
                            {formatCurrency(order.paidAmount)} /{" "}
                            {formatCurrency(order.total)}
                          </Text>
                        </Group>
                        <Progress
                          value={paymentProgress}
                          color={canStartProduction ? "teal" : "red"}
                          size="sm"
                          radius="xl"
                        />
                      </Paper>
                    )}

                    {order.paymentType === "full" &&
                      order.paymentStatus === "paid" && (
                        <Paper p="xs" bg="green.0" style={{ borderRadius: 8 }}>
                          <Group gap="xs">
                            <IconCheck
                              size={14}
                              color="var(--mantine-color-green-6)"
                            />
                            <Text size="xs" fw={500} c="green.7">
                              Lunas — siap produksi
                            </Text>
                          </Group>
                        </Paper>
                      )}

                    <Divider />

                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        Pelanggan
                      </Text>
                      <Text>{order.customerName}</Text>
                      {order.customerPhone && (
                        <Text size="sm" c="dimmed">
                          {order.customerPhone}
                        </Text>
                      )}
                    </div>

                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        Items
                      </Text>
                      <Stack gap="xs">
                        {order.items.map((item, idx) => (
                          <Group key={idx} justify="space-between">
                            <Text size="sm">
                              {item.name} x{item.quantity}
                            </Text>
                            <Text size="sm" fw={500}>
                              {formatCurrency(item.price * item.quantity)}
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                    </div>

                    {order.notes && (
                      <div>
                        <Text size="sm" fw={500} mb="xs">
                          Catatan
                        </Text>
                        <Text size="sm">{order.notes}</Text>
                      </div>
                    )}

                    <Divider />

                    <Text size="lg" fw={700}>
                      Total: {formatCurrency(order.total)}
                    </Text>

                    {user.role === "owner" || user.role === "produksi" ? (
                      <>
                        <Select
                          label="Assign ke Staff"
                          placeholder="Pilih staff produksi"
                          data={productionUsers.map((u) => ({
                            value: u.id,
                            label: u.name,
                          }))}
                          value={order.assignedTo || ""}
                          onChange={(value) => handleAssign(order.id, value)}
                        />

                        <Group grow>
                          {order.status === "pending" && (
                            <Tooltip
                              label={
                                !canStartProduction
                                  ? "DP belum mencapai minimum — produksi tidak bisa dimulai"
                                  : "Mulai proses produksi"
                              }
                              withArrow
                            >
                              <Button
                                leftSection={
                                  canStartProduction ? (
                                    <IconClock size={16} />
                                  ) : (
                                    <IconLock size={16} />
                                  )
                                }
                                disabled={!canStartProduction}
                                color={canStartProduction ? undefined : "gray"}
                                onClick={() =>
                                  handleStatusUpdate(order.id, "in-progress")
                                }
                              >
                                {canStartProduction
                                  ? "Mulai Kerjakan"
                                  : "DP Belum Cukup"}
                              </Button>
                            </Tooltip>
                          )}

                          {order.status === "in-progress" && (
                            <Button
                              leftSection={<IconCheck size={16} />}
                              color="green"
                              onClick={() =>
                                handleStatusUpdate(order.id, "completed")
                              }
                            >
                              Selesai
                            </Button>
                          )}
                        </Group>

                        {assignedUser && (
                          <Text size="sm" c="dimmed" ta="center">
                            Diassign ke: <strong>{assignedUser.name}</strong>
                          </Text>
                        )}
                      </>
                    ) : (
                      assignedUser && (
                        <Text size="sm" c="dimmed">
                          Staff: <strong>{assignedUser.name}</strong>
                        </Text>
                      )
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })
        )}
      </Grid>
    </>
  );
}
