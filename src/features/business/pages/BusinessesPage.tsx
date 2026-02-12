import { useState } from "react";
import {
  Title,
  Button,
  Table,
  Group,
  TextInput,
  Modal,
  Stack,
  Card,
  Text,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { useBusinessStore } from "../../../shared/stores/businessStore";

export default function BusinessesPage() {
  const businesses = useBusinessStore((state) => state.businesses);
  const addBusiness = useBusinessStore((state) => state.addBusiness);
  const updateBusiness = useBusinessStore((state) => state.updateBusiness);
  const deleteBusiness = useBusinessStore((state) => state.deleteBusiness);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingBiz, setEditingOrg] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm({
    initialValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
    },
    validate: {
      name: (value) => (value.trim() ? null : "Nama wajib diisi"),
      address: (value) => (value.trim() ? null : "Alamat wajib diisi"),
      phone: (value) => (value.trim() ? null : "Telepon wajib diisi"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Email tidak valid"),
    },
  });

  const filteredBiz = businesses.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenModal = (orgId?: string) => {
    if (orgId) {
      const org = businesses.find((o) => o.id === orgId);
      if (org) {
        form.setValues({
          name: org.name,
          address: org.address,
          phone: org.phone,
          email: org.email,
        });
        setEditingOrg(orgId);
      }
    } else {
      form.reset();
      setEditingOrg(null);
    }
    open();
  };

  const handleSubmit = (values: typeof form.values) => {
    if (editingBiz) {
      updateBusiness(editingBiz, values);
      notifications.show({
        title: "Berhasil",
        message: "Bisnis berhasil diupdate",
        color: "green",
      });
    } else {
      addBusiness(values);
      notifications.show({
        title: "Berhasil",
        message: "Bisnis berhasil ditambahkan",
        color: "green",
      });
    }

    close();
    form.reset();
    setEditingOrg(null);
  };

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Hapus Bisnis",
      children: (
        <Text>
          Yakin ingin menghapus organisasi "{name}"? Semua cabang terkait akan
          ikut terhapus.
        </Text>
      ),
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteBusiness(id);
        notifications.show({
          title: "Berhasil",
          message: "Bisnis berhasil dihapus",
          color: "green",
        });
      },
    });
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Daftar Bisnis</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpenModal()}
        >
          Tambah Bisnis
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <TextInput
          placeholder="Cari organisasi..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Card>

      {filteredBiz.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            Tidak ada organisasi ditemukan
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama</Table.Th>
                <Table.Th>Alamat</Table.Th>
                <Table.Th>Telepon</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredBiz.map((org) => (
                <Table.Tr key={org.id}>
                  <Table.Td>
                    <Text fw={500}>{org.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{org.address}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{org.phone}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{org.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        onClick={() => handleOpenModal(org.id)}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(org.id, org.name)}
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
        title={editingBiz ? "Edit Bisnis" : "Tambah Bisnis"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama Bisnis"
              placeholder="Nama organisasi"
              required
              {...form.getInputProps("name")}
            />

            <TextInput
              label="Alamat"
              placeholder="Alamat lengkap"
              required
              {...form.getInputProps("address")}
            />

            <TextInput
              label="Telepon"
              placeholder="021-xxxxxxxx"
              required
              {...form.getInputProps("phone")}
            />

            <TextInput
              label="Email"
              placeholder="email@example.com"
              required
              {...form.getInputProps("email")}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={close}>
                Batal
              </Button>
              <Button type="submit">{editingBiz ? "Update" : "Simpan"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
