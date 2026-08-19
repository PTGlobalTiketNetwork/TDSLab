import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to get Supabase client
const getSupabase = () => createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

// Retry helper for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  retryDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Check if it's a connection error that we should retry
      const lowerError = errorMsg.toLowerCase();
      const isConnectionError = lowerError.includes('connection') || 
                                lowerError.includes('econnreset') ||
                                lowerError.includes('network') ||
                                lowerError.includes('timeout') ||
                                lowerError.includes('reset by peer');
      
      if (!isConnectionError || attempt === maxRetries - 1) {
        // Don't retry non-connection errors or if this is the last attempt
        throw error;
      }
      
      console.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries}):`, errorMsg);
      
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

const ROUTE_PREFIX = "/make-server-67753e13";
const BUCKET_NAME = "Banners";
const ACCESS_PREFIX = "access:member:";
const ACCESS_AUDIT_PREFIX = "access:audit:";
const BOOTSTRAP_ADMIN_EMAIL = "ryan.setiawan@tiket.com";

type AccessRole = "admin" | "member";

type AccessMember = {
  userId: string;
  email: string;
  displayName?: string;
  role: AccessRole;
  active: boolean;
  addedBy: string | null;
  addedAt: string;
  updatedAt: string;
  revokedBy?: string | null;
  revokedAt?: string | null;
};

async function getAuthenticatedUser(c: any) {
  const authorization = c.req.header("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await getSupabase().auth.getUser(token);
  return error ? null : data.user;
}

async function ensureBootstrapAdmin(user: any): Promise<AccessMember | null> {
  if (!user?.email || user.email.toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL) return null;
  const key = `${ACCESS_PREFIX}${user.id}`;
  const current = await kv.get(key) as AccessMember | null;
  if (current) return current;
  const now = new Date().toISOString();
  const member: AccessMember = {
    userId: user.id, email: user.email, displayName: user.user_metadata?.name,
    role: "admin", active: true, addedBy: null, addedAt: now, updatedAt: now,
  };
  await kv.set(key, member);
  await kv.set(`${ACCESS_AUDIT_PREFIX}${now}:${crypto.randomUUID()}`, {
    action: "bootstrap_admin", actorId: user.id, actorEmail: user.email,
    targetId: user.id, targetEmail: user.email, timestamp: now,
  });
  return member;
}

async function getAccessMember(user: any): Promise<AccessMember | null> {
  const bootstrap = await ensureBootstrapAdmin(user);
  if (bootstrap) return bootstrap;
  return await kv.get(`${ACCESS_PREFIX}${user.id}`) as AccessMember | null;
}

async function requireAdmin(c: any): Promise<{ user: any; member: AccessMember } | null> {
  const user = await getAuthenticatedUser(c);
  if (!user) { c.status(401); c.json({ error: "Authentication required" }); return null; }
  const member = await getAccessMember(user);
  if (!member?.active || member.role !== "admin") { c.status(403); c.json({ error: "Admin access required" }); return null; }
  return { user, member };
}

// Health check endpoint
app.get(`${ROUTE_PREFIX}/health`, (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post(`${ROUTE_PREFIX}/signup`, async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { name: name },
      email_confirm: true
    });

    if (error) {
      console.error("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.error("Signup exception:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// --- Access Control Endpoints ---
app.get(`${ROUTE_PREFIX}/access/me`, async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user) return c.json({ error: "Authentication required" }, 401);
  const member = await getAccessMember(user);
  return c.json({
    role: member?.active ? member.role : null,
    isWhitelisted: Boolean(member?.active),
    isAdmin: member?.active && member.role === "admin",
  });
});

app.get(`${ROUTE_PREFIX}/access/members`, async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: "Admin access required" }, 403);
  const members = await kv.getByPrefix(ACCESS_PREFIX) as AccessMember[];
  return c.json(members.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
});

app.get(`${ROUTE_PREFIX}/access/audit`, async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: "Admin access required" }, 403);
  const events = await kv.getByPrefix(ACCESS_AUDIT_PREFIX);
  return c.json(events.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp)));
});

app.get(`${ROUTE_PREFIX}/access/accounts`, async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: "Admin access required" }, 403);
  const { data, error } = await getSupabase().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return c.json({ error: error.message }, 400);
  return c.json((data.users || []).map((user: any) => ({
    userId: user.id, email: user.email, displayName: user.user_metadata?.name || user.email,
  })));
});

app.post(`${ROUTE_PREFIX}/access/members`, async (c) => {
  const actor = await requireAdmin(c);
  if (!actor) return c.json({ error: "Admin access required" }, 403);
  const { userId, role } = await c.req.json();
  if (!userId || !["admin", "member"].includes(role)) return c.json({ error: "Valid userId and role are required" }, 400);
  const { data, error } = await getSupabase().auth.admin.getUserById(userId);
  if (error || !data.user?.email) return c.json({ error: "Existing account not found" }, 404);
  const now = new Date().toISOString();
  const previous = await kv.get(`${ACCESS_PREFIX}${userId}`) as AccessMember | null;
  const member: AccessMember = {
    userId, email: data.user.email, displayName: data.user.user_metadata?.name,
    role, active: true, addedBy: actor.user.id, addedAt: previous?.addedAt || now, updatedAt: now,
    revokedBy: null, revokedAt: null,
  };
  await kv.set(`${ACCESS_PREFIX}${userId}`, member);
  await kv.set(`${ACCESS_AUDIT_PREFIX}${now}:${crypto.randomUUID()}`, {
    action: previous ? "updated" : "added", actorId: actor.user.id, actorEmail: actor.user.email,
    targetId: userId, targetEmail: member.email, previousRole: previous?.role || null, role, timestamp: now,
  });
  return c.json(member);
});

// --- Banner Endpoints ---

// Create/Update Banner
app.post(`${ROUTE_PREFIX}/banners`, async (c) => {
  try {
    const banner = await c.req.json();
    
    // Ensure ID exists
    if (!banner.id) {
      banner.id = crypto.randomUUID();
    }
    
    // Validate required fields (relaxed for drafts)
    if (!banner.created_by) {
        return c.json({ error: "created_by is required" }, 400);
    }

    // Timestamps
    const now = () => new Date().toISOString();
    banner.updatedAt = now();
    if (!banner.createdAt) {
        banner.createdAt = now();
    }

    // Save to KV
    // Key format: banner:{id}
    await kv.set(`banner:${banner.id}`, banner);

    // LOG ACTIVITY for newly created banners that are published
    if (banner.status === 'published') {
        const activityKey = `activity:${now()}:${banner.id}`;
        const activityData = {
            user_id: banner.last_edited_by_id || banner.created_by,
            user_name: banner.last_edited_by_name || banner.creator_name || 'Unknown',
            user_avatar: banner.user_avatar || null,
            target_name: banner.name,
            target_type: 'banner',
            action: 'created',
            version: banner.version || 1,
            timestamp: now(),
            banner_id: banner.id,
            category: banner.category || 'Promo Banner'
        };
        await kv.set(activityKey, activityData);
    }

    return c.json(banner);
  } catch (err) {
    console.error("Error saving banner:", err);
    return c.json({ error: "Failed to save banner" }, 500);
  }
});

// Get Single Banner
app.get(`${ROUTE_PREFIX}/banners/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const banner = await kv.get(`banner:${id}`);
    
    if (!banner) {
        return c.json({ error: "Banner not found" }, 404);
    }
    
    return c.json(banner);
  } catch (err) {
    console.error("Error fetching banner:", err);
    return c.json({ error: "Failed to fetch banner" }, 500);
  }
});

