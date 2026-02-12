import { Title, Text, SimpleGrid, Paper, Stack, Group } from "@mantine/core";
import {
  IconBuilding,
  IconUsers,
  IconBuildingStore,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { useUserStore } from "../../../shared/stores/userStore";

export default function SuperAdminDashboardPage() {
  const businesses = useBusinessStore((state) => state.businesses);
  const branches = useBusinessStore((state) => state.branches);
  const users = useUserStore((state) => state.users);

  const stats = [
    {
      title: "Total Bisnis",
      value: businesses.length,
      icon: IconBuilding,
      color: "aqua",
    },
    {
      title: "Total Cabang",
      value: branches.length,
      icon: IconBuildingStore,
      color: "teal",
    },
    {
      title: "Total Users",
      value: users.length,
      icon: IconUsers,
      color: "grape",
    },
    {
      title: "Active Users",
      value: users.length, // In real app, filter by active status
      icon: IconTrendingUp,
      color: "green",
    },
  ];

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb={5}>
          Dashboard Superadmin
        </Title>
        <Text c="dimmed" size="sm">
          Overview seluruh data bisnis, cabang, dan users
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Paper key={stat.title} p="md" radius="md" withBorder>
              <Group justify="space-between">
                <Stack gap={0}>
                  <Text size="sm" c="dimmed" fw={500}>
                    {stat.title}
                  </Text>
                  <Text size="xl" fw={700}>
                    {stat.value}
                  </Text>
                </Stack>
                <Icon
                  size={32}
                  stroke={1.5}
                  color={`var(--mantine-color-${stat.color}-6)`}
                />
              </Group>
            </Paper>
          );
        })}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} mt="md">
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="md">
            Bisnis Terdaftar
          </Title>
          <Stack gap="xs">
            {businesses.length === 0 ? (
              <Text size="sm" c="dimmed">
                Belum ada bisnis terdaftar
              </Text>
            ) : (
              businesses.slice(0, 5).map((business) => (
                <Group key={business.id} justify="space-between">
                  <Text size="sm">{business.name}</Text>
                  <Text size="xs" c="dimmed">
                    {
                      branches.filter((b) => b.businessId === business.id)
                        .length
                    }{" "}
                    cabang
                  </Text>
                </Group>
              ))
            )}
          </Stack>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="md">
            Users Terbaru
          </Title>
          <Stack gap="xs">
            {users.length === 0 ? (
              <Text size="sm" c="dimmed">
                Belum ada users terdaftar
              </Text>
            ) : (
              users.slice(0, 5).map((user) => (
                <Group key={user.id} justify="space-between">
                  <div>
                    <Text size="sm">{user.name}</Text>
                    <Text size="xs" c="dimmed">
                      {user.email}
                    </Text>
                  </div>
                  <Text size="xs" c="dimmed" tt="capitalize">
                    {user.role}
                  </Text>
                </Group>
              ))
            )}
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
