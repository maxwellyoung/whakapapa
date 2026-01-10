'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  Users,
  GitBranch,
  FileText,
  History,
  Settings,
  Download,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { WorkspaceSwitcher } from './workspace-switcher'
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
  { href: '/export', label: 'Export', icon: Download },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNavClick = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <div className="flex items-center justify-between border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-sm p-4 md:hidden dark:border-stone-800/60 dark:bg-stone-950/80">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-900 dark:bg-stone-100">
          <svg className="h-4 w-4 text-stone-50 dark:text-stone-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v6m0 0l4-4m-4 4l-4-4" />
            <path d="M12 22V12" />
            <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">Whakapapa</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="mt-4">
            <WorkspaceSwitcher />
          </div>

          <Separator className="my-4" />

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <Separator className="my-4" />

          <nav className="space-y-1">
            {bottomItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                      : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-500 dark:hover:bg-stone-800/50 dark:hover:text-stone-100'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {item.label}
                </button>
              )
            })}

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition-all duration-200 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-500 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
              Sign out
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
