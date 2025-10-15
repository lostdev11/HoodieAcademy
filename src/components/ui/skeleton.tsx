import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-700/50", className)}
      {...props}
    />
  )
}

/**
 * Shimmer effect skeleton for better perceived performance
 */
function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-700/50",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-slate-500/30 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

/**
 * Card skeleton for course/bounty cards
 */
function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <ShimmerSkeleton className="h-6 w-32" />
        <ShimmerSkeleton className="h-5 w-20 rounded-full" />
      </div>
      <ShimmerSkeleton className="h-4 w-full" />
      <ShimmerSkeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <ShimmerSkeleton className="h-8 w-24 rounded-md" />
        <ShimmerSkeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  )
}

/**
 * Dashboard stats skeleton
 */
function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <ShimmerSkeleton className="h-10 w-10 rounded-full" />
        <ShimmerSkeleton className="h-4 w-32" />
      </div>
      <ShimmerSkeleton className="h-8 w-24" />
      <ShimmerSkeleton className="h-3 w-full" />
    </div>
  )
}

/**
 * Course list skeleton
 */
function CourseListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Bounty list skeleton
 */
function BountyListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Dashboard skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        <ShimmerSkeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  ShimmerSkeleton,
  CardSkeleton,
  StatsCardSkeleton,
  CourseListSkeleton,
  BountyListSkeleton,
  DashboardSkeleton
}
