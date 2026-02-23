import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Title,
  Text,
  Stepper,
  Button,
  Group,
  Card,
  SimpleGrid,
  TextInput,
  NumberInput,
  Select,
  MultiSelect,
  Textarea,
  Badge,
  Stack,
  Grid,
  Divider,
  ActionIcon,
  Table,
  Alert,
  Box,
  Modal,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconSearch,
  IconTrash,
  IconPlus,
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconDeviceFloppy,
  IconSend,
  IconUserPlus,
} from "@tabler/icons-react";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useCustomerStore } from "../../../shared/stores/customerStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { ROUTES } from "../../../core/routes";
import { DEFAULT_TAX_RATE, MIN_DP_PERCENT } from "../../../shared/constants";
import { formatCurrency, generateId } from "../../../shared/utils";
import type { Item, OrderItem } from "../../../shared/types";

// Local item config state (NOT using cartStore)
interface ConfiguredItem {
  localId: string; // unique key for this configured item
  item: Item;
  quantity: number;
  width?: number;
  height?: number;
  area?: number;
  material?: string;
  finishing: string[];
  discountPercent: number;
  overrideUnitPrice?: number; // harga satuan manual
  notes?: string;
  // Calculated
  unitPrice: number;
  finishingCost: number;
  setupFee: number;
  subtotal: number;
}

function calculateItemPrice(
  item: Item,
  config: { quantity: number; width?: number; height?: number; area?: number },
): number {
  if (item.pricingModel === "area") {
    return item.pricePerSqm || item.price;
  }
  if (item.pricingModel === "tiered" && item.tiers) {
    const tier = item.tiers.find(
      (t) =>
        config.quantity >= t.minQty &&
        (t.maxQty === null || config.quantity <= t.maxQty),
    );
    return tier ? tier.price : item.price;
  }
  return item.price;
}

function calculateFinishingCost(
  item: Item,
  finishing: string[],
  area: number,
  quantity: number,
): number {
  if (!item.finishingOptions || finishing.length === 0) return 0;
  let total = 0;
  for (const finName of finishing) {
    const opt = item.finishingOptions.find((f) => f.name === finName);
    if (!opt) continue;
    if (opt.pricingType === "per_unit") total += opt.price * quantity;
    else if (opt.pricingType === "per_area")
      total += opt.price * area * quantity;
    else if (opt.pricingType === "flat") total += opt.price;
  }
  return total;
}

