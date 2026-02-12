import { useState } from "react";
import {
  Title,
  Button,
  Table,
  Group,
  TextInput,
  Modal,
  Stack,
  Select,
  Card,
  Text,
  Badge,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { BRANCH_TYPES } from "../../../shared/constants";

export default function BranchesPage() {
  const branches = useBusinessStore((state) => state.branches);
  const businesses = useBusinessStore((state) => state.businesses);
  const addBranch = useBusinessStore((state) => state.addBranch);
  const updateBranch = useBusinessStore((state) => state.updateBranch);
  const deleteBranch = useBusinessStore((state) => state.deleteBranch);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm({
    initialValues: {
      name: "",
      type: "",
      businessId: "",
      address: "",
      phone: "",
    },
    validate: {
      name: (value) => (value.trim() ? null : "Nama wajib diisi"),
      type: (value) => (value ? null : "Tipe wajib dipilih"),
      businessId: (value) => (value ? null : "Bisnis wajib dipilih"),
      address: (value) => (value.trim() ? null : "Alamat wajib diisi"),
      phone: (value) => (value.trim() ? null : "Telepon wajib diisi"),
    },
  });

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenModal = (branchId?: string) => {
    if (branchId) {
      const branch = branches.find((b) => b.id === branchId);
      if (branch) {
        form.setValues({
          name: branch.name,
          type: branch.type,
          businessId: branch.businessId,
          address: branch.address,
          phone: branch.phone,
        });
        setEditingBranch(branchId);
      }
    } else {
      form.reset();
      setEditingBranch(null);
    }
    open();
  };

  const handleSubmit = (values: typeof form.values) => {
    if (editingBranch) {
      updateBranch(editingBranch, values as any);
      notifications.show({
        title: "Berhasil",
        message: "Cabang berhasil diupdate",
        color: "green",
      });
    } else {
      addBranch(values as any);
      notifications.show({
        title: "Berhasil",
        message: "Cabang berhasil ditambahkan",
        color: "green",
      });
    }

    close();
    form.reset();
    setEditingBranch(null);
  };

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Hapus Cabang",
      children: <Text>Yakin ingin menghapus cabang "{name}"?</Text>,
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteBranch(id);
        notifications.show({
          title: "Berhasil",
          message: "Cabang berhasil dihapus",
          color: "green",
        });
      },
    });
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Daftar Cabang</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpenModal()}
        >
          Tambah Cabang
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <TextInput
          placeholder="Cari cabang..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Card>

      {filteredBranches.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            Tidak ada cabang ditemukan
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama</Table.Th>
                <Table.Th>Tipe</Table.Th>
                <Table.Th>Bisnis</Table.Th>
                <Table.Th>Alamat</Table.Th>
                <Table.Th>Telepon</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredBranches.map((branch) => {
                const org = businesses.find((o) => o.id === branch.businessId);

                return (
                  <Table.Tr key={branch.id}>
                    <Table.Td>
                      <Text fw={500}>{branch.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={branch.type === "outlet" ? "aqua" : "green"}
                      >
                        {branch.type.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{org?.name || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{branch.address}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{branch.phone}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          onClick={() => handleOpenModal(branch.id)}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(branch.id, branch.name)}
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

      <Modal
        opened={opened}
        onClose={close}
        title={editingBranch ? "Edit Cabang" : "Tambah Cabang"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama Cabang"
              placeholder="Nama cabang"
              required
              {...form.getInputProps("name")}
            />

            <Select
              label="Tipe"
              placeholder="Pilih tipe"
              data={[
                { value: BRANCH_TYPES.OUTLET, label: "Outlet" },
                { value: BRANCH_TYPES.PRODUKSI, label: "Produksi" },
              ]}
              required
              {...form.getInputProps("type")}
            />

            <Select
              label="Bisnis"
              placeholder="Pilih organisasi"
              data={businesses.map((o) => ({ value: o.id, label: o.name }))}
              required
              searchable
              {...form.getInputProps("businessId")}
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

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={close}>
                Batal
              </Button>
              <Button type="submit">
                {editingBranch ? "Update" : "Simpan"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
