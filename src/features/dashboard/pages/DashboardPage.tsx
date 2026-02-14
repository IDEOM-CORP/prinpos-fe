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
  Badge,
  Button,
  ActionIcon,
  Select,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import {
  IconShoppingCart,
  IconTool,
  IconFileText,
  IconCurrencyDollar,
  IconUsers,
  IconBox,
  IconCategory,
  IconStack3,
  IconPaint,
  IconEye,
} from "@tabler/icons-react";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useUserStore } from "../../../shared/stores/userStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { useCategoryStore } from "../../../shared/stores/categoryStore";
import { useMaterialStore } from "../../../shared/stores/materialStore";
import { useFinishingStore } from "../../../shared/stores/finishingStore";
import { formatCurrency } from "../../../shared/utils";
import { IconBuildingStore } from "@tabler/icons-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
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
        </Stack>
        <ThemeIcon size={60} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const allOrders = useOrderStore((state) => state.orders);
  const items = useItemStore((state) => state.items);
  const allUsers = useUserStore((state) => state.users);
  const categories = useCategoryStore((state) => state.categories);
  const materials = useMaterialStore((state) => state.materials);
  const finishings = useFinishingStore((state) => state.finishings);
  const branches = useBusinessStore((state) => state.branches);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const navigate = useNavigate();

  // Branch options for filter
  const userBranches = branches.filter(
    (b) => user && b.businessId === user.businessId,
  );
  const branchOptions = [
    { value: "", label: "Semua Cabang" },
    ...userBranches.map((b) => ({ value: b.id, label: b.name })),
  ];

  // Filter by branch
  const orders = selectedBranchId
    ? allOrders.filter((o) => o.branchId === selectedBranchId)
    : allOrders;
  const users = selectedBranchId
    ? allUsers.filter((u) => u.branchId === selectedBranchId)
    : allUsers;

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
  const totalRevenue = orders
    .filter((o) => o.status === "completed" || o.status === "settled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <Group justify="space-between" mb="xs">
        <Title order={2}>Dashboard</Title>
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

      <Text size="lg" mb="xl">
        Selamat datang, <strong>{user?.name}</strong>!
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={<IconFileText size={30} />}
            color="aqua"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Orders Pending"
            value={pendingOrders}
            icon={<IconShoppingCart size={30} />}
            color="orange"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Orders Produksi"
            value={inProgressOrders}
            icon={<IconTool size={30} />}
            color="cyan"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Orders Selesai"
            value={completedOrders}
            icon={<IconFileText size={30} />}
            color="green"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Omzet"
            value={formatCurrency(totalRevenue)}
            icon={<IconCurrencyDollar size={30} />}
            color="teal"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Barang"
            value={items.length}
            icon={<IconBox size={30} />}
            color="violet"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Kategori"
            value={categories.length}
            icon={<IconCategory size={30} />}
            color="indigo"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Material"
            value={materials.length}
            icon={<IconStack3 size={30} />}
            color="grape"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Finishing"
            value={finishings.length}
            icon={<IconPaint size={30} />}
            color="lime"
          />
        </Grid.Col>

        {user?.role === "owner" && (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <StatCard
              title="Total Users"
              value={users.length}
              icon={<IconUsers size={30} />}
              color="pink"
            />
          </Grid.Col>
        )}
      </Grid>

      <Card mt="xl" shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Aktivitas Terbaru</Title>
          <Button variant="light" onClick={() => navigate("/orders")}>
            Lihat Semua Order
          </Button>
        </Group>

        {orders.length === 0 ? (
          <Text c="dimmed" ta="center">
            Belum ada order. Silakan buat order baru dari halaman Kasir.
          </Text>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>No. Order</Table.Th>
                <Table.Th>Pelanggan</Table.Th>
                <Table.Th>Tanggal</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 5)
                .map((order) => (
                  <Table.Tr key={order.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        {order.orderNumber}
                      </Text>
                    </Table.Td>
                    <Table.Td>{order.customerName}</Table.Td>
                    <Table.Td>
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          order.status === "completed"
                            ? "green"
                            : order.status === "pending_dp"
                              ? "orange"
                              : order.status === "in_progress"
                                ? "blue"
                                : "gray"
                        }
                        variant="light"
                      >
                        {order.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatCurrency(order.total)}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
