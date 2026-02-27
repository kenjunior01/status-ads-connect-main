import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileCheck, 
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { VerificationStatus } from '@/hooks/useCampaigns';

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<VerificationStatus, {
  icon: typeof CheckCircle;
  label: string;
  className: string;
  tooltipKey: string;
}> = {
  not_started: {
    icon: AlertCircle,
    label: 'not_started',
    className: 'bg-muted text-muted-foreground',
    tooltipKey: 'verification.statuses.not_started',
  },
  proof_submitted: {
    icon: FileCheck,
    label: 'proof_submitted',
    className: 'bg-primary/10 text-primary',
    tooltipKey: 'verification.statuses.proof_submitted',
  },
  under_review: {
    icon: Clock,
    label: 'under_review',
    className: 'bg-warning/10 text-warning',
    tooltipKey: 'verification.statuses.under_review',
  },
  verified: {
    icon: CheckCircle,
    label: 'verified',
    className: 'bg-success/10 text-success',
    tooltipKey: 'verification.statuses.verified',
  },
  rejected: {
    icon: XCircle,
    label: 'rejected',
    className: 'bg-destructive/10 text-destructive',
    tooltipKey: 'verification.statuses.rejected',
  },
};

const sizeConfig = {
  sm: { icon: 'h-3 w-3', text: 'text-xs', padding: 'px-1.5 py-0.5' },
  md: { icon: 'h-4 w-4', text: 'text-sm', padding: 'px-2 py-1' },
  lg: { icon: 'h-5 w-5', text: 'text-base', padding: 'px-3 py-1.5' },
};

export const VerificationBadge = ({ 
  status, 
  size = 'md', 
  showLabel = true 
}: VerificationBadgeProps) => {
  const { t } = useTranslation();
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const badge = (
    <span 
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.className,
        sizes.padding,
        sizes.text
      )}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span>{t(config.tooltipKey)}</span>}
    </span>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{t(config.tooltipKey)}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
};
