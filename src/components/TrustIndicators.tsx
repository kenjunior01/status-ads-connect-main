import { useTranslation } from "react-i18next";
import { Shield, Award, Users, CheckCircle, Clock, Star, Globe, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocalizationContext } from "@/contexts/LocalizationContext";

interface TrustIndicatorsProps {
  className?: string;
}

export const TrustIndicators = ({ className }: TrustIndicatorsProps) => {
  const { t } = useTranslation();
  
  const indicators = [
    {
      icon: Shield,
      label: t('trust.securePayment'),
      description: t('trustIndicators.secureDesc')
    },
    {
      icon: CheckCircle,
      label: t('trust.verifiedCreators'),
      description: t('trustIndicators.verifiedDesc')
    },
    {
      icon: Globe,
      label: t('trustIndicators.globalReach'),
      description: t('trustIndicators.globalDesc')
    },
    {
      icon: CreditCard,
      label: t('trustIndicators.multiCurrency'),
      description: t('trustIndicators.currencyDesc')
    }
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {indicators.map((indicator, index) => {
        const Icon = indicator.icon;
        return (
          <div
            key={index}
            className="flex flex-col items-center text-center p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
          >
            <div className="bg-primary/10 p-3 rounded-full mb-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h4 className="font-medium text-sm text-foreground mb-1">
              {indicator.label}
            </h4>
            <p className="text-xs text-muted-foreground">
              {indicator.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

interface SocialProofProps {
  className?: string;
}

export const SocialProof = ({ className }: SocialProofProps) => {
  const { t } = useTranslation();
  const { format } = useLocalizationContext();
  
  return (
    <div className={cn("text-center space-y-4", className)}>
      <div className="flex justify-center items-center gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">10K+</div>
          <div className="text-xs text-muted-foreground">{t('socialProof.creators')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success">{format(5000000)}</div>
          <div className="text-xs text-muted-foreground">{t('socialProof.paid')}</div>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <div className="text-xs text-muted-foreground">{t('socialProof.rating')}</div>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground italic">
          "{t('socialProof.testimonial')}"
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <img 
            src="/placeholder.svg" 
            alt={t('socialProof.user')} 
            loading="lazy"
            decoding="async"
            className="w-6 h-6 rounded-full"
          />
          <span className="text-xs text-muted-foreground">
            {t('socialProof.userName')}
          </span>
          <Badge variant="secondary" className="text-xs">{t('creator.verified')}</Badge>
        </div>
      </div>
    </div>
  );
};

interface UrgencyCounterProps {
  endTime: Date;
  className?: string;
}

export const UrgencyCounter = ({ endTime, className }: UrgencyCounterProps) => {
  const { t } = useTranslation();
  
  return (
    <div className={cn("bg-warning/10 border border-warning/20 rounded-lg p-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-warning" />
        <span className="text-sm font-medium text-warning">{t('urgency.limitedOffer')}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('urgency.signupBonus')}
      </p>
      <div className="mt-2 text-xs text-warning font-medium">
        ⏰ {t('urgency.spotsLeft')}
      </div>
    </div>
  );
};
