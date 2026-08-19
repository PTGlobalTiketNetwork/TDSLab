export type ProductCategory = 
  | "General"
  | "Hotel"
  | "Accommodation" 
  | "Transport"
  | "Flight"
  | "Train"
  | "Car Rental"
  | "ToDos"
  | "Event"
  | "All";

export type BannerStatus = 
  | "draft"
  | "published" 
  | "archived";

export type CampaignType = 
  | "daily_promo"
  | "big_campaign";

export type BannerCategory = 
  | "General"
  | "Promo Banner"
  | "Homepage Promo Banner"
  | "Hero Landing Page Header"
  | "Product Entry Point";

export interface Banner {
  id: string;
  name: string;
  product: ProductCategory;
  category: BannerCategory;
  imageUrl: string;
  thumbnail: string;
  dimension: string;
  fileSize: string;
  status: BannerStatus;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creatorName?: string;
  tags?: string[];
  campaign?: CampaignType;
  form_data?: any;
  version?: number;
  lastEditedById?: string;
  lastEditedByName?: string;
  isSyncing?: boolean;
}

export type ViewMode = "grid" | "list";

export type SortOption = 
  | "name_asc"
  | "name_desc"
  | "created_at_desc"
  | "created_at_asc"
  | "updated_at_desc"
  | "product_asc";

export interface FilterState {
  searchQuery: string;
  productFilter: ProductCategory | "All";
  sortBy: SortOption;
  viewMode: ViewMode;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}
