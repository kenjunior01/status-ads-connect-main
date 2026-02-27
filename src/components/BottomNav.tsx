import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Users, BarChart3, Crown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCampaignDialog } from "@/components/CreateCampaignForm";
import { Button } from "@/components/ui/button";

export const BottomNav = () => {
  const [open, setOpen] = useState(false);
  const items = [
    { to: "/", label: "Início", icon: Home },
    { to: "/creators", label: "Criadores", icon: Users },
    { to: "/ranking", label: "Ranking", icon: Crown },
    { to: "/dashboard/advertiser", label: "Painel", icon: BarChart3 },
  ];

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-40",
        "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75",
        "border-t border-border"
      )}
    >
      {/* FAB para criar campanha */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-primary hover:opacity-90"
          onClick={() => setOpen(true)}
          aria-label="Nova campanha"
        >
          <Plus className="h-7 w-7 text-primary-foreground" />
        </Button>
      </div>
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-xs",
                    "text-muted-foreground hover:text-foreground",
                    isActive && "text-primary"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="leading-none">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
      {/* Dialog de criação (global) */}
      <CreateCampaignDialog>
        <span className="hidden" />
      </CreateCampaignDialog>
    </nav>
  );
}
