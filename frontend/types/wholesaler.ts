export type Wholesaler = {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  preferred?: boolean;
  rating?: 1|2|3|4|5;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type WhItem = {
  id: string;
  wholesalerId: string;
  name: string;
  sku?: string;
  brand?: string;
  unit?: string;      // e.g. "each", "box", "m"
  packSize?: string;  // e.g. "10", "25kg"
  price?: number;     // last known price
  hasOffer?: boolean;
  offerPrice?: number;
  subs?: string[];    // alternative item IDs
  lastUpdated?: string;
};

export type WhOrderLine = {
  itemId: string;
  name: string;
  sku?: string;
  qty: number;
  unitPrice?: number;
};

export type WhOrder = {
  id: string;
  wholesalerId: string;
  createdAt: string;
  note?: string;
  lines: WhOrderLine[];
  total: number;
};
