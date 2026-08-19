import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { Banner } from '../types/banner';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;

// Retry helper for handling transient network errors
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If we get a response (even error responses), return it
      // Only retry on network failures
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Fetch attempt ${attempt + 1}/${maxRetries} failed:`, error);
      
      // Don't retry if this is the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: wait longer between each retry
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, throw the last error
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

export interface CreateBannerDTO {
  id?: string;
  name: string;
  category: string;
  status: 'published' | 'draft';
  form_data: any; // Raw wizard state
  image_url_en?: string;
  image_url_id?: string;
  created_by: string;
  creator_name?: string;
  thumbnail?: string; // Can be same as image_url_en
  metadata?: {
    dimension?: string;
    fileSize?: string;
  };
  product?: string; // Legacy support
  // Versioning
  version?: number;
  last_edited_by_id?: string;
  last_edited_by_name?: string;
  updated_at?: string;
}

export const BannerService = {
  async getBanner(id: string): Promise<Banner | null> {
      const response = await fetchWithRetry(`${SERVER_URL}/banners/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const item = await response.json();
      return {
        ...item,
        product: item.product || item.verticalCategory || 'Hotel',
        imageUrl: item.image_url_en || item.imageUrl || '',
        thumbnail: item.image_url_en || item.imageUrl || '',
        isPublished: item.status === 'published',
        createdBy: item.created_by || item.createdBy || '',
        creatorName: item.creator_name || item.creatorName || '',
        dimension: item.dimension || item.metadata?.dimension || '',
        fileSize: item.fileSize || item.metadata?.fileSize || '',
        version: item.version || 1,
        lastEditedById: item.last_edited_by_id,
        lastEditedByName: item.last_edited_by_name || item.creator_name || item.creatorName,
        updatedAt: item.updated_at || item.updatedAt || item.createdAt
      };
  },

  async listBanners(): Promise<Banner[]> {
    const response = await fetchWithRetry(`${SERVER_URL}/banners`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch banners: ${response.status} ${response.statusText}`);
      throw new Error('Failed to fetch banners');
    }
    
    const data = await response.json();
    // Map backend format to Banner type if needed
    // Assuming backend returns objects that match CreateBannerDTO + id, timestamps
    return data.map((item: any) => ({
      ...item,
      // Ensure required Banner fields are present
      product: item.product || item.verticalCategory || 'Hotel', 
      imageUrl: item.image_url_en || item.imageUrl || '',
      thumbnail: item.image_url_en || item.imageUrl || '',
      isPublished: item.status === 'published',
      createdBy: item.created_by || item.createdBy || '',
      creatorName: item.creator_name || item.creatorName || '',
      dimension: item.dimension || item.metadata?.dimension || '',
      fileSize: item.fileSize || item.metadata?.fileSize || '',
      // Versioning & Init Logic
      version: item.version || 1,
      lastEditedById: item.last_edited_by_id,
      lastEditedByName: item.last_edited_by_name || item.creator_name || item.creatorName,
      updatedAt: item.updated_at || item.updatedAt || item.createdAt
    }));
  },

  async saveBanner(banner: CreateBannerDTO): Promise<any> {
    // Set initial version info if not present
    const payload = {
        ...banner,
        version: banner.version || 1,
        last_edited_by_id: banner.last_edited_by_id || banner.created_by,
        last_edited_by_name: banner.last_edited_by_name || banner.creator_name,
        updated_at: new Date().toISOString()
    };

    const response = await fetchWithRetry(`${SERVER_URL}/banners`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errMessage = `Server error ${response.status}`;
      try { const err = await response.json(); errMessage = err.error || errMessage; } catch {}
      throw new Error(errMessage);
    }

    const savedData = await response.json();

    // Broadcast update (fire-and-forget; a broadcast failure must not surface as a save error)
    const bannerId = savedData.id || banner.id;
    if (bannerId) {
      try {
        await supabase.channel('banner_updates').httpSend({
           type: 'broadcast',
           event: 'NEW_VERSION_SAVED',
           payload: {
              bannerId: bannerId,
              userId: banner.last_edited_by_id,
              userName: banner.last_edited_by_name
           }
        });
      } catch (broadcastErr) {
        console.warn('Banner save broadcast failed (non-fatal):', broadcastErr);
      }
    }

    return savedData;
  },

  async getHistory(id: string): Promise<any[]> {
      const response = await fetchWithRetry(`${SERVER_URL}/banners/${id}/history`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
  },

  async updateBanner(id: string, banner: Partial<CreateBannerDTO>): Promise<any> {
    // Fetch current to increment version
    let currentVersion = 0;
    try {
        const current = await this.getBanner(id);
        if (current) currentVersion = current.version || 1;
    } catch (e) {
        console.warn("Could not fetch current version", e);
    }

    const payload = {
        ...banner,
        version: (banner.version || currentVersion) + 1,
        updated_at: new Date().toISOString()
    };

    const response = await fetchWithRetry(`${SERVER_URL}/banners/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errMessage = `Server error ${response.status}`;
      try { const err = await response.json(); errMessage = err.error || errMessage; } catch {}
      throw new Error(errMessage);
    }

    const savedData = await response.json();

    // Broadcast update (fire-and-forget; a broadcast failure must not surface as a save error)
    try {
      await supabase.channel('banner_updates').httpSend({
         type: 'broadcast',
         event: 'NEW_VERSION_SAVED',
         payload: {
            bannerId: id,
            userId: payload.last_edited_by_id,
            userName: payload.last_edited_by_name
         }
      });
    } catch (broadcastErr) {
      console.warn('Banner update broadcast failed (non-fatal):', broadcastErr);
    }

    return savedData;
  },

  async deleteBanner(id: string): Promise<void> {
    const response = await fetchWithRetry(`${SERVER_URL}/banners/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete banner');
    }
  },

  async uploadImage(file: Blob, path: string): Promise<{ url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetchWithRetry(`${SERVER_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errMessage = `Upload server error ${response.status}`;
      try { const err = await response.json(); errMessage = err.error || errMessage; } catch {}
      throw new Error(errMessage);
    }

    return response.json();
  },

  async deleteFiles(paths: string[]): Promise<void> {
    const response = await fetchWithRetry(`${SERVER_URL}/delete-files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paths }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete files');
    }
  },

  async checkBannerName(name: string): Promise<{ exists: boolean; id?: string }> {
    try {
        const banners = await this.listBanners();
        const found = banners.find(b => b.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (found) {
            return { exists: true, id: found.id };
        }
        return { exists: false };
    } catch (e) {
        console.error("Failed to check banner name", e);
        return { exists: false };
    }
  },

  async generateImage(options: { 
    prompt: string; 
    aspect_ratio?: string; 
    resolution?: string; 
    image_input?: string[];
    modelId?: string;
  }): Promise<{ imageUrl: string }> {
    // 1. Start the generation process
    // Disable retries to prevent duplicate processing on Replicate if the request times out but actually reached the server
    const startResponse = await fetchWithRetry(`${SERVER_URL}/start-generate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    }, 1); // maxRetries = 1 (try once, no retry)

    if (!startResponse.ok) {
      const err = await startResponse.json();
      throw new Error(err.error || 'Failed to start image generation');
    }

    const { predictionId } = await startResponse.json();

    // 2. Poll for results
    // We'll poll for up to 10 minutes (600 seconds) to handle slower models
    const maxAttempts = 300; // 300 * 2s = 600s
    const pollInterval = 2000; // 2s

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const pollResponse = await fetch(`${SERVER_URL}/check-prediction/${predictionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!pollResponse.ok) {
        console.warn('Polling failed, retrying...');
        continue;
      }

      const data = await pollResponse.json();

      if (data.status === 'succeeded') {
        let finalUrl = "";
        if (Array.isArray(data.output) && data.output.length > 0) {
            finalUrl = data.output[0];
        } else if (typeof data.output === "string") {
            finalUrl = data.output;
        }
        
        if (finalUrl) {
            return { imageUrl: finalUrl };
        }
        throw new Error('Generation succeeded but no output URL found');
      } else if (data.status === 'failed' || data.status === 'canceled') {
        throw new Error(data.error || `Generation ${data.status}`);
      }
      
      // If status is 'starting' or 'processing', continue loop
    }

    throw new Error('Generation timed out');
  },

  async getActivities(): Promise<any[]> {
    try {
      // Fetch all activities from kv_store
      // The server doesn't have a dedicated endpoint yet, so we'll need to add one
      // For now, we'll return empty array and add the endpoint
      const response = await fetchWithRetry(`${SERVER_URL}/activities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
  },

  async deleteActivity(timestamp: string, entityId: string): Promise<boolean> {
    try {
      const response = await fetch(`${SERVER_URL}/activities`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp, entity_id: entityId }),
      });
      if (!response.ok) {
        console.error('Failed to delete activity:', await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to delete activity:', error);
      return false;
    }
  }
};