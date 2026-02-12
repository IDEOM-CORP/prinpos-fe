import {
  Grid,
  Card,
  Text,
  Group,
  ThemeIcon,
  Stack,
  Title,
} from "@mantine/core";
import {
  IconShoppingCart,
  IconTool,
  IconFileText,
  IconCurrencyDollar,
  IconUsers,
  IconBox,
} from "@tabler/icons-react";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useUserStore } from "../../../shared/stores/userStore";
import { formatCurrency } from "../../../shared/utils";

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
  const orders = useOrderStore((state) => state.orders);
  const items = useItemStore((state) => state.items);
  const users = useUserStore((state) => state.users);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const inProgressOrders = orders.filter(
    (o) => o.status === "in-progress",
  ).length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <Title order={2} mb="xl">
        Dashboard
      </Title>

      <Text size="lg" mb="xl">
        Selamat datang, <strong>{user?.name}</strong>!
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={<IconFileText size={30} />}
            color="blue"
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
        <Title order={3} mb="md">
          Aktivitas Terbaru
        </Title>
        <Text c="dimmed">
          {orders.length === 0
            ? "Belum ada order. Silakan buat order baru dari halaman Kasir."
            : `Total ${totalOrders} order. ${pendingOrders} menunggu, ${inProgressOrders} dalam produksi, ${completedOrders} selesai.`}
        </Text>
      </Card>
    </>
  );
}
