import { useState } from "react";
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
  Image,
  Badge,
  ActionIcon,
  SegmentedControl,
  Paper,
  Switch,
  MultiSelect,
  Divider,
  ScrollArea,
  Tooltip,
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
  IconX,
} from "@tabler/icons-react";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { formatCurrency } from "../../../shared/utils";
import {
  DUMMY_IMAGES,
  UNIT_OPTIONS,
  AREA_UNIT_OPTIONS,
  MATERIALS,
} from "../../../shared/constants";
import { useCategoryStore } from "../../../shared/stores/categoryStore";
import type {
  TierPrice,
  FinishingOption,
  PricingModel,
} from "../../../shared/types";

interface FormValues {
  name: string;
  description: string;
  price: number;
  pricePerSqm: number;
  pricingModel: PricingModel;
  category: string;
  imageUrl: string;
  unit: string;
  areaUnit: "m" | "cm";
  tiers: TierPrice[];
  finishingOptions: FinishingOption[];
  materialOptions: string[];
  minOrder: number;
  setupFee: number;
  maxDiscount: number;
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

  const [opened, { open, close }] = useDisclosure(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPricing, setFilterPricing] = useState<string | null>(null);

  // Finishing option temp fields
  const [newFinishName, setNewFinishName] = useState("");
  const [newFinishPrice, setNewFinishPrice] = useState<number>(0);

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      description: "",
      price: 0,
      pricePerSqm: 0,
      pricingModel: "fixed",
      category: "",
      imageUrl: "",
      unit: "pcs",
      areaUnit: "m",
      tiers: [{ minQty: 1, maxQty: 10, price: 0 }],
      finishingOptions: [],
      materialOptions: [],
      minOrder: 1,
      setupFee: 0,
      maxDiscount: 100,
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

  const handleOpenModal = (itemId?: string) => {
    if (itemId) {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        form.setValues({
          name: item.name,
          description: item.description,
          price: item.price,
          pricePerSqm: item.pricePerSqm || 0,
          pricingModel: item.pricingModel,
          category: item.category,
          imageUrl: item.imageUrl,
          unit: item.unit || "pcs",
          areaUnit: item.areaUnit || "m",
          tiers:
            item.tiers && item.tiers.length > 0
              ? item.tiers
              : [{ minQty: 1, maxQty: 10, price: 0 }],
          finishingOptions: item.finishingOptions || [],
          materialOptions: item.materialOptions || [],
          minOrder: item.minOrder || 1,
          setupFee: item.setupFee || 0,
          maxDiscount: item.maxDiscount ?? 100,
          isActive: item.isActive ?? true,
        });
        setEditingItem(itemId);
      }
    } else {
      form.reset();
      setEditingItem(null);
    }
    setNewFinishName("");
    setNewFinishPrice(0);
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
      description: values.description,
      category: values.category,
      imageUrl: values.imageUrl,
      pricingModel: values.pricingModel,
      price: basePrice,
      pricePerSqm:
        values.pricingModel === "area" ? values.pricePerSqm : undefined,
      tiers: values.pricingModel === "tiered" ? values.tiers : undefined,
      unit: values.unit,
      areaUnit: values.pricingModel === "area" ? values.areaUnit : undefined,
      finishingOptions:
        values.finishingOptions.length > 0
          ? values.finishingOptions
          : undefined,
      materialOptions:
        values.materialOptions.length > 0 ? values.materialOptions : undefined,
      minOrder: values.minOrder,
      setupFee: values.setupFee,
      maxDiscount: values.maxDiscount,
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

  // --- Finishing helpers ---
  const addFinishing = () => {
    if (!newFinishName.trim()) return;
    const newOpt: FinishingOption = {
      id: `fo-${Date.now()}`,
      name: newFinishName.trim(),
      price: newFinishPrice || 0,
    };
    form.setFieldValue("finishingOptions", [
      ...form.values.finishingOptions,
      newOpt,
    ]);
    setNewFinishName("");
    setNewFinishPrice(0);
  };

