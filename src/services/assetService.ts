import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Asset } from '../types/asset';
import { BannerService } from './bannerService';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;

export interface CreateAssetDTO {
  name: string;
  category: string;
  image_url: string;
  created_by: string;
  ratio?: string;
  dimension?: string;
  file_size?: string;
  uploader_name?: string;
  user_avatar?: string;
}

export interface UpdateAssetDTO {
  id: string;
  name?: string;
  image_url?: string;
  category?: string;
  ratio?: string;
  dimension?: string;
  file_size?: string;
  uploader_name?: string;
  user_avatar?: string;
  last_edited_by_id?: string;
  last_edited_by_name?: string;
  last_edited_by_avatar?: string;
}

export const AssetService = {
  /**
   * Uploads the asset file to Supabase Storage via the server proxy.
   */
  async uploadAssetFile(file: File, category: string): Promise<string> {
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${crypto.randomUUID()}.${extension}`;
    // Sanitize category for path (remove spaces to match requirement ProductIcon)
    const safeCategory = category.replace(/\s+/g, '');
    const path = `Assets/Logo/${safeCategory}/${filename}`;

    try {
      const result = await BannerService.uploadImage(file, path);
      return result.url;
    } catch (error) {
      console.error('Failed to upload asset file:', error);
      throw new Error('Failed to upload asset file');
    }
  },

  /**
   * Creates a new record in the logo_assets table (using KV store).
   */
  async createAsset(asset: CreateAssetDTO): Promise<Asset> {
    const response = await fetch(`${SERVER_URL}/assets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...asset,
        created_at: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to save asset');
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      imageUrl: data.image_url,
      ratio: data.ratio || '1:1',
      dimension: data.dimension || 'Auto',
      fileSize: data.file_size || 'Auto',
      addedOn: new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: data.created_at, // ISO string for activity tracking
      updatedAt: data.updated_at || data.created_at, // ISO string for activity tracking
      uploaderName: data.uploader_name,
      createdBy: data.created_by,
    };
  },

  /**
   * Updates an asset.
   */
  async updateAsset(asset: UpdateAssetDTO): Promise<Asset> {
    const response = await fetch(`${SERVER_URL}/assets/${asset.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asset),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update asset');
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      imageUrl: data.image_url,
      ratio: data.ratio || '1:1',
      dimension: data.dimension || 'Auto',
      fileSize: data.file_size || 'Auto',
      addedOn: new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: data.created_at, // ISO string for activity tracking
      updatedAt: data.updated_at || data.created_at, // ISO string for activity tracking
      uploaderName: data.uploader_name,
      createdBy: data.created_by,
    };
  },

  /**
   * Lists assets for a category.
   */
  async listAssets(category?: string): Promise<Asset[]> {
    const response = await fetch(`${SERVER_URL}/assets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      
      const data = await response.json();

      let assets = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        imageUrl: item.image_url,
        ratio: item.ratio || '1:1',
        dimension: item.dimension || 'Auto',
        fileSize: item.file_size || 'Auto',
        addedOn: new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: item.created_at, // ISO string for activity tracking
        updatedAt: item.updated_at || item.created_at, // ISO string for activity tracking
        uploaderName: item.uploader_name,
        createdBy: item.created_by,
      }));

    if (category && category !== 'Others' && category !== 'All') {
      assets = assets.filter((asset: Asset) => asset.category === category);
    }

    return assets;
  },

  /**
   * Deletes an asset by ID (including the file in storage).
   */
  async deleteAsset(id: string): Promise<void> {
    const response = await fetch(`${SERVER_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete asset');
    }
  }
};