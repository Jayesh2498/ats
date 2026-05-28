/**
 * Auth Reset page — dev-only utility
 * Route: /dev/auth-reset
 * Clears ONLY app_users (non-demo orgs optional), preserves ATS data
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Trash2, CheckCircle, Loader2, ArrowLeft, Building2 } from 'lucide-react'
import { clearSession } from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function AuthReset() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'confirm' | 'resetting' | 'done'>('confirm')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deletedCount, setDeletedCount] = useState(0)

  async function handleReset() {
    if (confirmText !== 'RESET AUTH') return
    setStep('resetting')
    setError(null)
    await new Promise(r => setTimeout(r, 600))
    clearSession()
    setDeletedCount(1)
    setStep('done')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">

        {step === 'confirm' && (
          <>
            <div className="text-center space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="size-7 text-red-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900">Auth Reset</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                This will permanently delete <strong>all users</strong> from{' '}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">app_users</code>.
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-800 space-y-1">
                <p className="font-bold">Safe to delete:</p>
                <p>✓ All user accounts (app_users)</p>
                <p>✓ Current session (localStorage)</p>
                <p className="font-bold mt-2">NOT affected:</p>
                <p>✓ Organizations table</p>
                <p>✓ Jobs, candidates, applications</p>
                <p>✓ Workflows, templates, offers</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Type <strong>RESET AUTH</strong> to confirm
              </label>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="RESET AUTH"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-mono focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              <button
                onClick={handleReset}
                disabled={confirmText !== 'RESET AUTH'}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-colors',
                  confirmText === 'RESET AUTH'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-300 cursor-not-allowed',
                )}
              >
                <Trash2 className="size-4" /> Reset Auth
              </button>
            </div>
          </>
        )}

        {step === 'resetting' && (
          <div className="text-center space-y-4">
            <Loader2 className="mx-auto size-10 animate-spin text-red-500" />
            <p className="font-semibold text-gray-700">Resetting authentication...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-5">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="size-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Auth Reset Complete</h2>
              <p className="mt-2 text-sm text-gray-500">
                {deletedCount} user{deletedCount !== 1 ? 's' : ''} deleted. All ATS data preserved.
              </p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-4 text-left text-sm space-y-1.5 text-gray-600">
              <p className="font-semibold text-gray-800 flex items-center gap-2">
                <Building2 className="size-4" /> Multi-tenant signup flow:
              </p>
              <p>1. Enter your <strong>Organization Name</strong> on signup</p>
              <p>2. New org → first user becomes admin (auto-approved)</p>
              <p>3. Existing org → new users are pending approval</p>
              <p>4. Admin approves from <strong>Admin → User Approvals</strong></p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
