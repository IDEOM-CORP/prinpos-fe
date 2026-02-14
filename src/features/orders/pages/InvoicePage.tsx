import { useParams, useNavigate } from "react-router-dom";
import {
  Title,
  Text,
  Table,
  Group,
  Stack,
  Divider,
  Button,
  Paper,
  Box,
  Badge,
} from "@mantine/core";
import { IconPrinter, IconArrowLeft } from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { useUserStore } from "../../../shared/stores/userStore";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../../shared/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../../../shared/constants";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = useOrderStore((s) => s.getOrderById(id || ""));
  const businesses = useBusinessStore((s) => s.businesses);
  const branches = useBusinessStore((s) => s.branches);
  const users = useUserStore((s) => s.users);

  if (!order) {
    return (
      <Stack align="center" mt="xl">
        <Text>Order tidak ditemukan</Text>
        <Button variant="light" onClick={() => navigate(-1)}>
          Kembali
        </Button>
      </Stack>
    );
  }

  const business = businesses.find((b) => b.id === order.businessId);
  const branch = branches.find((b) => b.id === order.branchId);
  const createdByUser = users.find((u) => u.id === order.createdBy);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          nav, header, aside, .no-print,
          [class*="AppShell"], [class*="Navbar"], [class*="Header"] {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
          }
          .print-area {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Action buttons (hidden on print) */}
      <Group mb="md" className="no-print">
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate(-1)}
        >
          Kembali
        </Button>
        <Button
          leftSection={<IconPrinter size={16} />}
          onClick={() => window.print()}
        >
          Cetak Nota
        </Button>
      </Group>

      {/* Invoice content */}
      <Paper p="xl" withBorder className="print-area" maw={800} mx="auto">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={3}>{business?.name || "PrinPOS"}</Title>
            <Text size="sm" c="dimmed">
              {business?.address}
            </Text>
            <Text size="sm" c="dimmed">
              Telp: {business?.phone}
            </Text>
            <Text size="sm" c="dimmed">
              {business?.email}
            </Text>
          </Box>
          <Box ta="right">
            <Title order={4} c="aqua">
              INVOICE
            </Title>
            <Text size="sm" fw={600}>
              {order.orderNumber}
            </Text>
            <Text size="xs" c="dimmed">
              Tanggal: {formatDate(order.createdAt)}
            </Text>
            <Badge
              color={ORDER_STATUS_COLORS[order.status]}
              variant="light"
              mt="xs"
            >
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </Box>
        </Group>

        <Divider my="md" />

        {/* Customer & order info */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Pelanggan
            </Text>
            <Text fw={500}>{order.customerName}</Text>
            {order.customerPhone && (
              <Text size="sm" c="dimmed">
                Telp: {order.customerPhone}
              </Text>
            )}
          </Box>
          <Box ta="right">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Info Order
            </Text>
            <Text size="sm">Cabang: {branch?.name || "-"}</Text>
            <Text size="sm">Dibuat oleh: {createdByUser?.name || "-"}</Text>
            {order.deadline && (
              <Text size="sm" c="red">
                Deadline: {formatDate(order.deadline)}
              </Text>
            )}
          </Box>
        </Group>

        <Divider my="md" />

        {/* Items table */}
        <Table striped withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={30}>#</Table.Th>
              <Table.Th>Produk / Spesifikasi</Table.Th>
              <Table.Th ta="center">Qty</Table.Th>
              <Table.Th ta="right">Harga</Table.Th>
              <Table.Th ta="right">Subtotal</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {order.items.map((item, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>{idx + 1}</Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {item.name}
                  </Text>
                  <Stack gap={1}>
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
                    {item.discountPercent && item.discountPercent > 0 && (
                      <Text size="xs" c="red">
                        Diskon: {item.discountPercent}%
                      </Text>
                    )}
                    {item.notes && (
                      <Text size="xs" c="dimmed" fs="italic">
                        {item.notes}
                      </Text>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td ta="center">{item.quantity}</Table.Td>
                <Table.Td ta="right">{formatCurrency(item.price)}</Table.Td>
                <Table.Td ta="right" fw={500}>
                  {formatCurrency(item.subtotal)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {/* Totals */}
        <Box mt="md">
          <Group justify="flex-end">
            <Box w={280}>
              <Group justify="space-between" mb={4}>
                <Text size="sm">Subtotal</Text>
                <Text size="sm">{formatCurrency(order.subtotal)}</Text>
              </Group>
              {order.tax > 0 && (
                <Group justify="space-between" mb={4}>
                  <Text size="sm">PPN</Text>
                  <Text size="sm">{formatCurrency(order.tax)}</Text>
                </Group>
              )}
              <Divider my={4} />
              <Group justify="space-between">
                <Text fw={700}>Total</Text>
                <Text fw={700} size="lg">
                  {formatCurrency(order.total)}
                </Text>
              </Group>
              <Divider my={4} />
              <Group justify="space-between">
                <Text size="sm" c="green">
                  Sudah Dibayar
                </Text>
                <Text size="sm" c="green">
                  {formatCurrency(order.paidAmount)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="red" fw={600}>
                  Sisa Tagihan
                </Text>
                <Text size="sm" c="red" fw={600}>
                  {formatCurrency(order.remainingPayment)}
                </Text>
              </Group>
            </Box>
          </Group>
        </Box>

        {/* Payment history */}
        {order.payments && order.payments.length > 0 && (
          <>
            <Divider
              my="md"
              label="Riwayat Pembayaran"
              labelPosition="center"
            />
            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tanggal</Table.Th>
                  <Table.Th>Metode</Table.Th>
                  <Table.Th ta="right">Jumlah</Table.Th>
                  <Table.Th>Catatan</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {order.payments.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Text size="xs">{formatDateTime(p.createdAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" tt="uppercase">
                        {p.method}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" fw={500} c="green">
                        {formatCurrency(p.amount)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {p.note || "-"}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}

        {/* Notes */}
        {order.notes && (
          <>
            <Divider my="md" />
            <Text size="sm" c="dimmed">
              <Text span fw={600}>
                Catatan:
              </Text>{" "}
              {order.notes}
            </Text>
          </>
        )}

        {/* Footer */}
        <Divider my="md" />
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Dicetak: {formatDateTime(new Date().toISOString())}
          </Text>
          <Text size="xs" c="dimmed">
            {business?.name} — Terima kasih atas kepercayaan Anda
          </Text>
        </Group>
      </Paper>
    </>
  );
}
