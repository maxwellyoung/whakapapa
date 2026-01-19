import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-stone-200/80 dark:bg-stone-700/50',
        className
      )}
      {...props}
    />
  )
}

// Pre-built skeleton components for common patterns

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-stone-200 dark:border-stone-700 p-4', className)}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  )
}

function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }
  return <Skeleton className={cn('rounded-full', sizes[size])} />
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-stone-200 dark:border-stone-700">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonPersonCard() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
      <SkeletonAvatar size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

function SkeletonTimeline({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonTree() {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      {/* Top level */}
      <div className="flex gap-8">
        <Skeleton className="h-16 w-40 rounded-xl" />
        <Skeleton className="h-16 w-40 rounded-xl" />
      </div>
      {/* Connector */}
      <Skeleton className="h-8 w-px" />
      {/* Middle level */}
      <div className="flex gap-8">
        <Skeleton className="h-16 w-40 rounded-xl" />
        <Skeleton className="h-16 w-40 rounded-xl" />
        <Skeleton className="h-16 w-40 rounded-xl" />
      </div>
      {/* Connector */}
      <Skeleton className="h-8 w-px" />
      {/* Bottom level */}
      <div className="flex gap-8">
        <Skeleton className="h-16 w-40 rounded-xl" />
        <Skeleton className="h-16 w-40 rounded-xl" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonText,
  SkeletonTable,
  SkeletonPersonCard,
  SkeletonTimeline,
  SkeletonTree,
}