// Get Banner History
app.get(`${ROUTE_PREFIX}/banners/:id/history`, async (c) => {
    try {
        const id = c.req.param("id");
        // Fetch all keys starting with banner_history:{id}:
        const historyPrefix = `banner_history:${id}:`;
        const items = await withRetry(() => kv.getByPrefix(historyPrefix));
        
        // Sort by version descending (assuming version is part of the key or inside the object)
        // Since we store the full object in the value, we can sort by `version` property or `updated_at`.
        items.sort((a: any, b: any) => (b.version || 0) - (a.version || 0));
        
        return c.json(items);
    } catch (err) {
        console.error("Error fetching history:", err);
        return c.json({ error: "Failed to fetch history" }, 500);
    }
});

// Update Banner
app.put(`${ROUTE_PREFIX}/banners/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const banner = await c.req.json();
    
    // Ensure ID matches
    if (banner.id && banner.id !== id) {
        return c.json({ error: "ID mismatch" }, 400);
    }
    banner.id = id;

    // Validate required fields
    if (!banner.created_by) {
        return c.json({ error: "created_by is required" }, 400);
    }

    // Timestamps
    const now = () => new Date().toISOString();
    banner.updatedAt = now();
    // Assuming banner object contains createdAt if it's an update
    if (!banner.createdAt) {
        // Fallback if missing
        banner.createdAt = now();
    }

    // --- CLEANUP LOGIC REMOVED FOR VERSION HISTORY SUPPORT ---
    // Previous logic deleted images that were removed from the active banner record.
    // This broke version history because older versions (snapshots) still referenced those images.
    // Now, we keep all assets indefinitely to ensure history integrity.
    // Cleanup should only happen when the entire banner is deleted (and even then, strictly).

    // --- VERSION SNAPSHOTTING START ---
    // Rule: Only snapshot if status is becoming 'published'. 
    // If status remains 'draft', we simply overwrite.
    
    const isPublishing = banner.status === 'published';
    const oldBanner = await kv.get(`banner:${id}`);
    
    // 1. GET CURRENT DATA (Pre-fetch)
    // Identify Current Version. If not found, default to 1.
    const currentVer = oldBanner?.version || 1;
    
    // 2. DETERMINE ACTION TYPE FOR ACTIVITY LOG
    let actionType: 'published' | 'edited' | 'restored' | null = null;
    
    if (isPublishing) {
        // 3. CREATE HISTORY SNAPSHOT (The "Copy")
        // Before updating anything, save the OLD DATA as a history entry.
        if (oldBanner) {
            // FIX: If old banner (draft) is missing name info, try to recover it from current request
            // This fixes "Edited by Unknown" for initial versions converted from drafts
            if (oldBanner.status === 'draft') {
                 // Try to recover creator name if IDs match
                 if (!oldBanner.creator_name && banner.creator_name && oldBanner.created_by === banner.created_by) {
                     oldBanner.creator_name = banner.creator_name;
                 }
                 
                 // Try to recover last edited by name
                 if (!oldBanner.last_edited_by_name || oldBanner.last_edited_by_name === 'Unknown') {
                     // If current user is the creator/editor of the draft, use their name
                     if (oldBanner.created_by === banner.last_edited_by_id && banner.last_edited_by_name) {
                         oldBanner.last_edited_by_name = banner.last_edited_by_name;
                     }
                     // Fallback: use creator name if available
                     else if (oldBanner.creator_name) {
                         oldBanner.last_edited_by_name = oldBanner.creator_name;
                     }
                 }
            }

            const historyKey = `banner_history:${id}:${currentVer}`;
            await kv.set(historyKey, oldBanner);
        }

        // 4. UPDATE MASTER RECORD (The "New Version")
        // Version Increment: Set version = currentVer + 1
        banner.version = currentVer + 1;
        
        // 5. DETERMINE ACTION TYPE
        // CASE A: Truly New Publish (no oldBanner exists)
        if (!oldBanner) {
            actionType = 'published';
        }
        // CASE C: Restored (has restore_note)
        else if (banner.restore_note) {
            actionType = 'restored';
        }
        // CASE A/B: Draft being published - check if it was ever published before
        else if (oldBanner.status === 'draft') {
            // Check if this banner has any history (was it ever published before?)
            const historyItems = await kv.getByPrefix(`banner_history:${id}:`);
            if (historyItems.length === 0) {
                // No history = first time publishing (new banner)
                actionType = 'published';
            } else {
                // Has history = was published before, user edited and saved as draft, now publishing again
                actionType = 'edited';
            }
        }
        // CASE B: Edit (existing published banner being updated)
        else if (oldBanner.status === 'published') {
            actionType = 'edited';
        }
    } else {
        // DRAFT MODE: Overwrite without incrementing
        // Ensure version stays same as current (or 1 if new)
        banner.version = currentVer;
    }
    
    await kv.set(`banner:${id}`, banner);
    
    // 6. LOG ACTIVITY (only for published actions)
    if (actionType && isPublishing) {
        const activityKey = `activity:${now()}:${id}`;
        const activityData = {
            user_id: banner.last_edited_by_id || banner.created_by,
            user_name: banner.last_edited_by_name || banner.creator_name || 'Unknown',
            user_avatar: banner.user_avatar || null,
            target_name: banner.name,
            target_type: 'banner',
            action: actionType,
            version: banner.version,
            timestamp: now(),
            banner_id: id, // Store banner ID for click handling
            category: banner.category || 'Promo Banner'
        };
        await kv.set(activityKey, activityData);
    }
    
    return c.json(banner);
  } catch (err) {
    console.error("Error updating banner:", err);
    return c.json({ error: "Failed to update banner" }, 500);
  }
});

// --- Asset Endpoints ---

// Create Asset
app.post(`${ROUTE_PREFIX}/assets`, async (c) => {
  try {
    const asset = await c.req.json();
    
    // Ensure ID exists
    if (!asset.id) {
      asset.id = crypto.randomUUID();
    }
    
    // Validate required fields
    if (!asset.name || !asset.image_url || !asset.created_by) {
        return c.json({ error: "Missing required fields" }, 400);
    }

    // Timestamps
    const now = () => new Date().toISOString();
    if (!asset.created_at) {
        asset.created_at = now();
    }

    // Save to KV
    // Key format: asset:{id}
    await kv.set(`asset:${asset.id}`, asset);

    return c.json(asset);
  } catch (err) {
    console.error("Error saving asset:", err);
    return c.json({ error: "Failed to save asset" }, 500);
  }
});

// Update Asset
app.put(`${ROUTE_PREFIX}/assets/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    // Ensure ID exists
    if (!id) {
        return c.json({ error: "ID is required" }, 400);
    }

    // Fetch existing asset
    const existingAsset = await kv.get(`asset:${id}`);
    if (!existingAsset) {
        return c.json({ error: "Asset not found" }, 404);
    }
    
    // Determine if this is a new upload or edit
    const isEdit = !!existingAsset.created_at; // If created_at exists, it's an edit

    // If updating image, we might want to delete the old one?
    // For now, let's just assume the frontend handles uploading the new one
    // and we just update the URL.
    // Ideally, we should delete the old file if it's different.
    
    // If image_url is changing and it's not the same as before
    if (updates.image_url && updates.image_url !== existingAsset.image_url) {
         const oldUrl = existingAsset.image_url as string;
         const newUrl = updates.image_url as string;

         // Rewrite all banner references to the old URL so existing banners keep
         // displaying the (newly cropped/replaced) logo without manual edits.
         try {
             const banners = await kv.getByPrefix("banner:");
             const updatedBanners: any[] = [];
             for (const banner of banners) {
                 const fd = banner?.form_data;
                 if (!fd) continue;
                 let touched = false;
                 if (fd.campaignLogo === oldUrl) { fd.campaignLogo = newUrl; touched = true; }
                 if (fd.productIcon === oldUrl) { fd.productIcon = newUrl; touched = true; }
                 if (Array.isArray(fd.partnerLogos)) {
                     fd.partnerLogos.forEach((slot: any) => {
                         if (slot && slot.logo === oldUrl) { slot.logo = newUrl; touched = true; }
                     });
                 }
                 if (touched) {
                     banner.form_data = fd;
                     banner.updated_at = new Date().toISOString();
                     updatedBanners.push(banner);
                 }
             }
             for (const b of updatedBanners) {
                 await kv.set(`banner:${b.id}`, b);
             }
             if (updatedBanners.length > 0) {
                 console.log(`Asset URL changed — rewrote logo refs in ${updatedBanners.length} banner(s).`);
             }
         } catch (rewriteErr) {
             console.error("Failed to rewrite banner logo references:", rewriteErr);
         }

         // Helper to extract path (reused from delete)
         const extractPath = (urlString: string) => {
             if (!urlString) return null;
             try {
                const bucketSegment = `/${BUCKET_NAME}/`;
                const index = urlString.indexOf(bucketSegment);
                if (index !== -1) {
                    let path = urlString.substring(index + bucketSegment.length);
                    const queryIndex = path.indexOf('?');
                    if (queryIndex !== -1) path = path.substring(0, queryIndex);
                    return decodeURIComponent(path);
                }
             } catch(e) { console.error(e); }
             return null;
         };

         const oldPath = extractPath(oldUrl);
         if (oldPath) {
             console.log("Deleting old asset file:", oldPath);
             const supabase = getSupabase();
             await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
         }
    }

    const now = new Date().toISOString();
    const updatedAsset = {
        ...existingAsset,
        ...updates,
        id: id, // Ensure ID doesn't change
        updated_at: now
    };

    await kv.set(`asset:${id}`, updatedAsset);
    
    // Log activity for asset updates
    const isCategoryMove = updates.category && updates.category !== existingAsset.category;
    const actionType = isCategoryMove ? 'moved' : (isEdit ? 'edited' : 'uploaded');
    const activityKey = `activity:${now}:${id}`;
    const activityData = {
        user_id: updates.last_edited_by_id || updatedAsset.last_edited_by_id || updatedAsset.created_by,
        user_name: updates.last_edited_by_name || updatedAsset.last_edited_by_name || updatedAsset.uploader_name || 'Unknown',
        user_avatar: updates.last_edited_by_avatar || updatedAsset.last_edited_by_avatar || updatedAsset.user_avatar || null,
        target_name: updatedAsset.name,
        target_type: 'asset',
        action: actionType,
        timestamp: now,
        asset_id: id,
        category: updatedAsset.category
    };
    await kv.set(activityKey, activityData);
    
    return c.json(updatedAsset);
    
  } catch (err) {
    console.error("Error updating asset:", err);
    return c.json({ error: "Failed to update asset" }, 500);
  }
});

