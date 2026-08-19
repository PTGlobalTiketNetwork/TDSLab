export interface Asset {
  id: string;
  name: string;
  category: string; // 'Campaign', 'Payment', 'Airlines', 'Hotel', 'Other'
  imageUrl: string;
  ratio: string;
  dimension: string;
  fileSize: string;
  addedOn: string;
  createdAt?: string; // ISO string for activity tracking
  updatedAt?: string; // ISO string for activity tracking
  uploaderName?: string;
  createdBy?: string; // For tracking who created/uploaded it
}

export type AssetViewMode = 'grid' | 'list';