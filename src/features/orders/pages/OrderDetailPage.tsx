import { useState } from "react";
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
  Modal,
  NumberInput,
  Select,
  Textarea,
  Paper,
  Progress,
  Timeline,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCash,
  IconCreditCard,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconArrowRight,
  IconHistory,
  IconPrinter,
} from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useUserStore } from "../../../shared/stores/userStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { formatCurrency, formatDateTime } from "../../../shared/utils";
import { ROUTES } from "../../../core/routes";
import {
  MIN_DP_PERCENT,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  STATUS_TRANSITIONS,
} from "../../../shared/constants";
import type {
  DpStatus,
  PaymentRecord,
  OrderStatus,
} from "../../../shared/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = useOrderStore((state) => state.getOrderById(id!));
  const addPayment = useOrderStore((state) => state.addPayment);
  const isProductionReady = useOrderStore((state) => state.isProductionReady);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const canTransition = useOrderStore((state) => state.canTransition);
  const getStatusLogs = useOrderStore((state) => state.getStatusLogs);
  const users = useUserStore((state) => state.users);
  const currentUser = useAuthStore((state) => state.user);
  const branches = useBusinessStore((state) => state.branches);

  const [paymentOpened, { open: openPayment, close: closePayment }] =
    useDisclosure(false);

  const paymentForm = useForm({
    initialValues: {
      amount: 0,
      method: "cash",
      note: "",
    },
    validate: {
      amount: (value) => {
        if (value <= 0) return "Jumlah harus lebih dari 0";
        return null;
      },
    },
  });

  // Modal kembalian
  const [
    changeModalOpened,
    { open: openChangeModal, close: closeChangeModal },
  ] = useDisclosure(false);
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    paidAmount: number;
    remaining: number;
    method: string;
  } | null>(null);

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
  const payments: PaymentRecord[] = order.payments || [];
  const productionReady = isProductionReady(order.id);
  const dpStatus: DpStatus = order.dpStatus || "none";
  const minDpAmount =
    order.total * ((order.minDpPercent || MIN_DP_PERCENT) / 100);
  const paymentProgress =
    order.total > 0 ? (order.paidAmount / order.total) * 100 : 0;
  const statusLogs = getStatusLogs(order.id);

  // Get allowed next statuses for transition buttons
  const allowedTransitions: OrderStatus[] = (
    STATUS_TRANSITIONS[order.status] || []
  ).filter((s: string) =>
    canTransition(order.id, s as OrderStatus),
  ) as OrderStatus[];

  const getDpStatusColor = (s: DpStatus) => {
    switch (s) {
      case "paid":
        return "green";
      case "sufficient":
        return "teal";
      case "insufficient":
        return "red";
      default:
        return "gray";
    }
  };

  const getDpStatusLabel = (s: DpStatus) => {
    switch (s) {
      case "paid":
        return "Lunas";
      case "sufficient":
        return "DP Cukup";
      case "insufficient":
        return "DP Kurang";
      case "none":
        return "Belum Bayar";
      default:
        return s;
    }
  };

  const handlePayment = (values: typeof paymentForm.values) => {
    if (!currentUser || !order) return;

    const remaining = order.remainingPayment;
    const actualPaid = Math.min(values.amount, remaining);

    addPayment(
      order.id,
      actualPaid,
      values.method,
      currentUser.id,
      values.note || undefined,
    );

    // Simpan info untuk modal kembalian
    setLastPaymentInfo({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      paidAmount: values.amount,
      remaining,
      method: values.method,
    });

    paymentForm.reset();
    closePayment();

    // Buka modal kembalian
    openChangeModal();
  };

  const handlePayFull = () => {
    if (!order) return;
    paymentForm.setFieldValue("amount", order.remainingPayment);
  };

  const handleStatusTransition = (toStatus: OrderStatus) => {
    if (!currentUser) return;
    const success = updateOrderStatus(order.id, toStatus, currentUser.id);
    if (success) {
      notifications.show({
        title: "Status Diperbarui",
        message: `Order ${order.orderNumber} → ${ORDER_STATUS_LABELS[toStatus] || toStatus}`,
        color: ORDER_STATUS_COLORS[toStatus] || "blue",
      });
    } else {
      notifications.show({
        title: "Gagal",
        message: "Transisi status tidak diizinkan",
        color: "red",
      });
    }
  };

  return (
    <>
      <Group mb="xl">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={() => navigate(ROUTES.ORDERS)}
        >
          Kembali
        </Button>
        <Button
          leftSection={<IconPrinter size={16} />}
          variant="light"
          onClick={() =>
            navigate(ROUTES.ORDER_INVOICE.replace(":id", order.id))
          }
        >
          Cetak Nota
        </Button>
      </Group>

      <Grid>
        {/* Left Column: Order Detail */}
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
                <Group gap="xs">
                  <Badge
                    size="lg"
                    color={ORDER_STATUS_COLORS[order.status] || "gray"}
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </Badge>
                  {order.paymentType === "dp" && (
                    <Badge
                      size="lg"
                      color={getDpStatusColor(dpStatus)}
                      variant="outline"
                    >
                      {getDpStatusLabel(dpStatus)}
                    </Badge>
                  )}
                </Group>
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
                      align="flex-start"
                    >
                      <div style={{ flex: 1 }}>
                        <Text fw={500}>{item.name}</Text>
                        <Text size="sm" c="dimmed">
                          {formatCurrency(item.price)} x {item.quantity}
                        </Text>
                        {item.width && item.height && (
                          <Text size="xs" c="dimmed">
                            Ukuran: {item.width}×{item.height}m ={" "}
                            {item.area?.toFixed(2)}m²
                          </Text>
                        )}
                        {item.material && (
                          <Text size="xs" c="dimmed">
                            Material: {item.material}
                          </Text>
                        )}
                        {item.finishing && item.finishing.length > 0 && (
                          <Text size="xs" c="dimmed">
                            Finishing: {item.finishing.join(", ")}
                          </Text>
                        )}
                        {item.originalPrice &&
                          item.originalPrice !== item.price && (
                            <Text size="xs" c="red" td="line-through">
                              {formatCurrency(item.originalPrice)}
                              {item.discountPercent
                                ? ` (-${item.discountPercent}%)`
                                : ""}
                            </Text>
                          )}
                        {item.notes && (
                          <Text size="sm" c="dimmed" mt="xs" fs="italic">
                            Catatan: {item.notes}
                          </Text>
                        )}
                      </div>
                      <Text fw={700}>{formatCurrency(item.subtotal)}</Text>
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

        {/* Right Column: Summary, Payment, Info */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Summary Card */}
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
                  <Text>PPN:</Text>
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

            {/* Payment Status Card */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="sm" fw={500} c="dimmed" mb="md">
                STATUS PEMBAYARAN
              </Text>
              <Stack gap="sm">
                {/* Progress bar */}
                <div>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">
                      Terbayar
                    </Text>
                    <Text size="xs" fw={600}>
                      {Math.round(paymentProgress)}%
                    </Text>
                  </Group>
                  <Progress
                    value={paymentProgress}
                    color={
                      paymentProgress >= 100
                        ? "green"
                        : paymentProgress >=
                            (order.minDpPercent || MIN_DP_PERCENT)
                          ? "teal"
                          : "orange"
                    }
                    size="lg"
                    radius="xl"
                  />
                  {order.paymentType === "dp" && (
                    <Progress.Root size={4} mt={2} radius="xl">
                      <Progress.Section
                        value={order.minDpPercent || MIN_DP_PERCENT}
                        color="transparent"
                      />
                    </Progress.Root>
                  )}
                </div>

                <Group justify="space-between">
                  <Text size="sm">Sudah dibayar:</Text>
                  <Text size="sm" fw={600} c="green">
                    {formatCurrency(order.paidAmount)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Sisa tagihan:</Text>
                  <Text
                    size="sm"
                    fw={600}
                    c={order.remainingPayment > 0 ? "red" : "green"}
                  >
                    {order.remainingPayment > 0
                      ? formatCurrency(order.remainingPayment)
                      : "—"}
                  </Text>
                </Group>

                {order.paymentType === "dp" && (
                  <>
                    <Divider />
                    <Group justify="space-between">
                      <Text size="sm">Tipe:</Text>
                      <Badge size="sm" variant="light">
                        DP (Uang Muka)
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">
                        DP Minimum ({order.minDpPercent || MIN_DP_PERCENT}%):
                      </Text>
                      <Text size="sm" fw={500}>
                        {formatCurrency(minDpAmount)}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Status DP:</Text>
                      <Badge color={getDpStatusColor(dpStatus)} size="sm">
                        {getDpStatusLabel(dpStatus)}
                      </Badge>
                    </Group>

                    {/* Production readiness indicator */}
                    <Paper
                      p="xs"
                      bg={productionReady ? "teal.0" : "red.0"}
                      style={{ borderRadius: 8 }}
                    >
                      <Group gap="xs">
                        {productionReady ? (
                          <IconCheck
                            size={16}
                            color="var(--mantine-color-teal-6)"
                          />
                        ) : (
                          <IconAlertTriangle
                            size={16}
                            color="var(--mantine-color-red-6)"
                          />
                        )}
                        <Text
                          size="xs"
                          fw={500}
                          c={productionReady ? "teal.7" : "red.7"}
                        >
                          {productionReady
                            ? "Produksi siap dimulai"
                            : `DP kurang ${formatCurrency(minDpAmount - order.paidAmount)} untuk mulai produksi`}
                        </Text>
                      </Group>
                    </Paper>
                  </>
                )}

                {order.paymentMethod && (
                  <Group justify="space-between">
                    <Text size="sm">Metode:</Text>
                    <Text size="sm" fw={500} tt="capitalize">
                      {order.paymentMethod}
                    </Text>
                  </Group>
                )}

                {/* Pelunasan Button - only for kasir/owner */}
                {order.remainingPayment > 0 &&
                  order.paymentStatus !== "paid" &&
                  currentUser &&
                  (currentUser.role === "kasir" ||
                    currentUser.role === "owner") && (
                    <Button
                      fullWidth
                      mt="sm"
                      leftSection={<IconCash size={18} />}
                      color="green"
                      onClick={openPayment}
                    >
                      Terima Pembayaran / Pelunasan
                    </Button>
                  )}
              </Stack>
            </Card>

            {/* Payment History Card */}
            {payments.length > 0 && (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed" mb="md">
                  RIWAYAT PEMBAYARAN ({payments.length})
                </Text>
                <Timeline
                  active={payments.length - 1}
                  bulletSize={24}
                  lineWidth={2}
                >
                  {payments.map((payment, idx) => {
                    const payer = users.find((u) => u.id === payment.paidBy);
                    return (
                      <Timeline.Item
                        key={payment.id || idx}
                        bullet={
                          <ThemeIcon
                            size={24}
                            radius="xl"
                            color={
                              idx === payments.length - 1 ? "green" : "gray"
                            }
                          >
                            <IconCreditCard size={12} />
                          </ThemeIcon>
                        }
                        title={
                          <Text size="sm" fw={600}>
                            {formatCurrency(payment.amount)}
                          </Text>
                        }
                      >
                        <Text size="xs" c="dimmed">
                          {payment.method ? payment.method.toUpperCase() : "-"}
                          {payer ? ` • oleh ${payer.name}` : ""}
                        </Text>
                        {payment.note && (
                          <Text size="xs" c="dimmed" fs="italic">
                            {payment.note}
                          </Text>
                        )}
                        <Text size="xs" c="dimmed" mt={2}>
                          {formatDateTime(payment.createdAt)}
                        </Text>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </Card>
            )}

            {/* Info Card */}
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
                {order.deadline && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Deadline
                    </Text>
                    <Group gap="xs">
                      <IconClock size={14} />
                      <Text fw={500}>{formatDateTime(order.deadline)}</Text>
                    </Group>
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

            {/* Status Transition Controls */}
            {allowedTransitions.length > 0 && (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed" mb="md">
                  UBAH STATUS
                </Text>
                <Stack gap="xs">
                  {allowedTransitions.map((toStatus) => {
                    const isSettledBlocked =
                      toStatus === "settled" && order.remainingPayment > 0;
                    return (
                      <Button
                        key={toStatus}
                        variant={toStatus === "cancelled" ? "outline" : "light"}
                        color={ORDER_STATUS_COLORS[toStatus] || "gray"}
                        size="sm"
                        leftSection={
                          toStatus === "cancelled" ? (
                            <IconAlertTriangle size={16} />
                          ) : (
                            <IconArrowRight size={16} />
                          )
                        }
                        onClick={() => handleStatusTransition(toStatus)}
                        fullWidth
                        disabled={isSettledBlocked}
                        title={
                          isSettledBlocked
                            ? "Tidak bisa settle — masih ada sisa tagihan"
                            : undefined
                        }
                      >
                        → {ORDER_STATUS_LABELS[toStatus] || toStatus}
                        {isSettledBlocked ? " (sisa tagihan)" : ""}
                      </Button>
                    );
                  })}
                </Stack>
              </Card>
            )}

            {/* Status Log Timeline */}
            {statusLogs.length > 0 && (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed" mb="md">
                  <Group gap="xs">
                    <IconHistory size={16} />
                    LOG STATUS ({statusLogs.length})
                  </Group>
                </Text>
                <Timeline
                  active={statusLogs.length - 1}
                  bulletSize={24}
                  lineWidth={2}
                >
                  {statusLogs.map((log, idx) => {
                    const changedByUser = users.find(
                      (u) => u.id === log.changedBy,
                    );
                    return (
                      <Timeline.Item
                        key={log.id || idx}
                        bullet={
                          <ThemeIcon
                            size={24}
                            radius="xl"
                            color={ORDER_STATUS_COLORS[log.toStatus] || "gray"}
                          >
                            <IconCheck size={12} />
                          </ThemeIcon>
                        }
                        title={
                          <Text size="sm" fw={600}>
                            {log.fromStatus
                              ? `${ORDER_STATUS_LABELS[log.fromStatus] || log.fromStatus} → ${ORDER_STATUS_LABELS[log.toStatus] || log.toStatus}`
                              : ORDER_STATUS_LABELS[log.toStatus] ||
                                log.toStatus}
                          </Text>
                        }
                      >
                        {changedByUser && (
                          <Text size="xs" c="dimmed">
                            oleh {changedByUser.name}
                          </Text>
                        )}
                        {log.note && (
                          <Text size="xs" c="dimmed" fs="italic">
                            {log.note}
                          </Text>
                        )}
                        <Text size="xs" c="dimmed" mt={2}>
                          {formatDateTime(log.createdAt)}
                        </Text>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Pelunasan Modal */}
      <Modal
        opened={paymentOpened}
        onClose={closePayment}
        title="Terima Pembayaran"
        centered
      >
        <form onSubmit={paymentForm.onSubmit(handlePayment)}>
          <Stack gap="md">
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <Text size="sm">Sisa Tagihan:</Text>
                <Text size="lg" fw={700} c="red">
                  {formatCurrency(order.remainingPayment)}
                </Text>
              </Group>
            </Paper>

            <NumberInput
              label="Jumlah Pembayaran"
              placeholder="Masukkan jumlah"
              leftSection="Rp"
              thousandSeparator="."
              decimalSeparator=","
              min={1}
              size="lg"
              required
              {...paymentForm.getInputProps("amount")}
            />

            {/* Preview kembalian real-time (cash only) */}
            {paymentForm.values.method === "cash" &&
              paymentForm.values.amount > order.remainingPayment && (
                <Paper p="sm" radius="sm" bg="teal.0">
                  <Group justify="space-between">
                    <Text size="sm" fw={600} c="teal.7">
                      Kembalian
                    </Text>
                    <Text size="lg" fw={800} c="teal.7">
                      {formatCurrency(
                        paymentForm.values.amount - order.remainingPayment,
                      )}
                    </Text>
                  </Group>
                </Paper>
              )}

            <Button
              variant="light"
              size="xs"
              onClick={handlePayFull}
              color="green"
            >
              Lunasi Semua ({formatCurrency(order.remainingPayment)})
            </Button>

            <Select
              label="Metode Pembayaran"
              data={[
                { value: "cash", label: "Tunai (Cash)" },
                { value: "transfer", label: "Transfer Bank" },
                { value: "qris", label: "QRIS" },
                { value: "e-wallet", label: "E-Wallet (OVO/GoPay/Dana)" },
              ]}
              size="lg"
              {...paymentForm.getInputProps("method")}
            />

            <Textarea
              label="Catatan (opsional)"
              placeholder="Keterangan pembayaran"
              rows={2}
              {...paymentForm.getInputProps("note")}
            />

            <Group mt="md" grow>
              <Button variant="outline" onClick={closePayment}>
                Batal
              </Button>
              <Button
                type="submit"
                color="green"
                leftSection={<IconCash size={18} />}
              >
                Konfirmasi Pembayaran
              </Button>
            </Group>
          </Stack>
        </form>
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
            const {
              orderId,
              orderNumber,
              customerName,
              paidAmount,
              remaining,
              method,
            } = lastPaymentInfo;
            const actualPaid = Math.min(paidAmount, remaining);
            const change =
              method === "cash" ? Math.max(paidAmount - remaining, 0) : 0;
            const isFullyPaid = paidAmount >= remaining;

            return (
              <Stack gap={0}>
                {/* Header hijau */}
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
                    {orderNumber} · {customerName}
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
                        navigate(ROUTES.ORDER_INVOICE.replace(":id", orderId));
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
    </>
  );
}
