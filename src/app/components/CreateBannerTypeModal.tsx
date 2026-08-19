import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { BannerTypeCarousel, CarouselItem } from './BannerTypeCarousel';

interface CreateBannerTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectType: (type: 'promo' | 'entry-point') => void;
    promoExamples?: CarouselItem[];
    entryExamples?: CarouselItem[];
}

export function CreateBannerTypeModal({ isOpen, onClose, onSelectType, promoExamples, entryExamples }: CreateBannerTypeModalProps) {
    const bannerTypes = [
        {
            id: 'promo' as const,
            title: 'Promo Banner',
            description: 'Standard promotional banners with vertical themes.',
            examples: promoExamples,
        },
        {
            id: 'entry_point' as const,
            title: 'Product Entry Point',
            description: 'Small banners for app entry points and widgets.',
            examples: entryExamples,
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[680px]">
                <DialogHeader>
                    <DialogTitle className="text-[20px] font-bold text-[#303135]">
                        Select Banner Type
                    </DialogTitle>
                    <DialogDescription className="text-[14px] text-[#71747d]">
                        Choose the kind of banner you want to create.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    {bannerTypes.map((type) => {
                        return (
                            <button
                                key={type.id}
                                onClick={() => onSelectType(type.id === 'promo' ? 'promo' : 'entry-point')}
                                className="group relative flex flex-col overflow-hidden bg-white rounded-[12px] border-2 border-[#d8dce8] hover:border-[#007BFF] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
                            >
                                {/* Carousel Preview - Full Width at Top */}
                                <div className="w-full">
                                    <BannerTypeCarousel type={type.id} examples={type.examples} />
                                </div>

                                {/* Text Content - Bottom Half with Padding */}
                                <div className="p-6 pt-4">
                                    {/* Title */}
                                    <h3 className="text-[16px] font-bold text-[#303135] mb-2">
                                        {type.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-[14px] text-[#71747d] leading-relaxed">
                                        {type.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}