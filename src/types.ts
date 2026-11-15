export type Reagent = {
  id: string;
  name: string;
  formula: string;
  cas_number: string;
  category: string;
  location: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  expiry_date: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
};
