import { useState } from "react";
import { useMaterialStore } from "../../../shared/stores/materialStore";
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

export default function MaterialListPage() {
  const { materials, deleteMaterial } = useMaterialStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = materials.filter(
    (mat) =>
      mat.name.toLowerCase().includes(search.toLowerCase()) ||
      (mat.description || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Hapus Material",
      children: <Text>Yakin ingin menghapus material &quot;{name}&quot;?</Text>,
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteMaterial(id);
        notifications.show({
          title: "Berhasil",
          message: `Material "${name}" berhasil dihapus`,
          color: "green",
        });
      },
    });
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Daftar Material</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate("/material/add")}
        >
          Tambah Material
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <TextInput
          placeholder="Cari material..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Card>

      {filtered.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">
            {materials.length === 0
              ? "Belum ada data material. Klik Tambah Material untuk memulai."
              : "Tidak ada material ditemukan"}
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama</Table.Th>
                <Table.Th>Harga</Table.Th>
                <Table.Th>Satuan</Table.Th>
                <Table.Th>Deskripsi</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((mat) => (
                <Table.Tr key={mat.id} opacity={mat.isActive ? 1 : 0.5}>
                  <Table.Td>
                    <Text fw={500}>{mat.name}</Text>
                  </Table.Td>
                  <Table.Td>{formatCurrency(mat.price)}</Table.Td>
                  <Table.Td>
                    <Badge variant="light">{mat.unit}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {mat.description || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="dot"
                      color={mat.isActive ? "green" : "gray"}
                    >
                      {mat.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        onClick={() => navigate(`/material/edit/${mat.id}`)}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(mat.id, mat.name)}
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
    </>
  );
}
