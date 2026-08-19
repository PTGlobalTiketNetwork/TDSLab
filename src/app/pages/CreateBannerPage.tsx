import { useState, useEffect } from 'react';
import { CreateBanner } from '../components/create-banner/CreateBanner';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { BannerService } from '../../services/bannerService';
import { BannerFormData } from '../components/create-banner/types';
import { toast } from 'sonner';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';

interface CreateBannerPageProps {
  userName: string;
  userId?: string;
  userAvatar?: string;
}

export function CreateBannerPage({ userName, userId, userAvatar }: CreateBannerPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { category } = useParams<{ category: string }>();
  const editId = searchParams.get('edit');
  const versionParam = searchParams.get('version');
  
  const [initialData, setInitialData] = useState<BannerFormData | undefined>(undefined);
  const [initialStatus, setInitialStatus] = useState<'draft' | 'published' | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      loadBanner(editId, versionParam ? parseInt(versionParam) : undefined);
    }
  }, [editId, versionParam]);

  const loadBanner = async (id: string, version?: number) => {
    try {
      setIsLoading(true);
      
      let bannerData: any = null;

      if (version) {
          // Fetch from history
          const history = await BannerService.getHistory(id);
          bannerData = history.find((h: any) => h.version === version);
          if (!bannerData) {
              toast.custom((t) => <TiketSnackbar id={t} message={`Version ${version} not found`} variant="error" />);
          }
      } else {
          // Fetch current
          bannerData = await BannerService.getBanner(id);
      }
      
      if (bannerData && bannerData.form_data) {
        setInitialData(bannerData.form_data);
        setInitialStatus(bannerData.status as 'draft' | 'published');
      } else {
        if (!version) {
             // Fallback to list if getBanner fails or returns null (though getBanner handles it)
             const banners = await BannerService.listBanners();
             const found = banners.find(b => b.id === id);
             if (found && found.form_data) {
                 setInitialData(found.form_data);
                 setInitialStatus(found.status as 'draft' | 'published');
             } else {
                 toast.custom((t) => <TiketSnackbar id={t} message="Banner not found or missing data" variant="error" />);
                 navigate(`/banners/${category || 'promo-banner'}`);
             }
        } else {
             // Version not found handled above
             navigate(`/banners/${category || 'promo-banner'}`);
        }
      }
    } catch (error) {
      console.error('Failed to load banner for editing', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to load banner" variant="error" />);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = (message?: string) => {
    navigate(`/banners/${category || 'promo-banner'}`);
    if (message) toast.custom((t) => <TiketSnackbar id={t} message={message} variant="default" />);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fd]">
        <div className="w-8 h-8 border-4 border-[#0064D2] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <CreateBanner
      onBack={handleBack}
      userName={userName}
      userId={userId}
      userAvatar={userAvatar}
      initialData={initialData}
      editingId={editId || undefined}
      initialStatus={initialStatus}
      embedded={false}
      fullWidth={true}
    />
  );
}