// Get All Assets
app.get(`${ROUTE_PREFIX}/assets`, async (c) => {
  try {
    const assets = await withRetry(() => kv.getByPrefix("asset:"));
    return c.json(assets);
  } catch (err) {
    console.error("Error fetching assets:", err);
    return c.json({ error: "Failed to fetch assets" }, 500);
  }
});

// Delete Asset
app.delete(`${ROUTE_PREFIX}/assets/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Asset ID is required" }, 400);
    }
    
    // 1. Fetch the asset to get image path
    const asset = await kv.get(`asset:${id}`);
    
    if (asset) {
        const supabase = getSupabase();
        
        // Helper to extract path from URL (similar to banner delete logic)
        const extractPath = (urlString: string) => {
            if (!urlString) return null;
            try {
                const bucketSegment = `/${BUCKET_NAME}/`;
                const index = urlString.indexOf(bucketSegment);
                if (index !== -1) {
                    let path = urlString.substring(index + bucketSegment.length);
                    const queryIndex = path.indexOf('?');
                    if (queryIndex !== -1) {
                        path = path.substring(0, queryIndex);
                    }
                    return decodeURIComponent(path);
                }
            } catch (e) {
                console.error("Error parsing URL:", e);
            }
            return null;
        };

        const path = extractPath(asset.image_url);
        
        if (path) {
            console.log("Deleting asset file:", path);
            const { error: storageError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([path]);
            
            if (storageError) {
                console.error("Error deleting file from storage:", storageError);
            }
        }
    }

    await kv.del(`asset:${id}`);
    
    return c.json({ success: true });
  } catch (err) {
    console.error("Error deleting asset:", err);
    return c.json({ error: "Failed to delete asset" }, 500);
  }
});

// Get All Banners
app.get(`${ROUTE_PREFIX}/banners`, async (c) => {
  try {
    const banners = await withRetry(() => kv.getByPrefix("banner:"));
    return c.json(banners);
  } catch (err) {
    console.error("Error fetching banners:", err);
    return c.json({ error: "Failed to fetch banners" }, 500);
  }
});

// Get All Activities
app.get(`${ROUTE_PREFIX}/activities`, async (c) => {
  try {
    const activities = await withRetry(() => kv.getByPrefix("activity:"));
    // Sort by timestamp descending (most recent first)
    activities.sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    return c.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    return c.json({ error: "Failed to fetch activities" }, 500);
  }
});

// Delete Activity (temporary admin cleanup)
app.delete(`${ROUTE_PREFIX}/activities`, async (c) => {
  try {
    const { timestamp, entity_id } = await c.req.json();
    if (!timestamp || !entity_id) {
      return c.json({ error: "timestamp and entity_id are required" }, 400);
    }
    const activityKey = `activity:${timestamp}:${entity_id}`;
    console.log("Deleting activity with key:", activityKey);
    await kv.del(activityKey);
    return c.json({ success: true, deleted_key: activityKey });
  } catch (err) {
    console.error("Error deleting activity:", err);
    return c.json({ error: "Failed to delete activity" }, 500);
  }
});

// Delete Banner
app.delete(`${ROUTE_PREFIX}/banners/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Banner ID is required" }, 400);
    }
    
    // 1. Fetch the banner to be deleted
    const banner = await kv.get(`banner:${id}`);
    
    // 2. Fetch all history snapshots for this banner
    // We need these to find all images used by this banner over its lifetime
    const historyValues = await kv.getByPrefix(`banner_history:${id}:`);
    
    if (banner) {
        const supabase = getSupabase();
        
        // Helper to extract path from URL
        const extractPath = (urlString: string) => {
            if (!urlString) return null;
            try {
                const bucketSegment = `/${BUCKET_NAME}/`;
                const index = urlString.indexOf(bucketSegment);
                if (index !== -1) {
                    let path = urlString.substring(index + bucketSegment.length);
                    const queryIndex = path.indexOf('?');
                    if (queryIndex !== -1) {
                        path = path.substring(0, queryIndex);
                    }
                    return decodeURIComponent(path);
                }
            } catch (e) {
                console.error("Error parsing URL:", e);
            }
            return null;
        };

        // Identify ALL candidate paths from the banner and its history
        const candidatePaths = new Set<string>();
        
        const collectUrls = (obj: any) => {
            if (!obj) return;
            if (obj.image_url_en) candidatePaths.add(extractPath(obj.image_url_en)!);
            if (obj.image_url_id) candidatePaths.add(extractPath(obj.image_url_id)!);
            if (obj.form_data?.keyVisualUrl) candidatePaths.add(extractPath(obj.form_data.keyVisualUrl)!);
            if (obj.imageUrl) candidatePaths.add(extractPath(obj.imageUrl)!);
            if (obj.thumbnail) candidatePaths.add(extractPath(obj.thumbnail)!);
        };

        collectUrls(banner);
        historyValues.forEach(h => collectUrls(h));
        
        // Remove nulls/undefineds
        candidatePaths.delete(null as any);
        candidatePaths.delete(undefined as any);

        if (candidatePaths.size > 0) {
            console.log(`Checking usage for ${candidatePaths.size} candidate files...`);
            
            // 3. GLOBAL SCAN: Fetch ALL data to check for reference usage
            // This is "Deep Cleanup" - ensuring no other banner (duplicate or totally different) uses these files.
            // We fetch everything because we need to check usage in other banners AND other banners' history.
            // Using empty prefix to get everything.
            const allValues = await kv.getByPrefix("");
            
            // Create a collection of "Values to Delete" (current banner + its history)
            // We stringify them for easy comparison
            const valuesToDelete = [banner, ...historyValues].map(v => JSON.stringify(v));
            
            // 4. USAGE CHECK
            const finalPathsToDelete: string[] = [];

            for (const path of candidatePaths) {
                // Count TOTAL occurrences in the entire DB
                let totalMatches = 0;
                for (const val of allValues) {
                    if (JSON.stringify(val).includes(path)) {
                        totalMatches++;
                    }
                }
                
                // Count occurrences in the records we are about to delete
                let deletedMatches = 0;
                for (const valStr of valuesToDelete) {
                    if (valStr.includes(path)) {
                        deletedMatches++;
                    }
                }
                
                // If total > deleted, it means someone ELSE is using it.
                // If total == deleted (or less? shouldn't happen), then it's safe to delete.
                const otherMatches = totalMatches - deletedMatches;
                
                if (otherMatches <= 0) {
                    finalPathsToDelete.push(path);
                } else {
                    console.log(`File ${path} is preserved (used ${otherMatches} times elsewhere).`);
                }
            }

            // 5. Delete only the unused files
            if (finalPathsToDelete.length > 0) {
                console.log("Deleting unused files:", finalPathsToDelete);
                const { error: storageError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .remove(finalPathsToDelete);
                
                if (storageError) {
                    console.error("Error deleting files from storage:", storageError);
                }
            }
        }
    }

    // 6. DELETE RECORDS
    // Delete Master Record
    await kv.del(`banner:${id}`);
    
    // Delete History Records
    // We reconstruct keys from the history values since kv.getByPrefix only returns values
    // Assuming history items have 'version' property as per save logic
    if (historyValues.length > 0) {
        const historyKeys: string[] = [];
        historyValues.forEach((h: any) => {
             if (h.version) {
                 historyKeys.push(`banner_history:${id}:${h.version}`);
             }
        });
        
        if (historyKeys.length > 0) {
             console.log(`Deleting ${historyKeys.length} history records...`);
             await kv.mdel(historyKeys);
        }
    }
    
    return c.json({ success: true });
  } catch (err) {
    console.error("Error deleting banner:", err);
    return c.json({ error: "Failed to delete banner" }, 500);
  }
});

