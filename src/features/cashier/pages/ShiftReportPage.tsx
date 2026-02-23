import { useState, useMemo } from "react";
import {
  Title,
  Card,
  Text,
  Group,
  Stack,
  Table,
  Select,
  Badge,
  Modal,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBuildingStore, IconClock } from "@tabler/icons-react";
import { useShiftStore, type Shift } from "../../../shared/stores/shiftStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { formatCurrency, formatDateTime } from "../../../shared/utils";

export default function ShiftReportPage() {
  const allShifts = useShiftStore((s) => s.getAllShifts());
  const branches = useBusinessStore((s) => s.branches);

  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailOpened, { open: openDetail, close: closeDetail }] =
    useDisclosure(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const branchOptions = [
    { value: "", label: "Semua Cabang" },
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  const filteredShifts = useMemo(() => {
    return allShifts.filter((s) => {
      const matchBranch = !branchFilter || s.branchId === branchFilter;
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? s.isActive
            : !s.isActive;
      return matchBranch && matchStatus;
    });
  }, [allShifts, branchFilter, statusFilter]);

  const getBranchName = (id: string) =>
    branches.find((b) => b.id === id)?.name || "-";

  const viewDetail = (shift: Shift) => {
    setSelectedShift(shift);
    openDetail();
  };

  return (
    <>
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2}>Laporan Shift</Title>
      </Group>

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group>
          <Select
            placeholder="Semua Cabang"
            data={branchOptions}
            value={branchFilter || ""}
            onChange={(v) => setBranchFilter(v || null)}
            leftSection={<IconBuildingStore size={16} />}
            style={{ width: 220 }}
            clearable={false}
          />
          <Select
            placeholder="Status Shift"
            data={[
              { value: "all", label: "Semua" },
              { value: "active", label: "Aktif" },
              { value: "closed", label: "Sudah Ditutup" },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || "all")}
            style={{ width: 200 }}
          />
        </Group>
      </Card>

      {/* Table */}
      {filteredShifts.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            Tidak ada data shift
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cabang</Table.Th>
                <Table.Th>Kasir</Table.Th>
                <Table.Th>Buka</Table.Th>
                <Table.Th>Tutup</Table.Th>
                <Table.Th ta="right">Modal Awal</Table.Th>
                <Table.Th ta="right">Total Penjualan</Table.Th>
                <Table.Th ta="right">Selisih</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredShifts.map((shift) => (
                <Table.Tr
                  key={shift.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => viewDetail(shift)}
                >
                  <Table.Td>
                    <Text size="sm">{getBranchName(shift.branchId)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{shift.openedByName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDateTime(shift.openedAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {shift.closedAt ? formatDateTime(shift.closedAt) : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm">
                      {formatCurrency(shift.openingBalance)}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={500}>
                      {formatCurrency(shift.totalSalesFromOrders)}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    {shift.difference !== undefined ? (
                      <Text
                        size="sm"
                        fw={600}
                        c={
                          shift.difference === 0
                            ? "green"
                            : shift.difference > 0
                              ? "blue"
                              : "red"
                        }
                      >
                        {shift.difference >= 0 ? "+" : ""}
                        {formatCurrency(shift.difference)}
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        -
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={shift.isActive ? "green" : "gray"}>
                      {shift.isActive ? "Aktif" : "Ditutup"}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        opened={detailOpened}
        onClose={closeDetail}
        title={<Text fw={600}>Detail Shift</Text>}
        centered
        size="lg"
      >
        {selectedShift && (
          <Stack gap="md">
            {/* Info */}
            <Group gap="xl">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Cabang
                </Text>
                <Text size="sm" fw={500}>
                  {getBranchName(selectedShift.branchId)}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Kasir
                </Text>
                <Text size="sm" fw={500}>
                  {selectedShift.openedByName}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Status
                </Text>
                <Badge color={selectedShift.isActive ? "green" : "gray"}>
                  {selectedShift.isActive ? "Aktif" : "Ditutup"}
                </Badge>
              </Stack>
            </Group>

            <Group gap="xl">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  <IconClock size={12} /> Shift Dibuka
                </Text>
                <Text size="sm">{formatDateTime(selectedShift.openedAt)}</Text>
              </Stack>
              {selectedShift.closedAt && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    <IconClock size={12} /> Shift Ditutup
                  </Text>
                  <Text size="sm">
                    {formatDateTime(selectedShift.closedAt)}
                  </Text>
                </Stack>
              )}
            </Group>

            <Divider />

            {/* Financial Summary */}
            <Text fw={600}>Ringkasan Kas</Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Modal Awal</Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(selectedShift.openingBalance)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="green">
                  + Penjualan Cash
                </Text>
                <Text size="sm" fw={500} c="green">
                  {formatCurrency(selectedShift.totalCashSales)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="blue">
                  + Cash In (Manual)
                </Text>
                <Text size="sm" fw={500} c="blue">
                  {formatCurrency(selectedShift.totalCashIn)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="red">
                  - Cash Out
                </Text>
                <Text size="sm" fw={500} c="red">
                  {formatCurrency(selectedShift.totalCashOut)}
                </Text>
              </Group>
              <Divider variant="dashed" />
              <Group justify="space-between">
                <Text size="sm">Penjualan Non-Cash</Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(selectedShift.totalNonCash)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Total Transaksi Order</Text>
                <Text size="sm" fw={500}>
                  {selectedShift.orderPaymentCount} transaksi (
                  {formatCurrency(selectedShift.totalSalesFromOrders)})
                </Text>
              </Group>
              <Divider variant="dashed" />
              <Group justify="space-between">
                <Text size="sm" fw={600}>
                  Expected Cash
                </Text>
                <Text size="sm" fw={700}>
                  {formatCurrency(selectedShift.expectedEndingCash)}
                </Text>
              </Group>
              {selectedShift.actualEndingCash !== undefined && (
                <>
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>
                      Actual Cash
                    </Text>
                    <Text size="sm" fw={700}>
                      {formatCurrency(selectedShift.actualEndingCash)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>
                      Selisih
                    </Text>
                    <Text
                      size="sm"
                      fw={700}
                      c={
                        selectedShift.difference === 0
                          ? "green"
                          : (selectedShift.difference ?? 0) > 0
                            ? "blue"
                            : "red"
                      }
                    >
                      {(selectedShift.difference ?? 0) >= 0 ? "+" : ""}
                      {formatCurrency(selectedShift.difference ?? 0)}
                    </Text>
                  </Group>
                </>
              )}
            </Stack>

            {/* Cash Transactions */}
            {selectedShift.cashTransactions.length > 0 && (
              <>
                <Divider />
                <Text fw={600}>Riwayat Cash In/Out</Text>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Waktu</Table.Th>
                      <Table.Th>Tipe</Table.Th>
                      <Table.Th>Kategori</Table.Th>
                      <Table.Th>Keterangan</Table.Th>
                      <Table.Th ta="right">Jumlah</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedShift.cashTransactions.map((tx) => (
                      <Table.Tr key={tx.id}>
                        <Table.Td>
                          <Text size="xs">{formatDateTime(tx.createdAt)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="sm"
                            color={tx.type === "cash_in" ? "green" : "red"}
                          >
                            {tx.type === "cash_in" ? "Cash In" : "Cash Out"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{tx.category}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{tx.description}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text
                            size="sm"
                            fw={500}
                            c={tx.type === "cash_in" ? "green" : "red"}
                          >
                            {tx.type === "cash_in" ? "+" : "-"}
                            {formatCurrency(tx.amount)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </>
            )}
          </Stack>
        )}
      </Modal>
    </>
  );
}
