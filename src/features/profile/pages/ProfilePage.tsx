import {
  Title,
  Card,
  Text,
  Group,
  Stack,
  Avatar,
  Badge,
  Grid,
  Divider,
  ThemeIcon,
  Paper,
  Progress,
  Box,
} from "@mantine/core";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconBuildingStore,
  IconMapPin,
  IconCalendar,
  IconCrown,
  IconClock,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { formatDate } from "../../../shared/utils";
import dayjs from "dayjs";

const ROLE_LABELS: Record<string, string> = {
  owner: "Pemilik Usaha",
  kasir: "Kasir",
  produksi: "Tim Produksi",
  superadmin: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "aqua",
  kasir: "orange",
  produksi: "violet",
  superadmin: "red",
};

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { getBusinessById, getBranchById, getBranchesByBusiness } =
    useBusinessStore();

  if (!user) return null;

  const business = getBusinessById(user.businessId);
  const branch = getBranchById(user.branchId);
  const allBranches = business ? getBranchesByBusiness(business.id) : [];

  // Simulated subscription data
  const subscriptionStart = business ? dayjs(business.createdAt) : dayjs();
  const subscriptionEnd = subscriptionStart.add(1, "year");
  const totalDays = subscriptionEnd.diff(subscriptionStart, "day");
  const daysUsed = dayjs().diff(subscriptionStart, "day");
  const daysRemaining = Math.max(0, subscriptionEnd.diff(dayjs(), "day"));
  const progressPercent = Math.min(100, (daysUsed / totalDays) * 100);
  const isExpiringSoon = daysRemaining <= 30;

  return (
    <>
      <Group gap="sm" mb="xl">
        <Title order={2}>Profil Saya</Title>
      </Group>

      <Grid>
        {/* Left Column - Personal Info */}
        <Grid.Col span={{ base: 12, md: user.role === "owner" ? 5 : 12 }}>
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md" mb="lg">
              <Avatar size={100} radius="xl" color="aqua" variant="filled">
                <Text size="2rem" fw={700}>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </Avatar>
              <Stack align="center" gap={4}>
                <Text size="xl" fw={700}>
                  {user.name}
                </Text>
                <Badge
                  size="lg"
                  variant="light"
                  color={ROLE_COLORS[user.role] || "gray"}
                  leftSection={<IconShieldCheck size={14} />}
                >
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </Stack>
            </Stack>

            <Divider mb="lg" />

            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon variant="light" color="aqua" size="lg">
                  <IconMail size={18} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">
                    Email
                  </Text>
                  <Text size="sm" fw={500}>
                    {user.email}
                  </Text>
                </Box>
              </Group>

              <Group gap="sm">
                <ThemeIcon variant="light" color="aqua" size="lg">
                  <IconPhone size={18} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">
                    Telepon
                  </Text>
                  <Text size="sm" fw={500}>
                    {user.phone || "-"}
                  </Text>
                </Box>
              </Group>

              <Group gap="sm">
                <ThemeIcon variant="light" color="aqua" size="lg">
                  <IconBuildingStore size={18} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">
                    Cabang
                  </Text>
                  <Text size="sm" fw={500}>
                    {branch?.name || "-"}
                  </Text>
                  {branch && (
                    <Badge size="xs" variant="dot" color="aqua">
                      {branch.type === "outlet" ? "Outlet" : "Produksi"}
                    </Badge>
                  )}
                </Box>
              </Group>

              <Group gap="sm">
                <ThemeIcon variant="light" color="aqua" size="lg">
                  <IconCalendar size={18} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">
                    Bergabung Sejak
                  </Text>
                  <Text size="sm" fw={500}>
                    {formatDate(user.createdAt, "DD MMMM YYYY")}
                  </Text>
                </Box>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Right Column - Business & Subscription (Owner Only) */}
        {user.role === "owner" && (
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="lg">
              {/* Business Info */}
              {business && (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group gap="sm" mb="lg">
                    <ThemeIcon variant="light" color="aqua" size="lg">
                      <IconCrown size={18} />
                    </ThemeIcon>
                    <Title order={4}>Informasi Bisnis</Title>
                  </Group>

                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Stack gap="xs">
                        <Text size="xs" c="dimmed">
                          Nama Bisnis
                        </Text>
                        <Text size="sm" fw={600}>
                          {business.name}
                        </Text>
                      </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Stack gap="xs">
                        <Text size="xs" c="dimmed">
                          Email Bisnis
                        </Text>
                        <Text size="sm" fw={500}>
                          {business.email}
                        </Text>
                      </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Stack gap="xs">
                        <Text size="xs" c="dimmed">
                          Telepon Bisnis
                        </Text>
                        <Text size="sm" fw={500}>
                          {business.phone}
                        </Text>
                      </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Stack gap="xs">
                        <Text size="xs" c="dimmed">
                          Alamat
                        </Text>
                        <Text size="sm" fw={500}>
                          {business.address}
                        </Text>
                      </Stack>
                    </Grid.Col>

                    <Grid.Col span={12}>
                      <Divider my="xs" />
                      <Text size="xs" c="dimmed" mb="xs">
                        Cabang ({allBranches.length})
                      </Text>
                      <Group gap="xs">
                        {allBranches.map((b) => (
                          <Badge
                            key={b.id}
                            variant="light"
                            color={b.type === "outlet" ? "aqua" : "violet"}
                            leftSection={
                              b.type === "outlet" ? (
                                <IconBuildingStore size={12} />
                              ) : (
                                <IconMapPin size={12} />
                              )
                            }
                          >
                            {b.name}
                          </Badge>
                        ))}
                      </Group>
                    </Grid.Col>
                  </Grid>
                </Card>
              )}

              {/* Subscription Info */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group gap="sm" mb="lg">
                  <ThemeIcon variant="light" color="aqua" size="lg">
                    <IconClock size={18} />
                  </ThemeIcon>
                  <Title order={4}>Langganan</Title>
                  <Badge
                    variant="filled"
                    color={isExpiringSoon ? "orange" : "green"}
                    size="sm"
                  >
                    {isExpiringSoon ? "Segera Berakhir" : "Aktif"}
                  </Badge>
                </Group>

                <Paper p="md" withBorder radius="md" bg="gray.0" mb="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Stack align="center" gap={4}>
                        <Text size="xs" c="dimmed">
                          Paket
                        </Text>
                        <Badge size="lg" variant="light" color="aqua">
                          Profesional
                        </Badge>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Stack align="center" gap={4}>
                        <Text size="xs" c="dimmed">
                          Mulai
                        </Text>
                        <Text size="sm" fw={600}>
                          {subscriptionStart.format("DD MMM YYYY")}
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Stack align="center" gap={4}>
                        <Text size="xs" c="dimmed">
                          Berakhir
                        </Text>
                        <Text
                          size="sm"
                          fw={600}
                          c={isExpiringSoon ? "orange" : undefined}
                        >
                          {subscriptionEnd.format("DD MMM YYYY")}
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Paper>

                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Masa berlaku
                    </Text>
                    <Text size="sm" fw={500}>
                      {daysRemaining} hari tersisa
                    </Text>
                  </Group>
                  <Progress
                    value={progressPercent}
                    size="lg"
                    radius="md"
                    color={
                      isExpiringSoon
                        ? "orange"
                        : progressPercent > 75
                          ? "yellow"
                          : "aqua"
                    }
                  />
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      {subscriptionStart.format("DD MMM YYYY")}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {subscriptionEnd.format("DD MMM YYYY")}
                    </Text>
                  </Group>
                </Stack>
              </Card>

              {/* Quick Stats */}
              <Grid>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Stack align="center" gap={4}>
                      <IconUser size={24} color="var(--mantine-color-aqua-6)" />
                      <Text size="xs" c="dimmed">
                        Role
                      </Text>
                      <Text size="sm" fw={600} tt="capitalize">
                        {ROLE_LABELS[user.role]}
                      </Text>
                    </Stack>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Stack align="center" gap={4}>
                      <IconBuildingStore
                        size={24}
                        color="var(--mantine-color-aqua-6)"
                      />
                      <Text size="xs" c="dimmed">
                        Cabang
                      </Text>
                      <Text size="sm" fw={600}>
                        {allBranches.length}
                      </Text>
                    </Stack>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Stack align="center" gap={4}>
                      <IconCalendar
                        size={24}
                        color="var(--mantine-color-aqua-6)"
                      />
                      <Text size="xs" c="dimmed">
                        Bergabung
                      </Text>
                      <Text size="sm" fw={600}>
                        {dayjs().diff(dayjs(user.createdAt), "month")} bln
                      </Text>
                    </Stack>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Stack align="center" gap={4}>
                      <IconClock
                        size={24}
                        color="var(--mantine-color-aqua-6)"
                      />
                      <Text size="xs" c="dimmed">
                        Sisa Hari
                      </Text>
                      <Text
                        size="sm"
                        fw={600}
                        c={isExpiringSoon ? "orange" : undefined}
                      >
                        {daysRemaining}
                      </Text>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            </Stack>
          </Grid.Col>
        )}
      </Grid>
    </>
  );
}
