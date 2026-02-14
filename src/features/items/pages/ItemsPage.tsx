import { useState, useMemo } from "react";
import {
  Title,
  Button,
  Table,
  Group,
  TextInput,
  Modal,
  Stack,
  NumberInput,
  Select,
  Textarea,
  Card,
  Text,
  Badge,
  ActionIcon,
  SegmentedControl,
  Paper,
  Switch,
  MultiSelect,
  Divider,
  ScrollArea,
  Tooltip,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRulerMeasure,
  IconTag,
  IconChartBar,
  IconSettings,
  IconBarcode,
  IconClock,
  IconReceipt,
  IconPercentage,
} from "@tabler/icons-react";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { useFinishingStore } from "../../../shared/stores/finishingStore";
import { useMaterialStore } from "../../../shared/stores/materialStore";
import { formatCurrency } from "../../../shared/utils";
import { UNIT_OPTIONS, AREA_UNIT_OPTIONS } from "../../../shared/constants";
import { useCategoryStore } from "../../../shared/stores/categoryStore";
import type { TierPrice, PricingModel } from "../../../shared/types";

interface FormValues {
  name: string;
  sku: string;
  description: string;
  price: number;
  pricePerSqm: number;
  costPrice: number;
  pricingModel: PricingModel;
  category: string;
  imageUrl: string;
  unit: string;
  areaUnit: "m" | "cm";
  defaultWidth: number;
  defaultHeight: number;
  tiers: TierPrice[];
  finishingIds: string[];
  materialIds: string[];
  minOrder: number;
  setupFee: number;
  maxDiscount: number;
  productionDays: number;
  notes: string;
  isActive: boolean;
}

