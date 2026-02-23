import { useState, useMemo } from "react";
import {
  Title,
  Text,
  Group,
  Stack,
  Card,
  Table,
  Select,
  Button,
  Badge,
  Modal,
  NumberInput,
  TextInput,
  Textarea,
  ActionIcon,
  Tabs,
  Divider,
  Box,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconTrash,
  IconCalendar,
  IconBuildingStore,
  IconArrowUpRight,
  IconArrowDownRight,
  IconCash,
  IconReceipt,
  IconSettings,
  IconLock,
} from "@tabler/icons-react";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import {
  useFinanceStore,
  type FinanceType,
  type FinanceCategory,
} from "../../../shared/stores/financeStore";
import { formatCurrency, formatDateTime } from "../../../shared/utils";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

type PeriodType = "today" | "this_week" | "this_month" | "this_year" | "custom";

// Unified row for the finance table
interface FinanceRow {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: FinanceType;
  source: "order" | "manual";
  branchId: string;
}

export default function ReportsPage() {
  const allOrders = useOrderStore((state) => state.orders);
  const branches = useBusinessStore((state) => state.branches);
  const user = useAuthStore((state) => state.user);
  const financeEntries = useFinanceStore((state) => state.entries);
  const addEntry = useFinanceStore((state) => state.addEntry);
  const deleteEntry = useFinanceStore((state) => state.deleteEntry);
  const getCategories = useFinanceStore((state) => state.getCategories);
  const getCategoryNames = useFinanceStore((state) => state.getCategoryNames);
  const addCategory = useFinanceStore((state) => state.addCategory);
  const deleteCategoryFromStore = useFinanceStore(
    (state) => state.deleteCategory,
  );

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("this_month");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf("month").toDate(),
    dayjs().endOf("month").toDate(),
  ]);

  // Modal add entry
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] =
    useDisclosure(false);
  const [addType, setAddType] = useState<FinanceType>("income");

  // Modal manage categories
  const [catModalOpened, { open: openCatModal, close: closeCatModal }] =
    useDisclosure(false);
  const [catModalType, setCatModalType] = useState<FinanceType>("income");
  const [newCatName, setNewCatName] = useState("");

  const entryForm = useForm({
    initialValues: {
      amount: 0,
      description: "",
      category: "",
      note: "",
    },
    validate: {
      amount: (v) => (v > 0 ? null : "Jumlah harus lebih dari 0"),
      description: (v) => (v.trim() ? null : "Keterangan wajib diisi"),
      category: (v) => (v.trim() ? null : "Kategori wajib diisi"),
    },
  });

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

  // Date filter helper
  const isInRange = (dateStr: string) => {
    if (!dateRange[0] || !dateRange[1]) return true;
    return dayjs(dateStr).isBetween(dateRange[0], dateRange[1], "day", "[]");
  };

  // Build unified rows
  const allRows: FinanceRow[] = useMemo(() => {
    const rows: FinanceRow[] = [];

    // 1. Income from orders (payments)
    allOrders.forEach((order) => {
      if (order.status === "cancelled" || order.status === "expired") return;
      (order.payments || []).forEach((payment) => {
        rows.push({
          id: `order-${payment.id}`,
          date: payment.createdAt,
          description: `Pembayaran ${order.orderNumber} — ${order.customerName}`,
          category: "Order",
          amount: payment.amount,
          type: "income",
          source: "order",
          branchId: order.branchId,
        });
      });
    });

    // 2. Manual entries
    financeEntries.forEach((entry) => {
      rows.push({
        id: entry.id,
        date: entry.createdAt,
        description: entry.description,
        category: entry.category,
        amount: entry.amount,
        type: entry.type,
        source: "manual",
        branchId: entry.branchId,
      });
    });

    return rows;
  }, [allOrders, financeEntries]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const matchBranch = selectedBranchId
        ? row.branchId === selectedBranchId
        : true;
      const matchDate = isInRange(row.date);
      return matchBranch && matchDate;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, selectedBranchId, dateRange]);

  const incomeRows = filteredRows
    .filter((r) => r.type === "income")
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  const expenseRows = filteredRows
    .filter((r) => r.type === "expense")
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  const totalIncome = incomeRows.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRows.reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Categories from store (defaults + custom)
  const incomeCategoryNames = getCategoryNames("income");
  const expenseCategoryNames = getCategoryNames("expense");
  const incomeCategories = getCategories("income");
  const expenseCategories = getCategories("expense");

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName, catModalType);
    setNewCatName("");
    notifications.show({
      title: "Kategori Ditambahkan",
      message: `"${newCatName.trim()}" berhasil ditambahkan`,
      color: "blue",
    });
  };

  const handleDeleteCategory = (cat: FinanceCategory) => {
    if (cat.isDefault) return;
    modals.openConfirmModal({
      title: "Hapus Kategori",
      children: (
        <Text size="sm">Yakin hapus kategori &quot;{cat.name}&quot;?</Text>
      ),
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteCategoryFromStore(cat.id);
        notifications.show({
          title: "Dihapus",
          message: `Kategori "${cat.name}" berhasil dihapus`,
          color: "gray",
        });
      },
    });
  };

  const openCategoryManager = (type: FinanceType) => {
    setCatModalType(type);
    setNewCatName("");
    openCatModal();
  };

  const handleAddEntry = (values: typeof entryForm.values) => {
    if (!user) return;
    addEntry({
      type: addType,
      amount: values.amount,
      description: values.description.trim(),
      category: values.category,
      branchId: selectedBranchId || user.branchId,
      createdBy: user.id,
      note: values.note.trim() || undefined,
    });
    notifications.show({
      title:
        addType === "income"
          ? "Pemasukan Ditambahkan"
          : "Pengeluaran Ditambahkan",
      message: `${formatCurrency(values.amount)} — ${values.description}`,
      color: addType === "income" ? "green" : "red",
    });
    entryForm.reset();
    closeAddModal();
  };

  const handleDeleteEntry = (id: string, description: string) => {
    modals.openConfirmModal({
      title: "Hapus Transaksi",
      children: (
        <Text size="sm">Yakin hapus transaksi &quot;{description}&quot;?</Text>
      ),
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteEntry(id);
        notifications.show({
          title: "Dihapus",
          message: "Transaksi berhasil dihapus",
          color: "gray",
        });
      },
    });
  };

  const openAddIncome = () => {
    setAddType("income");
    entryForm.reset();
    openAddModal();
  };

  const openAddExpense = () => {
    setAddType("expense");
    entryForm.reset();
    openAddModal();
  };

  const getBranchName = (branchId: string) =>
    branches.find((b) => b.id === branchId)?.name || "-";

  // Render a finance table
  const renderTable = (rows: FinanceRow[], type: FinanceType) => {
    if (rows.length === 0) {
      return (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            Belum ada {type === "income" ? "pemasukan" : "pengeluaran"} di
            periode ini
          </Text>
        </Card>
      );
    }

    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tanggal</Table.Th>
              <Table.Th>Keterangan</Table.Th>
              <Table.Th>Kategori</Table.Th>
              <Table.Th>Cabang</Table.Th>
              <Table.Th ta="right">Jumlah</Table.Th>
              <Table.Th w={60}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Text size="sm">{formatDateTime(row.date)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{row.description}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size="sm"
                    variant="light"
                    color={
                      type === "income"
                        ? row.source === "order"
                          ? "blue"
                          : "teal"
                        : "orange"
                    }
                  >
                    {row.category}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {getBranchName(row.branchId)}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text
                    size="sm"
                    fw={600}
                    c={type === "income" ? "green" : "red"}
                  >
                    {type === "income" ? "+" : "-"}
                    {formatCurrency(row.amount)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {row.source === "manual" && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDeleteEntry(row.id, row.description)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    );
  };

  return (
    <>
      {/* Header */}
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2}>Laporan Keuangan</Title>
        <Group>
          <Button
            leftSection={<IconArrowUpRight size={16} />}
            variant="light"
            color="green"
            onClick={openAddIncome}
          >
            Tambah Pemasukan
          </Button>
          <Button
            leftSection={<IconArrowDownRight size={16} />}
            variant="light"
            color="red"
            onClick={openAddExpense}
          >
            Tambah Pengeluaran
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
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
            leftSection={<IconCalendar size={16} />}
            style={{ width: 200 }}
          />
          {periodType === "custom" && (
            <DatePickerInput
              type="range"
              placeholder="Pilih tanggal"
              value={dateRange}
              onChange={(value) =>
                setDateRange(value as unknown as [Date | null, Date | null])
              }
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
            style={{ width: 220 }}
          />
        </Group>
      </Card>

      {/* Tabs Content */}
      <Tabs defaultValue="income" variant="outline" radius="md" mb="xl">
        <Tabs.List mb="md">
          <Tabs.Tab
            value="income"
            leftSection={<IconArrowUpRight size={16} />}
            color="green"
          >
            Pemasukan ({incomeRows.length})
          </Tabs.Tab>
          <Tabs.Tab
            value="expense"
            leftSection={<IconArrowDownRight size={16} />}
            color="red"
          >
            Pengeluaran ({expenseRows.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* ===== TAB PEMASUKAN ===== */}
        <Tabs.Panel value="income">
          {renderTable(incomeRows, "income")}
        </Tabs.Panel>

        {/* ===== TAB PENGELUARAN ===== */}
        <Tabs.Panel value="expense">
          {renderTable(expenseRows, "expense")}
        </Tabs.Panel>
      </Tabs>

      {/* ===== RINGKASAN TOTAL ===== */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={600} mb="md" size="lg">
          Ringkasan Keuangan
        </Text>
        <Divider mb="md" />

        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <Box
                w={10}
                h={10}
                style={{ borderRadius: "50%", backgroundColor: "#40c057" }}
              />
              <Text>Total Pemasukan</Text>
            </Group>
            <Group gap="xs">
              <IconArrowUpRight size={18} color="#40c057" />
              <Text fw={700} size="lg" c="green">
                {formatCurrency(totalIncome)}
              </Text>
            </Group>
          </Group>

          <Group justify="space-between">
            <Group gap="xs">
              <Box
                w={10}
                h={10}
                style={{ borderRadius: "50%", backgroundColor: "#fa5252" }}
              />
              <Text>Total Pengeluaran</Text>
            </Group>
            <Group gap="xs">
              <IconArrowDownRight size={18} color="#fa5252" />
              <Text fw={700} size="lg" c="red">
                {formatCurrency(totalExpense)}
              </Text>
            </Group>
          </Group>

          <Divider variant="dashed" />

          <Group justify="space-between">
            <Group gap="xs">
              <IconCash size={20} />
              <Text fw={700} size="lg">
                Laba / Rugi Bersih
              </Text>
            </Group>
            <Text fw={800} size="xl" c={netProfit >= 0 ? "teal" : "red"}>
              {netProfit >= 0 ? "+" : ""}
              {formatCurrency(netProfit)}
            </Text>
          </Group>
        </Stack>
      </Card>

      {/* ===== MODAL TAMBAH PEMASUKAN / PENGELUARAN ===== */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title={
          <Group gap="xs">
            <IconReceipt size={20} />
            <Text fw={600}>
              Tambah {addType === "income" ? "Pemasukan" : "Pengeluaran"}
            </Text>
          </Group>
        }
        centered
      >
        <form onSubmit={entryForm.onSubmit(handleAddEntry)}>
          <Stack gap="sm">
            <NumberInput
              label="Jumlah (Rp)"
              placeholder="Masukkan jumlah"
              leftSection="Rp"
              thousandSeparator="."
              decimalSeparator=","
              min={1}
              required
              {...entryForm.getInputProps("amount")}
            />

            <TextInput
              label="Keterangan"
              placeholder={
                addType === "income"
                  ? "Contoh: Pembayaran jasa desain"
                  : "Contoh: Beli kertas A3"
              }
              required
              {...entryForm.getInputProps("description")}
            />

            <Group align="flex-end" gap="xs">
              <Select
                label="Kategori"
                placeholder="Pilih kategori"
                data={
                  addType === "income"
                    ? incomeCategoryNames
                    : expenseCategoryNames
                }
                required
                searchable
                style={{ flex: 1 }}
                {...entryForm.getInputProps("category")}
              />
              <ActionIcon
                variant="light"
                size="lg"
                mb={1}
                onClick={() => openCategoryManager(addType)}
                title="Kelola Kategori"
              >
                <IconSettings size={18} />
              </ActionIcon>
            </Group>

            {branches.length > 1 && (
              <Select
                label="Cabang"
                data={branches.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
                defaultValue={user?.branchId}
                placeholder="Pilih cabang"
              />
            )}

            <Textarea
              label="Catatan (opsional)"
              placeholder="Detail tambahan..."
              rows={2}
              {...entryForm.getInputProps("note")}
            />

            <Group mt="md" grow>
              <Button variant="outline" onClick={closeAddModal}>
                Batal
              </Button>
              <Button
                type="submit"
                color={addType === "income" ? "green" : "red"}
                leftSection={<IconPlus size={16} />}
              >
                Simpan {addType === "income" ? "Pemasukan" : "Pengeluaran"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* ===== MODAL KELOLA KATEGORI ===== */}
      <Modal
        opened={catModalOpened}
        onClose={closeCatModal}
        title={
          <Text fw={600}>
            Kelola Kategori{" "}
            {catModalType === "income" ? "Pemasukan" : "Pengeluaran"}
          </Text>
        }
        centered
      >
        <Stack gap="md">
          {/* Tambah kategori baru */}
          <Group gap="xs">
            <TextInput
              placeholder="Nama kategori baru..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconPlus size={14} />}
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              size="sm"
            >
              Tambah
            </Button>
          </Group>

          <Divider />

          {/* Daftar kategori */}
          <Stack gap="xs">
            {(catModalType === "income"
              ? incomeCategories
              : expenseCategories
            ).map((cat) => (
              <Group key={cat.id} justify="space-between">
                <Group gap="xs">
                  <Text size="sm">{cat.name}</Text>
                  {cat.isDefault && (
                    <Badge
                      size="xs"
                      variant="light"
                      color="gray"
                      leftSection={<IconLock size={10} />}
                    >
                      Default
                    </Badge>
                  )}
                </Group>
                {!cat.isDefault && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                )}
              </Group>
            ))}
          </Stack>
        </Stack>
      </Modal>
    </>
  );
}
