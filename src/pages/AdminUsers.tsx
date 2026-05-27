/**
 * Admin — User Approvals page (org-scoped)
 * Route: /admin/users
 * Only visible to admin users; shows ONLY users in the same org
 */
import { useState, useEffect } from 'react'
import {
  CheckCircle, XCircle, Clock, Users, Loader2,
  ShieldCheck, Shield, User, ChevronDown, Building2,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface AppUser {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'member' | 'user'
  status: 'pending' | 'approved' | 'rejected'
  org_id: string
  created_at: string
}

const STATUS_META = {
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600 border-red-200' },
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers]         = useState<AppUser[]>([])
  const [loading, setLoading]     = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)

  function fetchUsers() {
    setLoading(true)
    // Demo mode: just show the current user
    if (currentUser) {
      setUsers([{
        id: currentUser.id, email: currentUser.email,
        full_name: currentUser.full_name ?? null,
        role: currentUser.role as 'admin' | 'member' | 'user',
        status: 'approved', org_id: currentUser.org_id,
        created_at: new Date().toISOString(),
      }])
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [currentUser?.org_id])

  async function approveUser(id: string, _role: 'admin' | 'member') {
    setActioning(id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'approved', role: _role } : u))
    setActioning(null)
  }

  async function rejectUser(id: string) {
    setActioning(id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'rejected' } : u))
    setActioning(null)
  }

  async function changeRole(id: string, role: 'admin' | 'member') {
    setActioning(id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    setActioning(null)
  }

  const pending = users.filter(u => u.status === 'pending')
  const others  = users.filter(u => u.status !== 'pending')

  return (
    <AppShell>
      <div className="px-8 py-7 max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="size-5 text-violet-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Admin</p>
            </div>
            <h1 className="text-3xl font-black text-foreground">User Approvals</h1>
            <p className="text-muted-foreground mt-1">Manage workspace access for your organization.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{users.length} total</span>
            </div>
            {/* Org badge */}
            <div className="flex items-center gap-1.5 rounded-xl border bg-violet-50 px-3 py-1.5">
              <Building2 className="size-3.5 text-violet-600" />
              <span className="text-xs font-bold text-violet-700">{currentUser?.org_name}</span>
            </div>
          </div>
        </div>

        {/* Role legend */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md" style={{ background: 'hsl(271,76%,94%)' }}>
              <Shield className="size-3.5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Admin</p>
              <p className="text-[10px] text-muted-foreground">Can approve/reject users</p>
            </div>
          </div>
          <div className="w-px h-8 bg-border mx-1" />
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-muted">
              <User className="size-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Member</p>
              <p className="text-[10px] text-muted-foreground">Standard workspace access</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground ml-auto italic">Scoped to your organization only.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* Pending section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="size-4 text-amber-500" />
                <h2 className="text-sm font-bold text-foreground">
                  Pending Approval
                  {pending.length > 0 && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {pending.length}
                    </span>
                  )}
                </h2>
              </div>

              {pending.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                  <CheckCircle className="mx-auto size-8 text-emerald-400 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pending.map(u => (
                    <UserRow
                      key={u.id}
                      user={u}
                      actioning={actioning}
                      currentUserId={currentUser!.id}
                      onApproveAdmin={() => approveUser(u.id, 'admin')}
                      onApproveMember={() => approveUser(u.id, 'member')}
                      onReject={() => rejectUser(u.id)}
                      onChangeRole={role => changeRole(u.id, role)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* All users section */}
            {others.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-bold text-foreground">All Users</h2>
                </div>
                <div className="space-y-2">
                  {others.map(u => (
                    <UserRow
                      key={u.id}
                      user={u}
                      actioning={actioning}
                      currentUserId={currentUser!.id}
                      onApproveAdmin={() => approveUser(u.id, 'admin')}
                      onApproveMember={() => approveUser(u.id, 'member')}
                      onReject={() => rejectUser(u.id)}
                      onChangeRole={role => changeRole(u.id, role)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ── UserRow ───────────────────────────────────────────────────

function UserRow({
  user, actioning, currentUserId,
  onApproveAdmin, onApproveMember, onReject, onChangeRole,
}: {
  user: AppUser
  actioning: string | null
  currentUserId: string
  onApproveAdmin: () => void
  onApproveMember: () => void
  onReject: () => void
  onChangeRole: (role: 'admin' | 'member') => void
}) {
  const [roleDropdown, setRoleDropdown] = useState(false)
  const meta        = STATUS_META[user.status]
  const isActioning = actioning === user.id
  const joined      = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const isAdmin     = user.role === 'admin'
  const isSelf      = user.id === currentUserId

  return (
    <div className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{
            background: isAdmin ? 'hsl(271,76%,94%)' : 'hsl(240,5%,93%)',
            color: isAdmin ? '#7C3AED' : '#6B7280',
          }}
        >
          {(user.full_name ?? user.email)[0].toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.full_name ? user.full_name : user.email}
            </p>
            {/* Role chip */}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                isAdmin
                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200',
              )}
            >
              {isAdmin ? <Shield className="size-2.5" /> : <User className="size-2.5" />}
              {isAdmin ? 'Admin' : 'Member'}
            </span>
            {isSelf && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user.email} · Joined {joined}
          </p>
        </div>

        {/* Status badge */}
        <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold shrink-0', meta.color)}>
          {meta.label}
        </span>

        {/* Actions */}
        {!isSelf && user.status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Approve split button */}
            <div className="flex items-stretch rounded-xl overflow-hidden border border-emerald-500 shrink-0">
              <button
                onClick={onApproveMember}
                disabled={isActioning}
                className="flex items-center gap-1.5 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {isActioning ? <Loader2 className="size-3 animate-spin" /> : <User className="size-3" />}
                Member
              </button>
              <div className="w-px bg-emerald-500/60" />
              <button
                onClick={onApproveAdmin}
                disabled={isActioning}
                className="flex items-center gap-1.5 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                title="Approve as Admin"
              >
                <Shield className="size-3" />
                Admin
              </button>
            </div>
            {/* Reject */}
            <button
              onClick={onReject}
              disabled={isActioning}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
            >
              <XCircle className="size-3" /> Reject
            </button>
          </div>
        )}

        {/* Approved non-self: role toggle + revoke */}
        {!isSelf && user.status === 'approved' && (
          <div className="flex items-center gap-2 shrink-0 relative">
            <div className="relative">
              <button
                onClick={() => setRoleDropdown(v => !v)}
                disabled={isActioning}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60',
                  isAdmin
                    ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100',
                )}
              >
                {isActioning
                  ? <Loader2 className="size-3 animate-spin" />
                  : isAdmin ? <Shield className="size-3" /> : <User className="size-3" />}
                {isAdmin ? 'Admin' : 'Member'}
                <ChevronDown className="size-3 ml-0.5" />
              </button>

              {roleDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setRoleDropdown(false)} />
                  <div
                    className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl border bg-white shadow-lg overflow-hidden"
                    style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  >
                    <button
                      onClick={() => { onChangeRole('member'); setRoleDropdown(false) }}
                      className={cn(
                        'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-left transition-colors',
                        !isAdmin ? 'bg-gray-50 text-gray-500 cursor-default' : 'hover:bg-gray-50 text-gray-700',
                      )}
                      disabled={!isAdmin}
                    >
                      <User className="size-3.5 shrink-0" />
                      <div>
                        <p className="font-bold">Member</p>
                        <p className="font-normal text-muted-foreground text-[10px]">Standard access</p>
                      </div>
                      {!isAdmin && <span className="ml-auto text-[9px] text-emerald-600 font-bold">Current</span>}
                    </button>
                    <div className="h-px bg-border mx-2" />
                    <button
                      onClick={() => { onChangeRole('admin'); setRoleDropdown(false) }}
                      className={cn(
                        'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-left transition-colors',
                        isAdmin ? 'bg-violet-50 text-violet-500 cursor-default' : 'hover:bg-violet-50 text-violet-700',
                      )}
                      disabled={isAdmin}
                    >
                      <Shield className="size-3.5 shrink-0" />
                      <div>
                        <p className="font-bold">Admin</p>
                        <p className="font-normal text-muted-foreground text-[10px]">Can approve users</p>
                      </div>
                      {isAdmin && <span className="ml-auto text-[9px] text-violet-600 font-bold">Current</span>}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Revoke */}
            <button
              onClick={onReject}
              disabled={isActioning}
              className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              Revoke
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
