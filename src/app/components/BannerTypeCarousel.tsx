import { useState, useEffect } from 'react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { BannerFormData } from './create-banner/types';
import { BannerFixed } from './create-banner/BannerFixed';

export interface CarouselItem {
    formData: BannerFormData;
    imageUrl?: string; // Saved thumbnail URL
}

interface BannerTypeCarouselProps {
    type: 'promo' | 'entry_point';
    examples?: CarouselItem[];
}

// Helper to get exact dimensions for the SVG viewBox based on banner type
const getBannerDimensions = (formData: BannerFormData) => {
    // Product Entry Points
    if (formData.bannerCategory === 'Product Entry Point') {
        if (formData.bannerRatio === 'Mobile (2:1)') {
            return { width: 320, height: 160 };
        }
        if (formData.bannerRatio === 'Mobile (4:1)') {
            return { width: 320, height: 80 };
        }
        // Default to Mobile 5:2 (320x128)
        return { width: 320, height: 128 };
    }
    
    // Promo Banners (rendered via BannerLegacy which uses w-[600px])
    const width = 600;
    let height = 300; // Default Landscape 2:1

    switch (formData.bannerRatio) {
        case 'Square (1:1)':
            height = 600;
            break;
        case 'Portrait (3:4)':
            height = 800;
            break;
        case 'Landscape (16:9)':
            height = 337.5; // 600 * 9 / 16
            break;
        case 'Landscape (2:1)':
        default:
            height = 300;
            break;
    }
    
    return { width, height };
};

// --- Mock Data (Preserved) ---

const PROMO_MOCK_DATA: BannerFormData[] = [
    // 1. Landscape Hotel (Blue)
    {
        bannerName: 'Hotel Promo',
        bannerCategory: 'Promo Banner',
        verticalCategory: 'Hotel',
        bannerStyle: 'Style 2 (Thematic/tactical campaign)',
        bannerRatio: 'Landscape (2:1)',
        headlineType: '1 Headline',
        gradientOpacity: 60,
        showStamp: false,
        showCampaignLogo: false,
        showPartnerLogo: false,
        showJhtLogo: false,
        partnerLogos: [],
        backgroundType: 'gradient',
        backgroundGradientStops: [
            { id: '1', color: '#0064D2', position: 0, opacity: 100 },
            { id: '2', color: '#00A3FF', position: 100, opacity: 100 }
        ],
        backgroundGradientType: 'linear',
        backgroundGradientAngle: 135,
        content: {
            en: {
                headline: 'Luxury Hotel Deals',
                subHeadline: '',
                showPrefix: true,
                prefixType: 'discount_upto',
                mainBenefitPrefix: 'Up to',
                discountType: 'Non-IDR',
                discountAmount: '50',
                unit: '%',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
                discountAmountColor: '#FFFFFF',
                unitColor: '#FFFFFF',
                prefixColor: '#FFFFFF',
            },
            id: {
                headline: 'Promo Hotel Mewah',
                subHeadline: '',
                showPrefix: true,
                prefixType: 'discount_upto',
                mainBenefitPrefix: 'Hingga',
                discountType: 'Non-IDR',
                discountAmount: '50',
                unit: '%',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
                discountAmountColor: '#FFFFFF',
                unitColor: '#FFFFFF',
                prefixColor: '#FFFFFF',
            }
        }
    },
    // 2. Square Flight (Yellow)
    {
        bannerName: 'Flight Promo',
        bannerCategory: 'Promo Banner',
        verticalCategory: 'Transport',
        bannerStyle: 'Style 1 (Regular promo campaign)',
        bannerRatio: 'Square (1:1)',
        headlineType: 'With Sub-Headline',
        gradientOpacity: 60,
        showStamp: false,
        showCampaignLogo: false,
        showPartnerLogo: false,
        showJhtLogo: false,
        partnerLogos: [],
        backgroundType: 'gradient',
        backgroundGradientStops: [
            { id: '1', color: '#FFB800', position: 0, opacity: 100 },
            { id: '2', color: '#FF8C00', position: 100, opacity: 100 }
        ],
        backgroundGradientType: 'linear',
        backgroundGradientAngle: 90,
        content: {
            en: {
                headline: 'Fly Anywhere',
                subHeadline: 'Book now and save big',
                showPrefix: true,
                prefixType: 'start_from',
                mainBenefitPrefix: 'Start from',
                discountType: 'IDR',
                discountAmount: '299',
                unit: 'K',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
                subHeadlineColor: '#FFFFFF',
                discountAmountColor: '#FFFFFF',
                unitColor: '#FFFFFF',
                prefixColor: '#FFFFFF',
            },
            id: {
                headline: 'Terbang Kemana Saja',
                subHeadline: 'Pesan sekarang hemat banyak',
                showPrefix: true,
                prefixType: 'start_from',
                mainBenefitPrefix: 'Mulai dari',
                discountType: 'IDR',
                discountAmount: '299',
                unit: 'K',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
                subHeadlineColor: '#FFFFFF',
                discountAmountColor: '#FFFFFF',
                unitColor: '#FFFFFF',
                prefixColor: '#FFFFFF',
            }
        }
    },
    // 3. Landscape Event (Red/Pink)
    {
        bannerName: 'Event Promo',
        bannerCategory: 'Promo Banner',
        verticalCategory: 'Event',
        bannerStyle: 'Style 3 (Flagship/big campaign)',
        bannerRatio: 'Landscape (2:1)',
        headlineType: '2 Headlines',
        gradientOpacity: 60,
        showStamp: false,
        showCampaignLogo: false,
        showPartnerLogo: false,
        showJhtLogo: false,
        partnerLogos: [],
        backgroundType: 'gradient',
        backgroundGradientStops: [
            { id: '1', color: '#E91E63', position: 0, opacity: 100 },
            { id: '2', color: '#FF5252', position: 100, opacity: 100 }
        ],
        backgroundGradientType: 'linear',
        backgroundGradientAngle: 45,
        content: {
            en: {
                headline: 'Big Sale Event',
                subHeadline: '',
                secondHeadline: 'Limited Time Only',
                showPrefix: true,
                prefixType: 'discount',
                mainBenefitPrefix: 'Discount',
                discountType: 'IDR',
                discountAmount: '500',
                unit: 'K',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
                discountAmountColor: '#FFFFFF',
                unitColor: '#FFFFFF',
                prefixColor: '#FFFFFF',
            },
            id: {
                headline: 'Acara Diskon Besar',
                subHeadline: '',
                secondHeadline: 'Waktu Terbatas',
                showPrefix: true,
                prefixType: 'discount',
                mainBenefitPrefix: 'Diskon',
                discountType: 'IDR',
                discountAmount: '500',
                unit: 'K',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
                discountAmountColor: '#FFFFFF',
                unitColor: '#FFFFFF',
                prefixColor: '#FFFFFF',
            }
        }
    }
];

