import { Banner } from '../types/banner';

export const mockBanners: Banner[] = [
  {
    id: "banner-001",
    name: "OTW Hotel Promo",
    product: "Hotel",
    imageUrl: "figma:asset/b3dddd25dce90ae9b8f3fcbeebf23f38a8e32f80.png",
    thumbnail: "figma:asset/b3dddd25dce90ae9b8f3fcbeebf23f38a8e32f80.png",
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
    imageUrl: "figma:asset/1ee19ba8ae835e0e5088f43b6c7e0fc4fa67b56d.png",
    thumbnail: "figma:asset/1ee19ba8ae835e0e5088f43b6c7e0fc4fa67b56d.png",
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
    imageUrl: "figma:asset/0bedd6fe55f8d18b0bc8c9c3c5d48eef8385e2d6.png",
    thumbnail: "figma:asset/0bedd6fe55f8d18b0bc8c9c3c5d48eef8385e2d6.png",
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
    imageUrl: "figma:asset/97b2dcf5d75b5cd4dcbfab8e7b6b8ba96e48d86d.png",
    thumbnail: "figma:asset/97b2dcf5d75b5cd4dcbfab8e7b6b8ba96e48d86d.png",
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
