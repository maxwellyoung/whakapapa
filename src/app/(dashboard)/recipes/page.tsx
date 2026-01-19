'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Utensils,
  Plus,
  Search,
  User,
  ChefHat,
  Clock,
  Heart,
  Printer,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Memory, Person } from '@/types'

interface RecipeWithPerson extends Memory {
  person: Person
}

export default function RecipesPage() {
  const { currentWorkspace } = useWorkspace()
  const [recipes, setRecipes] = useState<RecipeWithPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchRecipes() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const { data } = await supabase
        .from('memories')
        .select('*, person:people(*)')
        .eq('workspace_id', currentWorkspace.id)
        .eq('memory_type', 'recipe')
        .order('created_at', { ascending: false })

      if (data) {
        setRecipes(data as RecipeWithPerson[])
      }
      setLoading(false)
    }

    fetchRecipes()
  }, [currentWorkspace])

  const filteredRecipes = recipes.filter((recipe) => {
    const query = searchQuery.toLowerCase()
    return (
      recipe.title?.toLowerCase().includes(query) ||
      recipe.content.toLowerCase().includes(query) ||
      recipe.person.preferred_name.toLowerCase().includes(query)
    )
  })

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
                <ChefHat className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  Family Recipes
                </h1>
                <p className="text-stone-500 dark:text-stone-400">
                  Treasured recipes passed down through generations
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="h-4 w-4 mr-2" />
              Print All
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 print:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
              <Utensils className="h-8 w-8 text-stone-400" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {searchQuery ? 'No recipes found' : 'No family recipes yet'}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-6">
              {searchQuery
                ? 'Try a different search term'
                : "Add recipes to family members' profiles to preserve your culinary heritage."}
            </p>
            {!searchQuery && (
              <Link href="/people">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Go to People
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 overflow-hidden hover:shadow-lg transition-shadow print:break-inside-avoid"
              >
                {/* Recipe Header */}
                <div className="p-4 border-b border-stone-100 dark:border-stone-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-lg">
                        {recipe.title || 'Untitled Recipe'}
                      </h3>
                      <Link
                        href={`/people/${recipe.person_id}`}
                        className="inline-flex items-center gap-2 mt-1 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={recipe.person.photo_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(recipe.person.preferred_name)}
                          </AvatarFallback>
                        </Avatar>
                        {recipe.person.preferred_name}&apos;s recipe
                      </Link>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                      <Utensils className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Recipe Content */}
                <div className="p-4">
                  <p className="text-stone-600 dark:text-stone-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {recipe.content}
                  </p>
                </div>

                {/* Recipe Footer */}
                {recipe.contributed_by_name && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      Shared by {recipe.contributed_by_name}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {recipes.length > 0 && (
          <div className="mt-8 text-center text-sm text-stone-400 dark:text-stone-500 print:hidden">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} from your family
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