const ENTRY_POINT_MOCK_DATA: BannerFormData[] = [
    // 1. Mobile 5:2 (With CTA)
    {
        bannerName: 'Entry Point Mobile 5:2',
        bannerCategory: 'Product Entry Point',
        verticalCategory: '',
        bannerStyle: 'Style 1 (Regular promo campaign)',
        bannerRatio: 'Mobile (5:2)',
        platform: 'Mobile',
        entryPointVariant: 'with_cta',
        headlineType: '1 Headline',
        gradientOpacity: 60,
        showStamp: false,
        showCampaignLogo: false,
        showPartnerLogo: false,
        showJhtLogo: false,
        partnerLogos: [],
        backgroundType: 'gradient',
        backgroundGradientStops: [
            { id: '1', color: '#6366F1', position: 0, opacity: 100 },
            { id: '2', color: '#8B5CF6', position: 100, opacity: 100 }
        ],
        backgroundGradientType: 'linear',
        backgroundGradientAngle: 135,
        content: {
            en: {
                headline: 'Special Deals',
                subHeadline: '',
                ctaText: 'Shop Now',
                showPrefix: false,
                prefixType: 'discount',
                mainBenefitPrefix: '',
                discountType: 'Non-IDR',
                discountAmount: '',
                unit: '%',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
            },
            id: {
                headline: 'Penawaran Spesial',
                subHeadline: '',
                ctaText: 'Belanja Sekarang',
                showPrefix: false,
                prefixType: 'discount',
                mainBenefitPrefix: '',
                discountType: 'Non-IDR',
                discountAmount: '',
                unit: '%',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
            }
        }
    },
    // 2. Mobile 2:1 (No CTA)
    {
        bannerName: 'Entry Point Mobile 2:1',
        bannerCategory: 'Product Entry Point',
        verticalCategory: '',
        bannerStyle: 'Style 1 (Regular promo campaign)',
        bannerRatio: 'Mobile (2:1)', // Corrected from 'Landscape (2:1)'
        platform: 'Mobile',
        entryPointVariant: 'no_cta',
        headlineType: 'With Sub-Headline',
        gradientOpacity: 60,
        showStamp: false,
        showCampaignLogo: false,
        showPartnerLogo: false,
        showJhtLogo: false,
        partnerLogos: [],
        backgroundType: 'gradient',
        backgroundGradientStops: [
            { id: '1', color: '#10B981', position: 0, opacity: 100 },
            { id: '2', color: '#14B8A6', position: 100, opacity: 100 }
        ],
        backgroundGradientType: 'linear',
        backgroundGradientAngle: 90,
        content: {
            en: {
                headline: 'Quick Access',
                subHeadline: 'Tap to explore more',
                ctaText: '',
                showPrefix: false,
                prefixType: 'discount',
                mainBenefitPrefix: '',
                discountType: 'Non-IDR',
                discountAmount: '',
                unit: '%',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
                subHeadlineColor: '#FFFFFF',
            },
            id: {
                headline: 'Akses Cepat',
                subHeadline: 'Ketuk untuk jelajahi',
                ctaText: '',
                showPrefix: false,
                prefixType: 'discount',
                mainBenefitPrefix: '',
                discountType: 'Non-IDR',
                discountAmount: '',
                unit: '%',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
                subHeadlineColor: '#FFFFFF',
            }
        }
    },
    // 3. Mobile 5:2 (With CTA - Variant 2)
    {
        bannerName: 'Entry Point Widget',
        bannerCategory: 'Product Entry Point',
        verticalCategory: '',
        bannerStyle: 'Style 1 (Regular promo campaign)',
        bannerRatio: 'Mobile (5:2)',
        platform: 'Mobile',
        entryPointVariant: 'with_cta',
        headlineType: '1 Headline',
        gradientOpacity: 60,
        showStamp: false,
        showCampaignLogo: false,
        showPartnerLogo: false,
        showJhtLogo: false,
        partnerLogos: [],
        backgroundType: 'gradient',
        backgroundGradientStops: [
            { id: '1', color: '#F59E0B', position: 0, opacity: 100 },
            { id: '2', color: '#EF4444', position: 100, opacity: 100 }
        ],
        backgroundGradientType: 'linear',
        backgroundGradientAngle: 45,
        content: {
            en: {
                headline: 'New Features',
                subHeadline: '',
                ctaText: 'Discover',
                showPrefix: false,
                prefixType: 'discount',
                mainBenefitPrefix: '',
                discountType: 'Non-IDR',
                discountAmount: '',
                unit: '%',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
            },
            id: {
                headline: 'Fitur Baru',
                subHeadline: '',
                ctaText: 'Temukan',
                showPrefix: false,
                prefixType: 'discount',
                mainBenefitPrefix: '',
                discountType: 'Non-IDR',
                discountAmount: '',
                unit: '%',
                hasSecondDiscount: false,
                labelDiscount: false,
                labelDiscountType: 'With icon',
                labelDiscountText: '',
                additionalLabel: false,
                additionalLabelType: 'Preset',
                additionalLabelText: '',
                termsAndCondition: false,
                termsText: '',
                headlineColor: '#FFFFFF',
            }
        }
    }
];

