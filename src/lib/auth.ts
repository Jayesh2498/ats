/**
 * Auth utilities — password hashing + JWT (browser-safe)
 * Uses Web Crypto API (no Node.js needed)
 */

const JWT_SECRET = 'talentflow-ats-secret-2024'
const STORAGE_KEY = 'ats_session'

export interface SessionUser {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'member' | 'user'
  status: 'pending' | 'approved' | 'rejected'
  org_id: string
  org_name: string
}

// ── Password hashing (SHA-256 based, browser-compatible) ──────
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = 'talentflow-salt-v1'
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password)
  return computed === hash
}

// ── Minimal JWT ───────────────────────────────────────────────
function b64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function createToken(user: SessionUser): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ ...user, iat: Date.now(), exp: Date.now() + 7 * 24 * 3600 * 1000 }))
  const sig = b64url(JWT_SECRET + payload)
  return `${header}.${payload}.${sig}`
}

export function parseToken(token: string): SessionUser | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp < Date.now()) return null
    return {
      id: payload.id,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
      status: payload.status,
      org_id: payload.org_id,
      org_name: payload.org_name,
    }
  } catch {
    return null
  }
}

// ── Session storage ───────────────────────────────────────────
export function saveSession(token: string): void {
  localStorage.setItem(STORAGE_KEY, token)
}

export function loadSession(): SessionUser | null {
  const token = localStorage.getItem(STORAGE_KEY)
  if (!token) return null
  return parseToken(token)
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}