export default function ItemsPage() {
  const items = useItemStore((state) => state.items);
  const addItem = useItemStore((state) => state.addItem);
  const updateItem = useItemStore((state) => state.updateItem);
  const deleteItem = useItemStore((state) => state.deleteItem);
  const user = useAuthStore((state) => state.user);
  const categories = useCategoryStore((state) => state.categories);
  const categoryNames = categories.map((c) => c.name);
  const finishings = useFinishingStore((state) => state.finishings);
  const materials = useMaterialStore((state) => state.materials);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPricing, setFilterPricing] = useState<string | null>(null);

  // Finishing/material select data from stores
  const finishingSelectData = finishings
    .filter((f) => f.isActive)
    .map((f) => ({
      value: f.id,
      label: `${f.name} (+${formatCurrency(f.price)})`,
    }));
  const materialSelectData = materials
    .filter((m) => m.isActive)
    .map((m) => ({ value: m.id, label: m.name }));

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      sku: "",
      description: "",
      price: 0,
      pricePerSqm: 0,
      costPrice: 0,
      pricingModel: "fixed",
      category: "",
      imageUrl: "",
      unit: "pcs",
      areaUnit: "m",
      defaultWidth: 0,
      defaultHeight: 0,
      tiers: [{ minQty: 1, maxQty: 10, price: 0 }],
      finishingIds: [],
      materialIds: [],
      minOrder: 1,
      setupFee: 0,
      maxDiscount: 100,
      productionDays: 1,
      notes: "",
      isActive: true,
    },
    validate: {
      name: (value) => (value.trim() ? null : "Nama wajib diisi"),
      price: (value, values) =>
        values.pricingModel === "fixed" && value <= 0
          ? "Harga harus lebih dari 0"
          : null,
      pricePerSqm: (value, values) =>
        values.pricingModel === "area" && value <= 0
          ? "Harga per m² harus lebih dari 0"
          : null,
      category: (value) => (value ? null : "Kategori wajib dipilih"),
      unit: (value) => (value ? null : "Satuan wajib dipilih"),
      tiers: (value, values) => {
        if (values.pricingModel !== "tiered") return null;
        if (value.length === 0) return "Minimal 1 tier harga";
        const hasInvalidPrice = value.some((t) => t.price <= 0);
        if (hasInvalidPrice) return "Semua tier harus memiliki harga > 0";
        return null;
      },
    },
  });

  const filteredItems = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || item.category === filterCategory;
    const matchPricing = !filterPricing || item.pricingModel === filterPricing;
    return matchSearch && matchCategory && matchPricing;
  });

  // --- SKU auto-generate ---
  const generateSku = () => {
    const cat = form.values.category || "PRD";
    const prefix = cat.substring(0, 3).toUpperCase().replace(/\s/g, "");
    const suffix = String(Date.now()).slice(-4);
    form.setFieldValue("sku", `${prefix}-${suffix}`);
  };

  // --- Margin calculation ---
  const marginPercent = useMemo(() => {
    const basePrice =
      form.values.pricingModel === "area"
        ? form.values.pricePerSqm
        : form.values.pricingModel === "tiered" && form.values.tiers.length > 0
          ? form.values.tiers[0].price
          : form.values.price;
    if (!basePrice || !form.values.costPrice || form.values.costPrice <= 0)
      return null;
    return Math.round(((basePrice - form.values.costPrice) / basePrice) * 100);
  }, [
    form.values.price,
    form.values.pricePerSqm,
    form.values.tiers,
    form.values.costPrice,
    form.values.pricingModel,
  ]);

  // --- Real-time price simulator ---
  const priceSimulation = useMemo(() => {
    const pm = form.values.pricingModel;
    const qty = 2;
    let baseUnit = 0;
    let areaSize = 0;

    if (pm === "fixed") {
      baseUnit = form.values.price;
    } else if (pm === "area") {
      const w = form.values.defaultWidth || 3;
      const h = form.values.defaultHeight || 1;
      areaSize = w * h;
      baseUnit = form.values.pricePerSqm * areaSize;
    } else if (pm === "tiered" && form.values.tiers.length > 0) {
      const tier =
        form.values.tiers.find(
          (t) => qty >= t.minQty && (t.maxQty === null || qty <= t.maxQty),
        ) || form.values.tiers[0];
      baseUnit = tier.price;
    }

    const subtotal = baseUnit * qty;
    let finishingTotal = 0;
    const finishingLines: string[] = [];
    for (const fId of form.values.finishingIds) {
      const fo = finishings.find((f) => f.id === fId);
      if (!fo) continue;
      let fCost = 0;
      if (fo.pricingType === "per_unit") {
        fCost = fo.price * qty;
        finishingLines.push(
          `${fo.name}: ${formatCurrency(fo.price)} × ${qty} = ${formatCurrency(fCost)}`,
        );
      } else if (fo.pricingType === "per_area" && pm === "area") {
        const area = areaSize || 1;
        fCost = fo.price * area * qty;
        finishingLines.push(
          `${fo.name}: ${formatCurrency(fo.price)}/m² × ${area}m² × ${qty} = ${formatCurrency(fCost)}`,
        );
      } else {
        fCost = fo.price;
        finishingLines.push(`${fo.name}: ${formatCurrency(fCost)} (flat)`);
      }
      finishingTotal += fCost;
    }

    const setup = form.values.setupFee || 0;
    const total = subtotal + finishingTotal + setup;

    return { qty, subtotal, finishingLines, finishingTotal, setup, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.values.pricingModel,
    form.values.price,
    form.values.pricePerSqm,
    form.values.defaultWidth,
    form.values.defaultHeight,
    form.values.tiers,
    form.values.finishingIds,
    form.values.setupFee,
    form.values.unit,
    finishings,
  ]);

  const handleOpenModal = (itemId?: string) => {
    if (itemId) {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        form.setValues({
          name: item.name,
          sku: item.sku || "",
          description: item.description,
          price: item.price,
          pricePerSqm: item.pricePerSqm || 0,
          costPrice: item.costPrice || 0,
          pricingModel: item.pricingModel,
          category: item.category,
          imageUrl: item.imageUrl,
          unit: item.unit || "pcs",
          areaUnit: item.areaUnit || "m",
          defaultWidth: item.defaultWidth || 0,
          defaultHeight: item.defaultHeight || 0,
          tiers:
            item.tiers && item.tiers.length > 0
              ? item.tiers
              : [{ minQty: 1, maxQty: 10, price: 0 }],
          finishingIds: (item.finishingOptions || []).map((fo) => fo.id),
          materialIds: (item.materialOptions || [])
            .map((name) => {
              const mat = materials.find((m) => m.name === name);
              return mat?.id || "";
            })
            .filter(Boolean),
          minOrder: item.minOrder || 1,
          setupFee: item.setupFee || 0,
          maxDiscount: item.maxDiscount ?? 100,
          productionDays: item.productionDays || 1,
          notes: item.notes || "",
          isActive: item.isActive ?? true,
        });
        setEditingItem(itemId);
      }
    } else {
      form.reset();
      setEditingItem(null);
    }
    open();
  };

  const handleSubmit = (values: FormValues) => {
    if (!user) return;

    const basePrice =
      values.pricingModel === "area"
        ? values.pricePerSqm
        : values.pricingModel === "tiered" && values.tiers.length > 0
          ? values.tiers[0].price
          : values.price;

    const itemData = {
      name: values.name,
      sku: values.sku || undefined,
      description: values.description,
      category: values.category,
      imageUrl: values.imageUrl,
      pricingModel: values.pricingModel,
      price: basePrice,
      costPrice: values.costPrice > 0 ? values.costPrice : undefined,
      pricePerSqm:
        values.pricingModel === "area" ? values.pricePerSqm : undefined,
      tiers: values.pricingModel === "tiered" ? values.tiers : undefined,
      unit: values.unit,
      areaUnit: values.pricingModel === "area" ? values.areaUnit : undefined,
      defaultWidth:
        values.pricingModel === "area" && values.defaultWidth > 0
          ? values.defaultWidth
          : undefined,
      defaultHeight:
        values.pricingModel === "area" && values.defaultHeight > 0
          ? values.defaultHeight
          : undefined,
      finishingOptions:
        values.finishingIds.length > 0
          ? (values.finishingIds
              .map((fId) => {
                const f = finishings.find((fin) => fin.id === fId);
                if (!f) return null;
                return {
                  id: f.id,
                  name: f.name,
                  price: f.price,
                  pricingType: f.pricingType,
                };
              })
              .filter(Boolean) as {
              id: string;
              name: string;
              price: number;
              pricingType: "per_unit" | "per_area" | "flat";
            }[])
          : undefined,
      materialOptions:
        values.materialIds.length > 0
          ? (values.materialIds
              .map((mId) => {
                const m = materials.find((mat) => mat.id === mId);
                return m?.name || null;
              })
              .filter(Boolean) as string[])
          : undefined,
      minOrder: values.minOrder,
      setupFee: values.setupFee,
      maxDiscount: values.maxDiscount,
      productionDays:
        values.productionDays > 0 ? values.productionDays : undefined,
      notes: values.notes.trim() || undefined,
      isActive: values.isActive,
    };

    if (editingItem) {
      updateItem(editingItem, itemData);
      notifications.show({
        title: "Berhasil",
        message: "Item berhasil diupdate",
        color: "green",
      });
    } else {
      addItem({
        ...itemData,
        businessId: user.businessId,
      });
      notifications.show({
        title: "Berhasil",
        message: "Item berhasil ditambahkan",
        color: "green",
      });
    }

    close();
    form.reset();
    setEditingItem(null);
  };

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Hapus Item",
      children: <Text>Yakin ingin menghapus item &quot;{name}&quot;?</Text>,
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteItem(id);
        notifications.show({
          title: "Berhasil",
          message: "Item berhasil dihapus",
          color: "green",
        });
      },
    });
  };

  // --- Tier helpers ---
  const addTier = () => {
    const tiers = form.values.tiers;
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? (lastTier.maxQty ?? lastTier.minQty) + 1 : 1;
    form.setFieldValue("tiers", [
      ...tiers,
      { minQty: newMin, maxQty: null, price: 0 },
    ]);
  };

  const removeTier = (index: number) => {
    form.setFieldValue(
      "tiers",
      form.values.tiers.filter((_, i) => i !== index),
    );
  };

  const updateTier = (
    index: number,
    field: keyof TierPrice,
    value: number | null,
  ) => {
    const newTiers = [...form.values.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    form.setFieldValue("tiers", newTiers);
  };

  // --- Pricing badge helper ---
  const renderPricingBadge = (pricingModel: PricingModel) => {
    switch (pricingModel) {
      case "area":
        return (
          <Badge
            variant="light"
            color="orange"
            leftSection={<IconRulerMeasure size={12} />}
          >
            Perlu Ukuran
          </Badge>
        );
      case "tiered":
        return (
          <Badge
            variant="light"
            color="violet"
            leftSection={<IconChartBar size={12} />}
          >
            Harga Bertingkat
          </Badge>
        );
      default:
        return (
          <Badge
            variant="light"
            color="aqua"
            leftSection={<IconTag size={12} />}
          >
            Harga Tetap
          </Badge>
        );
    }
  };

  const renderPriceDisplay = (item: (typeof items)[0]) => {
    if (item.pricingModel === "area" && item.pricePerSqm) {
      const unitLabel = item.areaUnit === "cm" ? "cm²" : "m²";
      return `${formatCurrency(item.pricePerSqm)}/${unitLabel}`;
    }
    if (item.pricingModel === "tiered" && item.tiers && item.tiers.length > 0) {
      const lowest = Math.min(...item.tiers.map((t) => t.price));
      const highest = Math.max(...item.tiers.map((t) => t.price));
      if (lowest === highest) return formatCurrency(lowest);
      return `${formatCurrency(lowest)} – ${formatCurrency(highest)}`;
    }
    return formatCurrency(item.price);
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Daftar Barang</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpenModal()}
        >
          Tambah Barang
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group grow>
          <TextInput
            placeholder="Cari barang..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="Semua Kategori"
            data={categoryNames}
            value={filterCategory}
            onChange={setFilterCategory}
            clearable
          />
          <Select
            placeholder="Semua Tipe Harga"
            data={[
              { value: "fixed", label: "Harga Tetap" },
              { value: "area", label: "Perlu Ukuran (m²)" },
              { value: "tiered", label: "Harga Bertingkat" },
            ]}
            value={filterPricing}
            onChange={setFilterPricing}
            clearable
          />
        </Group>
      </Card>

      {filteredItems.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            Tidak ada barang ditemukan
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama / SKU</Table.Th>
                <Table.Th>Kategori</Table.Th>
                <Table.Th>Tipe Harga</Table.Th>
                <Table.Th>Harga</Table.Th>
                <Table.Th>Satuan</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredItems.map((item) => (
                <Table.Tr key={item.id} opacity={item.isActive ? 1 : 0.5}>
                  <Table.Td>
                    <Text fw={500}>{item.name}</Text>
                    {item.sku && (
                      <Text size="xs" c="dimmed" ff="monospace">
                        {item.sku}
                      </Text>
                    )}
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {item.description}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge>{item.category}</Badge>
                  </Table.Td>
                  <Table.Td>{renderPricingBadge(item.pricingModel)}</Table.Td>
                  <Table.Td>
                    <Text fw={500} size="sm">
                      {renderPriceDisplay(item)}
                    </Text>
                    {item.setupFee ? (
                      <Text size="xs" c="dimmed">
                        +Setup {formatCurrency(item.setupFee)}
                      </Text>
                    ) : null}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{item.unit}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="dot"
                      color={item.isActive ? "green" : "gray"}
                    >
                      {item.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        onClick={() => handleOpenModal(item.id)}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(item.id, item.name)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* ========== MODAL FORM ========== */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingItem ? "Edit Barang" : "Tambah Barang"}
        size="xl"
      >
        <ScrollArea.Autosize mah="75vh">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {/* ========== SECTION 1: INFO PRODUK ========== */}
              <Paper p="md" withBorder radius="md">
                <Group gap="xs" mb="sm">
                  <ThemeIcon size="sm" variant="light" color="aqua">
                    <IconBarcode size={14} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>
                    ① Info Produk
                  </Text>
                </Group>

                <Stack gap="sm">
                  <Group grow align="flex-start">
                    <TextInput
                      label="Nama Barang"
                      placeholder="Nama barang"
                      required
                      {...form.getInputProps("name")}
                    />
                    <Select
                      label="Kategori"
                      placeholder="Pilih kategori"
                      data={categoryNames}
                      required
                      searchable
                      {...form.getInputProps("category")}
                    />
                  </Group>

                  <Group grow align="flex-end">
                    <TextInput
                      label="Kode / SKU"
                      placeholder="Otomatis atau manual"
                      leftSection={<IconBarcode size={14} />}
                      {...form.getInputProps("sku")}
                    />
                    <Button
                      variant="light"
                      size="sm"
                      onClick={generateSku}
                      mb={1}
                    >
                      Auto-generate
                    </Button>
                  </Group>

                  <Textarea
                    label="Deskripsi"
                    placeholder="Deskripsi barang"
                    rows={2}
                    {...form.getInputProps("description")}
                  />

                  <Group grow align="flex-start">
                    <Select
                      label="Satuan"
                      placeholder="Pilih satuan"
                      data={UNIT_OPTIONS}
                      required
                      {...form.getInputProps("unit")}
                    />
                  </Group>

                  <Switch
                    label="Produk Aktif"
                    description="Nonaktifkan jika produk sementara tidak dijual"
                    checked={form.values.isActive}
                    onChange={(e) =>
                      form.setFieldValue("isActive", e.currentTarget.checked)
                    }
                  />
                </Stack>
              </Paper>

              {/* ========== SECTION 2: MODEL HARGA ========== */}
              <Paper p="md" withBorder radius="md">
                <Group gap="xs" mb="sm">
                  <ThemeIcon size="sm" variant="light" color="aqua">
                    <IconTag size={14} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>
                    ② Model Harga
                  </Text>
                </Group>

                <Stack gap="sm">
                  <div>
                    <Text size="sm" fw={500} mb={4}>
                      Tipe Harga <span style={{ color: "red" }}>*</span>
                    </Text>
                    <SegmentedControl
                      fullWidth
                      data={[
                        {
                          value: "fixed",
                          label: (
                            <Group gap={6} justify="center">
                              <IconTag size={14} />
                              <Text size="sm">Harga Tetap</Text>
                            </Group>
                          ),
                        },
                        {
                          value: "area",
                          label: (
                            <Group gap={6} justify="center">
                              <IconRulerMeasure size={14} />
                              <Text size="sm">Per Ukuran</Text>
                            </Group>
                          ),
                        },
                        {
                          value: "tiered",
                          label: (
                            <Group gap={6} justify="center">
                              <IconChartBar size={14} />
                              <Text size="sm">Bertingkat</Text>
                            </Group>
                          ),
                        },
                      ]}
                      {...form.getInputProps("pricingModel")}
                    />
                  </div>

                  {/* --- FIXED pricing --- */}
                  {form.values.pricingModel === "fixed" && (
                    <NumberInput
                      label="Harga Satuan"
                      placeholder="0"
                      required
                      min={0}
                      prefix="Rp "
                      thousandSeparator=","
                      {...form.getInputProps("price")}
                    />
                  )}

                  {/* --- AREA pricing --- */}
                  {form.values.pricingModel === "area" && (
                    <Paper p="sm" withBorder radius="sm" bg="orange.0">
                      <Stack gap="sm">
                        <Text size="xs" fw={500} c="orange.8">
                          Harga dihitung: Panjang × Lebar × Harga per satuan
                          area
                        </Text>
                        <Group grow>
                          <NumberInput
                            label="Harga per satuan area"
                            placeholder="0"
                            required
                            min={0}
                            prefix="Rp "
                            thousandSeparator=","
                            {...form.getInputProps("pricePerSqm")}
                          />
                          <Select
                            label="Satuan Area"
                            data={AREA_UNIT_OPTIONS}
                            {...form.getInputProps("areaUnit")}
                          />
                        </Group>
                        <Group grow>
                          <NumberInput
                            label="Default Lebar"
                            description="Template ukuran standar"
                            placeholder="3"
                            min={0}
                            decimalScale={2}
                            value={form.values.defaultWidth || ""}
                            onChange={(v) =>
                              form.setFieldValue("defaultWidth", Number(v) || 0)
                            }
                          />
                          <NumberInput
                            label="Default Tinggi"
                            description="Template ukuran standar"
                            placeholder="1"
                            min={0}
                            decimalScale={2}
                            value={form.values.defaultHeight || ""}
                            onChange={(v) =>
                              form.setFieldValue(
                                "defaultHeight",
                                Number(v) || 0,
                              )
                            }
                          />
                        </Group>
                        {form.values.defaultWidth > 0 &&
                          form.values.defaultHeight > 0 && (
                            <Text size="xs" c="orange.7">
                              Luas default:{" "}
                              {(
                                form.values.defaultWidth *
                                form.values.defaultHeight
                              ).toFixed(2)}{" "}
                              {form.values.areaUnit === "cm" ? "cm²" : "m²"} ={" "}
                              {formatCurrency(
                                form.values.pricePerSqm *
                                  form.values.defaultWidth *
                                  form.values.defaultHeight,
                              )}
                            </Text>
                          )}
                      </Stack>
                    </Paper>
                  )}

                  {/* --- TIERED pricing --- */}
                  {form.values.pricingModel === "tiered" && (
                    <Paper p="sm" withBorder radius="sm" bg="violet.0">
                      <Stack gap="sm">
                        <Text size="xs" fw={500} c="violet.8">
                          Harga bertingkat berdasarkan jumlah order
                        </Text>
                        {form.errors.tiers && (
                          <Text size="xs" c="red">
                            {form.errors.tiers}
                          </Text>
                        )}
                        {form.values.tiers.map((tier, idx) => (
                          <Group key={idx} grow align="flex-end">
                            <NumberInput
                              label={idx === 0 ? "Min Qty" : undefined}
                              placeholder="Min"
                              min={1}
                              value={tier.minQty}
                              onChange={(v) =>
                                updateTier(idx, "minQty", Number(v) || 1)
                              }
                              size="sm"
                            />
                            <NumberInput
                              label={idx === 0 ? "Max Qty" : undefined}
                              placeholder="∞ (kosong)"
                              min={1}
                              value={tier.maxQty ?? ""}
                              onChange={(v) =>
                                updateTier(idx, "maxQty", v ? Number(v) : null)
                              }
                              size="sm"
                            />
                            <NumberInput
                              label={idx === 0 ? "Harga" : undefined}
                              placeholder="0"
                              min={0}
                              prefix="Rp "
                              thousandSeparator=","
                              value={tier.price}
                              onChange={(v) =>
                                updateTier(idx, "price", Number(v) || 0)
                              }
                              size="sm"
                            />
                            <Tooltip label="Hapus tier">
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="lg"
                                onClick={() => removeTier(idx)}
                                disabled={form.values.tiers.length <= 1}
                                mb={2}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        ))}
                        <Button
                          variant="light"
                          color="violet"
                          size="xs"
                          leftSection={<IconPlus size={14} />}
                          onClick={addTier}
                        >
                          Tambah Tier
                        </Button>
                      </Stack>
                    </Paper>
                  )}

                  {/* --- Cost Price & Margin --- */}
                  <Divider variant="dashed" />
                  <Group grow align="flex-end">
                    <NumberInput
                      label="Harga Modal (HPP)"
                      description="Untuk kalkulasi margin"
                      placeholder="0"
                      min={0}
                      prefix="Rp "
                      thousandSeparator=","
                      {...form.getInputProps("costPrice")}
                    />
                    <div>
                      {marginPercent !== null && (
                        <Paper
                          p="xs"
                          radius="sm"
                          bg={marginPercent > 0 ? "teal.0" : "red.0"}
                        >
                          <Group gap={4}>
                            <IconPercentage size={14} />
                            <Text
                              size="sm"
                              fw={600}
                              c={marginPercent > 0 ? "teal.7" : "red.7"}
                            >
                              Margin: {marginPercent}%
                            </Text>
                          </Group>
                        </Paper>
                      )}
                    </div>
                  </Group>
                </Stack>
              </Paper>

              {/* ========== SECTION 3: MATERIAL & FINISHING ========== */}
              <Paper p="md" withBorder radius="md">
                <Group gap="xs" mb="sm">
                  <ThemeIcon size="sm" variant="light" color="aqua">
                    <IconSettings size={14} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>
                    ③ Material & Finishing
                  </Text>
                </Group>

                <Stack gap="sm">
                  <MultiSelect
                    label="Opsi Material"
                    placeholder="Pilih material yang tersedia"
                    description="Data diambil dari modul Material"
                    data={materialSelectData}
                    searchable
                    {...form.getInputProps("materialIds")}
                  />

                  <MultiSelect
                    label="Opsi Finishing"
                    placeholder="Pilih finishing yang tersedia"
                    description="Data diambil dari modul Finishing"
                    data={finishingSelectData}
                    searchable
                    {...form.getInputProps("finishingIds")}
                  />

                  {finishingSelectData.length === 0 &&
                    materialSelectData.length === 0 && (
                      <Text size="xs" c="dimmed" ta="center">
                        Belum ada data finishing/material. Tambahkan dulu di
                        menu Finishing atau Material.
                      </Text>
                    )}
                </Stack>
              </Paper>

              {/* ========== SECTION 4: PENGATURAN ========== */}
              <Paper p="md" withBorder radius="md">
                <Group gap="xs" mb="sm">
                  <ThemeIcon size="sm" variant="light" color="aqua">
                    <IconReceipt size={14} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>
                    ④ Pengaturan Order
                  </Text>
                </Group>

                <Stack gap="sm">
                  <Group grow>
                    <NumberInput
                      label="Min. Order"
                      description="Jumlah minimum pemesanan"
                      placeholder="1"
                      min={1}
                      {...form.getInputProps("minOrder")}
                    />
                    <NumberInput
                      label="Biaya Setup"
                      description="Biaya desain / setup awal"
                      placeholder="0"
                      min={0}
                      prefix="Rp "
                      thousandSeparator=","
                      {...form.getInputProps("setupFee")}
                    />
                    <NumberInput
                      label="Maks. Diskon (%)"
                      description="Batas diskon kasir"
                      placeholder="100"
                      min={0}
                      max={100}
                      suffix="%"
                      {...form.getInputProps("maxDiscount")}
                    />
                  </Group>

                  <Group grow>
                    <NumberInput
                      label="Estimasi Produksi (hari)"
                      description="Berapa hari waktu pengerjaan"
                      placeholder="1"
                      min={0}
                      leftSection={<IconClock size={14} />}
                      {...form.getInputProps("productionDays")}
                    />
                    <div /> {/* spacer */}
                    <div /> {/* spacer */}
                  </Group>

                  <Textarea
                    label="Catatan Internal"
                    description="Untuk tim produksi (tidak terlihat pelanggan)"
                    placeholder="Catatan khusus produksi, resolusi file, jenis tinta, dll."
                    rows={2}
                    {...form.getInputProps("notes")}
                  />
                </Stack>
              </Paper>

              {/* ========== PRICE SIMULATOR ========== */}
              {priceSimulation.total > 0 && (
                <Paper p="md" withBorder radius="md" bg="gray.0">
                  <Group gap="xs" mb="sm">
                    <ThemeIcon size="sm" variant="light" color="teal">
                      <IconReceipt size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={600}>
                      💰 Simulasi Harga (Contoh: {priceSimulation.qty}{" "}
                      {form.values.unit})
                    </Text>
                  </Group>

                  <Stack gap={4}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Subtotal ({priceSimulation.qty} unit)
                      </Text>
                      <Text size="sm" fw={500}>
                        {formatCurrency(priceSimulation.subtotal)}
                      </Text>
                    </Group>

                    {priceSimulation.finishingLines.map((line, i) => (
                      <Group key={i} justify="space-between">
                        <Text size="xs" c="dimmed" pl="sm">
                          + {line}
                        </Text>
                      </Group>
                    ))}

                    {priceSimulation.finishingTotal > 0 && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Total Finishing
                        </Text>
                        <Text size="sm">
                          +{formatCurrency(priceSimulation.finishingTotal)}
                        </Text>
                      </Group>
                    )}

                    {priceSimulation.setup > 0 && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Setup Fee
                        </Text>
                        <Text size="sm">
                          +{formatCurrency(priceSimulation.setup)}
                        </Text>
                      </Group>
                    )}

                    <Divider />

                    <Group justify="space-between">
                      <Text size="sm" fw={700}>
                        TOTAL ESTIMASI
                      </Text>
                      <Text size="md" fw={700} c="teal">
                        {formatCurrency(priceSimulation.total)}
                      </Text>
                    </Group>

                    {marginPercent !== null && (
                      <Text size="xs" c="dimmed" ta="right">
                        Margin ~{marginPercent}%
                      </Text>
                    )}
                  </Stack>
                </Paper>
              )}

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={close}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingItem ? "Update" : "Simpan"}
                </Button>
              </Group>
            </Stack>
          </form>
        </ScrollArea.Autosize>
      </Modal>
    </>
  );
}
