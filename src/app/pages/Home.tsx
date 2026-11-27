import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TiketButton } from '../components/ui/TiketButton';
import { BannerService } from '../../services/bannerService';
import { AssetService } from '../../services/assetService';
import { Banner } from '../../types/banner';
import {
    Plus,
    Clock,
    FileEdit,
    Layout,
    Activity,
    FolderOpen
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { BannerFormData } from '../components/create-banner/types';
import { CreateBannerTypeModal } from '../components/CreateBannerTypeModal';
import { CarouselItem } from '../components/BannerTypeCarousel';
import { UserAvatar } from '../components/UserAvatar';
import { getUserDisplayName, getUserAvatarUrl, formatStoredName } from '../utils/userDisplay';

interface HomeProps {
    session: any;
}

interface ActivityItem {
    id: string;
    realId: string;
    text: React.ReactNode;
    time: string; // ISO string
    type: 'banner' | 'asset';
    category?: string;
    status?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    isCurrentUser?: boolean;
}

export function Home({ session }: HomeProps) {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState<Banner[]>([]);
    const [allBanners, setAllBanners] = useState<Banner[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [greeting, setGreeting] = useState("Good Morning");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const userName = getUserDisplayName(session?.user, "User");
    
    const userAvatar = getUserAvatarUrl(session?.user);

    useEffect(() => {
        // Set Greeting based on time
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");

        const loadData = async () => {
            try {
                const [banners, assets, activities] = await Promise.all([
                    BannerService.listBanners(),
                    AssetService.listAssets(),
                    BannerService.getActivities()
                ]);

                // Store all banners for carousel data
                setAllBanners(banners);

                // Process Drafts
                const draftBanners = banners
                    .filter(b => b.status === 'draft' && b.createdBy === session?.user?.id)
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                
                setDrafts(draftBanners);

                // Process Activities from kv_store
                // Build lookup sets of existing banner/asset IDs to filter out stale activities
                const existingBannerIds = new Set(banners.map(b => b.id));
                const existingAssetIds = new Set(assets.map(a => a.id));

                const formattedActivities: ActivityItem[] = activities
                    .filter(activity => {
                        // Only show activities for items that still exist
                        if (activity.target_type === 'banner' && activity.banner_id) {
                            return existingBannerIds.has(activity.banner_id);
                        }
                        if (activity.target_type === 'asset' && activity.asset_id) {
                            return existingAssetIds.has(activity.asset_id);
                        }
                        return false;
                    })
                    .slice(0, 5) // Take top 5
                    .map(activity => {
                        const { action, target_name, target_type, version, banner_id, asset_id, category, user_id, user_name, user_avatar } = activity;
                        
                        let text: React.ReactNode;
                        let realId = banner_id || asset_id || '';
                        let type: 'banner' | 'asset' = target_type;

                        // Fallback: stored activities may have user_name == 'Unknown' from older records.
                        // For assets, fall back to the asset's uploader name so the actor is still identifiable.
                        let resolvedUserName = user_name;
                        if ((!resolvedUserName || resolvedUserName === 'Unknown') && target_type === 'asset' && asset_id) {
                            const asset = assets.find(a => a.id === asset_id);
                            if (asset?.uploaderName) resolvedUserName = asset.uploaderName;
                        }

                        const isCurrentUser = user_id === session?.user?.id;
                        const displayName = isCurrentUser ? "You" : formatStoredName(resolvedUserName, "Someone");
                        
                        // Dynamic copy based on action type
                        if (target_type === 'banner') {
                            if (action === 'created') {
                                text = <span><span className="font-bold">{displayName}</span> created banner <span className="font-bold">'{target_name}'</span></span>;
                            } else if (action === 'published') {
                                text = <span><span className="font-bold">{displayName}</span> published banner <span className="font-bold">'{target_name}'</span></span>;
                            } else if (action === 'edited') {
                                text = <span><span className="font-bold">{displayName}</span> edited banner <span className="font-bold">'{target_name}'</span> to v{version}</span>;
                            } else if (action === 'restored') {
                                text = <span><span className="font-bold">{displayName}</span> restored banner <span className="font-bold">'{target_name}'</span> to Version {version}</span>;
                            } else {
                                text = <span><span className="font-bold">{displayName}</span> updated banner <span className="font-bold">'{target_name}'</span></span>;
                            }
                        } else if (target_type === 'asset') {
                            if (action === 'uploaded') {
                                text = <span><span className="font-bold">{displayName}</span> uploaded asset <span className="font-bold">'{target_name}'</span> to {category}</span>;
                            } else if (action === 'moved') {
                                text = <span><span className="font-bold">{displayName}</span> moved asset <span className="font-bold">'{target_name}'</span> to {category}</span>;
                            } else if (action === 'edited') {
                                text = <span><span className="font-bold">{displayName}</span> edited asset <span className="font-bold">'{target_name}'</span> to {category}</span>;
                            } else {
                                text = <span><span className="font-bold">{displayName}</span> updated asset <span className="font-bold">'{target_name}'</span></span>;
                            }
                        }
                        
                        return {
                            id: `activity-${activity.timestamp}-${realId}`,
                            realId,
                            text,
                            time: activity.timestamp,
                            type,
                            category,
                            status: 'published',
                            userId: user_id,
                            userName: resolvedUserName,
                            userAvatar: user_avatar || (isCurrentUser ? userAvatar : undefined),
                            isCurrentUser
                        };
                    });

                setActivities(formattedActivities);

            } catch (error) {
                console.error("Failed to load home data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const handleCreateNew = () => {
        setIsCreateModalOpen(true);
    };

    const handleSelectBannerType = (type: 'promo' | 'entry-point') => {
        setIsCreateModalOpen(false);
        if (type === 'promo') {
            navigate('/banners/promo-banner/create');
        } else {
            navigate('/banners/product-entry-point/create');
        }
    };

    const handleResumeDraft = (id: string, category: string) => {
        const slugMap: Record<string, string> = {
            'Promo Banner': 'promo-banner',
            'Homepage Promo Banner': 'homepage-promo-banner',
            'Hero Landing Page Header': 'hero-landing-page-header',
            'Product Entry Point': 'product-entry-point',
            'DLP Assets': 'dlp-assets',
            'TTD Promo Asset': 'ttd-promo-asset'
        };
        const slug = slugMap[category] || 'promo-banner';
        navigate(`/banners/${slug}/create?edit=${id}`);
    };

    const handleActivityClick = (item: ActivityItem) => {
        if (item.type === 'banner') {
            if (item.status === 'draft') {
                 navigate(`/banners/drafts?highlight=${item.realId}`);
            } else {
                 const slugMap: Record<string, string> = {
                    'Promo Banner': 'promo-banner',
                    'Homepage Promo Banner': 'homepage-promo-banner',
                    'Hero Landing Page Header': 'hero-landing-page-header',
                    'Product Entry Point': 'product-entry-point',
                    'DLP Assets': 'dlp-assets',
                    'TTD Promo Asset': 'ttd-promo-asset'
                };
                const slug = (item.category && slugMap[item.category]) ? slugMap[item.category] : 'promo-banner';
                navigate(`/banners/${slug}?highlight=${item.realId}`);
            }
        } else {
            // Assets - navigate to specific category
            const category = item.category || 'Others';
            const assetSlugMap: Record<string, string> = {
                'Product Icon': 'product-icon',
                'Entity Logo': 'brand-entity-logo',
            };
            const assetSlug = assetSlugMap[category] || category;
            navigate(`/assets/${assetSlug}?highlight=${item.realId}`);
        }
    };

    // [DISABLED] Delete activity - uncomment to re-enable cleanup mode
    // const handleDeleteActivity = async (e: React.MouseEvent, item: ActivityItem) => {
    //     e.stopPropagation();
    //     const confirmed = window.confirm(`Delete this activity entry?`);
    //     if (!confirmed) return;
    //     
    //     const success = await BannerService.deleteActivity(item.time, item.realId);
    //     if (success) {
    //         setActivities(prev => prev.filter(a => a.id !== item.id));
    //     }
    // };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-8 h-8 border-4 border-[#0064D2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Card Style from Cards01Outline
    const cardStyle = "bg-white rounded-[12px] border border-[#d8dce8] overflow-hidden";

    return (
        <div className="px-8 pb-12 w-full">
            <div className="flex flex-col gap-10 max-w-[1200px] mx-auto pt-8">
                
                {/* SECTION 1: Header/Hero */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-[32px] font-bold text-[#303135] mb-2 font-sans">
                            {greeting}, {userName}!
                        </h1>
                        <p className="text-[#71747d] text-[16px] font-normal">
                            Ready to create something new today?
                        </p>
                    </div>
                    <div className="shrink-0">
                        <TiketButton 
                            variant="primary" 
                            size="large" 
                            onClick={handleCreateNew}
                            className="shadow-lg shadow-blue-200"
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Create New Banner
                            </div>
                        </TiketButton>
                    </div>
                </div>

                {/* SECTION 2: Recent Drafts (CONDITIONAL) */}
                {drafts.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[20px] font-bold text-[#303135]">Recent Drafts</h3>
                            <button 
                                onClick={() => navigate('/banners/drafts')}
                                className="text-[#007BFF] text-[14px] font-bold hover:underline"
                            >
                                View All Drafts
                            </button>
                        </div>
                        {/* UNIFORM GRID - 4 COLUMNS. No live preview: a draft's saved data can't always be
                            re-rendered as a flat banner (DLP/TTD store several sub-banners nested), so this
                            is a simple info card instead of a thumbnail. */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {drafts.slice(0, 4).map((draft) => {
                                // Ratio only makes sense for Promo Banner: DLP/TTD hold several ratios in one project
                                const ratioLabel = draft.category === 'Promo Banner'
                                    ? (() => {
                                        const r = ((draft as any).form_data as BannerFormData | undefined)?.bannerRatio;
                                        if (r === 'Landscape (2:1)') return '2:1';
                                        if (r === 'Landscape (16:9)') return '16:9';
                                        if (r === 'Square (1:1)') return '1:1';
                                        if (r === 'Portrait (3:4)') return '3:4';
                                        if (r === 'Desktop (5:1)') return '5:1';
                                        if (r === 'Desktop (4:1)') return '4:1';
                                        return null;
                                    })()
                                    : null;

                                return (
                                <div
                                    key={draft.id}
                                    onClick={() => handleResumeDraft(draft.id, draft.category)}
                                    className="h-full flex flex-col gap-3 bg-white rounded-[12px] border border-[#d8dce8] p-4 cursor-pointer hover:shadow-lg hover:border-[#007BFF] transition-all duration-300 group"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#007BFF] bg-[#E3EFFB] px-2 py-1 rounded-full truncate">
                                            <FolderOpen className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{draft.category || 'Banner'}</span>
                                        </span>
                                        <FileEdit className="w-3.5 h-3.5 text-[#9EA0A5] group-hover:text-[#007BFF] transition-colors shrink-0" />
                                    </div>
                                    <h4 className="text-[15px] font-bold text-[#303135] leading-tight line-clamp-2" title={draft.name}>
                                        {draft.name}
                                    </h4>
                                    {ratioLabel && (
                                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium self-start">
                                            {ratioLabel}
                                        </span>
                                    )}
                                    <span className="text-[12px] text-[#9EA0A5] mt-auto" title={format(new Date(draft.updatedAt), 'PPpp')}>
                                        {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                                    </span>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* SECTION 3: Recent Activity (Real Data) */}
                <div className="w-full">
                    <h3 className="text-[20px] font-bold text-[#303135] mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#007BFF]" />
                        Recent Activity
                    </h3>
                    <div className={`${cardStyle} p-0`}>
                        <div className="divide-y divide-[#d8dce8]">
                            {activities.length > 0 ? (
                                activities.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex gap-4 items-start p-6 hover:bg-[#f8f9fd] transition-colors cursor-pointer group"
                                        onClick={() => handleActivityClick(item)}
                                    >
                                        <UserAvatar 
                                            src={item.isCurrentUser ? userAvatar : item.userAvatar}
                                            name={item.isCurrentUser ? userName : (item.userName || 'User')}
                                            size={32}
                                            showTooltip={false}
                                            className="mt-1 shrink-0 group-hover:scale-110 transition-transform"
                                        />
                                        <div className="flex-1">
                                            <p className="text-[14px] text-[#303135] leading-tight mb-1">
                                                {item.text}
                                            </p>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <p className="text-[12px] text-[#9EA0A5] font-normal cursor-default inline-block">
                                                            {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                                                        </p>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right">
                                                        <p>{format(new Date(item.time), "PPpp")}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        {/* [DISABLED] Delete activity - uncomment to re-enable cleanup mode
                                        <button
                                            onClick={(e) => handleDeleteActivity(e, item)}
                                            className="text-[#FF0000] text-[12px] font-bold hover:underline"
                                        >
                                            Delete
                                        </button>
                                        */}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-[#71747d]">
                                    <p>No recent activity yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* CREATE BANNER TYPE MODAL */}
            {/* Prepare real banner data for carousel */}
            {(() => {
                // Filter and prepare Promo Banner examples
                const recentPromoBanners: CarouselItem[] = allBanners
                    .filter(b => b.category === 'Promo Banner' && b.status === 'published' && (b as any).form_data)
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 5)
                    .map(b => ({
                        formData: (b as any).form_data as BannerFormData,
                        imageUrl: b.imageUrl // Use the saved thumbnail
                    }));

                // Filter and prepare Product Entry Point examples
                const recentEntryBanners: CarouselItem[] = allBanners
                    .filter(b => b.category === 'Product Entry Point' && b.status === 'published' && (b as any).form_data)
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 5)
                    .map(b => ({
                        formData: (b as any).form_data as BannerFormData,
                        imageUrl: b.imageUrl // Use the saved thumbnail
                    }));

                return (
                    <CreateBannerTypeModal 
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSelectType={handleSelectBannerType}
                        promoExamples={recentPromoBanners}
                        entryExamples={recentEntryBanners}
                    />
                );
            })()}
        </div>
    );
}