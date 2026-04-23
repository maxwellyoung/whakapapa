'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users,
  GitBranch,
  FileText,
  History,
  Settings,
  Download,
  Upload,
  LogOut,
  Sparkles,
  TreePine,
  ChefHat,
  ScanLine,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from './workspace-switcher'
import { SearchCommand } from './search-command'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/story', label: 'Story Mode', icon: BookOpen },
  { href: '/people', label: 'People', icon: Users },
  { href: '/tree', label: 'Family Tree', icon: GitBranch },
  { href: '/sources', label: 'Sources', icon: FileText },
  { href: '/scan', label: 'Scan Docs', icon: ScanLine },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
  { href: '/suggestions', label: 'Suggestions', icon: Sparkles },
  { href: '/activity', label: 'Activity', icon: History },
]

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/import', label: 'Import', icon: Upload },
  { href: '/export', label: 'Export', icon: Download },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItemClass = (isActive: boolean) =>
    cn(
      'atlas-nav-item group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-medium',
      isActive && 'is-active'
    )

  return (
    <aside className="atlas-sidebar flex h-screen w-[17.5rem] flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="atlas-brand-mark flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(69,45,31,0.22)] shadow-[0_10px_20px_rgba(86,59,40,0.08)]">
          <TreePine className="h-5 w-5 text-[var(--atlas-accent)]" strokeWidth={1.5} />
        </div>
        <div>
          <span className="block text-[1.35rem] font-semibold leading-none tracking-tight text-[var(--atlas-ink)]">
            Whakapapa
          </span>
          <span className="atlas-label mt-1 block text-[0.58rem]">Living archive</span>
        </div>
      </div>

      {/* Workspace switcher */}
      <div className="px-4 pb-2">
        <WorkspaceSwitcher />
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <SearchCommand />
      </div>

      {/* Main navigation */}
      <div className="px-4 pb-2">
        <p className="atlas-label px-3">Navigate</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 1.5 }}
                whileTap={{ scale: 0.99 }}
                className={navItemClass(isActive)}
              >
                <span
                  className={cn(
                    'absolute bottom-2 left-[0.45rem] top-2 w-[2px] rounded-full',
                    isActive ? 'bg-[var(--atlas-accent)]' : 'bg-transparent'
                  )}
                />
                <item.icon
                  className={cn(
                    'atlas-nav-icon h-[18px] w-[18px]',
                    isActive && 'text-[var(--atlas-accent)]'
                  )}
                  strokeWidth={1.65}
                />
                {item.label}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[rgba(101,76,57,0.18)] to-transparent" />

      {/* Bottom navigation */}
      <div className="px-4 pt-4 pb-1">
        <p className="atlas-label px-3">Workspace</p>
      </div>
      <nav className="space-y-1 px-3 py-2">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 1.5 }}
                whileTap={{ scale: 0.99 }}
                className={navItemClass(isActive)}
              >
                <span
                  className={cn(
                    'absolute bottom-2 left-[0.45rem] top-2 w-[2px] rounded-full',
                    isActive ? 'bg-[var(--atlas-accent)]' : 'bg-transparent'
                  )}
                />
                <item.icon
                  className={cn(
                    'atlas-nav-icon h-[18px] w-[18px]',
                    isActive && 'text-[var(--atlas-accent)]'
                  )}
                  strokeWidth={1.65}
                />
                {item.label}
              </motion.div>
            </Link>
          )
        })}

        <motion.button
          whileHover={{ x: 1.5 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSignOut}
          className={cn(navItemClass(false), 'w-full text-left')}
        >
          <span className="absolute bottom-2 left-[0.45rem] top-2 w-[2px] rounded-full bg-transparent" />
          <LogOut className="atlas-nav-icon h-[18px] w-[18px]" strokeWidth={1.65} />
          Sign out
        </motion.button>
      </nav>
    </aside>
  )
}
