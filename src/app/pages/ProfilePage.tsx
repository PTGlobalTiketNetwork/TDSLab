import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Slider } from '../components/ui/slider';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Loader2, User, Trash2, Link as LinkIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, resizeImage } from '../../utils/canvasUtils';
import { useNavigate } from 'react-router-dom';
import LogoTiketHorizontal from '../../imports/LogoTiketHorizontal-7-464';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';

const ROUTE_PREFIX = "/make-server-67753e13"; // Must match backend

// Helper to interact with the backend for deleting files
async function deleteFilesViaBackend(paths: string[]) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    try {
        await fetch(`https://${projectId}.supabase.co/functions/v1${ROUTE_PREFIX}/delete-files`, {
            method: 'POST',
            body: JSON.stringify({ paths }),
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (e) {
        console.error("Failed to delete old avatar", e);
    }
}

// Helper to extract path from Supabase URL
// Assumes URL structure: .../storage/v1/object/public/Banners/Assets/Avatars/...
function extractStoragePath(url: string): string | null {
    try {
        if (!url.includes('/Banners/')) return null;
        const parts = url.split('/Banners/');
        if (parts.length < 2) return null;
        return parts[1];
    } catch (e) {
        return null;
    }
}

// Helper to interact with the backend for avatar upload
async function uploadAvatarViaBackend(file: Blob, userId: string): Promise<string> {
    const formData = new FormData();
    const fileName = `avatar_${Date.now()}.jpg`;
    const path = `Assets/Avatars/${userId}/${fileName}`;
    
    formData.append('file', file);
    formData.append('path', path);

    // Get the current session to get the access token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1${ROUTE_PREFIX}/upload-avatar`, {
        method: 'POST',
        body: formData,
        headers: {
             'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data.url;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [displayName, setDisplayName] = useState('');
  
  // Avatar Logic State
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [slackUrl, setSlackUrl] = useState('');
  const [isAvatarDirty, setIsAvatarDirty] = useState(false);

  // Crop State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUser(user);
      setDisplayName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '');
      
      const currentAvatar = user.user_metadata?.avatar_url || null;
      setOriginalAvatarUrl(currentAvatar);
      setPreviewAvatarUrl(currentAvatar);
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to load profile" variant="error" />);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        toast.custom((t) => <TiketSnackbar id={t} message="File size must be less than 1MB" variant="error" />);
        return;
      }

      // Read file for cropping
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropOpen(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatarUrl(null);
    setPendingAvatarBlob(null);
    setSlackUrl(''); // Clear input if user decides to remove
    setIsAvatarDirty(true);
  };

  const handleSlackUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;
      setSlackUrl(newUrl);
      
      if (newUrl.trim()) {
          setPreviewAvatarUrl(newUrl);
          setPendingAvatarBlob(null); // Clear any pending file upload
          setIsAvatarDirty(true);
      } else {
          // If input is cleared, revert to original (or null if original was null)
          setPreviewAvatarUrl(originalAvatarUrl);
          // If we revert to original, technically it's not dirty anymore unless original was different?
          // But to be safe, we can check. For now, let's assume if they clear it, they might want to revert.
          // However, if they had explicitly removed it before, this "undoes" the remove.
          setIsAvatarDirty(false); 
      }
  };

  const handleCropSave = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;

      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImage) {
        throw new Error('Failed to crop image');
      }

      // Resize to 400x400
      const resizedImage = await resizeImage(croppedImage, 400, 400);
      
      // Update local preview state only
      setPendingAvatarBlob(resizedImage);
      setPreviewAvatarUrl(URL.createObjectURL(resizedImage));
      setSlackUrl(''); // Clear slack URL if a file is chosen
      setIsAvatarDirty(true);
      
      setIsCropOpen(false);
      setImageSrc(null);

    } catch (error: any) {
      console.error('Error processing avatar:', error);
      toast.custom((t) => <TiketSnackbar id={t} message={`Failed to process avatar: ${error.message || 'Unknown error'}`} variant="error" />);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      let finalAvatarUrl = originalAvatarUrl;

      // Handle Avatar Changes
      if (isAvatarDirty) {
          if (pendingAvatarBlob) {
             // Upload new file
             finalAvatarUrl = await uploadAvatarViaBackend(pendingAvatarBlob, user.id);
          } else {
             // Use whatever string is in preview (null or a URL)
             finalAvatarUrl = previewAvatarUrl;
          }

          // Cleanup: Delete old avatar if it was replaced/removed AND it was an internal file
          if (originalAvatarUrl && originalAvatarUrl !== finalAvatarUrl) {
              const oldPath = extractStoragePath(originalAvatarUrl);
              if (oldPath) {
                  await deleteFilesViaBackend([oldPath]);
              }
          }
      }

      const { error } = await supabase.auth.updateUser({
        data: { 
            full_name: displayName, 
            name: displayName,
            avatar_url: finalAvatarUrl 
        }
      });

      if (error) throw error;
      
      toast.custom((t) => <TiketSnackbar id={t} message="Profile updated successfully" variant="default" />);
      navigate('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to update profile" variant="error" />);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F5F7]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E8EAEE] h-16 flex items-center px-6 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4 w-full max-w-5xl mx-auto">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="w-[120px]">
            <LogoTiketHorizontal />
          </div>
          <div className="ml-auto font-medium text-gray-900">
            Profile Settings
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-[#E8EAEE] overflow-hidden">
            <div className="p-8 border-b border-[#E8EAEE]">
              <h1 className="text-2xl font-bold text-[#303135]">Profile</h1>
              <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                    <AvatarImage src={previewAvatarUrl || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-[#007BFF] text-white">
                      {displayName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-200 text-gray-600 hover:text-[#007BFF] hover:border-[#007BFF] transition-all"
                    title="Change Avatar"
                  >
                    <Camera size={18} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                
                <div className="flex-1 space-y-4 text-center sm:text-left">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Profile Picture</h3>
                    <p className="text-sm text-gray-500">
                      Upload a new avatar. Max size 1MB. Recommended size 400x400px.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Slack URL Input */}
                    <div className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input 
                              value={slackUrl}
                              onChange={handleSlackUrlChange}
                              placeholder="Or paste Slack profile URL" 
                              className="pl-9 bg-white h-9"
                            />
                        </div>
                    </div>

                    {/* Remove Button */}
                    {previewAvatarUrl && (
                        <button 
                          onClick={handleRemoveAvatar}
                          className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5 transition-colors w-fit"
                        >
                            <Trash2 size={14} />
                            Remove Avatar
                        </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Form Section */}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={user.email} 
                    disabled 
                    className="bg-gray-50 text-gray-500 border-gray-200"
                  />
                  <p className="text-xs text-gray-400">Email address cannot be changed.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="max-w-md"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-[#E8EAEE] flex justify-end">
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-[#007BFF] hover:bg-[#0064D2] text-white font-semibold px-6"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Crop Modal */}
      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Drag and zoom to adjust your profile picture.
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative h-80 w-full bg-gray-900 rounded-md overflow-hidden mt-4">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="py-4">
            <Label className="mb-2 block">Zoom</Label>
            <Slider 
              value={[zoom]} 
              min={1} 
              max={3} 
              step={0.1} 
              onValueChange={(val) => setZoom(val[0])} 
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropOpen(false)}>Cancel</Button>
            <Button onClick={handleCropSave} className="bg-[#007BFF] text-white hover:bg-[#0064D2]">
              Set Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