// Upload File
app.post(`${ROUTE_PREFIX}/upload`, async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];
    const path = body['path'] as string; // e.g. "Promo_Banner/user_123/timestamp_en.png"

    if (!(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }
    if (!path) {
        return c.json({ error: "No path provided" }, 400);
    }

    const supabase = getSupabase();

    // Ensure bucket exists or update it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucket = buckets?.find(b => b.name === BUCKET_NAME);
    const isPublic = bucket?.public ?? false;
    
    if (!bucket) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: false, // Default to private if we create it
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
    } else {
      await supabase.storage.updateBucket(BUCKET_NAME, {
        public: isPublic, // Preserve existing public status
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
    }

    // Upload
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error("Upload error:", error);
      return c.json({ error: error.message }, 500);
    }

    // Generate URL
    let fileUrl = "";
    
    if (isPublic) {
        // Use public URL for public buckets
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        fileUrl = data.publicUrl;
    } else {
        // Use signed URL for private buckets
        const { data: signedData, error: signError } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

        if (signError || !signedData) {
            console.error("Sign error:", signError);
            return c.json({ error: "Failed to sign URL" }, 500);
        }
        fileUrl = signedData.signedUrl;
    }

    return c.json({ 
        path: path,
        url: fileUrl
    });

  } catch (err) {
    console.error("Upload exception:", err);
    return c.json({ error: "Internal server error during upload" }, 500);
  }
});

