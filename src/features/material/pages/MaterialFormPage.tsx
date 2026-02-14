import { useMaterialStore } from "../../../shared/stores/materialStore";
import { useForm } from "@mantine/form";
import {
  Button,
  TextInput,
  NumberInput,
  Title,
  Card,
  Stack,
  Group,
  Switch,
  Select,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { generateId } from "../../../shared/utils";
import { UNIT_OPTIONS } from "../../../shared/constants";

export default function MaterialFormPage() {
  const { addMaterial, updateMaterial, materials } = useMaterialStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = !!id;
  const mat = editing ? materials.find((m) => m.id === id) : undefined;

  const form = useForm({
    initialValues: {
      name: mat?.name || "",
      price: mat?.price || 0,
      unit: mat?.unit || "pcs",
      description: mat?.description || "",
      isActive: mat?.isActive ?? true,
    },
    validate: {
      name: (value) => (value.trim() ? null : "Nama material wajib diisi"),
      price: (value) => (value > 0 ? null : "Harga harus lebih dari 0"),
      unit: (value) => (value ? null : "Satuan wajib dipilih"),
    },
  });

  function handleSubmit(values: typeof form.values) {
    if (editing && mat) {
      updateMaterial(mat.id, { ...values });
      notifications.show({
        title: "Berhasil",
        message: "Material berhasil diupdate",
        color: "green",
      });
    } else {
      addMaterial({
        id: generateId(),
        name: values.name,
        price: values.price,
        unit: values.unit,
        description: values.description,
        businessId: "",
        createdAt: new Date().toISOString(),
        isActive: values.isActive,
      });
      notifications.show({
        title: "Berhasil",
        message: "Material berhasil ditambahkan",
        color: "green",
      });
    }
    navigate("/material");
  }

  return (
    <>
      <Title order={2} mb="xl">
        {editing ? "Edit Material" : "Tambah Material"}
      </Title>

      <Card shadow="sm" padding="lg" radius="md" withBorder maw={600}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama Material"
              placeholder="Contoh: Flexi Korea"
              required
              {...form.getInputProps("name")}
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
            <Select
              label="Satuan"
              placeholder="Pilih satuan"
              data={UNIT_OPTIONS}
              required
              {...form.getInputProps("unit")}
            />
            <TextInput
              label="Deskripsi"
              placeholder="Deskripsi opsional"
              {...form.getInputProps("description")}
            />
            <Switch
              label="Aktif"
              description="Nonaktifkan jika material tidak tersedia sementara"
              checked={form.values.isActive}
              onChange={(e) =>
                form.setFieldValue("isActive", e.currentTarget.checked)
              }
            />
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={() => navigate("/material")}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </>
  );
}
