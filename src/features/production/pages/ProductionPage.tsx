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
import {
  MIN_DP_PERCENT,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../../../shared/constants";
import type { DpStatus, OrderStatus } from "../../../shared/types";

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
  // Only show production-relevant statuses (not draft, settled, cancelled, expired)
  const productionOrders = orders.filter(
    (o) =>
      !o.isDeleted &&
      ["ready_production", "in_progress", "completed"].includes(o.status),
  );

  const filteredOrders = productionOrders.filter((o) => {
    if (selectedStatus === "all") return true;
    return o.status === selectedStatus;
  });

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    if (!user) return;
    const success = updateOrderStatus(orderId, status, user.id);
    if (success) {
      notifications.show({
        title: "Status Diupdate",
        message: `Status order → ${ORDER_STATUS_LABELS[status] || status}`,
        color: "green",
      });
    } else {
      notifications.show({
        title: "Gagal",
        message: "Transisi status tidak diizinkan",
        color: "red",
      });
    }
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

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Produksi</Title>
        <Select
          placeholder="Filter Status"
          data={[
            { value: "all", label: "Semua" },
            { value: "ready_production", label: "Siap Produksi" },
            { value: "in_progress", label: "Proses" },
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
                        <Badge
                          color={ORDER_STATUS_COLORS[order.status] || "gray"}
                          size="lg"
                        >
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </Group>
                    </Group>

                    {/* Deadline indicator */}
                    {order.deadline && (
                      <Badge
                        size="sm"
                        color={
                          new Date(order.deadline).getTime() - Date.now() <
                          24 * 60 * 60 * 1000
                            ? "red"
                            : new Date(order.deadline).getTime() - Date.now() <
                                3 * 24 * 60 * 60 * 1000
                              ? "orange"
                              : "gray"
                        }
                        variant="light"
                        leftSection={<IconClock size={12} />}
                      >
                        Deadline:{" "}
                        {new Date(order.deadline).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Badge>
                    )}

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
                          <Paper
                            key={idx}
                            p="xs"
                            withBorder
                            style={{ borderRadius: 6 }}
                          >
                            <Group justify="space-between" mb={2}>
                              <Text size="sm" fw={500}>
                                {item.name} x{item.quantity}
                              </Text>
                              <Text size="sm" fw={500}>
                                {formatCurrency(item.subtotal)}
                              </Text>
                            </Group>
                            {item.width && item.height && (
                              <Text size="xs" c="dimmed">
                                Ukuran: {item.width}×{item.height}m ={" "}
                                {item.area?.toFixed(2)}m²
                              </Text>
                            )}
                            {item.material && (
                              <Text size="xs" c="dimmed">
                                Material: {item.material}
                              </Text>
                            )}
                            {item.finishing && item.finishing.length > 0 && (
                              <Text size="xs" c="dimmed">
                                Finishing: {item.finishing.join(", ")}
                              </Text>
                            )}
                            {item.notes && (
                              <Text size="xs" c="dimmed" fs="italic">
                                {item.notes}
                              </Text>
                            )}
                          </Paper>
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
                          {order.status === "ready_production" && (
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
                                  handleStatusUpdate(order.id, "in_progress")
                                }
                              >
                                {canStartProduction
                                  ? "Mulai Kerjakan"
                                  : "DP Belum Cukup"}
                              </Button>
                            </Tooltip>
                          )}

                          {order.status === "in_progress" && (
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