// Upload Avatar (Specific endpoint for avatars to allow flexible folder structure)
app.post(`${ROUTE_PREFIX}/upload-avatar`, async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];
    const path = body['path'] as string; 

    if (!(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }
    if (!path) {
        return c.json({ error: "No path provided" }, 400);
    }

    const supabase = getSupabase();

    // Ensure bucket exists or update it (reuse BUCKET_NAME which is "Banners")
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucket = buckets?.find(b => b.name === BUCKET_NAME);
    const isPublic = bucket?.public ?? false;
    
    if (!bucket) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Force public for avatars usually? Or keep consistent.
        fileSizeLimit: 52428800,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
    }

    // Upload
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error("Avatar Upload error:", error);
      return c.json({ error: error.message }, 500);
    }

    // Generate URL
    let fileUrl = "";
    // Avatars usually need to be public or long-lived signed.
    // If bucket is private, we must sign.
    // Ideally, for avatars, we prefer a persistent URL. 
    // If bucket is private, we can't get a truly persistent public URL without 'public' bucket.
    // We will generate a signed URL for 10 years for now if private.
    
    if (isPublic) {
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        fileUrl = data.publicUrl;
    } else {
        const { data: signedData, error: signError } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years

        if (signError || !signedData) {
            console.error("Sign error:", signError);
            return c.json({ error: "Failed to sign URL" }, 500);
        }
        fileUrl = signedData.signedUrl;
    }

    return c.json({ 
        path: path,
        url: fileUrl
    });

  } catch (err) {
    console.error("Avatar Upload exception:", err);
    return c.json({ error: "Internal server error during upload" }, 500);
  }
});

// Delete Files
app.post(`${ROUTE_PREFIX}/delete-files`, async (c) => {
  try {
    const { paths } = await c.req.json();
    
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
        return c.json({ error: "Paths array is required" }, 400);
    }

    const supabase = getSupabase();
    
    // Check if paths are valid strings
    if (paths.some(p => typeof p !== 'string')) {
         return c.json({ error: "Invalid path format" }, 400);
    }

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(paths);

    if (error) {
        console.error("Delete files error:", error);
        return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("Delete files exception:", err);
    return c.json({ error: "Internal server error during file deletion" }, 500);
  }
});

