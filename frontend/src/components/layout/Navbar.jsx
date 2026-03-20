'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, LayoutDashboard, PlusCircle, LogOut, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/auth/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const navLinks = [
    { href: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/quiz/create', label: 'Create Quiz',  icon: PlusCircle },
    { href: '/room/join',   label: 'Join Room',    icon: Zap },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[#1A1A2E] border-b border-[#0F3460] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#E94560] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain size={18} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Quiz<span className="text-[#E94560]">AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === href
                    ? 'bg-[#E94560] text-white'
                    : 'text-gray-300 hover:text-white hover:bg-[#0F3460]'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E94560] flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-gray-300 text-sm">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 transition-all text-sm"
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
