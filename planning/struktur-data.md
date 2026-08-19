# Struktur Data Banner Management

## Overview
Dokumen ini mendefinisikan struktur data untuk Banner yang akan disimpan di Supabase KV Store dan digunakan dalam aplikasi Dashboard Banner Management.

---

## Banner Data Model

### TypeScript Interface

```typescript
interface Banner {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Banner name/title (e.g., "OTW Hotel Promo")
  product: ProductCategory;      // Product category
  imageUrl: string;              // Banner image URL (from Supabase Storage or figma:asset)
  thumbnail: string;             // Thumbnail URL untuk list view
  dimension: string;             // Image dimension (e.g., "1080*540")
  fileSize: string;              // File size (e.g., "128 kb")
  status: BannerStatus;          // Draft, Published, Archived
  isPublished: boolean;          // Publish toggle state
  createdAt: string;             // ISO date string (e.g., "2022-10-20T00:00:00Z")
  updatedAt: string;             // ISO date string
  createdBy: string;             // User ID yang membuat
  tags?: string[];               // Optional tags untuk categorization
  campaign?: CampaignType;       // Daily Promo atau Big Campaign
}

type ProductCategory = 
  | "Hotel"
  | "Accommodation" 
  | "Transport"
  | "Flight"
  | "Train"
  | "Car Rental"
  | "ToDos"
  | "All";

type BannerStatus = 
  | "draft"
  | "published" 
  | "archived";

type CampaignType = 
  | "daily_promo"
  | "big_campaign";
```

---

## Sample Data (Mock untuk Development)

```typescript
const mockBanners: Banner[] = [
  {
    id: "banner-001",
    name: "OTW Hotel Promo",
    product: "Hotel",
    imageUrl: "figma:asset/...", // Akan diganti dengan actual image
    thumbnail: "figma:asset/...",
    dimension: "1080*540",
    fileSize: "128 kb",
    status: "published",
    isPublished: true,
    createdAt: "2022-10-20T10:30:00Z",
    updatedAt: "2022-10-20T10:30:00Z",
    createdBy: "user-michael-001",
    tags: ["hotel", "promo", "surabaya"],
    campaign: "daily_promo"
  },
  {
    id: "banner-002",
    name: "Car rental promo 1",
    product: "Car Rental",
    imageUrl: "figma:asset/...",
    thumbnail: "figma:asset/...",
    dimension: "1080*540",
    fileSize: "115 kb",
    status: "published",
    isPublished: true,
    createdAt: "2022-10-15T08:20:00Z",
    updatedAt: "2022-10-15T08:20:00Z",
    createdBy: "user-michael-001",
    tags: ["car", "rental", "discount"],
    campaign: "daily_promo"
  },
  {
    id: "banner-003",
    name: "Flight promo Sriwijaya, NAM air",
    product: "Flight",
    imageUrl: "figma:asset/...",
    thumbnail: "figma:asset/...",
    dimension: "1080*540",
    fileSize: "142 kb",
    status: "published",
    isPublished: true,
    createdAt: "2022-10-12T14:45:00Z",
    updatedAt: "2022-10-12T14:45:00Z",
    createdBy: "user-michael-001",
    tags: ["flight", "sriwijaya", "nam air"],
    campaign: "daily_promo"
  },
  {
    id: "banner-004",
    name: "First time user",
    product: "All",
    imageUrl: "figma:asset/...",
    thumbnail: "figma:asset/...",
    dimension: "1080*540",
    fileSize: "98 kb",
    status: "published",
    isPublished: false,
    createdAt: "2022-10-10T09:15:00Z",
    updatedAt: "2022-10-10T09:15:00Z",
    createdBy: "user-michael-001",
    tags: ["new user", "first time", "welcome"],
    campaign: "big_campaign"
  }
];
```

---

## KV Store Schema

Karena menggunakan Supabase KV Store (key-value table), data banner akan disimpan dengan struktur:

### Key Patterns

```
banners:all                    → Array<Banner>          // List semua banners
banners:id:{bannerId}          → Banner                 // Individual banner
banners:product:{product}      → Array<string>          // Banner IDs by product
banners:campaign:{campaign}    → Array<string>          // Banner IDs by campaign
banners:status:{status}        → Array<string>          // Banner IDs by status
user:session                   → UserSession            // Current user session
```

### Example KV Operations

