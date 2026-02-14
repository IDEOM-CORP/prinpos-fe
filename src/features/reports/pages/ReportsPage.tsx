import { useState } from "react";
import {
  Grid,
  Card,
  Text,
  Group,
  ThemeIcon,
  Stack,
  Title,
  Table,
  Select,
} from "@mantine/core";
import {
  IconFileText,
  IconCurrencyDollar,
  IconShoppingCart,
  IconCheck,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { formatCurrency, formatDate } from "../../../shared/utils";
import { IconBuildingStore } from "@tabler/icons-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {title}
          </Text>
          <Text size="xl" fw={700}>
            {value}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
        <ThemeIcon size={60} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

export default function ReportsPage() {
  const allOrders = useOrderStore((state) => state.orders);
  const items = useItemStore((state) => state.items);
  const branches = useBusinessStore((state) => state.branches);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Branch options for filter
  const branchOptions = [
    { value: "", label: "Semua Cabang" },
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  // Filter by branch
  const orders = selectedBranchId
    ? allOrders.filter((o) => o.branchId === selectedBranchId)
    : allOrders;

  // Total orders
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === "pending_dp" || o.status === "ready_production",
  ).length;
  const inProgressOrders = orders.filter(
    (o) => o.status === "in_progress",
  ).length;
  const completedOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "settled",
  ).length;

  // Revenue
  const totalRevenue = orders
    .filter((o) => o.status === "completed" || o.status === "settled")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingRevenue = orders
    .filter((o) => o.status === "pending_dp" || o.status === "ready_production")
    .reduce((sum, o) => sum + o.total, 0);

  // Average order value
  const avgOrderValue =
    completedOrders > 0 ? totalRevenue / completedOrders : 0;

  // Top selling items
  const itemSales: {
    [key: string]: { name: string; quantity: number; revenue: number };
  } = {};

  orders
    .filter((o) => o.status === "completed" || o.status === "settled")
    .forEach((order) => {
      order.items.forEach((item) => {
        if (!itemSales[item.itemId]) {
          itemSales[item.itemId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        itemSales[item.itemId].quantity += item.quantity;
        itemSales[item.itemId].revenue += item.price * item.quantity;
      });
    });

  const topItems = Object.entries(itemSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Recent orders
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Laporan & Statistik</Title>
        <Select
          placeholder="Semua Cabang"
          data={branchOptions}
          value={selectedBranchId}
          onChange={(value) => setSelectedBranchId(value || "")}
          leftSection={<IconBuildingStore size={16} />}
          size="sm"
          style={{ width: 220 }}
          clearable={false}
          allowDeselect={false}
        />
      </Group>

      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={<IconFileText size={30} />}
            color="aqua"
            subtitle={`${pendingOrders} pending, ${inProgressOrders} proses`}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Orders Selesai"
            value={completedOrders}
            icon={<IconCheck size={30} />}
            color="green"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Omzet"
            value={formatCurrency(totalRevenue)}
            icon={<IconCurrencyDollar size={30} />}
            color="teal"
            subtitle="Dari orders selesai"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Pending Revenue"
            value={formatCurrency(pendingRevenue)}
            icon={<IconShoppingCart size={30} />}
            color="orange"
            subtitle="Orders belum selesai"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Rata-rata Nilai Order"
            value={formatCurrency(avgOrderValue)}
            icon={<IconTrendingUp size={30} />}
            color="violet"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Produk"
            value={items.length}
            icon={<IconFileText size={30} />}
            color="pink"
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">
              Top 10 Produk Terlaris
            </Title>
            {topItems.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Belum ada data penjualan
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Produk</Table.Th>
                    <Table.Th>Terjual</Table.Th>
                    <Table.Th>Revenue</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {topItems.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {item.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{item.quantity}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {formatCurrency(item.revenue)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">
              Orders Terbaru
            </Title>
            {recentOrders.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Belum ada order
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>No. Order</Table.Th>
                    <Table.Th>Pelanggan</Table.Th>
                    <Table.Th>Tanggal</Table.Th>
                    <Table.Th>Total</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recentOrders.map((order) => (
                    <Table.Tr key={order.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {order.orderNumber}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{order.customerName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(order.createdAt)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {formatCurrency(order.total)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          c={
                            order.status === "completed" ||
                            order.status === "settled"
                              ? "green"
                              : order.status === "in_progress"
                                ? "aqua"
                                : "orange"
                          }
                          fw={500}
                        >
                          {order.status}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
}
