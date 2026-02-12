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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { formatCurrency } from "../../../shared/utils";
import { ITEM_CATEGORIES, DUMMY_IMAGES } from "../../../shared/constants";

export default function ItemsPage() {
  const items = useItemStore((state) => state.items);
  const addItem = useItemStore((state) => state.addItem);
  const updateItem = useItemStore((state) => state.updateItem);
  const deleteItem = useItemStore((state) => state.deleteItem);
  const user = useAuthStore((state) => state.user);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      stock: 0,
      imageUrl: "",
    },
    validate: {
      name: (value) => (value.trim() ? null : "Nama wajib diisi"),
      price: (value) => (value > 0 ? null : "Harga harus lebih dari 0"),
      category: (value) => (value ? null : "Kategori wajib dipilih"),
      stock: (value) => (value >= 0 ? null : "Stok tidak boleh negatif"),
    },
  });

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenModal = (itemId?: string) => {
    if (itemId) {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        form.setValues({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          stock: item.stock,
          imageUrl: item.imageUrl,
        });
        setEditingItem(itemId);
      }
    } else {
      form.reset();
      setEditingItem(null);
    }
    open();
  };

  const handleSubmit = (values: typeof form.values) => {
    if (!user) return;

    if (editingItem) {
      updateItem(editingItem, values);
      notifications.show({
        title: "Berhasil",
        message: "Item berhasil diupdate",
        color: "green",
      });
    } else {
      addItem({
        ...values,
        businessId: user.businessId,
        pricingModel: "fixed",
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
      children: <Text>Yakin ingin menghapus item "{name}"?</Text>,
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
        <TextInput
          placeholder="Cari barang..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
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
                <Table.Th>Harga</Table.Th>
                <Table.Th>Stok</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredItems.map((item) => (
                <Table.Tr key={item.id}>
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
                  <Table.Td>
                    <Text fw={500}>{formatCurrency(item.price)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        item.stock > 10
                          ? "green"
                          : item.stock > 0
                            ? "orange"
                            : "red"
                      }
                    >
                      {item.stock}
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

      <Modal
        opened={opened}
        onClose={close}
        title={editingItem ? "Edit Barang" : "Tambah Barang"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama Barang"
              placeholder="Nama barang"
              required
              {...form.getInputProps("name")}
            />

            <Textarea
              label="Deskripsi"
              placeholder="Deskripsi barang"
              rows={3}
              {...form.getInputProps("description")}
            />

            <Select
              label="Kategori"
              placeholder="Pilih kategori"
              data={ITEM_CATEGORIES}
              required
              searchable
              {...form.getInputProps("category")}
            />

            <NumberInput
              label="Harga"
              placeholder="0"
              required
              min={0}
              prefix="Rp "
              thousandSeparator=","
              {...form.getInputProps("price")}
            />

            <NumberInput
              label="Stok"
              placeholder="0"
              required
              min={0}
              {...form.getInputProps("stock")}
            />

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
              <Button type="submit">{editingItem ? "Update" : "Simpan"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