  const removeFinishing = (id: string) => {
    form.setFieldValue(
      "finishingOptions",
      form.values.finishingOptions.filter((f) => f.id !== id),
    );
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
                <Table.Th>Gambar</Table.Th>
                <Table.Th>Nama</Table.Th>
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
                    <Image
                      src={item.imageUrl}
                      height={50}
                      width={50}
                      radius="sm"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{item.name}</Text>
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
              {/* --- Basic Info --- */}
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
                <Switch
                  label="Produk Aktif"
                  description="Nonaktifkan jika produk sementara tidak dijual"
                  mt={6}
                  checked={form.values.isActive}
                  onChange={(e) =>
                    form.setFieldValue("isActive", e.currentTarget.checked)
                  }
                />
              </Group>

              <Divider label="Tipe Harga" labelPosition="center" />

              {/* --- Pricing Model Selector --- */}
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Model Harga <span style={{ color: "red" }}>*</span>
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
                <Paper p="md" withBorder radius="md" bg="orange.0">
                  <Stack gap="sm">
                    <Text size="sm" fw={500} c="orange.8">
                      Harga dihitung berdasarkan ukuran (Panjang × Lebar)
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
                  </Stack>
                </Paper>
              )}

              {/* --- TIERED pricing --- */}
              {form.values.pricingModel === "tiered" && (
                <Paper p="md" withBorder radius="md" bg="violet.0">
                  <Stack gap="sm">
                    <Text size="sm" fw={500} c="violet.8">
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

              <Divider label="Material & Finishing" labelPosition="center" />

              {/* --- Material Options --- */}
              <MultiSelect
                label="Opsi Material"
                placeholder="Pilih material yang tersedia"
                data={MATERIALS}
                searchable
                {...form.getInputProps("materialOptions")}
              />

              {/* --- Finishing Options --- */}
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Opsi Finishing
                </Text>
                {form.values.finishingOptions.length > 0 && (
                  <Stack gap={4} mb="xs">
                    {form.values.finishingOptions.map((fo) => (
                      <Paper key={fo.id} p="xs" withBorder radius="sm">
                        <Group justify="space-between">
                          <Group gap="xs">
                            <Text size="sm" fw={500}>
                              {fo.name}
                            </Text>
                            <Badge size="sm" variant="light" color="aqua">
                              +{formatCurrency(fo.price)}
                            </Badge>
                          </Group>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => removeFinishing(fo.id)}
                          >
                            <IconX size={12} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
                <Group grow align="flex-end">
                  <TextInput
                    placeholder="Nama finishing (cth: Laminating)"
                    size="sm"
                    value={newFinishName}
                    onChange={(e) => setNewFinishName(e.currentTarget.value)}
                  />
                  <NumberInput
                    placeholder="Harga tambahan"
                    size="sm"
                    min={0}
                    prefix="Rp "
                    thousandSeparator=","
                    value={newFinishPrice}
                    onChange={(v) => setNewFinishPrice(Number(v) || 0)}
                  />
                  <Button
                    variant="light"
                    size="sm"
                    leftSection={<IconPlus size={14} />}
                    onClick={addFinishing}
                    disabled={!newFinishName.trim()}
                  >
                    Tambah
                  </Button>
                </Group>
              </div>

              <Divider
                label={
                  <Group gap={4}>
                    <IconSettings size={14} />
                    <Text size="sm">Pengaturan Harga</Text>
                  </Group>
                }
                labelPosition="center"
              />

              {/* --- Price Controls --- */}
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

              <Divider />

              {/* --- Image --- */}
              <Select
                label="Gambar"
                placeholder="Pilih gambar"
                data={Object.entries(DUMMY_IMAGES).map(([key]) => ({
                  value: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                }))}
                value={
                  Object.entries(DUMMY_IMAGES).find(
                    ([, url]) => url === form.values.imageUrl,
                  )?.[0] || ""
                }
                onChange={(value) => {
                  if (value) {
                    form.setFieldValue(
                      "imageUrl",
                      DUMMY_IMAGES[value as keyof typeof DUMMY_IMAGES],
                    );
                  }
                }}
              />

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
