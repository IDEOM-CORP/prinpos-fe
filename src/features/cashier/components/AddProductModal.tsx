import { useState, useMemo } from "react";
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
  Badge,
} from "@mantine/core";
import type { Item } from "../../../shared/types";
import { formatCurrency } from "../../../shared/utils";

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
  const isTiered = item?.pricingModel === "tiered";
  const area = width && height ? width * height : 0;

  // Material options: use item-specific if available, otherwise empty
  const materialData = useMemo(() => {
    if (!item?.materialOptions || item.materialOptions.length === 0) return [];
    return item.materialOptions;
  }, [item]);

  // Finishing options: use item-specific if available
  const finishingData = useMemo(() => {
    if (!item?.finishingOptions || item.finishingOptions.length === 0)
      return [];
    return item.finishingOptions.map((fo) => ({
      value: fo.name,
      label: `${fo.name} (+${formatCurrency(fo.price)})`,
    }));
  }, [item]);

  // Get tiered price for the current quantity
  const getTieredPrice = (qty: number): number => {
    if (!item?.tiers || item.tiers.length === 0) return item?.price || 0;
    for (const tier of item.tiers) {
      if (qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty)) {
        return tier.price;
      }
    }
    // Fallback: use last tier if quantity exceeds all
    const lastTier = item.tiers[item.tiers.length - 1];
    if (lastTier && lastTier.maxQty === null) return lastTier.price;
    return item.price;
  };

  // Calculate finishing add-on total
  const finishingTotal = useMemo(() => {
    if (!item?.finishingOptions || finishing.length === 0) return 0;
    return finishing.reduce((sum, fName) => {
      const opt = item.finishingOptions?.find((fo) => fo.name === fName);
      return sum + (opt?.price || 0);
    }, 0);
  }, [finishing, item]);

  const calculateTotal = () => {
    if (!item) return 0;

    let baseTotal = 0;

    if (isAreaBased && area && item.pricePerSqm) {
      baseTotal = area * item.pricePerSqm * quantity;
    } else if (isTiered) {
      const unitPrice = getTieredPrice(quantity);
      baseTotal = unitPrice * quantity;
    } else {
      baseTotal = item.price * quantity;
    }

    // Add finishing costs (per unit/per piece)
    const finishingCost = finishingTotal * quantity;

    // Add setup fee (one-time)
    const setupFee = item.setupFee || 0;

    return baseTotal + finishingCost + setupFee;
  };

  const minOrder = item?.minOrder || 1;

  const handleAdd = () => {
    if (!item) return;

    if (isAreaBased && (!width || !height)) {
      return;
    }

    if (quantity < minOrder) {
      return;
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
    setQuantity(1);
    setWidth(0);
    setHeight(0);
    setMaterial("");
    setFinishing([]);
    onClose();
  };

  if (!item) return null;

  const total = calculateTotal();
  const areaUnitLabel = item.areaUnit === "cm" ? "cm" : "meter";
  const areaSqLabel = item.areaUnit === "cm" ? "cm²" : "m²";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Tambah: ${item.name}`}
      size="md"
      centered
    >
      <Stack gap="md">
        {/* Area-based dimensions */}
        {isAreaBased && (
          <>
            <Group grow>
              <NumberInput
                label={`Panjang (${areaUnitLabel})`}
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
                label={`Lebar (${areaUnitLabel})`}
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
              <Paper p="sm" withBorder bg="aqua.0">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Luas Area
                  </Text>
                  <Text size="lg" fw={700} c="aqua">
                    {area.toFixed(2)} {areaSqLabel}
                  </Text>
                </Group>
                {item.pricePerSqm && (
                  <Text size="xs" c="dimmed" mt={4}>
                    {formatCurrency(item.pricePerSqm)} / {areaSqLabel}
                  </Text>
                )}
              </Paper>
            )}
          </>
        )}

        {/* Tiered pricing info */}
        {isTiered && item.tiers && item.tiers.length > 0 && (
          <Paper p="sm" withBorder bg="violet.0">
            <Text size="sm" fw={500} c="violet.8" mb="xs">
              Harga Bertingkat
            </Text>
            <Stack gap={4}>
              {item.tiers.map((tier, idx) => {
                const isActive =
                  quantity >= tier.minQty &&
                  (tier.maxQty === null || quantity <= tier.maxQty);
                return (
                  <Group key={idx} justify="space-between">
                    <Text
                      size="sm"
                      fw={isActive ? 700 : 400}
                      c={isActive ? "violet.8" : "dimmed"}
                    >
                      {tier.minQty}
                      {tier.maxQty ? ` – ${tier.maxQty}` : "+"} {item.unit}
                    </Text>
                    <Badge
                      variant={isActive ? "filled" : "light"}
                      color="violet"
                      size="sm"
                    >
                      {formatCurrency(tier.price)}/{item.unit}
                    </Badge>
                  </Group>
                );
              })}
            </Stack>
          </Paper>
        )}

        {/* Fixed price display */}
        {!isAreaBased && !isTiered && (
          <Paper p="md" withBorder>
            <Text size="sm" c="dimmed" mb="xs">
              Harga Satuan
            </Text>
            <Text size="xl" fw={700} c="aqua">
              {formatCurrency(item.price)}/{item.unit}
            </Text>
          </Paper>
        )}

        {/* Material selection (item-specific) */}
        {materialData.length > 0 && (
          <Select
            label="Material"
            placeholder="Pilih material"
            data={materialData}
            value={material}
            onChange={(val) => setMaterial(val || "")}
            searchable
            size="lg"
          />
        )}

        {/* Finishing options (item-specific with prices) */}
        {finishingData.length > 0 && (
          <MultiSelect
            label="Finishing (opsional)"
            placeholder="Pilih finishing"
            data={finishingData}
            value={finishing}
            onChange={setFinishing}
            searchable
            size="lg"
          />
        )}

        {/* Quantity */}
        <NumberInput
          label={`Jumlah (${item.unit})`}
          placeholder="1"
          value={quantity}
          onChange={(val) => setQuantity(Number(val) || 1)}
          min={minOrder}
          size="lg"
          required
          description={
            minOrder > 1 ? `Min. order: ${minOrder} ${item.unit}` : undefined
          }
        />

        <Divider />

        {/* Total breakdown */}
        <Paper p="md" withBorder bg="aqua.0">
          <Stack gap="xs">
            {/* Unit price line */}
            {isTiered && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Harga per {item.unit}
                </Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(getTieredPrice(quantity))}
                </Text>
              </Group>
            )}

            {isAreaBased && area > 0 && item.pricePerSqm && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Area
                </Text>
                <Text size="sm">
                  {area.toFixed(2)} {areaSqLabel} ×{" "}
                  {formatCurrency(item.pricePerSqm)}
                </Text>
              </Group>
            )}

            {finishingTotal > 0 && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Finishing
                </Text>
                <Text size="sm">
                  +{formatCurrency(finishingTotal)} × {quantity}
                </Text>
              </Group>
            )}

            {item.setupFee ? (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Biaya Setup
                </Text>
                <Text size="sm">+{formatCurrency(item.setupFee)}</Text>
              </Group>
            ) : null}

            <Divider />

            <Group justify="space-between">
              <Text fw={500}>Total Harga</Text>
              <Text size="xl" fw={700} c="aqua">
                {formatCurrency(total)}
              </Text>
            </Group>
          </Stack>
        </Paper>

        <Group grow>
          <Button variant="outline" onClick={handleClose} size="lg">
            Batal
          </Button>
          <Button
            onClick={handleAdd}
            size="lg"
            disabled={
              (isAreaBased && (!width || !height)) || quantity < minOrder
            }
          >
            Tambah ke Keranjang
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
