import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const UrgencyBar = () => {
  const { t } = useTranslation();
  const flags = ["🇺🇸","🇬🇧","🇵🇹","🇧🇷","🇪🇸","🇫🇷","🇩🇪","🇮🇳","🇮🇩","🇵🇭","🇻🇳","🇯🇵","🇰🇷","🇳🇬","🇿🇦","🇦🇴","🇲🇿"];
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-warning/10 text-warning border-0">{t('urgency.limitedOffer')}</Badge>
          <span
            className={cn("text-sm", "text-foreground")}
            dangerouslySetInnerHTML={{ __html: t('urgency.signupBonus') }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t('urgency.spotsLeft')}</span>
          <div className="hidden md:flex items-center gap-1 text-lg">
            {flags.map((f, i) => (
              <span key={i} className="leading-none">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
