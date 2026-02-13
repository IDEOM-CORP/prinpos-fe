import { useState } from "react";
import {
  Title,
  Button,
  Table,
  Group,
  TextInput,
  Modal,
  Stack,
  Textarea,
  Card,
  Text,
  ActionIcon,
  Badge,
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
  IconCategory,
} from "@tabler/icons-react";
import { useCategoryStore } from "../../../shared/stores/categoryStore";
import { useItemStore } from "../../../shared/stores/itemStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { formatDate } from "../../../shared/utils";

export default function CategoriesPage() {
  const categories = useCategoryStore((state) => state.categories);
  const addCategory = useCategoryStore((state) => state.addCategory);
  const updateCategory = useCategoryStore((state) => state.updateCategory);
  const deleteCategory = useCategoryStore((state) => state.deleteCategory);
  const items = useItemStore((state) => state.items);
  const user = useAuthStore((state) => state.user);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return "Nama kategori wajib diisi";
        const duplicate = categories.find(
          (c) =>
            c.name.toLowerCase() === value.trim().toLowerCase() &&
            c.id !== editingCategory,
        );
        if (duplicate) return "Kategori dengan nama ini sudah ada";
        return null;
      },
    },
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Count items per category
  const getItemCount = (categoryName: string) => {
    return items.filter((item) => item.category === categoryName).length;
  };

  const handleOpenModal = (categoryId?: string) => {
    if (categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) {
        form.setValues({
          name: cat.name,
          description: cat.description || "",
        });
        setEditingCategory(categoryId);
      }
    } else {
      form.reset();
      setEditingCategory(null);
    }
    open();
  };

  const handleSubmit = (values: typeof form.values) => {
    if (!user) return;

    if (editingCategory) {
      // If name changed, update all items with old category name
      const oldCategory = categories.find((c) => c.id === editingCategory);
      if (oldCategory && oldCategory.name !== values.name.trim()) {
        const itemsToUpdate = items.filter(
          (item) => item.category === oldCategory.name,
        );
        const updateItem = useItemStore.getState().updateItem;
        itemsToUpdate.forEach((item) => {
          updateItem(item.id, { category: values.name.trim() });
        });
      }

      updateCategory(editingCategory, {
        name: values.name.trim(),
        description: values.description.trim(),
      });
      notifications.show({
        title: "Berhasil",
        message: "Kategori berhasil diupdate",
        color: "green",
      });
    } else {
      addCategory({
        name: values.name.trim(),
        description: values.description.trim(),
        businessId: user.businessId,
      });
      notifications.show({
        title: "Berhasil",
        message: "Kategori berhasil ditambahkan",
        color: "green",
      });
    }

    close();
    form.reset();
    setEditingCategory(null);
  };

  const handleDelete = (id: string, name: string) => {
    const itemCount = getItemCount(name);

    modals.openConfirmModal({
      title: "Hapus Kategori",
      children: (
        <Stack gap="xs">
          <Text>Yakin ingin menghapus kategori "{name}"?</Text>
          {itemCount > 0 && (
            <Text size="sm" c="red" fw={500}>
              ⚠️ Ada {itemCount} barang yang menggunakan kategori ini. Barang
              tersebut tidak akan terhapus, tetapi kategorinya akan menjadi
              tidak terkategorikan.
            </Text>
          )}
        </Stack>
      ),
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteCategory(id);
        notifications.show({
          title: "Berhasil",
          message: "Kategori berhasil dihapus",
          color: "green",
        });
      },
    });
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Group gap="sm">
          <IconCategory size={28} />
          <Title order={2}>Kategori Barang</Title>
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpenModal()}
        >
          Tambah Kategori
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <TextInput
          placeholder="Cari kategori..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Card>

      {filteredCategories.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            {search
              ? "Tidak ada kategori ditemukan"
              : "Belum ada kategori. Tambahkan kategori pertama."}
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama Kategori</Table.Th>
                <Table.Th>Deskripsi</Table.Th>
                <Table.Th>Jumlah Barang</Table.Th>
                <Table.Th>Dibuat</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredCategories.map((cat) => {
                const itemCount = getItemCount(cat.name);

                return (
                  <Table.Tr key={cat.id}>
                    <Table.Td>
                      <Text fw={500}>{cat.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {cat.description || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={itemCount > 0 ? "aqua" : "gray"}
                      >
                        {itemCount} barang
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(cat.createdAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          onClick={() => handleOpenModal(cat.id)}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(cat.id, cat.name)}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setEditingCategory(null);
          form.reset();
        }}
        title={editingCategory ? "Edit Kategori" : "Tambah Kategori"}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama Kategori"
              placeholder="Contoh: Banner, Stiker, Brosur..."
              required
              {...form.getInputProps("name")}
            />

            <Textarea
              label="Deskripsi"
              placeholder="Deskripsi singkat kategori (opsional)"
              rows={3}
              {...form.getInputProps("description")}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={() => {
                  close();
                  setEditingCategory(null);
                  form.reset();
                }}
              >
                Batal
              </Button>
              <Button type="submit">
                {editingCategory ? "Update" : "Simpan"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
