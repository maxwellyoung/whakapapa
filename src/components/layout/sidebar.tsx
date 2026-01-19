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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { WorkspaceSwitcher } from './workspace-switcher'
import { SearchCommand } from './search-command'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/people', label: 'People', icon: Users },
  { href: '/tree', label: 'Family Tree', icon: GitBranch },
  { href: '/sources', label: 'Sources', icon: FileText },
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

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-stone-200/60 bg-stone-50/50 dark:border-stone-800/60 dark:bg-stone-950/50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 dark:bg-stone-100">
          <TreePine className="h-5 w-5 text-stone-50 dark:text-stone-900" strokeWidth={1.5} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Whakapapa
        </span>
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
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {item.label}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent dark:via-stone-800" />

      {/* Bottom navigation */}
      <nav className="space-y-1 px-3 py-4">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-500 dark:hover:bg-stone-800/50 dark:hover:text-stone-100'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {item.label}
              </motion.div>
            </Link>
          )
        })}

        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-500 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          Sign out
        </motion.button>
      </nav>
    </aside>
  )
}
