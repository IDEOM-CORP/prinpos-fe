import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Title,
  Card,
  Text,
  Button,
  Group,
  Stack,
  TextInput,
  Modal,
  Textarea,
  Divider,
  Paper,
  Select,
  NumberInput,
  Badge,
  Table,
  Progress,
  Alert,
  Tabs,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconSearch,
  IconCash,
  IconEye,
  IconPrinter,
  IconAlertCircle,
  IconCheck,
  IconArrowRight,
  IconArrowUpRight,
  IconArrowDownRight,
  IconClock,
  IconDoorEnter,
  IconDoorExit,
} from "@tabler/icons-react";
import type { Order } from "../../../shared/types";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import {
  useShiftStore,
  CASH_IN_CATEGORIES,
  CASH_OUT_CATEGORIES,
} from "../../../shared/stores/shiftStore";
import { formatCurrency, formatDateTime } from "../../../shared/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DP_QUICK_OPTIONS,
  MIN_DP_PERCENT,
} from "../../../shared/constants";
import { ROUTES } from "../../../core/routes";

export default function CashierPage() {
  const navigate = useNavigate();
  const orders = useOrderStore((s) => s.getActiveOrders());
  const addPayment = useOrderStore((s) => s.addPayment);
  const user = useAuthStore((s) => s.user);
  const branches = useBusinessStore((s) => s.branches);

  // Shift store
  const openShiftAction = useShiftStore((s) => s.openShift);
  const closeShiftAction = useShiftStore((s) => s.closeShift);
  const getActiveShift = useShiftStore((s) => s.getActiveShift);
  const addCashTransaction = useShiftStore((s) => s.addCashTransaction);
  const recordOrderPayment = useShiftStore((s) => s.recordOrderPayment);

  const userBranchId = user?.branchId || "";
  const activeShift = getActiveShift(userBranchId);

  // States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [paymentModalOpened, { open: openPayment, close: closePayment }] =
    useDisclosure(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");

  // Modal kembalian
  const [
    changeModalOpened,
    { open: openChangeModal, close: closeChangeModal },
  ] = useDisclosure(false);
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{
    order: Order;
    paidAmount: number;
    remaining: number;
    method: string;
  } | null>(null);

  // Shift modals
  const [openShiftModal, { open: showOpenShift, close: hideOpenShift }] =
    useDisclosure(false);
  const [closeShiftModal, { open: showCloseShift, close: hideCloseShift }] =
    useDisclosure(false);
  const [cashTxModal, { open: showCashTx, close: hideCashTx }] =
    useDisclosure(false);
  const [cashTxType, setCashTxType] = useState<"cash_in" | "cash_out">(
    "cash_in",
  );

  // Shift form states
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [actualCash, setActualCash] = useState<number>(0);
  const [cashTxAmount, setCashTxAmount] = useState<number>(0);
  const [cashTxCategory, setCashTxCategory] = useState("");
  const [cashTxDescription, setCashTxDescription] = useState("");

  // Orders that need payment attention
  const payableOrders = useMemo(() => {
    return orders.filter((order) => {
      const needsPayment =
        order.status === "awaiting_payment" ||
        order.status === "pending_dp" ||
        (order.status === "completed" && order.remainingPayment > 0);
      if (!needsPayment) return false;

      const matchSearch =
        !search ||
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(search.toLowerCase());
      const matchBranch = !branchFilter || order.branchId === branchFilter;
      const matchStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchSearch && matchBranch && matchStatus;
    });
  }, [orders, search, branchFilter, statusFilter]);

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setPaymentAmount(0);
    setPaymentMethod("cash");
    setPaymentNote("");
    openPayment();
  };

  const handlePayment = () => {
    if (!selectedOrder || !user || paymentAmount <= 0) return;

    const remaining = selectedOrder.remainingPayment;
    const actualPaid = Math.min(paymentAmount, remaining);

    addPayment(
      selectedOrder.id,
      actualPaid,
      paymentMethod,
      user.id,
      paymentNote || undefined,
    );

    // Record to shift
    recordOrderPayment(userBranchId, actualPaid, paymentMethod);

    notifications.show({
      title: "Pembayaran Diterima",
      message: `${formatCurrency(actualPaid)} untuk order ${selectedOrder.orderNumber}`,
      color: "green",
      icon: <IconCash size={16} />,
    });

    // Simpan info untuk modal kembalian
    setLastPaymentInfo({
      order: selectedOrder,
      paidAmount: paymentAmount,
      remaining,
      method: paymentMethod,
    });

    closePayment();
    setSelectedOrder(null);

    // Buka modal kembalian
    openChangeModal();
  };

  // === SHIFT HANDLERS ===
  const handleOpenShift = () => {
    if (!user) return;
    try {
      openShiftAction(userBranchId, user.id, user.name, openingBalance);
      notifications.show({
        title: "Shift Dibuka",
        message: `Modal awal: ${formatCurrency(openingBalance)}`,
        color: "green",
      });
      hideOpenShift();
      setOpeningBalance(0);
    } catch {
      notifications.show({
        title: "Error",
        message: "Cabang ini sudah memiliki shift aktif",
        color: "red",
      });
    }
  };

  const handleCloseShift = () => {
    if (!user || !activeShift) return;
    const result = closeShiftAction(
      activeShift.id,
      user.id,
      user.name,
      actualCash,
    );
    if (result) {
      const diff = result.difference ?? 0;
      notifications.show({
        title: "Shift Ditutup",
        message: `Selisih: ${diff >= 0 ? "+" : ""}${formatCurrency(diff)}`,
        color: diff === 0 ? "green" : "orange",
      });
    }
    hideCloseShift();
    setActualCash(0);
  };

  const openCashIn = () => {
    setCashTxType("cash_in");
    setCashTxAmount(0);
    setCashTxCategory("");
    setCashTxDescription("");
    showCashTx();
  };

  const openCashOut = () => {
    setCashTxType("cash_out");
    setCashTxAmount(0);
    setCashTxCategory("");
    setCashTxDescription("");
    showCashTx();
  };

  const handleCashTransaction = () => {
    if (!user || !activeShift || cashTxAmount <= 0 || !cashTxCategory) return;
    addCashTransaction(
      activeShift.id,
      cashTxType,
      cashTxAmount,
      cashTxCategory,
      cashTxDescription || cashTxCategory,
      user.id,
    );
    notifications.show({
      title: cashTxType === "cash_in" ? "Cash In" : "Cash Out",
      message: `${formatCurrency(cashTxAmount)} — ${cashTxCategory}`,
      color: cashTxType === "cash_in" ? "green" : "red",
    });
    hideCashTx();
  };

  const outletBranches = branches.filter((b) => b.type === "outlet");

  const totalOutstanding = payableOrders.reduce(
    (sum, o) => sum + o.remainingPayment,
    0,
  );

  // === NO ACTIVE SHIFT — SHOW OPEN SHIFT SCREEN ===
  if (!activeShift) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Kasir</Title>
        </Group>

        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack align="center" gap="lg" py="xl">
            <ThemeIcon size={80} radius="xl" color="blue" variant="light">
              <IconDoorEnter size={40} />
            </ThemeIcon>
            <Stack align="center" gap={4}>
              <Title order={3}>Belum Ada Shift Aktif</Title>
              <Text c="dimmed" ta="center">
                Buka shift terlebih dahulu untuk mulai menerima pembayaran
              </Text>
            </Stack>
            <Button
              size="lg"
              leftSection={<IconDoorEnter size={20} />}
              onClick={showOpenShift}
            >
              Buka Shift
            </Button>
          </Stack>
        </Card>

        {/* Open Shift Modal */}
        <Modal
          opened={openShiftModal}
          onClose={hideOpenShift}
          title={<Text fw={600}>Buka Shift Baru</Text>}
          centered
        >
          <Stack gap="md">
            <Paper p="md" withBorder bg="gray.0" radius="md">
              <Group gap="xs" mb="xs">
                <IconClock size={16} />
                <Text size="sm" fw={500}>
                  Informasi
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Kasir: <strong>{user?.name}</strong>
              </Text>
              <Text size="sm" c="dimmed">
                Cabang:{" "}
                <strong>
                  {branches.find((b) => b.id === userBranchId)?.name || "-"}
                </strong>
              </Text>
            </Paper>

            <NumberInput
              label="Modal Awal (Cash Drawer)"
              placeholder="Masukkan jumlah kas awal"
              leftSection="Rp"
              thousandSeparator="."
              decimalSeparator=","
              min={0}
              size="lg"
              value={openingBalance}
              onChange={(v) => setOpeningBalance(Number(v) || 0)}
            />

            <Group mt="md" grow>
              <Button variant="outline" onClick={hideOpenShift}>
                Batal
              </Button>
              <Button size="lg" onClick={handleOpenShift}>
                Buka Shift
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    );
  }

  // Expected cash calculation
  const expectedCash =
    activeShift.openingBalance +
    activeShift.totalCashIn +
    activeShift.totalCashSales -
    activeShift.totalCashOut;

  // === ACTIVE SHIFT — SHOW CASHIER ===
  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Title order={2}>Pembayaran</Title>
        <Group>
          <Badge size="lg" variant="light" color="orange">
            {payableOrders.length} order menunggu • Outstanding:{" "}
            {formatCurrency(totalOutstanding)}
          </Badge>
        </Group>
      </Group>

      {/* Shift Info Bar */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Group justify="space-between">
          <Group gap="lg">
            <Group gap="xs">
              <Badge color="green" variant="dot" size="lg">
                Shift Aktif
              </Badge>
              <Text size="sm" c="dimmed">
                {user?.name} • sejak {formatDateTime(activeShift.openedAt)}
              </Text>
            </Group>
            <Divider orientation="vertical" />
            <Group gap="md">
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  Modal
                </Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(activeShift.openingBalance)}
                </Text>
              </Stack>
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  Cash Sales
                </Text>
                <Text size="sm" fw={500} c="green">
                  {formatCurrency(activeShift.totalCashSales)}
                </Text>
              </Stack>
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  Expected Cash
                </Text>
                <Text size="sm" fw={600}>
                  {formatCurrency(expectedCash)}
                </Text>
              </Stack>
            </Group>
          </Group>

          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              color="green"
              leftSection={<IconArrowUpRight size={14} />}
              onClick={openCashIn}
            >
              Cash In
            </Button>
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconArrowDownRight size={14} />}
              onClick={openCashOut}
            >
              Cash Out
            </Button>
            <Button
              size="xs"
              variant="outline"
              color="gray"
              leftSection={<IconDoorExit size={14} />}
              onClick={() => {
                setActualCash(expectedCash);
                showCloseShift();
              }}
            >
              Tutup Shift
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Filters */}
      <Group>
        <TextInput
          placeholder="Cari no. order / pelanggan..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Tabs
          value={statusFilter}
          onChange={(v) => setStatusFilter(v || "all")}
        >
          <Tabs.List>
            <Tabs.Tab value="all">Semua</Tabs.Tab>
            <Tabs.Tab value="awaiting_payment">Menunggu Bayar</Tabs.Tab>
            <Tabs.Tab value="pending_dp">Menunggu DP</Tabs.Tab>
            <Tabs.Tab value="completed">Pelunasan</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        {outletBranches.length > 1 && (
          <Select
            placeholder="Semua Outlet"
            data={outletBranches.map((b) => ({ value: b.id, label: b.name }))}
            value={branchFilter}
            onChange={setBranchFilter}
            clearable
            w={180}
          />
        )}
      </Group>

      {/* Orders table */}
      {payableOrders.length === 0 ? (
        <Alert
          color="gray"
          variant="light"
          icon={<IconAlertCircle size={16} />}
        >
          Tidak ada order yang menunggu pembayaran saat ini.
        </Alert>
      ) : (
        <Card withBorder padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>No. Order</Table.Th>
                <Table.Th>Pelanggan</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Dibayar</Table.Th>
                <Table.Th>Sisa</Table.Th>
                <Table.Th>Progress</Table.Th>
                <Table.Th>Deadline</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payableOrders.map((order) => {
                const paidPercent =
                  order.total > 0
                    ? Math.round((order.paidAmount / order.total) * 100)
                    : 0;
                const isUrgent =
                  order.deadline &&
                  new Date(order.deadline).getTime() - new Date().getTime() <
                    24 * 60 * 60 * 1000;

                return (
                  <Table.Tr key={order.id}>
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {order.orderNumber}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDateTime(order.createdAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{order.customerName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={ORDER_STATUS_COLORS[order.status]}
                        variant="light"
                        size="sm"
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {formatCurrency(order.total)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="green">
                        {formatCurrency(order.paidAmount)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="red" fw={600}>
                        {formatCurrency(order.remainingPayment)}
                      </Text>
                    </Table.Td>
                    <Table.Td w={120}>
                      <Progress
                        value={paidPercent}
                        size="sm"
                        color={
                          paidPercent >= 100
                            ? "green"
                            : paidPercent >= 50
                              ? "aqua"
                              : "orange"
                        }
                      />
                      <Text size="xs" c="dimmed" ta="center">
                        {paidPercent}%
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {order.deadline ? (
                        <Badge
                          size="sm"
                          color={isUrgent ? "red" : "gray"}
                          variant="light"
                        >
                          {new Date(order.deadline).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          leftSection={<IconCash size={14} />}
                          onClick={() => openPaymentModal(order)}
                        >
                          Bayar
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconEye size={14} />}
                          onClick={() =>
                            navigate(
                              ROUTES.ORDER_DETAIL.replace(":id", order.id),
                            )
                          }
                        >
                          Detail
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          leftSection={<IconPrinter size={14} />}
                          onClick={() =>
                            navigate(
                              ROUTES.ORDER_INVOICE.replace(":id", order.id),
                            )
                          }
                        >
                          Nota
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Payment Modal */}
      <Modal
        opened={paymentModalOpened}
        onClose={closePayment}
        title="Terima Pembayaran"
        size="md"
        centered
      >
        {selectedOrder && (
          <Stack gap="md">
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Order
                </Text>
                <Text fw={600}>{selectedOrder.orderNumber}</Text>
              </Group>
              <Group justify="space-between" mt="xs">
                <Text size="sm" c="dimmed">
                  Pelanggan
                </Text>
                <Text>{selectedOrder.customerName}</Text>
              </Group>
              <Divider my="sm" />
              <Group justify="space-between">
                <Text size="sm">Total</Text>
                <Text fw={500}>{formatCurrency(selectedOrder.total)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Sudah Dibayar</Text>
                <Text c="green">
                  {formatCurrency(selectedOrder.paidAmount)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={600}>
                  Sisa Tagihan
                </Text>
                <Text c="red" fw={700} size="lg">
                  {formatCurrency(selectedOrder.remainingPayment)}
                </Text>
              </Group>
            </Paper>

            {/* Quick pay buttons */}
            <Group gap="xs">
              <Button
                size="xs"
                variant="outline"
                onClick={() => setPaymentAmount(selectedOrder.remainingPayment)}
              >
                Lunasi Semua
              </Button>
              {DP_QUICK_OPTIONS.map((pct) => {
                const amt = Math.round(
                  selectedOrder.total * (pct / 100) - selectedOrder.paidAmount,
                );
                if (amt <= 0 || amt > selectedOrder.remainingPayment)
                  return null;
                return (
                  <Button
                    key={pct}
                    size="xs"
                    variant="outline"
                    onClick={() => setPaymentAmount(amt)}
                  >
                    DP {pct}% ({formatCurrency(amt)})
                  </Button>
                );
              })}
            </Group>

            <NumberInput
              label="Jumlah Pembayaran"
              placeholder="Masukkan jumlah"
              leftSection="Rp"
              thousandSeparator="."
              decimalSeparator=","
              min={1}
              value={paymentAmount}
              onChange={(v) => setPaymentAmount(Number(v) || 0)}
              size="lg"
            />

            {/* Preview kembalian real-time (cash only) */}
            {paymentMethod === "cash" &&
              paymentAmount > selectedOrder.remainingPayment && (
                <Paper p="sm" radius="sm" bg="teal.0">
                  <Group justify="space-between">
                    <Text size="sm" fw={600} c="teal.7">
                      Kembalian
                    </Text>
                    <Text size="lg" fw={800} c="teal.7">
                      {formatCurrency(
                        paymentAmount - selectedOrder.remainingPayment,
                      )}
                    </Text>
                  </Group>
                </Paper>
              )}

            {paymentAmount > 0 &&
              paymentAmount <
                Math.round(selectedOrder.total * (MIN_DP_PERCENT / 100)) -
                  selectedOrder.paidAmount &&
              selectedOrder.status === "awaiting_payment" && (
                <Alert
                  color="orange"
                  variant="light"
                  icon={<IconAlertCircle size={16} />}
                >
                  DP di bawah {MIN_DP_PERCENT}% — produksi belum bisa dimulai
                </Alert>
              )}

            <Select
              label="Metode Pembayaran"
              data={[
                { value: "cash", label: "Tunai (Cash)" },
                { value: "transfer", label: "Transfer Bank" },
                { value: "qris", label: "QRIS" },
                { value: "e-wallet", label: "E-Wallet (OVO/GoPay/Dana)" },
              ]}
              value={paymentMethod}
              onChange={(v) => setPaymentMethod(v || "cash")}
            />

            <Textarea
              label="Catatan"
              placeholder="Catatan pembayaran (opsional)"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.currentTarget.value)}
            />

            <Group mt="md">
              <Button variant="outline" onClick={closePayment} fullWidth>
                Batal
              </Button>
              <Button
                fullWidth
                size="lg"
                disabled={paymentAmount <= 0}
                onClick={handlePayment}
              >
                Terima {formatCurrency(paymentAmount)}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* ===== MODAL KEMBALIAN ===== */}
      <Modal
        opened={changeModalOpened}
        onClose={closeChangeModal}
        title=""
        size="sm"
        centered
        withCloseButton={false}
        styles={{ body: { padding: 0 } }}
      >
        {lastPaymentInfo &&
          (() => {
            const { order, paidAmount, remaining, method } = lastPaymentInfo;
            const actualPaid = Math.min(paidAmount, remaining);
            const change =
              method === "cash" ? Math.max(paidAmount - remaining, 0) : 0;
            const isFullyPaid = paidAmount >= remaining;

            return (
              <Stack gap={0}>
                {/* Header warna hijau */}
                <Box
                  p="xl"
                  style={{
                    background: "linear-gradient(135deg, #2f9e44, #40c057)",
                    borderRadius:
                      "var(--mantine-radius-md) var(--mantine-radius-md) 0 0",
                    textAlign: "center",
                  }}
                >
                  <ThemeIcon
                    size={56}
                    radius="xl"
                    color="white"
                    variant="white"
                    mx="auto"
                    mb="sm"
                    style={{ color: "#2f9e44" }}
                  >
                    <IconCheck size={32} />
                  </ThemeIcon>
                  <Text c="white" fw={700} size="lg">
                    Pembayaran Diterima!
                  </Text>
                  <Text c="rgba(255,255,255,0.85)" size="sm">
                    {order.orderNumber} · {order.customerName}
                  </Text>
                </Box>

                {/* Body */}
                <Stack gap="sm" p="xl">
                  <Paper p="md" withBorder radius="md" bg="gray.0">
                    <Stack gap={8}>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Tagihan
                        </Text>
                        <Text size="sm" fw={500}>
                          {formatCurrency(remaining)}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Dibayar
                        </Text>
                        <Text size="sm" fw={500} c="green">
                          {formatCurrency(actualPaid)}
                        </Text>
                      </Group>
                      {change > 0 && (
                        <>
                          <Divider />
                          <Group justify="space-between">
                            <Text fw={700} size="md">
                              Kembalian
                            </Text>
                            <Text fw={800} size="xl" c="teal">
                              {formatCurrency(change)}
                            </Text>
                          </Group>
                        </>
                      )}
                      {!isFullyPaid && (
                        <>
                          <Divider />
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">
                              Sisa Tagihan
                            </Text>
                            <Text size="sm" fw={600} c="orange">
                              {formatCurrency(remaining - actualPaid)}
                            </Text>
                          </Group>
                        </>
                      )}
                    </Stack>
                  </Paper>

                  <Group grow>
                    <Button
                      variant="light"
                      leftSection={<IconPrinter size={16} />}
                      onClick={() => {
                        closeChangeModal();
                        navigate(ROUTES.ORDER_INVOICE.replace(":id", order.id));
                      }}
                    >
                      Cetak Resi
                    </Button>
                    <Button
                      rightSection={<IconArrowRight size={16} />}
                      onClick={closeChangeModal}
                    >
                      Selesai
                    </Button>
                  </Group>
                </Stack>
              </Stack>
            );
          })()}
      </Modal>

      {/* ===== MODAL TUTUP SHIFT ===== */}
      <Modal
        opened={closeShiftModal}
        onClose={hideCloseShift}
        title={<Text fw={600}>Tutup Shift</Text>}
        centered
        size="md"
      >
        {activeShift && (
          <Stack gap="md">
            <Paper p="md" withBorder bg="gray.0" radius="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Kasir
                  </Text>
                  <Text size="sm" fw={500}>
                    {activeShift.openedByName}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Shift Dibuka
                  </Text>
                  <Text size="sm">{formatDateTime(activeShift.openedAt)}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="sm">Modal Awal</Text>
                  <Text size="sm" fw={500}>
                    {formatCurrency(activeShift.openingBalance)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="green">
                    + Cash Sales
                  </Text>
                  <Text size="sm" c="green">
                    {formatCurrency(activeShift.totalCashSales)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="blue">
                    + Cash In
                  </Text>
                  <Text size="sm" c="blue">
                    {formatCurrency(activeShift.totalCashIn)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="red">
                    - Cash Out
                  </Text>
                  <Text size="sm" c="red">
                    {formatCurrency(activeShift.totalCashOut)}
                  </Text>
                </Group>
                <Divider variant="dashed" />
                <Group justify="space-between">
                  <Text size="sm">Non-Cash (Transfer/QRIS)</Text>
                  <Text size="sm">
                    {formatCurrency(activeShift.totalNonCash)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Total Transaksi</Text>
                  <Text size="sm">
                    {activeShift.orderPaymentCount} transaksi
                  </Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text fw={700}>Expected Cash</Text>
                  <Text fw={700} size="lg">
                    {formatCurrency(expectedCash)}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <NumberInput
              label="Uang Fisik di Cash Drawer"
              placeholder="Hitung dan masukkan jumlah uang"
              leftSection="Rp"
              thousandSeparator="."
              decimalSeparator=","
              min={0}
              size="lg"
              value={actualCash}
              onChange={(v) => setActualCash(Number(v) || 0)}
            />

            {/* Preview selisih */}
            <Paper p="md" withBorder radius="md">
              <Group justify="space-between">
                <Text fw={600}>Selisih</Text>
                <Text
                  fw={700}
                  size="lg"
                  c={
                    actualCash - expectedCash === 0
                      ? "green"
                      : actualCash - expectedCash > 0
                        ? "blue"
                        : "red"
                  }
                >
                  {actualCash - expectedCash >= 0 ? "+" : ""}
                  {formatCurrency(actualCash - expectedCash)}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>
                {actualCash - expectedCash === 0
                  ? "Pas! Tidak ada selisih"
                  : actualCash - expectedCash > 0
                    ? "Kelebihan kas"
                    : "Kekurangan kas"}
              </Text>
            </Paper>

            <Group mt="md" grow>
              <Button variant="outline" onClick={hideCloseShift}>
                Batal
              </Button>
              <Button
                color="red"
                leftSection={<IconDoorExit size={16} />}
                onClick={handleCloseShift}
              >
                Tutup Shift
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* ===== MODAL CASH IN / OUT ===== */}
      <Modal
        opened={cashTxModal}
        onClose={hideCashTx}
        title={
          <Text fw={600}>
            {cashTxType === "cash_in" ? "Cash In" : "Cash Out"}
          </Text>
        }
        centered
      >
        <Stack gap="sm">
          <NumberInput
            label="Jumlah"
            placeholder="Masukkan nominal"
            leftSection="Rp"
            thousandSeparator="."
            decimalSeparator=","
            min={1}
            value={cashTxAmount}
            onChange={(v) => setCashTxAmount(Number(v) || 0)}
          />

          <Select
            label="Kategori"
            placeholder="Pilih kategori"
            data={
              cashTxType === "cash_in"
                ? CASH_IN_CATEGORIES
                : CASH_OUT_CATEGORIES
            }
            value={cashTxCategory}
            onChange={(v) => setCashTxCategory(v || "")}
            searchable
          />

          <TextInput
            label="Keterangan"
            placeholder="Detail pengeluaran..."
            value={cashTxDescription}
            onChange={(e) => setCashTxDescription(e.currentTarget.value)}
          />

          <Group mt="md" grow>
            <Button variant="outline" onClick={hideCashTx}>
              Batal
            </Button>
            <Button
              color={cashTxType === "cash_in" ? "green" : "red"}
              disabled={cashTxAmount <= 0 || !cashTxCategory}
              onClick={handleCashTransaction}
            >
              Simpan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