// Generate Text (GPT-5)
app.post(`${ROUTE_PREFIX}/generate-text`, async (c) => {
  try {
    const { prompt_json, source_lang, target_lang, modelId } = await c.req.json();
    const token = Deno.env.get("REPLICATE_API_TOKEN");

    if (!token) {
        return c.json({ error: "Replicate API token not configured" }, 500);
    }

    // Determine Replicate Model ID
    let replicateModelId = 'openai/gpt-5'; // Default
    if (modelId === 'gemini-3-pro') {
        replicateModelId = 'google/gemini-3-pro';
    } else if (modelId && modelId !== 'gpt-5') {
        replicateModelId = modelId;
    }

    // Construct Input Payload per instructions
    const createPayload = (minimal = false) => {
        const systemPrompt = `You are a professional translator for marketing banners. Translate the values in the provided JSON from ${source_lang} to ${target_lang}. Keep the tone exciting and persuasive. Return ONLY the valid JSON object. Do not translate keys.`;
        const userContent = JSON.stringify(prompt_json);

        if (modelId === 'gemini-3-pro') {
             return {
                prompt: userContent,
                system_instruction: systemPrompt,
                max_output_tokens: 2048,
                temperature: 0.3,
                thinking_level: "low"
            };
        }

        // Default GPT-5 Logic
        const payload: any = {
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            max_completion_tokens: 512,
            reasoning_effort: "low" 
        };

        if (!minimal) {
             // Some older GPT models might use these specific params, keeping for backward compat if needed
             // But for GPT-5 as per prompt, we rely on the object above.
             // We can keep 'verbosity' if it helps.
             payload.verbosity = "low";
        }
        return payload;
    };

    console.log("Generating text with model:", replicateModelId);

    // Try with full schema first
    let startResponse = await fetch(`https://api.replicate.com/v1/models/${replicateModelId}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: createPayload(false) }),
    });

    // If 422, retry with minimal payload (fallback for schema mismatch)
    if (startResponse.status === 422) {
         console.warn("Full schema rejected (422), retrying with minimal payload...");
         startResponse = await fetch(`https://api.replicate.com/v1/models/${replicateModelId}/predictions`, {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ input: createPayload(true) }),
         });
    }

    if (!startResponse.ok) {
        const errText = await startResponse.text();
        console.error("Replicate API error (Text):", errText);
        // Try to parse JSON error if possible
        let errMsg = errText;
        try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.detail || errJson.error || errText;
        } catch (e) {
            // keep raw text
        }
        return c.json({ error: `Failed to start text generation: ${errMsg}` }, 500);
    }

    const startData = await startResponse.json();
    const predictionId = startData.id;
    let status = startData.status;
    let output = startData.output;

    // Poll for completion
    const startTime = Date.now();
    const TIMEOUT_MS = 180000; // 3 minutes timeout
    while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
        if (Date.now() - startTime > TIMEOUT_MS) {
             const elapsedSec = Math.round((Date.now() - startTime) / 1000);
             console.error(`Text generation timed out after ${elapsedSec}s for prediction ${predictionId}`);
             return c.json({ error: `Translation timed out after ${elapsedSec} seconds. The AI model took too long to respond. Please try again.` }, 504);
        }

        await new Promise(r => setTimeout(r, 1000));

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
            },
        });
        
        if (!pollResponse.ok) {
             const pollErrText = await pollResponse.text();
             console.error(`Polling failed for prediction ${predictionId}: status=${pollResponse.status}, body=${pollErrText}`);
             return c.json({ error: `Failed to check translation status (HTTP ${pollResponse.status}). Please try again.` }, 500);
        }

        const pollData = await pollResponse.json();
        status = pollData.status;
        output = pollData.output;

        // If prediction failed or was canceled, extract error details immediately
        if (status === "failed") {
            const replicateError = pollData.error || "Unknown error from AI model";
            const replicateLog = pollData.logs ? pollData.logs.slice(-500) : "";
            console.error(`Replicate prediction ${predictionId} failed:`, replicateError, replicateLog ? `\nLogs: ${replicateLog}` : "");
            return c.json({ 
                error: `Translation failed: ${replicateError}`,
                prediction_id: predictionId,
                details: replicateLog || undefined
            }, 500);
        }

        if (status === "canceled") {
            console.error(`Replicate prediction ${predictionId} was canceled`);
            return c.json({ 
                error: "Translation was canceled by the AI service.",
                prediction_id: predictionId
            }, 500);
        }
    }

    if (status === "succeeded") {
        // Output from text models is usually an array of strings or a single string
        // We expect JSON string in the output
        let resultText = Array.isArray(output) ? output.join("") : output;
        
        // Clean markdown if present
        if (typeof resultText === 'string') {
            resultText = resultText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }

        return c.json({ text: resultText });
    }
    
    // Fallback for any unexpected status
    return c.json({ error: `Text generation ended with unexpected status: ${status}` }, 500);

  } catch (err) {
    console.error("Text generation exception:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Generate Image (Replicate)
app.post(`${ROUTE_PREFIX}/generate-image`, async (c) => {
  try {
    const { prompt, aspect_ratio, resolution, image_input, modelId } = await c.req.json();
    const token = Deno.env.get("REPLICATE_API_TOKEN");

    if (!token) {
        return c.json({ error: "Replicate API token not configured" }, 500);
    }
    
    if (!prompt) {
        return c.json({ error: "Prompt is required" }, 400);
    }

    // Model Configuration
    let replicateModel = 'google/nano-banana-pro'; // Default to Nano Banana Pro
    
    if (modelId === 'nano-banana') {
        replicateModel = 'black-forest-labs/flux-schnell';
    } else if (modelId === 'flux-dev') {
        replicateModel = 'black-forest-labs/flux-dev';
    }

    // Construct Input Payload based on Model Family
    let input: any = {};

    if (replicateModel.includes('flux')) {
        // --- FLUX FAMILY ---
        // Validate Aspect Ratio for Flux (Strict subset)
        const validFluxRatios = ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16"];
        let safeRatio = aspect_ratio;
        
        // Flux does NOT support 'match_input_image', default to 1:1
        if (!validFluxRatios.includes(safeRatio)) {
            safeRatio = "1:1";
        }

        input = {
            prompt: prompt,
            aspect_ratio: safeRatio,
            output_format: "jpg",
            disable_safety_checker: true,
            safety_tolerance: 5
        };
    } else {
        // --- NANO BANANA / OTHERS ---
        // Pass through parameters as defined in the schema (supports match_input_image)
        input = {
            prompt: prompt,
            aspect_ratio: aspect_ratio || "1:1",
            resolution: resolution || "2K",
            image_input: image_input || [],
            output_format: "jpg",
            safety_filter_level: "block_only_high"
        };
    }

    // Call Replicate API to start prediction
    const startResponse = await fetch(`https://api.replicate.com/v1/models/${replicateModel}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!startResponse.ok) {
        const err = await startResponse.text();
        console.error("Replicate API error:", err);
        return c.json({ error: "Failed to start generation" }, 500);
    }

    const startData = await startResponse.json();
    const predictionId = startData.id;
    let status = startData.status;
    let output = startData.output;
    let errorLog = null;

    // Poll for completion (Simple polling for demonstration)
    // Increased timeout to 5 minutes for long-running generations
    const startTime = Date.now();
    while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
        if (Date.now() - startTime > 300000) { // 5 minutes
             return c.json({ error: "Generation timed out after 5 minutes" }, 504);
        }

        await new Promise(r => setTimeout(r, 2000)); // Wait 2s to reduce API spam

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
            },
        });
        
        if (!pollResponse.ok) {
             console.error("Replicate poll error");
             return c.json({ error: "Polling failed" }, 500);
        }

        const pollData = await pollResponse.json();
        status = pollData.status;
        output = pollData.output;
        errorLog = pollData.error;
    }

    if (status === "succeeded") {
        let finalUrl = "";
        if (Array.isArray(output) && output.length > 0) {
            finalUrl = output[0];
        } else if (typeof output === "string") {
            finalUrl = output;
        }

        if (finalUrl) {
            return c.json({ imageUrl: finalUrl });
        }
    }
    
    console.error("Generation failed or invalid output format", { status, output, error: errorLog });
    return c.json({ error: errorLog || "Generation failed or returned no output" }, 500);

  } catch (err) {
    console.error("Generation exception:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Start Image Generation (Async) - Returns prediction ID immediately
app.post(`${ROUTE_PREFIX}/start-generate-image`, async (c) => {
  try {
    const { prompt, aspect_ratio, resolution, image_input, modelId } = await c.req.json();
    const token = Deno.env.get("REPLICATE_API_TOKEN");

    if (!token) {
        return c.json({ error: "Replicate API token not configured" }, 500);
    }
    
    if (!prompt) {
        return c.json({ error: "Prompt is required" }, 400);
    }

    // Model Configuration
    let replicateModel = 'google/nano-banana-pro'; // Default to Nano Banana Pro
    
    if (modelId === 'nano-banana') {
        replicateModel = 'black-forest-labs/flux-schnell';
    } else if (modelId === 'flux-dev') {
        replicateModel = 'black-forest-labs/flux-dev';
    }

    // Construct Input Payload
    let input: any = {};

    if (replicateModel.includes('flux')) {
        const validFluxRatios = ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16"];
        let safeRatio = aspect_ratio;
        
        if (!validFluxRatios.includes(safeRatio)) {
            safeRatio = "1:1";
        }

        input = {
            prompt: prompt,
            aspect_ratio: safeRatio,
            output_format: "jpg",
            disable_safety_checker: true,
            safety_tolerance: 5
        };
    } else {
        input = {
            prompt: prompt,
            aspect_ratio: aspect_ratio || "1:1",
            resolution: resolution || "2K",
            image_input: image_input || [],
            output_format: "jpg",
            safety_filter_level: "block_only_high"
        };
    }

    // Start prediction
    const startResponse = await fetch(`https://api.replicate.com/v1/models/${replicateModel}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!startResponse.ok) {
        const err = await startResponse.text();
        console.error("Replicate API error:", err);
        return c.json({ error: "Failed to start generation" }, 500);
    }

    const startData = await startResponse.json();
    
    // Return prediction ID immediately for client-side polling
    return c.json({ 
      predictionId: startData.id,
      status: startData.status
    });

  } catch (err) {
    console.error("Start generation exception:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Start Text Generation (Async) - Returns prediction ID immediately
app.post(`${ROUTE_PREFIX}/start-generate-text`, async (c) => {
  try {
    const { prompt_json, source_lang, target_lang, modelId } = await c.req.json();
    const token = Deno.env.get("REPLICATE_API_TOKEN");

    if (!token) {
        return c.json({ error: "Replicate API token not configured" }, 500);
    }

    // Determine Replicate Model ID
    let replicateModelId = 'google/gemini-3-pro'; // Default to Gemini 3 Pro
    
    if (modelId === 'gpt-5') {
        replicateModelId = 'openai/gpt-5';
    } else if (modelId && modelId !== 'gemini-3-pro') {
        replicateModelId = modelId;
    }

    // Construct Input Payload
    const createPayload = (minimal = false) => {
        const systemPrompt = `You are a professional translator for marketing banners. Translate the values in the provided JSON from ${source_lang} to ${target_lang}. Keep the tone exciting and persuasive. Return ONLY the valid JSON object. Do not translate keys.`;
        const userContent = JSON.stringify(prompt_json);

        if (replicateModelId === 'google/gemini-3-pro') {
             return {
                prompt: userContent,
                system_instruction: systemPrompt,
                max_output_tokens: 2048,
                temperature: 0.3,
                thinking_level: "low"
            };
        }

        const payload: any = {
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            max_completion_tokens: 512,
            reasoning_effort: "low" 
        };

        if (!minimal) {
             payload.verbosity = "low";
        }
        return payload;
    };

    console.log("Starting text generation with model:", replicateModelId);

    // Try with full schema first
    let startResponse = await fetch(`https://api.replicate.com/v1/models/${replicateModelId}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: createPayload(false) }),
    });

    // If 422, retry with minimal payload
    if (startResponse.status === 422) {
         console.warn("Full schema rejected (422), retrying with minimal payload...");
         startResponse = await fetch(`https://api.replicate.com/v1/models/${replicateModelId}/predictions`, {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ input: createPayload(true) }),
         });
    }

    if (!startResponse.ok) {
        const errText = await startResponse.text();
        console.error("Replicate API error (Text):", errText);
        let errMsg = errText;
        try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.detail || errJson.error || errText;
        } catch (e) {
            // keep raw text
        }
        return c.json({ error: `Failed to start text generation: ${errMsg}` }, 500);
    }

    const startData = await startResponse.json();
    
    // Return prediction ID immediately for client-side polling
    return c.json({ 
      predictionId: startData.id,
      status: startData.status
    });

  } catch (err) {
    console.error("Start text generation exception:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Check Prediction Status (for polling)
app.get(`${ROUTE_PREFIX}/check-prediction/:id`, async (c) => {
  try {
    const predictionId = c.req.param("id");
    const token = Deno.env.get("REPLICATE_API_TOKEN");

    if (!token) {
        return c.json({ error: "Replicate API token not configured" }, 500);
    }

    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json",
        },
    });
    
    if (!pollResponse.ok) {
         console.error("Replicate poll error");
         return c.json({ error: "Failed to check prediction status" }, 500);
    }

    const pollData = await pollResponse.json();
    
    // Return status and output
    return c.json({ 
      status: pollData.status,
      output: pollData.output,
      error: pollData.error,
      logs: pollData.logs
    });

  } catch (err) {
    console.error("Check prediction exception:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Cancel Prediction
app.post(`${ROUTE_PREFIX}/cancel-prediction/:id`, async (c) => {
  try {
    const predictionId = c.req.param("id");
    const token = Deno.env.get("REPLICATE_API_TOKEN");

    if (!token) {
        return c.json({ error: "Replicate API token not configured" }, 500);
    }

    const cancelResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}/cancel`, {
        method: "POST",
        headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json",
        },
    });
    
    if (!cancelResponse.ok) {
         console.error("Replicate cancel error:", await cancelResponse.text());
         return c.json({ error: "Failed to cancel prediction" }, 500);
    }

    const cancelData = await cancelResponse.json();
    
    return c.json({ 
      success: true,
      status: cancelData.status
    });

  } catch (err) {
    console.error("Cancel prediction exception:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// --- Generative Resize History Endpoints ---

// Save History Item
app.post(`${ROUTE_PREFIX}/generative-resize/history`, async (c) => {
  try {
    const item = await c.req.json();
    
    if (!item.id) item.id = crypto.randomUUID();
    if (!item.created_at) item.created_at = new Date().toISOString();
    
    // Save to KV
    // Key format: ai_gen:{id}
    await kv.set(`ai_gen:${item.id}`, item);

    return c.json(item);
  } catch (err) {
    console.error("Error saving history:", err);
    return c.json({ error: "Failed to save history" }, 500);
  }
});

// Get History (with pagination and filtering)
app.get(`${ROUTE_PREFIX}/generative-resize/history`, async (c) => {
  try {
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12");
    const userId = url.searchParams.get("userId");
    const ratio = url.searchParams.get("ratio");
    const resolution = url.searchParams.get("resolution");
    const taskType = url.searchParams.get("taskType");
    const targetLang = url.searchParams.get("targetLang");
    const sort = url.searchParams.get("sort") || "newest";

    console.log(`[History] Request: taskType=${taskType}, targetLang=${targetLang}, ratio=${ratio}`);

    const legacyItems = await withRetry(() => kv.getByPrefix("gen_resize_history:"));
    const newItems = await withRetry(() => kv.getByPrefix("ai_gen:"));
    let items: any[] = [...legacyItems, ...newItems];
    console.log(`[History] Total Raw Items: ${items.length} (Legacy: ${legacyItems.length}, New: ${newItems.length})`);

    // 1. Filter by User (Context)
    if (userId) {
        items = items.filter(item => item.created_by === userId);
    }
    console.log(`[History] Items after User Filter: ${items.length}`);

    // 1.5. Filter by task_type (Strict Mode)
    // We strictly separate 'resize', 'translate', and 'image_generation' tasks.
    if (taskType === 'translate') {
        items = items.filter(item => item.task_type === 'translate');
    } else if (taskType === 'image_generation') {
        items = items.filter(item => item.task_type === 'image_generation');
    } else if (taskType === 'resize' || !taskType) {
        // Default to resize view if no taskType specified, for backward compatibility
        items = items.filter(item => {
            const t = item.task_type;
            // Match if 'resize' OR if it's undefined/null/empty (legacy items)
            return t === 'resize' || t === undefined || t === null || t === '';
        });
    } else if (taskType === 'all') {
        // Show everything (no filter)
    } else {
        // Unknown taskType: return empty (safety default)
        items = [];
    }

    console.log(`[History] Items after Task Filter (${taskType}): ${items.length}`);

    // Calculate Facets (Available options based on current context)
    const uniqueRatios = [...new Set(items.map(i => i.ratio))].filter(Boolean).sort();
    const uniqueResolutions = [...new Set(items.map(i => i.resolution))].filter(Boolean).sort();
    const uniqueTargetLangs = [...new Set(items.map(i => i.target_lang))].filter(Boolean).sort();

    // 2. Filter by Attributes
    if (ratio && ratio !== 'all') {
        items = items.filter(item => item.ratio === ratio);
    }
    if (resolution && resolution !== 'all') {
        items = items.filter(item => item.resolution === resolution);
    }
    if (targetLang && targetLang !== 'all') {
        items = items.filter(item => item.target_lang === targetLang);
    }
    
    console.log(`[History] Items after Attribute Filters: ${items.length}`);

    // 3. Sort
    items.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return sort === 'newest' ? timeB - timeA : timeA - timeB;
    });

    // 3. Paginate
    const total = items.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return c.json({
        data: paginatedItems,
        total: total,
        page: page,
        limit: limit,
        facets: {
            ratios: uniqueRatios,
            resolutions: uniqueResolutions,
            targetLangs: uniqueTargetLangs
        }
    });
  } catch (err) {
    console.error("Error fetching history:", err);
    return c.json({ error: "Failed to fetch history" }, 500);
  }
});

// Delete History Item
app.delete(`${ROUTE_PREFIX}/generative-resize/history/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    // Also delete the file from storage if possible?
    // The prompt says "Delete: Visible only if created_by === currentUser"
    // We'll leave file deletion for now or implement if requested. 
    // Usually we should clean up the output file.
    
    let item = await kv.get(`ai_gen:${id}`);
    let key = `ai_gen:${id}`;

    if (!item) {
        // Fallback for legacy items
        item = await kv.get(`gen_resize_history:${id}`);
        key = `gen_resize_history:${id}`;
    }

    if (item && item.image_url) {
        const supabase = getSupabase();
        // Extract path logic... simplified here
         const extractPath = (urlString: string) => {
             if (!urlString) return null;
             try {
                const bucketSegment = `/${BUCKET_NAME}/`;
                const index = urlString.indexOf(bucketSegment);
                if (index !== -1) {
                    let path = urlString.substring(index + bucketSegment.length);
                    const queryIndex = path.indexOf('?');
                    if (queryIndex !== -1) path = path.substring(0, queryIndex);
                    return decodeURIComponent(path);
                }
             } catch(e) { console.error(e); }
             return null;
         };
         const path = extractPath(item.image_url);
         if (path) {
             await supabase.storage.from(BUCKET_NAME).remove([path]);
         }
    }

    await kv.del(key);
    return c.json({ success: true });
  } catch (err) {
     return c.json({ error: "Failed to delete" }, 500);
  }
});

// Utility: Remove Background
app.post(`${ROUTE_PREFIX}/utility/remove-background`, async (c) => {
  try {
    const { image, format, background_type } = await c.req.json();
    const token = Deno.env.get("REPLICATE_API_TOKEN");

    if (!token) {
        return c.json({ error: "Replicate API token not configured" }, 500);
    }

    if (!image) {
        return c.json({ error: "Image URL is required" }, 400);
    }

    // 851-labs/background-remover schema
    // Explicitly providing defaults matching the schema
    const input = {
        image: image,
        format: format || 'png',
        background_type: background_type || 'rgba',
        reverse: false,
        threshold: 0
    };

    console.log("Removing background for:", image);

    // 1. Get the latest version ID first (More robust than direct model endpoint)
    let versionId = "bc21b51dfca058947e84269bc12c652721e25d482559592233f82245c363f848"; // Fallback/Cache? No, let's fetch it.
    
    // We'll try to fetch the model details to get the latest version
    // If this fails with 404, the model name is wrong.
    const modelResponse = await fetch("https://api.replicate.com/v1/models/851-labs/background-remover", {
        headers: { "Authorization": `Token ${token}` }
    });

    if (modelResponse.ok) {
        const modelData = await modelResponse.json();
        if (modelData.latest_version) {
            versionId = modelData.latest_version.id;
        }
    } else {
        console.warn("Could not fetch model details, trying fallback or direct prediction...");
        // If we can't get the version, we might be hitting a 404 on the model itself.
        // But let's try the direct endpoint again? No, that failed.
        // Let's assume if we can't find it, we might need a fallback.
    }

    // 2. Create Prediction using the Version endpoint
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
          version: versionId,
          input: input 
      }),
    });

    if (!startResponse.ok) {
        const errText = await startResponse.text();
        console.error("Replicate API error:", errText);
        
        // Try to extract a clean message
        let errMsg = errText;
        try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.detail || errJson.error || errText;
        } catch (e) {}

        return c.json({ error: `Failed to start background removal: ${errMsg}` }, 500);
    }

    const startData = await startResponse.json();
    const predictionId = startData.id;
    let status = startData.status;
    let output = startData.output;
    let errorLog = null;

    // Poll
    const startTime = Date.now();
    while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
        if (Date.now() - startTime > 300000) { 
             return c.json({ error: "Operation timed out" }, 504);
        }

        await new Promise(r => setTimeout(r, 2000));

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
            },
        });
        
        if (!pollResponse.ok) {
             return c.json({ error: "Polling failed" }, 500);
        }

        const pollData = await pollResponse.json();
        status = pollData.status;
        output = pollData.output;
        errorLog = pollData.error;
    }

    if (status === "succeeded") {
        // Output is typically a URL string
        return c.json({ url: output });
    }
    
    return c.json({ error: errorLog || `Background removal failed: ${status}` }, 500);

  } catch (err) {
    console.error("Background removal exception:", err);
    return c.json({ error: `Internal server error: ${err.message}` }, 500);
  }
});

Deno.serve(app.fetch);