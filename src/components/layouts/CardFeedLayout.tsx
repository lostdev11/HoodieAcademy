'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CardFeedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFeedItemProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

interface CardFeedSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

// Main container for the card feed
export function CardFeedLayout({ children, className }: CardFeedLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

// Individual card item for the feed
export function CardFeedItem({ 
  title, 
  subtitle, 
  badge, 
  badgeVariant = 'default',
  children, 
  className,
  onClick,
  interactive = false
}: CardFeedItemProps) {
  const cardClasses = cn(
    "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 transition-all duration-300",
    interactive && "hover:border-cyan-500/50 hover:bg-slate-700/50 cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10",
    className
  );

  return (
    <Card className={cardClasses} onClick={onClick}>
      {(title || subtitle || badge) && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <CardTitle className="text-lg text-white mb-1">
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className="text-sm text-gray-300">
                  {subtitle}
                </p>
              )}
            </div>
            {badge && (
              <Badge variant={badgeVariant} className="ml-2">
                {badge}
              </Badge>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

// Section header for grouping related cards
export function CardFeedSection({ title, subtitle, children, className }: CardFeedSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || subtitle) && (
        <div className="text-center mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-white mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-300 text-sm">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Grid layout for cards
export function CardFeedGrid({ 
  children, 
  cols = 1, 
  className 
}: { 
  children: React.ReactNode; 
  cols?: 1 | 2 | 3 | 4; 
  className?: string; 
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-6", gridCols[cols], className)}>
      {children}
    </div>
  );
}

// Info card for displaying information
export function InfoCard({ 
  title, 
  children, 
  icon, 
  variant = 'default',
  className 
}: { 
  title: string; 
  children: React.ReactNode; 
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string; 
}) {
  const variantStyles = {
    default: "border-cyan-500/30 bg-cyan-500/5",
    success: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    error: "border-red-500/30 bg-red-500/5"
  };

  return (
    <Card className={cn("border-2", variantStyles[variant], className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          {icon && <span className="text-cyan-400">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

// Action card for interactive elements
export function ActionCard({ 
  title, 
  subtitle, 
  action, 
  children, 
  className 
}: { 
  title: string; 
  subtitle?: string; 
  action?: React.ReactNode;
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <Card className={cn("bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-white mb-1">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-gray-300">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="ml-4">
              {action}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
