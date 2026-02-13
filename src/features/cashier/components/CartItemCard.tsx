import { useState } from "react";
import {
  Paper,
  Group,
  Stack,
  Text,
  ActionIcon,
  NumberInput,
  Select,
  MultiSelect,
  Button,
  Collapse,
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconMinus,
  IconSettings,
} from "@tabler/icons-react";
import type { CartItem } from "../../../shared/types";
import { formatCurrency } from "../../../shared/utils";

interface CartItemCardProps {
  cartItem: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onUpdateDimensions?: (width: number, height: number) => void;
  onUpdateMaterial?: (material: string) => void;
  onUpdateFinishing?: (finishing: string[]) => void;
}

export default function CartItemCard({
  cartItem,
  onRemove,
  onUpdateQuantity,
  onUpdateDimensions,
  onUpdateMaterial,
  onUpdateFinishing,
}: CartItemCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [width, setWidth] = useState(cartItem.width || 0);
  const [height, setHeight] = useState(cartItem.height || 0);

  const isAreaBased = cartItem.item.pricingModel === "area";
  const hasOptions =
    isAreaBased ||
    (cartItem.item.materialOptions &&
      cartItem.item.materialOptions.length > 0) ||
    (cartItem.item.finishingOptions &&
      cartItem.item.finishingOptions.length > 0);

  const calculateItemTotal = () => {
    if (isAreaBased && cartItem.area && cartItem.item.pricePerSqm) {
      return cartItem.area * cartItem.item.pricePerSqm * cartItem.quantity;
    }
    if (
      cartItem.item.pricingModel === "tiered" &&
      cartItem.item.tiers &&
      cartItem.item.tiers.length > 0
    ) {
      let unitPrice = cartItem.item.price;
      for (const tier of cartItem.item.tiers) {
        if (
          cartItem.quantity >= tier.minQty &&
          (tier.maxQty === null || cartItem.quantity <= tier.maxQty)
        ) {
          unitPrice = tier.price;
          break;
        }
      }
      return unitPrice * cartItem.quantity;
    }
    return cartItem.item.price * cartItem.quantity;
  };

  const handleDimensionChange = () => {
    if (width > 0 && height > 0 && onUpdateDimensions) {
      onUpdateDimensions(width, height);
    }
  };

  return (
    <Paper p="sm" withBorder>
      <Group justify="space-between" align="flex-start" mb="xs">
        <Stack gap={4} style={{ flex: 1 }}>
          <Text fw={500} size="sm">
            {cartItem.item.name}
          </Text>
          {isAreaBased && cartItem.area && (
            <Text size="xs" c="dimmed">
              {cartItem.width}m × {cartItem.height}m ={" "}
              {cartItem.area.toFixed(2)}m²
            </Text>
          )}
          {cartItem.material && (
            <Text size="xs" c="aqua">
              Material: {cartItem.material}
            </Text>
          )}
          {cartItem.finishing && cartItem.finishing.length > 0 && (
            <Text size="xs" c="green">
              Finishing: {cartItem.finishing.join(", ")}
            </Text>
          )}
        </Stack>
        <Group gap="xs">
          {hasOptions && (
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
            >
              <IconSettings size={16} />
            </ActionIcon>
          )}
          <ActionIcon color="red" variant="subtle" size="sm" onClick={onRemove}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Collapse in={showOptions}>
        <Stack
          gap="xs"
          mb="sm"
          p="xs"
          style={{
            background: "#FAF5EE",
            borderRadius: "4px",
          }}
        >
          <Group grow>
            <NumberInput
              label="Panjang (m)"
              value={width}
              onChange={(val) => setWidth(Number(val) || 0)}
              min={0}
              step={0.1}
              decimalScale={2}
              size="xs"
            />
            <NumberInput
              label="Lebar (m)"
              value={height}
              onChange={(val) => setHeight(Number(val) || 0)}
              min={0}
              step={0.1}
              decimalScale={2}
              size="xs"
            />
          </Group>
          {onUpdateDimensions && (
            <Button
              size="xs"
              onClick={handleDimensionChange}
              disabled={!width || !height}
            >
              Update Ukuran
            </Button>
          )}
          {onUpdateMaterial &&
            cartItem.item.materialOptions &&
            cartItem.item.materialOptions.length > 0 && (
              <Select
                label="Material"
                data={cartItem.item.materialOptions}
                value={cartItem.material}
                onChange={(val) => val && onUpdateMaterial(val)}
                size="xs"
                searchable
              />
            )}
          {onUpdateFinishing &&
            cartItem.item.finishingOptions &&
            cartItem.item.finishingOptions.length > 0 && (
              <MultiSelect
                label="Finishing"
                data={cartItem.item.finishingOptions.map((fo) => ({
                  value: fo.name,
                  label: `${fo.name} (+${formatCurrency(fo.price)})`,
                }))}
                value={cartItem.finishing || []}
                onChange={(val) => onUpdateFinishing(val)}
                size="xs"
                searchable
              />
            )}
        </Stack>
      </Collapse>

      <Group justify="space-between" align="center">
        <Group gap="xs">
          <ActionIcon
            variant="filled"
            size="sm"
            onClick={() => onUpdateQuantity(cartItem.quantity - 1)}
          >
            <IconMinus size={14} />
          </ActionIcon>
          <Text
            fw={700}
            size="sm"
            style={{ minWidth: "30px", textAlign: "center" }}
          >
            {cartItem.quantity}
          </Text>
          <ActionIcon
            variant="filled"
            size="sm"
            onClick={() => onUpdateQuantity(cartItem.quantity + 1)}
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Group>
        <Stack gap={0} align="flex-end">
          {isAreaBased && cartItem.item.pricePerSqm && cartItem.area && (
            <Text size="xs" c="dimmed">
              {formatCurrency(cartItem.item.pricePerSqm)}/m² ×{" "}
              {cartItem.area.toFixed(2)}m²
            </Text>
          )}
          <Text fw={700} c="aqua">
            {formatCurrency(calculateItemTotal())}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}
