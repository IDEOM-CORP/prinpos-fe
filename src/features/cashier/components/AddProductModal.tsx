import { useState } from "react";
import {
  Modal,
  Stack,
  NumberInput,
  Select,
  MultiSelect,
  Button,
  Text,
  Group,
  Divider,
  Paper,
} from "@mantine/core";
import type { Item } from "../../../shared/types";
import { formatCurrency } from "../../../shared/utils";
import { MATERIALS, FINISHING_OPTIONS } from "../../../shared/constants";

interface AddProductModalProps {
  opened: boolean;
  onClose: () => void;
  item: Item | null;
  onAdd: (options: {
    quantity: number;
    width?: number;
    height?: number;
    material?: string;
    finishing?: string[];
  }) => void;
}

export default function AddProductModal({
  opened,
  onClose,
  item,
  onAdd,
}: AddProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [material, setMaterial] = useState<string>("");
  const [finishing, setFinishing] = useState<string[]>([]);

  const isAreaBased = item?.pricingModel === "area";
  const area = width && height ? width * height : 0;

  const calculateTotal = () => {
    if (!item) return 0;

    if (isAreaBased && area && item.pricePerSqm) {
      return area * item.pricePerSqm * quantity;
    }
    return item.price * quantity;
  };

  const handleAdd = () => {
    if (!item) return;

    if (isAreaBased && (!width || !height)) {
      return; // Validation handled by button disabled state
    }

    onAdd({
      quantity,
      width: isAreaBased ? width : undefined,
      height: isAreaBased ? height : undefined,
      material: material || undefined,
      finishing: finishing.length > 0 ? finishing : undefined,
    });

    // Reset form
    setQuantity(1);
    setWidth(0);
    setHeight(0);
    setMaterial("");
    setFinishing([]);
    onClose();
  };

  const handleClose = () => {
    // Reset form on close
    setQuantity(1);
    setWidth(0);
    setHeight(0);
    setMaterial("");
    setFinishing([]);
    onClose();
  };

  if (!item) return null;

  const total = calculateTotal();

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Tambah: ${item.name}`}
      size="md"
      centered
    >
      <Stack gap="md">
        {isAreaBased ? (
          <>
            <Group grow>
              <NumberInput
                label="Panjang (meter)"
                placeholder="0.0"
                value={width || ""}
                onChange={(val) => setWidth(Number(val) || 0)}
                min={0}
                step={0.1}
                decimalScale={2}
                required
                size="lg"
              />
              <NumberInput
                label="Lebar (meter)"
                placeholder="0.0"
                value={height || ""}
                onChange={(val) => setHeight(Number(val) || 0)}
                min={0}
                step={0.1}
                decimalScale={2}
                required
                size="lg"
              />
            </Group>

            {area > 0 && (
              <Paper p="sm" withBorder bg="blue.0">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Luas Area
                  </Text>
                  <Text size="lg" fw={700} c="blue">
                    {area.toFixed(2)} m²
                  </Text>
                </Group>
                {item.pricePerSqm && (
                  <Text size="xs" c="dimmed" mt={4}>
                    {formatCurrency(item.pricePerSqm)} / m²
                  </Text>
                )}
              </Paper>
            )}

            <Select
              label="Material"
              placeholder="Pilih material"
              data={MATERIALS}
              value={material}
              onChange={(val) => setMaterial(val || "")}
              searchable
              size="lg"
            />

            <MultiSelect
              label="Finishing (opsional)"
              placeholder="Pilih finishing"
              data={FINISHING_OPTIONS}
              value={finishing}
              onChange={setFinishing}
              searchable
              size="lg"
            />
          </>
        ) : (
          <Paper p="md" withBorder>
            <Text size="sm" c="dimmed" mb="xs">
              Harga Satuan
            </Text>
            <Text size="xl" fw={700} c="blue">
              {formatCurrency(item.price)}
            </Text>
          </Paper>
        )}

        <NumberInput
          label="Jumlah"
          placeholder="1"
          value={quantity}
          onChange={(val) => setQuantity(Number(val) || 1)}
          min={1}
          max={item.stock}
          size="lg"
          required
        />

        <Divider />

        <Paper p="md" withBorder bg="gray.0">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={500}>Total Harga</Text>
              <Text size="xl" fw={700} c="blue">
                {formatCurrency(total)}
              </Text>
            </Group>
            {isAreaBased && area > 0 && item.pricePerSqm && (
              <Text size="xs" c="dimmed">
                {area.toFixed(2)} m² × {formatCurrency(item.pricePerSqm)} ×{" "}
                {quantity} pcs
              </Text>
            )}
          </Stack>
        </Paper>

        <Group grow>
          <Button variant="outline" onClick={handleClose} size="lg">
            Batal
          </Button>
          <Button
            onClick={handleAdd}
            size="lg"
            disabled={isAreaBased && (!width || !height)}
          >
            Tambah ke Keranjang
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