// Single Slide Component to manage local state
const BannerCarouselSlide = ({ item }: { item: CarouselItem }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const { width, height } = getBannerDimensions(item.formData);
    const isRealData = 'imageUrl' in item && !!item.imageUrl;

    return (
        <div 
            className="relative w-full h-[160px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden"
        >
            {/* Layer A: Mock Component (SVG Wrapper for Perfect 'contain' scaling) */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                 <svg 
                    viewBox={`0 0 ${width} ${height}`} 
                    className="w-full h-full block" 
                    preserveAspectRatio="xMidYMid meet" 
                    xmlns="http://www.w3.org/2000/svg"
                 >
                    <foreignObject width={width} height={height}>
                        <div style={{ width: '100%', height: '100%' }}>
                            <BannerFixed 
                                formData={item.formData}
                                lang="en"
                                scale={item.formData.keyVisualScale || 100}
                                position={item.formData.keyVisualPosition || { x: 50, y: 50 }}
                                previewUrl={item.formData.keyVisualUrl || null}
                                isDraggable={false}
                                hideHeader={true}
                                hideBorder={true}
                                fullSize={true}
                                renderScale={1}
                            />
                        </div>
                    </foreignObject>
                 </svg>
            </div>

            {/* Layer B: Real Image (Fades in over Mock) */}
            {isRealData && (
                <img
                    src={item.imageUrl}
                    alt={item.formData.bannerName}
                    onLoad={() => setIsImageLoaded(true)}
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
            )}
        </div>
    );
};

export function BannerTypeCarousel({ type, examples }: BannerTypeCarouselProps) {
    // Determine if we're using real data or mock data
    const mockDataArray = type === 'promo' ? PROMO_MOCK_DATA : ENTRY_POINT_MOCK_DATA;
    const hasRealData = examples && examples.length > 0;
    const dataSource = hasRealData ? examples : mockDataArray.map(formData => ({ formData }));

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: false,
        appendDots: (dots: React.ReactNode) => (
            <div
                style={{
                    position: "absolute",
                    bottom: "8px",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <ul className="flex gap-1.5 p-0 m-0 list-none"> {dots} </ul>
            </div>
        ),
        customPaging: (i: number) => (
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 hover:bg-white transition-all cursor-pointer custom-dot" />
        )
    };

    return (
        <div className="w-full h-[160px] rounded-lg overflow-hidden relative group">
            <style>{`
                .slick-dots li { margin: 0; width: auto; height: auto; }
                .slick-dots li.slick-active .custom-dot { width: 16px; background-color: white; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
            `}</style>
            <Slider {...settings}>
                {dataSource.map((item, index) => (
                    <BannerCarouselSlide key={index} item={item} />
                ))}
            </Slider>
        </div>
    );
}
