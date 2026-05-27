import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  GitBranch,
  BookOpen,
  CalendarDays,
  Mail,
  Zap,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AtsIcon } from '@/components/AtsIcon'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       href: '/dashboard',       icon: LayoutDashboard },
  { label: 'Jobs',            href: '/jobs',            icon: Briefcase },
  { label: 'Pipeline',        href: '/pipeline',        icon: GitBranch },
  { label: 'Library',         href: '/library',         icon: BookOpen },
  { label: 'Calendar',        href: '/calendar',        icon: CalendarDays },
  { label: 'Email Templates', href: '/email-templates', icon: Mail },
  { label: 'Workflows',       href: '/workflows',       icon: Zap },
  { label: 'Settings',        href: '/settings',        icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[hsl(150,18%,96%)]">
      {/* Sidebar */}
      <aside
        className="flex w-60 flex-shrink-0 flex-col bg-[hsl(150,18%,93%)] py-5"
        style={{ boxShadow: 'inset -4px 0 12px rgba(0,0,0,0.04)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#40826D] shadow-md">
            <AtsIcon size={20} color="#ffffff" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[#1a3d30]">
            TalentFlow
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/dashboard'
                ? location.pathname === href
                : location.pathname.startsWith(href)

            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#D6EDE7] text-[#245849]'
                    : 'text-[#3a6052] hover:bg-[#D6EDE7]/60 hover:text-[#245849]'
                )}
              >
                <Icon
                  size={17}
                  className={cn(
                    'shrink-0',
                    isActive ? 'text-[#40826D]' : 'text-[#6aab94]'
                  )}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User / Org info + Logout */}
        <div className="mt-auto px-3">
          <div className="rounded-xl bg-white/60 px-3 py-3 shadow-sm">
            <p className="truncate text-xs font-semibold text-[#245849]">
              {user?.org_name ?? 'Organization'}
            </p>
            <p className="truncate text-[11px] text-[#6aab94] mt-0.5">
              {user?.email ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#3a6052] transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} className="shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
