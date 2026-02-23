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
} from "@tabler/icons-react";
import type { Order } from "../../../shared/types";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
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

  const outletBranches = branches.filter((b) => b.type === "outlet");

  const totalOutstanding = payableOrders.reduce(
    (sum, o) => sum + o.remainingPayment,
    0,
  );

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Pembayaran</Title>
        <Badge size="lg" variant="light" color="orange">
          {payableOrders.length} order menunggu • Outstanding:{" "}
          {formatCurrency(totalOutstanding)}
        </Badge>
      </Group>

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
    </Stack>
  );
}