```typescript
// Get all banners
const allBanners = await kv.get('banners:all');

// Get banners by product category
const hotelBannerIds = await kv.get('banners:product:Hotel');
const hotelBanners = await kv.mget(
  hotelBannerIds.map(id => `banners:id:${id}`)
);

// Add new banner
await kv.set(`banners:id:${newBanner.id}`, newBanner);
// Update index
const allBannerIds = await kv.get('banners:all') || [];
await kv.set('banners:all', [...allBannerIds, newBanner.id]);

// Update publish status
const banner = await kv.get(`banners:id:${bannerId}`);
banner.isPublished = !banner.isPublished;
banner.updatedAt = new Date().toISOString();
await kv.set(`banners:id:${bannerId}`, banner);

// Delete banner
await kv.del(`banners:id:${bannerId}`);
// Update indexes...
```

---

## User Session Data

```typescript
interface UserSession {
  id: string;                    // User ID
  email: string;                 // Email
  name: string;                  // Display name (e.g., "Michael Fernanlie")
  avatar?: string;               // Optional avatar URL
  role: UserRole;                // User role
  accessToken: string;           // Supabase access token
  expiresAt: string;             // Token expiration
}

type UserRole = "admin" | "editor" | "viewer";

// Mock session
const mockUserSession: UserSession = {
  id: "user-michael-001",
  email: "michael.fernanlie@tiket.com",
  name: "Michael Fernanlie",
  role: "admin",
  accessToken: "...",
  expiresAt: "2024-12-31T23:59:59Z"
};
```

---

## Filter & Search State

```typescript
interface FilterState {
  searchQuery: string;           // Search input value
  productFilter: ProductCategory | "All"; // Selected product filter
  sortBy: SortOption;            // Sort criteria
  viewMode: ViewMode;            // Grid or List view
}

type SortOption = 
  | "name_asc"
  | "name_desc"
  | "date_newest"
  | "date_oldest";

type ViewMode = "grid" | "list";

// Default filter state
const defaultFilters: FilterState = {
  searchQuery: "",
  productFilter: "All",
  sortBy: "date_newest",
  viewMode: "grid"
};
```

---

## UI State

```typescript
interface UIState {
  selectedBannerId: string | null;     // Currently selected banner
  isDeleteModalOpen: boolean;          // Delete confirmation modal
  deleteModalBannerId: string | null;  // Banner to delete
  toast: ToastMessage | null;          // Toast notification
  isSidebarCollapsed: boolean;         // Sidebar collapse state
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;                   // Auto-hide duration in ms
}

// Example toast
const downloadSuccessToast: ToastMessage = {
  id: "toast-001",
  type: "success",
  message: "ID Translation has been downloaded",
  duration: 3000
};
```

---

## Data Transformation Functions

### Filter Banners

```typescript
function filterBanners(
  banners: Banner[], 
  filters: FilterState
): Banner[] {
  let filtered = [...banners];
  
  // Search filter
  if (filters.searchQuery) {
    filtered = filtered.filter(banner =>
      banner.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
    );
  }
  
  // Product filter
  if (filters.productFilter !== "All") {
    filtered = filtered.filter(banner =>
      banner.product === filters.productFilter
    );
  }
  
  // Sort
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "date_newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "date_oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });
  
  return filtered;
}
```

### Format Date

```typescript
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options); // "20 Oct 2022"
}
```

### Format File Size

```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' kb';
  return (bytes / 1048576).toFixed(2) + ' MB';
}
```

---

## API Response Types (untuk future backend integration)

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Example usage
type GetBannersResponse = ApiResponse<Banner[]>;
type CreateBannerResponse = ApiResponse<Banner>;
type DeleteBannerResponse = ApiResponse<{ deleted: boolean }>;
```

---

## Validation Schema

```typescript
const bannerValidation = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  product: {
    required: true,
    enum: ["Hotel", "Accommodation", "Transport", "Flight", "Train", "Car Rental", "ToDos", "All"]
  },
  imageUrl: {
    required: true,
    format: "url"
  },
  dimension: {
    required: true,
    pattern: /^\d+\*\d+$/ // e.g., "1080*540"
  }
};
```

---

## Notes

1. **Image Storage**: Banner images akan disimpan di Supabase Storage bucket `make-9ee0fe87-banners` dengan signed URLs untuk private access
2. **Data Persistence**: Saat ini menggunakan KV store, tapi struktur data sudah siap untuk migrasi ke table relational jika diperlukan
3. **Mock Data**: Untuk fase development awal, gunakan mock data di frontend. Backend integration dilakukan di fase berikutnya
4. **Type Safety**: Semua interfaces akan di-export dari `/src/types/banner.ts` untuk reusability
5. **Image URLs**: Gunakan format `figma:asset/...` untuk imported images dari Figma, atau Supabase Storage URLs untuk uploaded banners
