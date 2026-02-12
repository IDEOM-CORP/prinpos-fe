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
  PasswordInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { useUserStore } from "../../../shared/stores/userStore";
import { useBusinessStore } from "../../../shared/stores/businessStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import { USER_ROLES } from "../../../shared/constants";

export default function UsersPage() {
  const users = useUserStore((state) => state.users);
  const addUser = useUserStore((state) => state.addUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const branches = useBusinessStore((state) => state.branches);
  const currentUser = useAuthStore((state) => state.user);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      role: "",
      branchId: "",
      phone: "",
    },
    validate: {
      name: (value) => (value.trim() ? null : "Nama wajib diisi"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Email tidak valid"),
      password: (value) =>
        editingUser || value.length >= 6 ? null : "Password minimal 6 karakter",
      role: (value) => (value ? null : "Role wajib dipilih"),
      branchId: (value) => (value ? null : "Cabang wajib dipilih"),
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenModal = (userId?: string) => {
    if (userId) {
      const user = users.find((u) => u.id === userId);
      if (user) {
        form.setValues({
          name: user.name,
          email: user.email,
          password: "",
          role: user.role,
          branchId: user.branchId,
          phone: user.phone || "",
        });
        setEditingUser(userId);
      }
    } else {
      form.reset();
      setEditingUser(null);
    }
    open();
  };

  const handleSubmit = (values: typeof form.values) => {
    if (!currentUser) return;

    const userData: any = {
      name: values.name,
      email: values.email,
      role: values.role as any,
      branchId: values.branchId,
      businessId: currentUser.businessId,
      phone: values.phone,
    };

    if (editingUser) {
      if (values.password) {
        userData.password = values.password;
      }
      updateUser(editingUser, userData);
      notifications.show({
        title: "Berhasil",
        message: "User berhasil diupdate",
        color: "green",
      });
    } else {
      userData.password = values.password;
      addUser(userData);
      notifications.show({
        title: "Berhasil",
        message: "User berhasil ditambahkan",
        color: "green",
      });
    }

    close();
    form.reset();
    setEditingUser(null);
  };

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Hapus User",
      children: <Text>Yakin ingin menghapus user "{name}"?</Text>,
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteUser(id);
        notifications.show({
          title: "Berhasil",
          message: "User berhasil dihapus",
          color: "green",
        });
      },
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "red";
      case "kasir":
        return "aqua";
      case "produksi":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Daftar Users</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpenModal()}
        >
          Tambah User
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <TextInput
          placeholder="Cari user..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Card>

      {filteredUsers.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            Tidak ada user ditemukan
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Cabang</Table.Th>
                <Table.Th>Telepon</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.map((user) => {
                const branch = branches.find((b) => b.id === user.branchId);

                return (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text fw={500}>{user.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getRoleColor(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{branch?.name || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.phone || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          onClick={() => handleOpenModal(user.id)}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={user.id === currentUser?.id}
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
        title={editingUser ? "Edit User" : "Tambah User"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama"
              placeholder="Nama lengkap"
              required
              {...form.getInputProps("name")}
            />

            <TextInput
              label="Email"
              placeholder="email@example.com"
              required
              {...form.getInputProps("email")}
            />

            <PasswordInput
              label={
                editingUser
                  ? "Password (kosongkan jika tidak ingin mengubah)"
                  : "Password"
              }
              placeholder="Password"
              required={!editingUser}
              {...form.getInputProps("password")}
            />

            <Select
              label="Role"
              placeholder="Pilih role"
              data={[
                { value: USER_ROLES.OWNER, label: "Owner" },
                { value: USER_ROLES.KASIR, label: "Kasir" },
                { value: USER_ROLES.PRODUKSI, label: "Produksi" },
              ]}
              required
              {...form.getInputProps("role")}
            />

            <Select
              label="Cabang"
              placeholder="Pilih cabang"
              data={branches.map((b) => ({
                value: b.id,
                label: `${b.name} (${b.type})`,
              }))}
              required
              searchable
              {...form.getInputProps("branchId")}
            />

            <TextInput
              label="Telepon"
              placeholder="08xxxxxxxxxx"
              {...form.getInputProps("phone")}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={close}>
                Batal
              </Button>
              <Button type="submit">{editingUser ? "Update" : "Simpan"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
