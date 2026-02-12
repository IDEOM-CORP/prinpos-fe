import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  Divider,
  Grid,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useUserStore } from "../../../shared/stores/userStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { formatCurrency, formatDateTime } from "../../../shared/utils";
import { ROUTES } from "../../../core/routes";
import type { Order } from "../../../shared/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = useOrderStore((state) => state.getOrderById(id!));
  const users = useUserStore((state) => state.users);
  const branches = useBusinessStore((state) => state.branches);

  if (!order) {
    return (
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Text c="dimmed" ta="center">
          Order tidak ditemukan
        </Text>
      </Card>
    );
  }

  const createdByUser = users.find((u) => u.id === order.createdBy);
  const assignedUser = order.assignedTo
    ? users.find((u) => u.id === order.assignedTo)
    : null;
  const branch = branches.find((b) => b.id === order.branchId);

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
      <Button
        leftSection={<IconArrowLeft size={16} />}
        variant="subtle"
        onClick={() => navigate(ROUTES.ORDERS)}
        mb="xl"
      >
        Kembali
      </Button>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="lg">
              <Group justify="space-between">
                <div>
                  <Title order={2}>{order.orderNumber}</Title>
                  <Text size="sm" c="dimmed">
                    {formatDateTime(order.createdAt)}
                  </Text>
                </div>
                <Badge size="lg" color={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </Group>

              <Divider />

              <div>
                <Text size="sm" fw={500} c="dimmed" mb="xs">
                  INFORMASI PELANGGAN
                </Text>
                <Text fw={500}>{order.customerName}</Text>
                {order.customerPhone && (
                  <Text c="dimmed">{order.customerPhone}</Text>
                )}
              </div>

              <Divider />

              <div>
                <Text size="sm" fw={500} c="dimmed" mb="md">
                  ITEMS
                </Text>
                <Stack gap="md">
                  {order.items.map((item, idx) => (
                    <Group
                      key={idx}
                      justify="space-between"
                      p="md"
                      style={{ background: "#FAF5EE", borderRadius: 8 }}
                    >
                      <div style={{ flex: 1 }}>
                        <Text fw={500}>{item.name}</Text>
                        <Text size="sm" c="dimmed">
                          {formatCurrency(item.price)} x {item.quantity}
                        </Text>
                        {item.notes && (
                          <Text size="sm" c="dimmed" mt="xs">
                            Catatan: {item.notes}
                          </Text>
                        )}
                      </div>
                      <Text fw={700}>
                        {formatCurrency(item.price * item.quantity)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </div>

              {order.notes && (
                <>
                  <Divider />
                  <div>
                    <Text size="sm" fw={500} c="dimmed" mb="xs">
                      CATATAN ORDER
                    </Text>
                    <Text>{order.notes}</Text>
                  </div>
                </>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="sm" fw={500} c="dimmed" mb="md">
                RINGKASAN
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text>Subtotal:</Text>
                  <Text>{formatCurrency(order.subtotal)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text>Pajak (11%):</Text>
                  <Text>{formatCurrency(order.tax)}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text fw={700} size="lg">
                    Total:
                  </Text>
                  <Text fw={700} size="xl" c="aqua">
                    {formatCurrency(order.total)}
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="sm" fw={500} c="dimmed" mb="md">
                INFORMASI LAINNYA
              </Text>
              <Stack gap="sm">
                {branch && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Cabang
                    </Text>
                    <Text fw={500}>{branch.name}</Text>
                  </div>
                )}
                {createdByUser && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Dibuat oleh
                    </Text>
                    <Text fw={500}>{createdByUser.name}</Text>
                  </div>
                )}
                {assignedUser && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Staff Produksi
                    </Text>
                    <Text fw={500}>{assignedUser.name}</Text>
                  </div>
                )}
                {order.completedAt && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Selesai pada
                    </Text>
                    <Text fw={500}>{formatDateTime(order.completedAt)}</Text>
                  </div>
                )}
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
}
