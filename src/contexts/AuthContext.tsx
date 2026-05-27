import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createToken, saveSession, loadSession, clearSession, type SessionUser } from '@/lib/auth'
import { DEMO_USER } from '@/lib/mockDb'

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  signup: (email: string, password: string, orgName: string, fullName?: string) => Promise<SignupResult>
  logout: () => void
}

type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_credentials' | 'pending' | 'rejected' | 'error'; message: string }

type SignupResult =
  | { ok: true; isAdmin: boolean; pending?: boolean }
  | { ok: false; message: string }

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = loadSession()
    setUser(session)
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    void password
    const sessionUser: SessionUser =
      email.toLowerCase().trim() === DEMO_USER.email
        ? DEMO_USER
        : {
            id:        'user-guest',
            email:     email.toLowerCase().trim(),
            full_name: email.split('@')[0],
            role:      'admin',
            status:    'approved',
            org_id:    DEMO_USER.org_id,
            org_name:  DEMO_USER.org_name,
          }
    const token = createToken(sessionUser)
    saveSession(token)
    setUser(sessionUser)
    return { ok: true }
  }, [])

  const signup = useCallback(async (
    email: string,
    _password: string,
    orgName: string,
    fullName?: string,
  ): Promise<SignupResult> => {
    const sessionUser: SessionUser = {
      id:        'user-' + Date.now(),
      email:     email.toLowerCase().trim(),
      full_name: fullName ?? email.split('@')[0],
      role:      'admin',
      status:    'approved',
      org_id:    DEMO_USER.org_id,
      org_name:  orgName || DEMO_USER.org_name,
    }
    const token = createToken(sessionUser)
    saveSession(token)
    setUser(sessionUser)
    return { ok: true, isAdmin: true }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
