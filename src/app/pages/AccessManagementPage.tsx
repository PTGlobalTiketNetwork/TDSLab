import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, UserPlus, History, Users } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { AccessService } from '../../services/accessService';
import { TiketSelect, type TiketSelectOption } from '../components/ui/TiketSelect';
import { TiketButton } from '../components/ui/TiketButton';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

const BOOTSTRAP_ADMIN_EMAIL = 'ryan.setiawan@tiket.com';

const ROLE_OPTIONS: TiketSelectOption[] = [
  {
    id: 'member',
    label: 'Member',
    renderSelected: 'Member — Tools and AI generation',
    render: (
      <span className="flex flex-col gap-[2px]">
        <span className="text-[14px] leading-[1.43] text-[#303135]">Member</span>
        <span className="text-[12px] leading-[1.34] text-[#71747d]">Tools and AI generation</span>
      </span>
    ),
  },
  {
    id: 'admin',
    label: 'Admin',
    renderSelected: 'Admin — includes Settings management',
    render: (
      <span className="flex flex-col gap-[2px]">
        <span className="text-[14px] leading-[1.43] text-[#303135]">Admin</span>
        <span className="text-[12px] leading-[1.34] text-[#71747d]">Includes Settings management</span>
      </span>
    ),
  },
];

export function AccessManagementPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<any>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setCurrentUserId(session.user.id);
    try {
      const [m, a, e] = await Promise.all([
        AccessService.getMembers(session.access_token),
        AccessService.getAccounts(session.access_token),
        AccessService.getAudit(session.access_token),
      ]);
      setMembers(m); setAccounts(a); setEvents(e);
    } catch (err: any) {
      console.error('Failed to load access management data:', err);
      setError(err.message || 'Could not load access data');
    }
  };

  useEffect(() => { load(); }, []);

  const candidates = useMemo(
    () => accounts.filter(a => !members.some(m => m.userId === a.userId && m.active)),
    [accounts, members],
  );

  // Label carries both name and email so the dropdown's search matches either one.
  const accountOptions: TiketSelectOption[] = useMemo(() => candidates.map(a => ({
    id: a.userId,
    label: `${a.displayName || a.email} ${a.email}`,
    renderSelected: `${a.displayName || a.email} · ${a.email}`,
    render: (
      <span className="flex flex-col gap-[2px]">
        <span className="text-[14px] leading-[1.43] text-[#303135]">{a.displayName || a.email}</span>
        <span className="text-[12px] leading-[1.34] text-[#71747d]">{a.email}</span>
      </span>
    ),
  })), [candidates]);

  const add = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !selectedId) return;
    setIsSaving(true);
    setError('');
    try {
      await AccessService.addMember(session.access_token, selectedId, role);
      setSelectedId('');
      await load();
    } catch (err: any) {
      console.error('Failed to grant access:', err);
      setError(err.message || 'Could not grant access');
    } finally {
      setIsSaving(false);
    }
  };

  const revoke = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !revokeTarget) return;
    setIsRevoking(true);
    setError('');
    try {
      await AccessService.revokeMember(session.access_token, revokeTarget.userId);
      setRevokeTarget(null);
      await load();
    } catch (err: any) {
      console.error('Failed to revoke access:', err);
      setRevokeTarget(null);
      setError(err.message || 'Could not revoke access');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-8 text-[#303135]">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#007BFF]">Settings / Access management</p>
          <h1 className="text-3xl font-bold">Whitelist control</h1>
          <p className="mt-2 text-[#71747d]">Manage approved AI and Tools access. All changes are recorded.</p>
        </div>
        <ShieldCheck className="size-10 text-[#007BFF]" />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-xl border border-[#d8dce8] bg-white p-6">
          <div className="mb-5 flex items-center gap-2">
            <UserPlus className="size-5 text-[#007BFF]" />
            <h2 className="text-lg font-bold">Add existing account</h2>
          </div>

          <label className="mb-2 block text-sm font-medium">Account</label>
          <div className="mb-4">
            <TiketSelect
              options={accountOptions}
              value={selectedId}
              onChange={setSelectedId}
              placeholder="Select an existing account"
              showSearch
            />
          </div>

          <label className="mb-2 block text-sm font-medium">Access role</label>
          <div className="mb-5">
            <TiketSelect
              options={ROLE_OPTIONS}
              value={role}
              onChange={value => setRole(value as 'member' | 'admin')}
              placeholder="Select access role"
              showSearch={false}
            />
          </div>

          <TiketButton
            className="w-full"
            disabled={!selectedId}
            isLoading={isSaving}
            onClick={add}
          >
            Grant access
          </TiketButton>
        </section>

        <section className="rounded-xl border border-[#d8dce8] bg-white">
          <div className="flex items-center justify-between border-b border-[#e9ebef] px-6 py-5">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-[#007BFF]" />
              <h2 className="text-lg font-bold">Whitelisted accounts</h2>
            </div>
            <span className="text-sm text-[#71747d]">{members.filter(m => m.active).length} active</span>
          </div>
          <div className="divide-y divide-[#e9ebef]">
            {members.filter(m => m.active).map(m => (
              <div key={m.userId} className="flex items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="font-semibold">{m.displayName || m.email}</p>
                  <p className="text-sm text-[#71747d]">{m.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${m.role === 'admin' ? 'bg-blue-50 text-[#0064D2]' : 'bg-slate-100 text-slate-600'}`}>{m.role}</span>
                  {m.email?.toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL && m.userId !== currentUserId && (
                    <TiketButton variant="tertiary" onClick={() => setRevokeTarget(m)}>Revoke access</TiketButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-[#d8dce8] bg-white">
        <div className="flex items-center gap-2 border-b border-[#e9ebef] px-6 py-5">
          <History className="size-5 text-[#007BFF]" />
          <h2 className="text-lg font-bold">Access history</h2>
        </div>
        <div className="divide-y divide-[#e9ebef]">
          {events.slice(0, 20).map((e, i) => (
            <div key={i} className="px-6 py-3 text-sm">
              <span className="font-semibold">{e.actorEmail || 'System'}</span> {e.action} <span className="font-semibold">{e.targetEmail}</span>
              <span className="ml-2 text-[#71747d]">{new Date(e.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>

      <AlertDialog open={!!revokeTarget} onOpenChange={open => { if (!open && !isRevoking) setRevokeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget?.displayName || revokeTarget?.email} ({revokeTarget?.email}) will lose {revokeTarget?.role} access. You can grant it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <TiketButton variant="secondary" disabled={isRevoking} onClick={() => setRevokeTarget(null)}>Cancel</TiketButton>
            <TiketButton variant="alert" isLoading={isRevoking} onClick={revoke}>Revoke access</TiketButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
