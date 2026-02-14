// Finishing type
export interface Finishing {
  id: string;
  name: string;
  description?: string;
  price: number; // additional price
  pricingType: "per_unit" | "per_area" | "flat";
  businessId: string;
  createdAt: string;
  isActive: boolean;
}
