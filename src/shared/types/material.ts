// Material type
export interface Material {
  id: string;
  name: string;
  description?: string;
  price: number; // base price per unit or per area
  unit: string; // 'pcs', 'meter', etc.
  businessId: string;
  createdAt: string;
  isActive: boolean;
}
