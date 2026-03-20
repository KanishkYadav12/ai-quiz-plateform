'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, LayoutDashboard, PlusCircle, LogOut, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/auth/useAuth'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const navLinks = [
    { href: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/quiz/create', label: 'Create Quiz',  icon: PlusCircle },
    { href: '/room/join',   label: 'Join Room',    icon: Zap },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border)] shadow-sm backdrop-blur-md bg-opacity-85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Brain size={18} className="text-white" />
            </div>
            <span className="font-bold text-[var(--text-primary)] text-lg tracking-tight">
              Quiz<span className="text-[var(--accent-primary)]">AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pathname === href
                    ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--border)]">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-[var(--text-secondary)] text-sm font-medium">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error-muted)] transition-all text-sm font-medium"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
