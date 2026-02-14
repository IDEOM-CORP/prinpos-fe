import { useState } from "react";
import { useFinishingStore } from "../../../shared/stores/finishingStore";
import {
  Title,
  Button,
  Table,
  Text,
  Group,
  ActionIcon,
  Card,
  TextInput,
  Badge,
} from "@mantine/core";
import { IconEdit, IconTrash, IconPlus, IconSearch } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { formatCurrency } from "../../../shared/utils";

const PRICING_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  per_unit: { label: "Per Unit", color: "blue" },
  per_area: { label: "Per m²", color: "orange" },
  flat: { label: "Flat", color: "gray" },
};

export default function FinishingListPage() {
  const { finishings, deleteFinishing } = useFinishingStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = finishings.filter(
    (fin) =>
      fin.name.toLowerCase().includes(search.toLowerCase()) ||
      (fin.description || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Hapus Finishing",
      children: (
        <Text>Yakin ingin menghapus finishing &quot;{name}&quot;?</Text>
      ),
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteFinishing(id);
        notifications.show({
          title: "Berhasil",
          message: `Finishing "${name}" berhasil dihapus`,
          color: "green",
        });
      },
    });
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Daftar Finishing</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate("/finishing/add")}
        >
          Tambah Finishing
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <TextInput
          placeholder="Cari finishing..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Card>

      {filtered.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            {finishings.length === 0
              ? "Belum ada data finishing. Klik Tambah Finishing untuk memulai."
              : "Tidak ada finishing ditemukan"}
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama</Table.Th>
                <Table.Th>Harga</Table.Th>
                <Table.Th>Jenis Harga</Table.Th>
                <Table.Th>Deskripsi</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((fin) => {
                const pt = PRICING_TYPE_LABELS[fin.pricingType] || {
                  label: fin.pricingType,
                  color: "gray",
                };
                return (
                  <Table.Tr key={fin.id} opacity={fin.isActive ? 1 : 0.5}>
                    <Table.Td>
                      <Text fw={500}>{fin.name}</Text>
                    </Table.Td>
                    <Table.Td>{formatCurrency(fin.price)}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={pt.color}>
                        {pt.label}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {fin.description || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="dot"
                        color={fin.isActive ? "green" : "gray"}
                      >
                        {fin.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          onClick={() => navigate(`/finishing/edit/${fin.id}`)}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(fin.id, fin.name)}
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
    </>
  );
}