function calculateConfiguredItem(
  item: Item,
  config: Partial<ConfiguredItem> & { overrideUnitPrice?: number },
): ConfiguredItem {
  const quantity = config.quantity || item.minOrder || 1;
  const width = config.width || item.defaultWidth;
  const height = config.height || item.defaultHeight;
  const area =
    item.pricingModel === "area" && width && height ? width * height : 0;
  const finishing = config.finishing || [];
  const discountPercent = config.discountPercent || 0;

  const basePrice = calculateItemPrice(item, { quantity, width, height, area });
  // Jika ada override harga satuan, gunakan langsung (abaikan diskon%)
  const effectiveUnitPrice =
    config.overrideUnitPrice && config.overrideUnitPrice > 0
      ? config.overrideUnitPrice
      : basePrice * (1 - discountPercent / 100);

  const finishingCost = calculateFinishingCost(item, finishing, area, quantity);
  const setupFee = item.setupFee || 0;

  let subtotal: number;
  if (item.pricingModel === "area") {
    subtotal = effectiveUnitPrice * area * quantity + finishingCost + setupFee;
  } else {
    subtotal = effectiveUnitPrice * quantity + finishingCost + setupFee;
  }

  return {
    localId: config.localId || generateId(),
    item,
    quantity,
    width,
    height,
    area,
    material: config.material,
    finishing,
    discountPercent:
      config.overrideUnitPrice && config.overrideUnitPrice > 0
        ? 0
        : discountPercent,
    overrideUnitPrice:
      config.overrideUnitPrice && config.overrideUnitPrice > 0
        ? config.overrideUnitPrice
        : undefined,
    notes: config.notes,
    unitPrice: effectiveUnitPrice,
    finishingCost,
    setupFee,
    subtotal,
  };
}

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [configuredItems, setConfiguredItems] = useState<ConfiguredItem[]>([]);
  const [selectedItemForConfig, setSelectedItemForConfig] =
    useState<Item | null>(null);

  const items = useItemStore((s) => s.items);
  const addOrder = useOrderStore((s) => s.addOrder);
  const customers = useCustomerStore((s) => s.customers);
  const addCustomer = useCustomerStore((s) => s.addCustomer);
  const businesses = useBusinessStore((s) => s.businesses);
  const user = useAuthStore((s) => s.user);

  const business = businesses.find((b) => b.id === user?.businessId);
  const taxRate = business?.taxEnabled
    ? (business.taxRate ?? DEFAULT_TAX_RATE)
    : 0;

  const orderForm = useForm({
    initialValues: {
      customerId: "",
      deadline: null as Date | null,
      notes: "",
    },
    validate: {
      customerId: (v) => (v ? null : "Pilih pelanggan"),
    },
  });

  // Config form for individual item
  const configForm = useForm({
    initialValues: {
      quantity: 1,
      width: 0,
      height: 0,
      material: "",
      finishing: [] as string[],
      discountPercent: 0,
      overrideUnitPrice: 0,
      notes: "",
    },
  });

  // Modal tambah pelanggan baru
  const [
    customerModalOpened,
    { open: openCustomerModal, close: closeCustomerModal },
  ] = useDisclosure(false);
  const customerForm = useForm({
    initialValues: {
      name: "",
      phone: "",
      email: "",
      company: "",
      address: "",
    },
    validate: {
      name: (v) => (v.trim() ? null : "Nama pelanggan wajib diisi"),
    },
  });

  const handleAddCustomer = (values: typeof customerForm.values) => {
    if (!user) return;
    const newCustomer = addCustomer({
      name: values.name.trim(),
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
      company: values.company.trim() || undefined,
      address: values.address.trim() || undefined,
      businessId: user.businessId,
    });
    // Auto-select pelanggan baru
    orderForm.setFieldValue("customerId", newCustomer.id);
    notifications.show({
      title: "Pelanggan Ditambahkan",
      message: `${newCustomer.name} berhasil ditambahkan`,
      color: "green",
    });
    customerForm.reset();
    closeCustomerModal();
  };
  const activeItems = items.filter((i) => i.isActive);
  const categories = useMemo(
    () => [...new Set(activeItems.map((i) => i.category))],
    [activeItems],
  );

  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [activeItems, search, categoryFilter]);

  // Pricing summary
  const subtotal = configuredItems.reduce((sum, ci) => sum + ci.subtotal, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Select an item to configure
  const openConfigForItem = (item: Item) => {
    setSelectedItemForConfig(item);
    configForm.setValues({
      quantity: item.minOrder || 1,
      width: item.defaultWidth || 0,
      height: item.defaultHeight || 0,
      material: item.materialOptions?.[0] || "",
      finishing: [],
      discountPercent: 0,
      overrideUnitPrice: 0,
      notes: "",
    });
  };

  // Add configured item to order
  const addConfiguredItem = () => {
    if (!selectedItemForConfig) return;
    const newItem = calculateConfiguredItem(selectedItemForConfig, {
      localId: generateId(),
      quantity: configForm.values.quantity,
      width: configForm.values.width || undefined,
      height: configForm.values.height || undefined,
      material: configForm.values.material || undefined,
      finishing: configForm.values.finishing,
      discountPercent: configForm.values.discountPercent,
      overrideUnitPrice: configForm.values.overrideUnitPrice || undefined,
      notes: configForm.values.notes || undefined,
    });
    setConfiguredItems((prev) => [...prev, newItem]);
    setSelectedItemForConfig(null);
    configForm.reset();
  };

  // Remove configured item
  const removeConfiguredItem = (localId: string) => {
    setConfiguredItems((prev) => prev.filter((ci) => ci.localId !== localId));
  };

  // Submit order
  const submitOrder = (asDraft: boolean) => {
    if (!user) return;
    if (!asDraft) {
      const validation = orderForm.validate();
      if (validation.hasErrors) return;
    }

    const customer = customers.find(
      (c) => c.id === orderForm.values.customerId,
    );

    const orderItems: OrderItem[] = configuredItems.map((ci) => ({
      itemId: ci.item.id,
      name: ci.item.name,
      category: ci.item.category,
      width: ci.width,
      height: ci.height,
      area: ci.area,
      material: ci.material,
      finishing: ci.finishing,
      pricePerSqm:
        ci.item.pricingModel === "area" ? ci.item.pricePerSqm : undefined,
      originalPrice: ci.item.price,
      price: ci.unitPrice,
      discountPercent: ci.discountPercent || undefined,
      quantity: ci.quantity,
      subtotal: ci.subtotal,
      notes: ci.notes,
    }));

    const status = asDraft ? "draft" : "awaiting_payment";

    const newOrder = addOrder({
      customerId: orderForm.values.customerId || undefined,
      customerName: customer?.name || "Walk-in Customer",
      customerPhone: customer?.phone,
      items: orderItems,
      subtotal,
      tax,
      total,
      paymentType: "dp",
      paymentStatus: "unpaid",
      dpStatus: "none",
      downPayment: 0,
      remainingPayment: total,
      paidAmount: 0,
      minDpPercent: MIN_DP_PERCENT,
      payments: [],
      deadline: orderForm.values.deadline
        ? new Date(orderForm.values.deadline).toISOString()
        : undefined,
      status,
      branchId: user.branchId,
      businessId: user.businessId,
      createdBy: user.id,
      notes: orderForm.values.notes || undefined,
    });

    notifications.show({
      title: asDraft ? "Draft Tersimpan" : "Order Dikirim",
      message: asDraft
        ? `Order ${newOrder.orderNumber} tersimpan sebagai draft`
        : `Order ${newOrder.orderNumber} dikirim ke kasir untuk pembayaran`,
      color: asDraft ? "gray" : "green",
      icon: asDraft ? <IconDeviceFloppy size={16} /> : <IconSend size={16} />,
    });

    navigate(ROUTES.ORDERS);
  };

  // Stepper navigation
  const canGoNext = () => {
    if (active === 0)
      return configuredItems.length > 0 || selectedItemForConfig !== null;
    if (active === 1) return configuredItems.length > 0;
    if (active === 2) return !orderForm.validate().hasErrors;
    return true;
  };

  const nextStep = () => setActive((c) => Math.min(c + 1, 3));
  const prevStep = () => setActive((c) => Math.max(c - 1, 0));

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Buat Order Baru</Title>
      </Group>

      <Stepper
        active={active}
        onStepClick={setActive}
        allowNextStepsSelect={false}
      >
        {/* ============ STEP 1: Pilih Produk ============ */}
        <Stepper.Step
          label="Pilih Produk"
          description="Tambah & konfigurasi item"
        >
          <Grid mt="md">
            {/* Left: Product catalog */}
            <Grid.Col span={{ base: 12, md: selectedItemForConfig ? 6 : 8 }}>
              <Card withBorder>
                <Stack gap="sm">
                  <Text fw={600}>Katalog Produk</Text>
                  <Group>
                    <TextInput
                      placeholder="Cari produk..."
                      leftSection={<IconSearch size={16} />}
                      value={search}
                      onChange={(e) => setSearch(e.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <Select
                      placeholder="Semua Kategori"
                      data={categories}
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      clearable
                      w={180}
                    />
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {filteredItems.map((item) => (
                      <Card
                        key={item.id}
                        withBorder
                        padding="sm"
                        style={{ cursor: "pointer" }}
                        onClick={() => openConfigForItem(item)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Box>
                            <Text fw={500} size="sm" lineClamp={1}>
                              {item.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {item.category}
                            </Text>
                          </Box>
                          <Stack gap={2} align="flex-end">
                            <Badge size="xs" variant="light" color="aqua">
                              {item.pricingModel}
                            </Badge>
                            <Text size="xs" fw={500}>
                              {formatCurrency(item.price)}
                              {item.pricingModel === "area"
                                ? "/m²"
                                : `/${item.unit}`}
                            </Text>
                          </Stack>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Card>
            </Grid.Col>

            {/* Right: Config form for selected item */}
            {selectedItemForConfig && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={600}>
                        Konfigurasi: {selectedItemForConfig.name}
                      </Text>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => setSelectedItemForConfig(null)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>

                    {/* Area dimensions */}
                    {selectedItemForConfig.pricingModel === "area" && (
                      <Group grow>
                        <NumberInput
                          label="Lebar (m)"
                          min={0.1}
                          step={0.1}
                          decimalScale={2}
                          {...configForm.getInputProps("width")}
                        />
                        <NumberInput
                          label="Tinggi (m)"
                          min={0.1}
                          step={0.1}
                          decimalScale={2}
                          {...configForm.getInputProps("height")}
                        />
                      </Group>
                    )}

                    {selectedItemForConfig.pricingModel === "area" &&
                      configForm.values.width > 0 &&
                      configForm.values.height > 0 && (
                        <Text size="sm" c="dimmed">
                          Area:{" "}
                          {(
                            configForm.values.width * configForm.values.height
                          ).toFixed(2)}{" "}
                          m² ×{" "}
                          {formatCurrency(
                            selectedItemForConfig.pricePerSqm ||
                              selectedItemForConfig.price,
                          )}
                          /m²
                        </Text>
                      )}

                    {/* Tiered pricing info */}
                    {selectedItemForConfig.pricingModel === "tiered" &&
                      selectedItemForConfig.tiers && (
                        <Box>
                          <Text size="xs" fw={500} mb={4}>
                            Harga per tier:
                          </Text>
                          {selectedItemForConfig.tiers.map((tier, i) => (
                            <Text
                              key={i}
                              size="xs"
                              c={
                                configForm.values.quantity >= tier.minQty &&
                                (tier.maxQty === null ||
                                  configForm.values.quantity <= tier.maxQty)
                                  ? "aqua"
                                  : "dimmed"
                              }
                            >
                              {tier.minQty}-{tier.maxQty ?? "∞"}{" "}
                              {selectedItemForConfig.unit}:{" "}
                              {formatCurrency(tier.price)}/
                              {selectedItemForConfig.unit}
                            </Text>
                          ))}
                        </Box>
                      )}

                    <NumberInput
                      label={`Jumlah (${selectedItemForConfig.unit})`}
                      min={selectedItemForConfig.minOrder || 1}
                      {...configForm.getInputProps("quantity")}
                    />

                    {/* Material */}
                    {selectedItemForConfig.materialOptions &&
                      selectedItemForConfig.materialOptions.length > 0 && (
                        <Select
                          label="Material"
                          data={selectedItemForConfig.materialOptions}
                          {...configForm.getInputProps("material")}
                        />
                      )}

                    {/* Finishing */}
                    {selectedItemForConfig.finishingOptions &&
                      selectedItemForConfig.finishingOptions.length > 0 && (
                        <MultiSelect
                          label="Finishing"
                          data={selectedItemForConfig.finishingOptions.map(
                            (f) => ({
                              value: f.name,
                              label: `${f.name} (+${formatCurrency(f.price)} ${f.pricingType === "per_unit" ? "/pcs" : f.pricingType === "per_area" ? "/m²" : "flat"})`,
                            }),
                          )}
                          {...configForm.getInputProps("finishing")}
                        />
                      )}

                    {/* Override harga satuan */}
                    <NumberInput
                      label="Override Harga Satuan"
                      description={
                        <>
                          Harga asli:{" "}
                          <strong>
                            {formatCurrency(
                              calculateItemPrice(selectedItemForConfig, {
                                quantity: configForm.values.quantity,
                                width: configForm.values.width || undefined,
                                height: configForm.values.height || undefined,
                              }),
                            )}
                          </strong>{" "}
                          — isi jika ingin ubah harga manual
                        </>
                      }
                      placeholder="Kosongkan = pakai harga otomatis"
                      min={0}
                      prefix="Rp "
                      thousandSeparator=","
                      {...configForm.getInputProps("overrideUnitPrice")}
                    />

                    {/* Discount — hanya tampil jika tidak ada override harga */}
                    {(!configForm.values.overrideUnitPrice ||
                      configForm.values.overrideUnitPrice <= 0) && (
                      <NumberInput
                        label="Diskon (%)"
                        min={0}
                        max={selectedItemForConfig.maxDiscount || 100}
                        suffix="%"
                        {...configForm.getInputProps("discountPercent")}
                      />
                    )}

                    <Textarea
                      label="Catatan Item"
                      placeholder="Catatan untuk produksi..."
                      {...configForm.getInputProps("notes")}
                    />

                    {/* Price preview */}
                    <Divider />
                    {(() => {
                      const preview = calculateConfiguredItem(
                        selectedItemForConfig,
                        {
                          quantity: configForm.values.quantity,
                          width: configForm.values.width || undefined,
                          height: configForm.values.height || undefined,
                          material: configForm.values.material || undefined,
                          finishing: configForm.values.finishing,
                          discountPercent: configForm.values.discountPercent,
                          overrideUnitPrice:
                            configForm.values.overrideUnitPrice || undefined,
                        },
                      );
                      const isOverride =
                        configForm.values.overrideUnitPrice &&
                        configForm.values.overrideUnitPrice > 0;
                      return (
                        <Stack gap={4}>
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">
                              Harga satuan
                            </Text>
                            <Group gap={4}>
                              {isOverride && (
                                <Badge size="xs" color="orange" variant="light">
                                  Custom
                                </Badge>
                              )}
                              <Text
                                size="sm"
                                fw={isOverride ? 600 : undefined}
                                c={isOverride ? "orange" : undefined}
                              >
                                {formatCurrency(preview.unitPrice)}
                              </Text>
                            </Group>
                          </Group>
                          {preview.finishingCost > 0 && (
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">
                                Finishing
                              </Text>
                              <Text size="sm">
                                {formatCurrency(preview.finishingCost)}
                              </Text>
                            </Group>
                          )}
                          {preview.setupFee > 0 && (
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">
                                Setup fee
                              </Text>
                              <Text size="sm">
                                {formatCurrency(preview.setupFee)}
                              </Text>
                            </Group>
                          )}
                          <Group justify="space-between">
                            <Text fw={600}>Subtotal</Text>
                            <Text fw={600} c="aqua">
                              {formatCurrency(preview.subtotal)}
                            </Text>
                          </Group>
                        </Stack>
                      );
                    })()}

                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={addConfiguredItem}
                    >
                      Tambah ke Order
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            )}

            {/* Bottom: Items in order */}
            <Grid.Col span={12}>
              {configuredItems.length > 0 && (
                <Card withBorder>
                  <Text fw={600} mb="sm">
                    Item dalam Order ({configuredItems.length})
                  </Text>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Produk</Table.Th>
                        <Table.Th>Spesifikasi</Table.Th>
                        <Table.Th>Qty</Table.Th>
                        <Table.Th>Harga</Table.Th>
                        <Table.Th>Subtotal</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {configuredItems.map((ci) => (
                        <Table.Tr key={ci.localId}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {ci.item.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {ci.item.category}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap={2}>
                              {ci.width && ci.height && (
                                <Text size="xs">
                                  {ci.width}×{ci.height}m ={" "}
                                  {ci.area?.toFixed(2)}m²
                                </Text>
                              )}
                              {ci.material && (
                                <Text size="xs">Material: {ci.material}</Text>
                              )}
                              {ci.finishing.length > 0 && (
                                <Text size="xs">
                                  Finishing: {ci.finishing.join(", ")}
                                </Text>
                              )}
                              {ci.overrideUnitPrice &&
                              ci.overrideUnitPrice > 0 ? (
                                <Badge size="xs" color="orange" variant="light">
                                  Harga Custom
                                </Badge>
                              ) : (
                                ci.discountPercent > 0 && (
                                  <Badge size="xs" color="red" variant="light">
                                    Disc {ci.discountPercent}%
                                  </Badge>
                                )
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            {ci.quantity} {ci.item.unit}
                          </Table.Td>
                          <Table.Td>{formatCurrency(ci.unitPrice)}</Table.Td>
                          <Table.Td fw={500}>
                            {formatCurrency(ci.subtotal)}
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => removeConfiguredItem(ci.localId)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              )}

              {configuredItems.length === 0 && (
                <Alert
                  color="gray"
                  variant="light"
                  icon={<IconAlertCircle size={16} />}
                >
                  Belum ada item. Klik produk dari katalog untuk menambahkan.
                </Alert>
              )}
            </Grid.Col>
          </Grid>
        </Stepper.Step>

        {/* ============ STEP 2: Info Order ============ */}
        <Stepper.Step label="Info Order" description="Pelanggan & deadline">
          <Grid mt="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder>
                <Stack gap="md">
                  <Text fw={600}>Informasi Order</Text>
                  <Group align="flex-end" gap="xs">
                    <Select
                      label="Pelanggan"
                      placeholder="Pilih pelanggan"
                      data={customers.map((c) => ({
                        value: c.id,
                        label: `${c.name}${c.company ? ` (${c.company})` : ""}`,
                      }))}
                      searchable
                      style={{ flex: 1 }}
                      {...orderForm.getInputProps("customerId")}
                    />
                    <Button
                      variant="light"
                      leftSection={<IconUserPlus size={16} />}
                      onClick={openCustomerModal}
                      mb={1}
                    >
                      Baru
                    </Button>
                  </Group>
                  <DateInput
                    label="Deadline"
                    placeholder="Pilih tanggal deadline"
                    minDate={new Date()}
                    valueFormat="DD MMM YYYY"
                    {...orderForm.getInputProps("deadline")}
                  />
                  <Textarea
                    label="Catatan Order"
                    placeholder="Catatan umum untuk order ini..."
                    {...orderForm.getInputProps("notes")}
                  />
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder>
                <Stack gap="sm">
                  <Text fw={600}>Ringkasan Item</Text>
                  {configuredItems.map((ci) => (
                    <Group key={ci.localId} justify="space-between">
                      <Box>
                        <Text size="sm">{ci.item.name}</Text>
                        <Text size="xs" c="dimmed">
                          {ci.quantity} {ci.item.unit}
                          {ci.area ? ` • ${ci.area.toFixed(2)}m²` : ""}
                        </Text>
                      </Box>
                      <Text size="sm" fw={500}>
                        {formatCurrency(ci.subtotal)}
                      </Text>
                    </Group>
                  ))}
                  <Divider />
                  <Group justify="space-between">
                    <Text size="sm">Subtotal</Text>
                    <Text size="sm">{formatCurrency(subtotal)}</Text>
                  </Group>
                  {taxRate > 0 && (
                    <Group justify="space-between">
                      <Text size="sm">PPN ({(taxRate * 100).toFixed(0)}%)</Text>
                      <Text size="sm">{formatCurrency(tax)}</Text>
                    </Group>
                  )}
                  <Group justify="space-between">
                    <Text fw={700}>Total</Text>
                    <Text fw={700} c="aqua" size="lg">
                      {formatCurrency(total)}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Stepper.Step>

        {/* ============ STEP 3: Review & Submit ============ */}
        <Stepper.Step label="Review" description="Periksa & kirim">
          <Grid mt="md">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card withBorder>
                <Text fw={600} mb="sm">
                  Detail Order
                </Text>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Produk</Table.Th>
                      <Table.Th>Spesifikasi</Table.Th>
                      <Table.Th>Qty</Table.Th>
                      <Table.Th>Subtotal</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {configuredItems.map((ci) => (
                      <Table.Tr key={ci.localId}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {ci.item.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={2}>
                            {ci.width && ci.height && (
                              <Text size="xs">
                                {ci.width}×{ci.height}m ({ci.area?.toFixed(2)}
                                m²)
                              </Text>
                            )}
                            {ci.material && (
                              <Text size="xs">Material: {ci.material}</Text>
                            )}
                            {ci.finishing.length > 0 && (
                              <Text size="xs">
                                Finishing: {ci.finishing.join(", ")}
                              </Text>
                            )}
                            {ci.discountPercent > 0 && (
                              <Text size="xs" c="red">
                                Diskon {ci.discountPercent}%
                              </Text>
                            )}
                            {ci.notes && (
                              <Text size="xs" c="dimmed" fs="italic">
                                {ci.notes}
                              </Text>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          {ci.quantity} {ci.item.unit}
                        </Table.Td>
                        <Table.Td fw={500}>
                          {formatCurrency(ci.subtotal)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                <Card withBorder>
                  <Stack gap="sm">
                    <Text fw={600}>Info Pelanggan</Text>
                    <Text size="sm">
                      {customers.find(
                        (c) => c.id === orderForm.values.customerId,
                      )?.name || "-"}
                    </Text>
                    {orderForm.values.deadline && (
                      <>
                        <Text fw={600} mt="xs">
                          Deadline
                        </Text>
                        <Text size="sm">
                          {new Date(
                            orderForm.values.deadline,
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </Text>
                      </>
                    )}
                    {orderForm.values.notes && (
                      <>
                        <Text fw={600} mt="xs">
                          Catatan
                        </Text>
                        <Text size="sm" c="dimmed">
                          {orderForm.values.notes}
                        </Text>
                      </>
                    )}
                  </Stack>
                </Card>
                <Card withBorder>
                  <Stack gap="xs">
                    <Text fw={600}>Ringkasan Biaya</Text>
                    <Group justify="space-between">
                      <Text size="sm">Subtotal</Text>
                      <Text size="sm">{formatCurrency(subtotal)}</Text>
                    </Group>
                    {taxRate > 0 && (
                      <Group justify="space-between">
                        <Text size="sm">
                          PPN ({(taxRate * 100).toFixed(0)}%)
                        </Text>
                        <Text size="sm">{formatCurrency(tax)}</Text>
                      </Group>
                    )}
                    <Divider />
                    <Group justify="space-between">
                      <Text fw={700}>Total</Text>
                      <Text fw={700} c="aqua" size="lg">
                        {formatCurrency(total)}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Min. DP {MIN_DP_PERCENT}%:{" "}
                      {formatCurrency((total * MIN_DP_PERCENT) / 100)}
                    </Text>
                  </Stack>
                </Card>

                <Group grow>
                  <Button
                    variant="default"
                    leftSection={<IconDeviceFloppy size={16} />}
                    onClick={() => submitOrder(true)}
                  >
                    Simpan Draft
                  </Button>
                  <Button
                    leftSection={<IconSend size={16} />}
                    onClick={() => submitOrder(false)}
                  >
                    Kirim ke Kasir
                  </Button>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stepper.Step>
      </Stepper>

      {/* Navigation buttons */}
      {active < 3 && (
        <Group justify="space-between" mt="md">
          <Button
            variant="default"
            onClick={prevStep}
            disabled={active === 0}
            leftSection={<IconArrowLeft size={16} />}
          >
            Sebelumnya
          </Button>
          {active < 2 && (
            <Button
              onClick={nextStep}
              disabled={!canGoNext()}
              rightSection={<IconArrowRight size={16} />}
            >
              Selanjutnya
            </Button>
          )}
        </Group>
      )}

      {/* ===== MODAL TAMBAH PELANGGAN BARU ===== */}
      <Modal
        opened={customerModalOpened}
        onClose={closeCustomerModal}
        title="Tambah Pelanggan Baru"
        centered
      >
        <form onSubmit={customerForm.onSubmit(handleAddCustomer)}>
          <Stack gap="sm">
            <TextInput
              label="Nama Pelanggan"
              placeholder="Nama lengkap"
              required
              {...customerForm.getInputProps("name")}
            />
            <TextInput
              label="No. Telepon"
              placeholder="08xxx"
              {...customerForm.getInputProps("phone")}
            />
            <TextInput
              label="Email"
              placeholder="email@contoh.com"
              {...customerForm.getInputProps("email")}
            />
            <TextInput
              label="Perusahaan / Instansi"
              placeholder="Nama perusahaan (opsional)"
              {...customerForm.getInputProps("company")}
            />
            <Textarea
              label="Alamat"
              placeholder="Alamat lengkap (opsional)"
              rows={2}
              {...customerForm.getInputProps("address")}
            />
            <Group mt="md" grow>
              <Button variant="outline" onClick={closeCustomerModal}>
                Batal
              </Button>
              <Button type="submit" leftSection={<IconUserPlus size={16} />}>
                Simpan Pelanggan
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
