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
  Badge,
  ActionIcon,
  ScrollArea,
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
  IconPhone,
  IconMail,
  IconBuilding,
} from "@tabler/icons-react";
import { useCustomerStore } from "../../../shared/stores/customerStore";
import { useAuthStore } from "../../../shared/stores/authStore";

interface FormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  company: string;
  notes: string;
}

export default function CustomersPage() {
  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const deleteCustomer = useCustomerStore((state) => state.deleteCustomer);
  const user = useAuthStore((state) => state.user);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      company: "",
      notes: "",
    },
    validate: {
      name: (value) => (value.trim() ? null : "Nama pelanggan wajib diisi"),
    },
  });

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const handleOpenModal = (customerId?: string) => {
    if (customerId) {
      const cust = customers.find((c) => c.id === customerId);
      if (cust) {
        form.setValues({
          name: cust.name,
          phone: cust.phone || "",
          email: cust.email || "",
          address: cust.address || "",
          company: cust.company || "",
          notes: cust.notes || "",
        });
        setEditingId(customerId);
      }
    } else {
      form.reset();
      setEditingId(null);
    }
    open();
  };

  const handleSubmit = (values: FormValues) => {
    if (!user) return;

    const data = {
      name: values.name,
      phone: values.phone || undefined,
      email: values.email || undefined,
      address: values.address || undefined,
      company: values.company || undefined,
      notes: values.notes || undefined,
    };

    if (editingId) {
      updateCustomer(editingId, data);
      notifications.show({
        title: "Berhasil",
        message: "Data pelanggan berhasil diupdate",
        color: "green",
      });
    } else {
      addCustomer({ ...data, businessId: user.businessId });
      notifications.show({
        title: "Berhasil",
        message: "Pelanggan berhasil ditambahkan",
        color: "green",
      });
    }

    close();
    form.reset();
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Hapus Pelanggan",
      children: (
        <Text>Yakin ingin menghapus pelanggan &quot;{name}&quot;?</Text>
      ),
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteCustomer(id);
        notifications.show({
          title: "Berhasil",
          message: "Pelanggan berhasil dihapus",
          color: "green",
        });
      },
    });
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Daftar Pelanggan</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpenModal()}
        >
          Tambah Pelanggan
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <TextInput
          placeholder="Cari pelanggan (nama, telepon, perusahaan, email)..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Card>

      {filteredCustomers.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            Tidak ada pelanggan ditemukan
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nama</Table.Th>
                  <Table.Th>Telepon</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Perusahaan</Table.Th>
                  <Table.Th>Alamat</Table.Th>
                  <Table.Th>Catatan</Table.Th>
                  <Table.Th>Aksi</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredCustomers.map((cust) => (
                  <Table.Tr key={cust.id}>
                    <Table.Td>
                      <Text fw={500}>{cust.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      {cust.phone ? (
                        <Group gap={4}>
                          <IconPhone size={14} />
                          <Text size="sm">{cust.phone}</Text>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {cust.email ? (
                        <Group gap={4}>
                          <IconMail size={14} />
                          <Text size="sm">{cust.email}</Text>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {cust.company ? (
                        <Badge
                          variant="light"
                          color="aqua"
                          leftSection={<IconBuilding size={12} />}
                        >
                          {cust.company}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">
                          Perorangan
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={1}>
                        {cust.address || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {cust.notes || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          onClick={() => handleOpenModal(cust.id)}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(cust.id, cust.name)}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* ========== MODAL FORM ========== */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? "Edit Pelanggan" : "Tambah Pelanggan"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama Pelanggan"
              placeholder="Nama lengkap atau nama perusahaan"
              required
              {...form.getInputProps("name")}
            />

            <Group grow>
              <TextInput
                label="No. Telepon"
                placeholder="08xxxxxxxxxx"
                leftSection={<IconPhone size={14} />}
                {...form.getInputProps("phone")}
              />
              <TextInput
                label="Email"
                placeholder="email@contoh.com"
                leftSection={<IconMail size={14} />}
                {...form.getInputProps("email")}
              />
            </Group>

            <TextInput
              label="Perusahaan / Instansi"
              placeholder="Nama perusahaan (opsional)"
              leftSection={<IconBuilding size={14} />}
              {...form.getInputProps("company")}
            />

            <Textarea
              label="Alamat"
              placeholder="Alamat lengkap"
              rows={2}
              {...form.getInputProps("address")}
            />

            <Textarea
              label="Catatan"
              placeholder="Catatan khusus (opsional)"
              rows={2}
              {...form.getInputProps("notes")}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={close}>
                Batal
              </Button>
              <Button type="submit">{editingId ? "Update" : "Simpan"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
