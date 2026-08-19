import { projectId } from '../../utils/supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;
export type AccessRole = 'admin' | 'member' | null;
export type AccessState = { role: AccessRole; isWhitelisted: boolean; isAdmin: boolean };

async function request(path: string, token: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}${path}`, {
      ...init,
      // Only Content-Type and Authorization are allowed by the server CORS policy.
      // Sending an `apikey` header here makes the browser preflight fail with "Failed to fetch".
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
  } catch (error) {
    console.error(`Network error while calling access endpoint ${path}:`, error);
    throw new Error(`Could not reach the access server at ${SERVER_URL}${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as any));
    console.error(`Access endpoint ${path} failed with status ${response.status}:`, payload);
    throw new Error(payload.error || `Access request failed with status ${response.status}`);
  }
  return response.json();
}
export const AccessService = {
  getMe: (token: string) => request('/access/me', token) as Promise<AccessState>,
  getMembers: (token: string) => request('/access/members', token),
  getAudit: (token: string) => request('/access/audit', token),
  getAccounts: (token: string) => request('/access/accounts', token),
  addMember: (token: string, userId: string, role: 'admin' | 'member') => request('/access/members', token, { method: 'POST', body: JSON.stringify({ userId, role }) }),
};
