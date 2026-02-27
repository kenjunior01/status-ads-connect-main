import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "primary";
  className?: string;
}

const variantStyles = {
  default: "bg-gradient-muted/5 border-muted/20",
  success: "bg-gradient-success/5 border-success/20",
  warning: "bg-gradient-warning/5 border-warning/20", 
  primary: "bg-gradient-primary/5 border-primary/20"
};

const iconStyles = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  primary: "text-primary"
};

const valueStyles = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  primary: "text-primary"
};

export const MetricsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = "default",
  className 
}: MetricsCardProps) => {
  return (
    <Card className={cn(variantStyles[variant], "hover:shadow-subtle transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Icon className={cn("h-5 w-5", iconStyles[variant])} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("text-2xl font-bold", valueStyles[variant])}>
              {typeof value === 'number' && value > 999 
                ? `${(value / 1000).toFixed(1)}k` 
                : value}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground/70">
                {subtitle}
              </div>
            )}
          </div>
          {trend && (
            <div className="flex-shrink-0">
              <Badge 
                variant={trend.isPositive ? "default" : "destructive"}
                className="text-xs"
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};