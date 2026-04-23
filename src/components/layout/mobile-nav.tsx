'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  BookOpen,
  Users,
  GitBranch,
  FileText,
  History,
  Settings,
  Download,
  Upload,
  LogOut,
  Sparkles,
  ScanLine,
  ChefHat,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { WorkspaceSwitcher } from './workspace-switcher'
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

  const navItemClass = (isActive: boolean) =>
    cn(
      'atlas-nav-item group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium',
      isActive && 'is-active'
    )

  return (
    <div className="atlas-sidebar flex items-center justify-between border-b border-[rgba(101,76,57,0.14)] px-4 py-4 md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="atlas-brand-mark flex h-9 w-9 items-center justify-center rounded-2xl border border-[rgba(69,45,31,0.22)] shadow-[0_10px_20px_rgba(86,59,40,0.08)]">
          <ScanLine className="h-4 w-4 text-[var(--atlas-accent)]" strokeWidth={1.6} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[var(--atlas-ink)]">Whakapapa</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
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
                  data-active={isActive}
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
                    strokeWidth={1.6}
                  />
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
                  data-active={isActive}
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
                    strokeWidth={1.6}
                  />
                  {item.label}
                </button>
              )
            })}

            <button
              onClick={handleSignOut}
              className={navItemClass(false)}
            >
              <span className="absolute bottom-2 left-[0.45rem] top-2 w-[2px] rounded-full bg-transparent" />
              <LogOut className="atlas-nav-icon h-[18px] w-[18px]" strokeWidth={1.6} />
              Sign out
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
