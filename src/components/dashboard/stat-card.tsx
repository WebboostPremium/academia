import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("card-ring p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-foreground">{value}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          {trend && <p className="mt-1 text-xs font-medium text-accent">{trend}</p>}
        </div>
        {icon && (
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
