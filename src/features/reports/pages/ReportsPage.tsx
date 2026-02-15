import { useState, useMemo } from "react";
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
  Progress,
  Badge,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconFileText,
  IconCurrencyDollar,
  IconTrendingUp,
  IconBuildingStore,
  IconCalendar,
  IconCreditCard,
} from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { formatCurrency } from "../../../shared/utils";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  comparison?: string;
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

type PeriodType = "today" | "this_week" | "this_month" | "this_year" | "custom";

export default function ReportsPage() {
  const allOrders = useOrderStore((state) => state.orders);
  const branches = useBusinessStore((state) => state.branches);

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("this_month");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf("month").toDate(),
    dayjs().endOf("month").toDate(),
  ]);

  // Branch options
  const branchOptions = [
    { value: "", label: "Semua Cabang" },
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  // Handle period change
  const handlePeriodChange = (value: string) => {
    setPeriodType(value as PeriodType);
    const now = dayjs();
    switch (value) {
      case "today":
        setDateRange([now.startOf("day").toDate(), now.endOf("day").toDate()]);
        break;
      case "this_week":
        setDateRange([
          now.startOf("week").add(1, "day").toDate(),
          now.endOf("week").add(1, "day").toDate(),
        ]);
        break;
      case "this_month":
        setDateRange([
          now.startOf("month").toDate(),
          now.endOf("month").toDate(),
        ]);
        break;
      case "this_year":
        setDateRange([
          now.startOf("year").toDate(),
          now.endOf("year").toDate(),
        ]);
        break;
      case "custom":
        setDateRange([null, null]);
        break;
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => {
      const matchBranch = selectedBranchId
        ? o.branchId === selectedBranchId
        : true;
      let matchDate = true;
      if (dateRange[0] && dateRange[1]) {
        matchDate = dayjs(o.createdAt).isBetween(
          dateRange[0],
          dateRange[1],
          "day",
          "[]",
        );
      }
      return matchBranch && matchDate;
    });
  }, [allOrders, selectedBranchId, dateRange]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const completed = filteredOrders.filter(
      (o) => o.status === "completed" || o.status === "settled",
    );
    const revenue = completed.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const completedCount = completed.length;
    const aov = completedCount > 0 ? revenue / completedCount : 0;

    // Outstanding Receivable (Piutang)
    // Orders that are NOT cancelled/expired, and have remaining payment > 0
    const receivable = filteredOrders
      .filter(
        (o) =>
          o.status !== "cancelled" &&
          o.status !== "expired" &&
          o.remainingPayment > 0,
      )
      .reduce((sum, o) => sum + o.remainingPayment, 0);

    return { revenue, totalOrders, completedCount, aov, receivable };
  }, [filteredOrders]);

  // Revenue per Branch
  const revenueByBranch = useMemo(() => {
    const data: Record<string, number> = {};
    filteredOrders
      .filter((o) => o.status === "completed" || o.status === "settled")
      .forEach((o) => {
        const branchName =
          branches.find((b) => b.id === o.branchId)?.name || "Unknown";
        data[branchName] = (data[branchName] || 0) + o.total;
      });
    return Object.entries(data)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredOrders, branches]);

  // Product Performance & Revenue per Product
  const productPerformance = useMemo(() => {
    const data: Record<
      string,
      { name: string; qty: number; revenue: number; category: string }
    > = {};

    // Check all completed orders in the filtered range
    filteredOrders
      .filter((o) => o.status === "completed" || o.status === "settled")
      .forEach((order) => {
        order.items.forEach((item) => {
          if (!data[item.itemId]) {
            data[item.itemId] = {
              name: item.name,
              qty: 0,
              revenue: 0,
              category: item.category || "-",
            };
          }
          data[item.itemId].qty += item.quantity;
          data[item.itemId].revenue += item.subtotal; // Use subtotal for accurate revenue share
        });
      });

    return Object.values(data)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10
  }, [filteredOrders]);

  // Revenue per Period (Graph-like table)
  const revenuePerPeriod = useMemo(() => {
    const data: Record<string, number> = {};
    const format = periodType === "this_year" ? "MMM YYYY" : "DD MMM";

    filteredOrders
      .filter((o) => o.status === "completed" || o.status === "settled")
      .forEach((o) => {
        const key = dayjs(o.createdAt).format(format);
        data[key] = (data[key] || 0) + o.total;
      });

    // Fill missing dates if needed (skipped for simplicity, showing only active days)
    return Object.entries(data).map(([date, total]) => ({ date, total }));
  }, [filteredOrders, periodType]);

  const maxRevenuePeriod = Math.max(...revenuePerPeriod.map((d) => d.total), 1);

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Laporan & Statistik</Title>
        <Group>
          <Select
            placeholder="Pilih Periode"
            data={[
              { value: "today", label: "Hari Ini" },
              { value: "this_week", label: "Minggu Ini" },
              { value: "this_month", label: "Bulan Ini" },
              { value: "this_year", label: "Tahun Ini" },
              { value: "custom", label: "Custom Range" },
            ]}
            value={periodType}
            onChange={(v) => handlePeriodChange(v || "this_month")}
            allowDeselect={false}
          />
          {periodType === "custom" && (
            <DatePickerInput
              type="range"
              placeholder="Pilih tanggal"
              value={dateRange}
              onChange={(value) =>
                setDateRange(value as unknown as [Date | null, Date | null])
              }
              leftSection={<IconCalendar size={16} />}
              clearable
            />
          )}
          <Select
            placeholder="Semua Cabang"
            data={branchOptions}
            value={selectedBranchId}
            onChange={(value) => setSelectedBranchId(value || "")}
            leftSection={<IconBuildingStore size={16} />}
            clearable={false}
          />
        </Group>
      </Group>

      {/* Summary Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(metrics.revenue)}
            icon={<IconCurrencyDollar size={30} />}
            color="teal"
            subtitle={`${metrics.completedCount} transaksi sukses`}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg. Order Value"
            value={formatCurrency(metrics.aov)}
            icon={<IconTrendingUp size={30} />}
            color="violet"
            subtitle="Rata-rata per transaksi"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Piutang (Receivable)"
            value={formatCurrency(metrics.receivable)}
            icon={<IconCreditCard size={30} />}
            color="orange"
            subtitle="Belum lunas (semua status)"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Transaksi"
            value={metrics.totalOrders}
            icon={<IconFileText size={30} />}
            color="blue"
            subtitle="Semua status order"
          />
        </Grid.Col>
      </Grid>

      <Grid>
        {/* Product Performance */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Title order={3} mb="md">
              Top 10 Produk Terlaris (Revenue)
            </Title>
            {productPerformance.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Tidak ada data penjualan
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Produk</Table.Th>
                    <Table.Th>Kategori</Table.Th>
                    <Table.Th>Terjual</Table.Th>
                    <Table.Th>Revenue</Table.Th>
                    <Table.Th>Kontribusi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {productPerformance.map((p) => (
                    <Table.Tr key={p.name}>
                      <Table.Td fw={500}>{p.name}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray">
                          {p.category}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{p.qty}</Table.Td>
                      <Table.Td>{formatCurrency(p.revenue)}</Table.Td>
                      <Table.Td width={100}>
                        <Progress
                          value={(p.revenue / metrics.revenue) * 100}
                          size="sm"
                          color="teal"
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>

        {/* Revenue Breakdown Side */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Revenue per Branch */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                Omzet per Cabang
              </Title>
              {revenueByBranch.length === 0 ? (
                <Text c="dimmed" size="sm">
                  Tidak ada data
                </Text>
              ) : (
                <Stack gap="sm">
                  {revenueByBranch.map((b) => (
                    <div key={b.name}>
                      <Group justify="space-between" mb={4}>
                        <Text size="sm">{b.name}</Text>
                        <Text size="sm" fw={500}>
                          {formatCurrency(b.total)}
                        </Text>
                      </Group>
                      <Progress
                        value={(b.total / metrics.revenue) * 100}
                        color="indigo"
                        size="sm"
                      />
                    </div>
                  ))}
                </Stack>
              )}
            </Card>

            {/* Revenue Trend (Simple List) */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                Omzet per Periode
              </Title>
              {revenuePerPeriod.length === 0 ? (
                <Text c="dimmed" size="sm">
                  Tidak ada data
                </Text>
              ) : (
                <Stack gap="xs" style={{ maxHeight: 300, overflowY: "auto" }}>
                  {revenuePerPeriod.map((d) => (
                    <Group key={d.date} justify="space-between">
                      <Text size="sm" c="dimmed">
                        {d.date}
                      </Text>
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {formatCurrency(d.total)}
                        </Text>
                        <div
                          style={{
                            width: 60,
                            height: 6,
                            backgroundColor: "#f1f3f5",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${(d.total / maxRevenuePeriod) * 100}%`,
                              height: "100%",
                              backgroundColor: "#20c997",
                            }}
                          />
                        </div>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              )}
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
}
