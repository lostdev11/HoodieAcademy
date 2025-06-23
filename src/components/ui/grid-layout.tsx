"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number
  gap?: number
}

const GridLayout = React.forwardRef<HTMLDivElement, GridLayoutProps>(
  ({ className, columns = 3, gap = 4, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          `grid-cols-1 md:grid-cols-${columns}`,
          `gap-${gap}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GridLayout.displayName = "GridLayout"

const GridItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("min-w-0", className)}
        {...props}
      />
    )
  }
)
GridItem.displayName = "GridItem"

export { GridLayout, GridItem } 