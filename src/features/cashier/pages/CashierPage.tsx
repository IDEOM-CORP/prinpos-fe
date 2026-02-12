import { useState } from "react";
import {
  Box,
  Card,
  Text,
  Button,
  Group,
  Stack,
  TextInput,
  Modal,
  Textarea,
  Divider,
  Tabs,
  Paper,
  ScrollArea,
  Flex,
  Image,
  Select,
  NumberInput,
  Radio,
  Menu,
  ActionIcon,
  Avatar,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconSearch,
  IconReceipt,
  IconCalendar,
  IconLogout,
  IconDashboard,
  IconChevronLeft,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import type { Item } from "../../../shared/types";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useCartStore } from "../../../shared/stores/cartStore";
import { useOrderStore } from "../../../shared/stores/orderStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { formatCurrency } from "../../../shared/utils";
import { TAX_RATE, ITEM_CATEGORIES, APP_NAME } from "../../../shared/constants";
import { ROUTES } from "../../../core/routes";
import CartItemCard from "../components/CartItemCard";
import AddProductModal from "../components/AddProductModal";

export default function CashierPage() {
  const items = useItemStore((state) => state.items);
  const cart = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addItem);
  const removeFromCart = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateDimensions = useCartStore((state) => state.updateDimensions);
  const updateMaterial = useCartStore((state) => state.updateMaterial);
  const updateFinishing = useCartStore((state) => state.updateFinishing);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const addOrder = useOrderStore((state) => state.addOrder);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [checkoutOpened, { open: openCheckout, close: closeCheckout }] =
    useDisclosure(false);
  const [
    productModalOpened,
    { open: openProductModal, close: closeProductModal },
  ] = useDisclosure(false);
  const [selectedProduct, setSelectedProduct] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

  const form = useForm({
    initialValues: {
      customerName: "",
      customerPhone: "",
      paymentType: "full",
      downPaymentAmount: 0,
      paymentMethod: "cash",
      deadline: null as Date | null,
      notes: "",
    },
    validate: {
      customerName: (value) =>
        value.trim() ? null : "Nama pelanggan wajib diisi",
      downPaymentAmount: (value, values) => {
        if (values.paymentType === "dp") {
          const total = getTotal() + getTotal() * TAX_RATE;
          if (value <= 0) return "DP harus lebih dari 0";
          if (value >= total)
            return "DP tidak boleh lebih dari atau sama dengan total";
        }
        return null;
      },
    },
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = getTotal();
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleProductClick = (item: Item) => {
    if (item.stock <= 0) return;

    // Check if area-based product
    if (item.pricingModel === "area" || item.pricePerSqm) {
      // Area-based products need dimensions input
      setSelectedProduct(item);
      openProductModal();
    } else {
      // Fixed price products can be added directly
      addToCart(item);
      // notifications.show({
      //   title: "Ditambahkan ke keranjang",
      //   message: `${item.name} berhasil ditambahkan`,
      //   color: "green",
      // });
    }
  };

  const handleAddProduct = (options: {
    quantity: number;
    width?: number;
    height?: number;
    material?: string;
    finishing?: string[];
  }) => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, options.quantity, {
      width: options.width,
      height: options.height,
      material: options.material,
      finishing: options.finishing,
    });
  };

  const handleCheckout = (values: typeof form.values) => {
    if (cart.length === 0) {
      notifications.show({
        title: "Keranjang Kosong",
        message: "Silakan tambahkan barang terlebih dahulu",
        color: "orange",
      });
      return;
    }

    if (!user) return;

    const paymentType = values.paymentType as "full" | "dp" | "installment";
    const downPayment =
      paymentType === "full" ? total : values.downPaymentAmount;
    const remainingPayment = paymentType === "full" ? 0 : total - downPayment;
    const paymentStatus = paymentType === "full" ? "paid" : "partial";

    const order = addOrder({
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      items: cart.map((c) => ({
        itemId: c.item.id,
        name: c.item.name,
        category: c.item.category,
        width: c.width,
        height: c.height,
        area: c.area,
        material: c.material,
        finishing: c.finishing,
        pricePerSqm: c.item.pricePerSqm,
        price:
          c.item.pricingModel === "area" && c.area && c.item.pricePerSqm
            ? c.area * c.item.pricePerSqm
            : c.item.price,
        quantity: c.quantity,
        subtotal:
          c.item.pricingModel === "area" && c.area && c.item.pricePerSqm
            ? c.area * c.item.pricePerSqm * c.quantity
            : c.item.price * c.quantity,
        notes: c.notes,
      })),
      subtotal,
      tax,
      total,
      paymentType,
      paymentStatus,
      downPayment,
      remainingPayment,
      paidAmount: downPayment,
      paymentMethod: values.paymentMethod,
      deadline: values.deadline?.toISOString(),
      status: "pending",
      branchId: user.branchId,
      businessId: user.businessId,
      createdBy: user.id,
      notes: values.notes,
    });

    // Update stock (only for non-area-based items)
    cart.forEach((c) => {
      if (c.item.pricingModel !== "area") {
        useItemStore.getState().updateStock(c.item.id, -c.quantity);
      }
    });

    notifications.show({
      title: "Order Berhasil",
      message: `Order ${order.orderNumber} telah dibuat${paymentType === "dp" ? " dengan DP " + formatCurrency(downPayment) : ""}`,
      color: "green",
    });

    clearCart();
    form.reset();
    closeCheckout();
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Fullscreen Header */}
      <Box
        style={{
          height: "60px",
          borderBottom: "1px solid var(--mantine-color-gray-3)",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
        }}
      >
        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            title="Kembali ke Dashboard"
          >
            <IconChevronLeft size={24} />
          </ActionIcon>
          <Text size="xl" fw={700} c="blue">
            {APP_NAME} - Kasir
          </Text>
        </Group>

        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" size="lg">
              <Avatar size="sm" radius="xl" color="blue">
                {user?.name.charAt(0).toUpperCase()}
              </Avatar>
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              {user?.name}
              <Text size="xs" c="dimmed">
                {user?.role}
              </Text>
            </Menu.Label>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconDashboard size={16} />}
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              Dashboard
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLogout size={16} />}
              color="red"
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>

      {/* Main Cashier Content */}
      <Box
        style={{
          display: "flex",
          height: "calc(100vh - 60px)",
          gap: 0,
          overflow: "hidden",
        }}
      >
        {/* Left Side - Product List */}
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--mantine-color-gray-3)",
          }}
        >
          {/* Search Bar */}
          <Box
            p="md"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
          >
            <TextInput
              placeholder="Cari produk..."
              leftSection={<IconSearch size={18} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="lg"
              radius="xl"
            />
          </Box>

          {/* Categories */}
          <Box
            p="md"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
          >
            <Tabs
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value || "Semua")}
            >
              <Tabs.List>
                <Tabs.Tab value="Semua">Semua</Tabs.Tab>
                {ITEM_CATEGORIES.map((category) => (
                  <Tabs.Tab key={category} value={category}>
                    {category}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </Box>

          {/* Product Grid */}
          <ScrollArea style={{ flex: 1 }} p="md">
            <Box
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "12px",
              }}
            >
              {filteredItems.map((item) => {
                const cartItem = cart.find((c) => c.item.id === item.id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <Card
                    key={item.id}
                    shadow="sm"
                    padding="xs"
                    radius="md"
                    withBorder
                    style={{
                      cursor: "pointer",
                      height: "250px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                    onClick={() => handleProductClick(item)}
                  >
                    {quantity > 0 && (
                      <Box
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "var(--mantine-color-blue-6)",
                          color: "white",
                          borderRadius: "50%",
                          width: 24,
                          height: 24,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          zIndex: 10,
                        }}
                      >
                        {quantity}
                      </Box>
                    )}

                    <Card.Section
                      style={{
                        position: "relative",
                        border: "solid 4px",
                      }}
                    >
                      <Image
                        src={item.imageUrl}
                        height={100}
                        alt={item.name}
                        fit="cover"
                      />
                    </Card.Section>

                    <Stack gap={4} mt="xs" style={{ flex: 1 }}>
                      <Text
                        fw={600}
                        size="sm"
                        lineClamp={2}
                        style={{ minHeight: "36px" }}
                      >
                        {item.name}
                      </Text>
                      <Text size="lg" fw={700} c="blue">
                        {formatCurrency(item.price)}
                      </Text>
                      <Text size="xs" c={item.stock > 0 ? "dimmed" : "red"}>
                        {item.stock > 0 ? `Stok: ${item.stock}` : "Habis"}
                      </Text>
                    </Stack>
                  </Card>
                );
              })}
            </Box>
          </ScrollArea>
        </Box>

        {/* Right Side - Cart & Checkout */}
        <Box
          style={{
            width: "400px",
            display: "flex",
            flexDirection: "column",
            background: "var(--mantine-color-gray-0)",
          }}
        >
          {/* Cart Header */}
          <Box
            p="md"
            style={{
              borderBottom: "1px solid var(--mantine-color-gray-3)",
              background: "white",
            }}
          >
            <Group justify="space-between">
              <Group gap="xs">
                <IconReceipt size={24} />
                <Text fw={700} size="lg">
                  Pesanan
                </Text>
              </Group>
              {cart.length > 0 && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={clearCart}
                >
                  Hapus Semua
                </Button>
              )}
            </Group>
          </Box>

          {/* Cart Items */}
          <ScrollArea style={{ flex: 1 }} p="md">
            {cart.length === 0 ? (
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "200px",
                }}
              >
                <Text c="dimmed" ta="center">
                  Belum ada pesanan
                </Text>
              </Box>
            ) : (
              <Stack gap="sm">
                {cart.map((cartItem) => (
                  <CartItemCard
                    key={cartItem.item.id}
                    cartItem={cartItem}
                    onRemove={() => removeFromCart(cartItem.item.id)}
                    onUpdateQuantity={(qty) =>
                      updateQuantity(cartItem.item.id, qty)
                    }
                    onUpdateDimensions={(w, h) =>
                      updateDimensions(cartItem.item.id, w, h)
                    }
                    onUpdateMaterial={(m) =>
                      updateMaterial(cartItem.item.id, m)
                    }
                    onUpdateFinishing={(f) =>
                      updateFinishing(cartItem.item.id, f)
                    }
                  />
                ))}
              </Stack>
            )}
          </ScrollArea>

          {/* Cart Summary & Checkout */}
          {cart.length > 0 && (
            <Box
              p="md"
              style={{
                borderTop: "1px solid var(--mantine-color-gray-3)",
                background: "white",
              }}
            >
              <Stack gap="xs">
                <Flex justify="space-between">
                  <Text>Subtotal</Text>
                  <Text fw={500}>{formatCurrency(subtotal)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text size="sm" c="dimmed">
                    Pajak (11%)
                  </Text>
                  <Text size="sm">{formatCurrency(tax)}</Text>
                </Flex>
                <Divider my="xs" />
                <Flex justify="space-between">
                  <Text size="xl" fw={700}>
                    Total
                  </Text>
                  <Text size="xl" fw={700} c="blue">
                    {formatCurrency(total)}
                  </Text>
                </Flex>
                <Button
                  size="xl"
                  fullWidth
                  mt="md"
                  onClick={openCheckout}
                  style={{ height: "60px", fontSize: "18px" }}
                >
                  Bayar {formatCurrency(total)}
                </Button>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Add Product Modal */}
        <AddProductModal
          opened={productModalOpened}
          onClose={closeProductModal}
          item={selectedProduct}
          onAdd={handleAddProduct}
        />

        {/* Checkout Modal */}
        <Modal
          opened={checkoutOpened}
          onClose={closeCheckout}
          title="Selesaikan Pembayaran"
          size="lg"
          centered
        >
          <form onSubmit={form.onSubmit(handleCheckout)}>
            <Stack gap="md">
              <Paper p="md" withBorder>
                <Stack gap="xs">
                  <Flex justify="space-between">
                    <Text fw={600}>Total Pembayaran</Text>
                    <Text size="xl" fw={700} c="blue">
                      {formatCurrency(total)}
                    </Text>
                  </Flex>
                  <Text size="sm" c="dimmed">
                    {getItemCount()} item • Subtotal: {formatCurrency(subtotal)}{" "}
                    + Pajak: {formatCurrency(tax)}
                  </Text>
                </Stack>
              </Paper>

              <Divider label="Data Pelanggan" labelPosition="center" />

              <TextInput
                label="Nama Pelanggan"
                placeholder="Masukkan nama pelanggan"
                required
                size="lg"
                {...form.getInputProps("customerName")}
              />
              <TextInput
                label="No. Telepon"
                placeholder="08xxxxxxxxxx"
                size="lg"
                {...form.getInputProps("customerPhone")}
              />

              <DateInput
                label="Deadline Pengerjaan (opsional)"
                placeholder="Pilih tanggal"
                leftSection={<IconCalendar size={18} />}
                size="lg"
                minDate={new Date()}
                {...form.getInputProps("deadline")}
              />

              <Divider label="Pembayaran" labelPosition="center" />

              <Radio.Group
                label="Tipe Pembayaran"
                {...form.getInputProps("paymentType")}
              >
                <Stack gap="xs" mt="xs">
                  <Radio value="full" label="Lunas (Full Payment)" />
                  <Radio value="dp" label="DP (Down Payment)" />
                </Stack>
              </Radio.Group>

              {form.values.paymentType === "dp" && (
                <Paper p="md" withBorder bg="orange.0">
                  <NumberInput
                    label="Jumlah DP"
                    placeholder="Masukkan jumlah DP"
                    leftSection="Rp"
                    thousandSeparator="."
                    decimalSeparator=","
                    min={0}
                    max={total - 1}
                    size="lg"
                    required
                    {...form.getInputProps("downPaymentAmount")}
                  />
                  {form.values.downPaymentAmount > 0 && (
                    <Text size="sm" c="dimmed" mt="xs">
                      Sisa tagihan:{" "}
                      {formatCurrency(total - form.values.downPaymentAmount)}
                    </Text>
                  )}
                </Paper>
              )}

              <Select
                label="Metode Pembayaran"
                data={[
                  { value: "cash", label: "Tunai (Cash)" },
                  { value: "transfer", label: "Transfer Bank" },
                  { value: "qris", label: "QRIS" },
                  { value: "e-wallet", label: "E-Wallet (OVO/GoPay/Dana)" },
                ]}
                size="lg"
                {...form.getInputProps("paymentMethod")}
              />

              <Textarea
                label="Catatan"
                placeholder="Catatan tambahan (opsional)"
                rows={3}
                {...form.getInputProps("notes")}
              />

              <Group mt="md">
                <Button variant="outline" onClick={closeCheckout} fullWidth>
                  Batal
                </Button>
                <Button type="submit" fullWidth size="lg">
                  {form.values.paymentType === "full"
                    ? `Bayar Lunas ${formatCurrency(total)}`
                    : `Bayar DP ${formatCurrency(form.values.downPaymentAmount || 0)}`}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Box>
    </Box>
  );
}
