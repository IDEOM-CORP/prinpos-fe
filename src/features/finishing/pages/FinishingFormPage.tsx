import { useFinishingStore } from "../../../shared/stores/finishingStore";
import { useForm } from "@mantine/form";
import {
  Button,
  TextInput,
  NumberInput,
  Select,
  Title,
  Card,
  Stack,
  Group,
  Switch,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { generateId } from "../../../shared/utils";

const pricingTypes = [
  { value: "per_unit", label: "Per Unit" },
  { value: "per_area", label: "Per m²" },
  { value: "flat", label: "Flat (sekali bayar)" },
];

export default function FinishingFormPage() {
  const { addFinishing, updateFinishing, finishings } = useFinishingStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = !!id;
  const fin = editing ? finishings.find((f) => f.id === id) : undefined;

  const form = useForm({
    initialValues: {
      name: fin?.name || "",
      price: fin?.price || 0,
      pricingType: fin?.pricingType || "per_unit",
      description: fin?.description || "",
      isActive: fin?.isActive ?? true,
    },
    validate: {
      name: (value) => (value.trim() ? null : "Nama finishing wajib diisi"),
      price: (value) => (value > 0 ? null : "Harga harus lebih dari 0"),
    },
  });

  function handleSubmit(values: typeof form.values) {
    if (editing && fin) {
      updateFinishing(fin.id, { ...values });
      notifications.show({
        title: "Berhasil",
        message: "Finishing berhasil diupdate",
        color: "green",
      });
    } else {
      addFinishing({
        id: generateId(),
        name: values.name,
        price: values.price,
        pricingType: values.pricingType as "per_unit" | "per_area" | "flat",
        description: values.description,
        businessId: "",
        createdAt: new Date().toISOString(),
        isActive: values.isActive,
      });
      notifications.show({
        title: "Berhasil",
        message: "Finishing berhasil ditambahkan",
        color: "green",
      });
    }
    navigate("/finishing");
  }

  return (
    <>
      <Title order={2} mb="xl">
        {editing ? "Edit Finishing" : "Tambah Finishing"}
      </Title>

      <Card shadow="sm" padding="lg" radius="md" withBorder maw={600}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama Finishing"
              placeholder="Contoh: Laminating Glossy"
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
              label="Jenis Harga"
              data={pricingTypes}
              required
              {...form.getInputProps("pricingType")}
            />
            <TextInput
              label="Deskripsi"
              placeholder="Deskripsi opsional"
              {...form.getInputProps("description")}
            />
            <Switch
              label="Aktif"
              description="Nonaktifkan jika finishing tidak tersedia sementara"
              checked={form.values.isActive}
              onChange={(e) =>
                form.setFieldValue("isActive", e.currentTarget.checked)
              }
            />
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={() => navigate("/finishing")}>
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
