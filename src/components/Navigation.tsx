import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  LayoutDashboard, 
  Target, 
  Star,
  Menu,
  LogIn,
  UserPlus,
  Search,
  MapPin,
  Trophy,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RegionCurrencySelector } from "@/components/RegionCurrencySelector";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserSubscriptionDialog } from "@/components/UserSubscriptionDialog";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalizationContext } from "@/contexts/LocalizationContext";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CreateCampaignDialog } from "@/components/CreateCampaignForm";

export const Navigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  const { getCurrentCountry } = useLocalizationContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [creatorResults, setCreatorResults] = useState<Array<{ id: string; display_name: string; rating?: number | null; niche?: string | null }>>([]);
  const currentPath = location.pathname;
  
  const currentCountry = getCurrentCountry();
  const { subscribed } = useUserSubscription();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Keyboard shortcut: Ctrl/Cmd + K abre a paleta
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const q = cmdQuery.trim();
      if (!q) {
        setCreatorResults([]);
        return;
      }
      const { data } = await supabase
        .from("creator_listings")
        .select("id,display_name,rating,niche")
        .ilike("display_name", `%${q}%`)
        .order("rating", { ascending: false })
        .limit(8);
      if (active) {
        setCreatorResults((data || []) as Array<{ id: string; display_name: string; rating?: number | null; niche?: string | null }>);
      }
    };
    load();
    return () => { active = false; };
  }, [cmdQuery]);

  const getDashboardPage = () => {
    if (role === "admin") return "/dashboard/admin";
    if (role === "advertiser") return "/dashboard/advertiser";
    return "/dashboard/creator";
  };

  const menuItems = [
    {
      title: t('navigation.home'),
      icon: Home,
      path: "/",
      description: t('navigation.home')
    },
    {
      title: t('navigation.explore'),
      icon: Search,
      path: "/creators",
      description: t('navigation.explore')
    },
    {
      title: "Leilões",
      icon: Target,
      path: "/auctions",
      description: "Leilões de Campanhas"
    },
    {
      title: "Ranking",
      icon: Trophy,
      path: "/ranking",
      description: "Ranking de Criadores"
    },
    {
      title: "Lembretes",
      icon: Bell,
      path: "/reminders",
      description: "Alertas e lembretes"
    },
    {
      title: t('navigation.creators'),
      icon: Star,
      path: "/dashboard/creator",
      description: t('navigation.creators')
    },
    {
      title: t('navigation.advertisers'),
      icon: Target,
      path: "/dashboard/advertiser",
      description: t('navigation.advertisers')
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavigation("/")}
          >
            <div className="bg-gradient-primary p-2 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                StatusAds
              </div>
              {currentCountry && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  <MapPin className="h-2 w-2" />
                  {currentCountry.name}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation - Enhanced */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 relative after:content-[''] after:absolute after:left-3 after:right-3 after:-bottom-1 after:h-0.5 after:rounded-full",
                    isActive ? "bg-primary/10 text-primary after:bg-primary" : "after:bg-transparent"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Button>
              );
            })}
            {/* Atalho para criar campanha */}
            {role === "advertiser" && (
              <Button size="sm" className="ml-2 bg-gradient-primary hover:opacity-90" onClick={() => setCreateOpen(true)}>
                Criar campanha
              </Button>
            )}
            {/* Atalho para Command Palette */}
            <Button variant="outline" size="sm" className="ml-1" onClick={() => setCommandOpen(true)} title="Pesquisar / Ações (Ctrl+K)">
              <Search className="h-4 w-4 mr-2" />
              Ações
              <span className="ml-2 hidden lg:inline-block text-[10px] text-muted-foreground border rounded px-1 py-0.5">Ctrl+K</span>
            </Button>
          </div>

          {/* Auth Buttons & Language */}
          <div className="hidden md:flex items-center gap-2">
            <RegionCurrencySelector />
            <LanguageSelector />
            <ThemeToggle />
            {user && !subscribed && <UserSubscriptionDialog />}
            {user && <NotificationBell />}
            {role === "admin" && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/payments")}>
                Pagamentos
              </Button>
            )}
            {role === "admin" && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/webhooks")}>
                Webhooks
              </Button>
            )}
            {role === "admin" && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/logs")}>
                Logs
              </Button>
            )}
            {role === "admin" && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/dunning")}>
                Dunning
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/ads/sponsor")}>
              Anunciar
            </Button>
            {role === "admin" && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/ads-pricing")}>
                  Preços
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/sponsored-banners")}>
                  Banners
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/banner-analytics")}>
                  Analytics
                </Button>
              </>
            )}
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate(getDashboardPage())}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {t('navigation.login')}
                </Button>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90" onClick={() => navigate("/auth")}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('navigation.register')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <div className="hidden sm:block">
              <RegionCurrencySelector />
            </div>
            <LanguageSelector />
            {user && <NotificationBell />}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                {/* Ações principais */}
                <div className="mt-6 space-y-2">
                  <Button variant="secondary" className="w-full justify-start h-12" onClick={() => handleNavigation("/creators")}>
                    🔎 <span className="ml-2">Explorar criadores</span>
                  </Button>
                  <Button variant="secondary" className="w-full justify-start h-12" onClick={() => handleNavigation("/ads/sponsor?placement=roll")}>
                    📣 <span className="ml-2">Anunciar agora</span>
                  </Button>
                  {role === "advertiser" && (
                    <Button variant="secondary" className="w-full justify-start h-12" onClick={() => { setCreateOpen(true); setMobileOpen(false); }}>
                      🚀 <span className="ml-2">Nova campanha</span>
                    </Button>
                  )}
                </div>
                {/* Navegação essencial */}
                <div className="flex flex-col space-y-2 mt-6">
                  {[
                    { title: t('navigation.home'), icon: Home, path: "/" },
                    { title: "Ranking", icon: Trophy, path: "/ranking" },
                    { title: "Dashboard", icon: LayoutDashboard, path: getDashboardPage() },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.path}
                        variant={currentPath === item.path ? "default" : "ghost"}
                        className="justify-start h-12"
                        onClick={() => handleNavigation(item.path)}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">{item.title}</div>
                        </div>
                      </Button>
                    );
                  })}
                  <Button variant="ghost" className="justify-start h-12" onClick={() => setCommandOpen(true)}>
                    <Search className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Pesquisar</div>
                    </div>
                  </Button>
                  <div className="pt-4 border-t space-y-2">
                    {user ? (
                      <>
                        <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigation(getDashboardPage())}>
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                        <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                          <LogIn className="h-4 w-4 mr-2" />
                          Sair
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigation("/auth")}>
                          <LogIn className="h-4 w-4 mr-2" />
                          {t('navigation.login')}
                        </Button>
                        <Button className="w-full justify-start bg-gradient-primary" onClick={() => handleNavigation("/auth")}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          {t('navigation.register')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Pesquisar páginas, criadores e ações..." value={cmdQuery} onValueChange={setCmdQuery} />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.path} onSelect={() => { handleNavigation(item.path); setCommandOpen(false); }}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </CommandItem>
              );
            })}
          </CommandGroup>
          {creatorResults.length > 0 && (
            <CommandGroup heading="Criadores">
              {creatorResults.map((c) => (
                <CommandItem key={c.id} onSelect={() => { navigate(`/creators?focus=${c.id}`); setCommandOpen(false); }}>
                  <Star className="mr-2 h-4 w-4 text-primary" />
                  {c.display_name}
                  {typeof c.rating === "number" ? <span className="ml-auto text-xs text-muted-foreground">⭐ {c.rating}</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Ações">
            {role === "advertiser" && (
              <CommandItem onSelect={() => { setCreateOpen(true); setCommandOpen(false); }}>
                <Target className="mr-2 h-4 w-4" />
                Criar nova campanha
              </CommandItem>
            )}
            <CommandItem onSelect={() => { setMobileOpen(true); }}>
              <Menu className="mr-2 h-4 w-4" />
              Abrir menu
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Create Campaign Dialog (global) */}
      <CreateCampaignDialog>
        <span className="hidden" />
      </CreateCampaignDialog>
    </nav>
  );
};
