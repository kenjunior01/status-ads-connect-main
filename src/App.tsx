import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { BottomNav } from "@/components/BottomNav";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard").then(m => ({ default: m.CreatorDashboard || m.default })));
const AdvertiserDashboard = lazy(() => import("./pages/AdvertiserDashboard").then(m => ({ default: m.AdvertiserDashboard || m.default })));
const AdvertiserOnboarding = lazy(() => import("./pages/AdvertiserOnboarding").then(m => ({ default: m.AdvertiserOnboarding || m.default })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard || m.default })));
const RankingPage = lazy(() => import("./pages/Ranking"));
const CampaignRedirect = lazy(() => import("./pages/CampaignRedirect").then(m => ({ default: m.CampaignRedirect || m.default })));
const NotFound = lazy(() => import("./pages/NotFound"));
import { AuthProvider, useAuth, type UserRole } from "@/contexts/AuthContext";
const SellerOnboarding = lazy(() => import("./pages/SellerOnboarding").then(m => ({ default: m.SellerOnboarding || m.default })));
const Auctions = lazy(() => import("./pages/Auctions").then(m => ({ default: m.Auctions || m.default })));
const CollaborativeCampaigns = lazy(() => import("./pages/CollaborativeCampaigns").then(m => ({ default: m.CollaborativeCampaigns || m.default })));
const Challenges = lazy(() => import("./pages/Challenges").then(m => ({ default: m.Challenges || m.default })));
const CommunityHub = lazy(() => import("./pages/CommunityHub").then(m => ({ default: m.CommunityHub || m.default })));
const BestPractices = lazy(() => import("./pages/BestPractices").then(m => ({ default: m.BestPractices || m.default })));
const MentorshipCenter = lazy(() => import("./pages/MentorshipCenter").then(m => ({ default: m.MentorshipCenter || m.default })));
import { CampaignCalendar } from "./components/CampaignCalendar";
const CampaignDetails = lazy(() => import("./pages/CampaignDetails").then(m => ({ default: m.CampaignDetails || m.default })));
const Reminders = lazy(() => import("./pages/Reminders").then(m => ({ default: m.Reminders || m.default })));
const AdminPaymentEvents = lazy(() => import("./pages/AdminPaymentEvents").then(m => ({ default: m.AdminPaymentEvents || m.default })));
const AdminWebhookSettings = lazy(() => import("./pages/AdminWebhookSettings").then(m => ({ default: m.AdminWebhookSettings || m.default })));
const AdminFunctionLogs = lazy(() => import("./pages/AdminFunctionLogs").then(m => ({ default: m.AdminFunctionLogs || m.default })));
const AdminDunning = lazy(() => import("./pages/AdminDunning").then(m => ({ default: m.AdminDunning || m.default })));
const SponsoredAdForm = lazy(() => import("./pages/SponsoredAdForm").then(m => ({ default: m.SponsoredAdForm || m.default })));
const AdminAdPricing = lazy(() => import("./pages/AdminAdPricing").then(m => ({ default: m.AdminAdPricing || m.default })));
const AdminSponsoredBanners = lazy(() => import("./pages/AdminSponsoredBanners").then(m => ({ default: m.AdminSponsoredBanners || m.default })));
const AdminBannerAnalytics = lazy(() => import("./pages/AdminBannerAnalytics").then(m => ({ default: m.AdminBannerAnalytics || m.default })));
import AdminBootstrap from "./pages/AdminBootstrap";
import RoleBootstrap from "./pages/RoleBootstrap";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ServiceStatusBanner } from "./components/ServiceStatusBanner";
import { ReminderScheduler } from "./components/ReminderScheduler";

// Initialize i18n
import "@/lib/i18n";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: Exclude<UserRole, null>[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const Prefetcher = () => {
    const { role } = useAuth();
    const location = useLocation();
    useEffect(() => {
      const preload = async () => {
        if (role === "admin") {
          await import("./pages/AdminDashboard");
        } else if (role === "creator") {
          await import("./pages/CreatorDashboard");
        } else if (role === "advertiser") {
          await import("./pages/AdvertiserDashboard");
        }
      };
      preload();
    }, [role]);
    useEffect(() => {
      const p = location.pathname;
      if (p === "/") document.title = "StatusAds • Início";
      else if (p.startsWith("/auth")) document.title = "StatusAds • Entrar";
      else if (p.includes("/dashboard/admin")) document.title = "StatusAds • Admin";
      else if (p.includes("/dashboard/creator")) document.title = "StatusAds • Criador";
      else if (p.includes("/dashboard/advertiser")) document.title = "StatusAds • Anunciante";
      else document.title = "StatusAds";
    }, [location.pathname]);
    return null;
  };
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <NotificationProvider>
                <div id="app-wrapper" className="min-h-screen bg-background pb-14 md:pb-0">
                  <Navigation />
                  <ServiceStatusBanner />
                  <ReminderScheduler />
                  <main className="animate-fade-in">
                    <ErrorBoundary>
                      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary" /></div>}>
                        <Prefetcher />
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/auth" element={<Auth />} />
                        <Route path="/creators" element={<Index />} />
                          <Route path="/ranking" element={<RankingPage />} />
                          <Route path="/go/:campaignId" element={<CampaignRedirect />} />
                        <Route
                          path="/onboarding"
                          element={
                            <ProtectedRoute>
                              <SellerOnboarding />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/auctions"
                          element={
                            <ProtectedRoute>
                              <Auctions />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/onboarding/advertiser"
                          element={
                            <ProtectedRoute allowedRoles={["advertiser"]}>
                              <AdvertiserOnboarding />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/creator"
                          element={
                            <ProtectedRoute allowedRoles={["creator"]}>
                              <CreatorDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/advertiser"
                          element={
                            <ProtectedRoute allowedRoles={["advertiser"]}>
                              <AdvertiserDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/admin"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/admin/payments"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminPaymentEvents />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/admin/webhooks"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminWebhookSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/admin/logs"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminFunctionLogs />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/admin/dunning"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminDunning />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ads/sponsor"
                          element={<SponsoredAdForm />}
                        />
                        <Route
                          path="/dashboard/admin/ads-pricing"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminAdPricing />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/admin/sponsored-banners"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminSponsoredBanners />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/admin/banner-analytics"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminBannerAnalytics />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/campaigns/collaborative"
                          element={
                            <ProtectedRoute allowedRoles={["advertiser"]}>
                              <CollaborativeCampaigns />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/challenges"
                          element={
                            <ProtectedRoute>
                              <Challenges />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/community" element={<CommunityHub />} />
                        <Route path="/best-practices" element={<BestPractices />} />
                        <Route
                          path="/mentorship"
                          element={
                            <ProtectedRoute>
                              <MentorshipCenter />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/calendar"
                          element={
                            <ProtectedRoute>
                              <CampaignCalendar />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/reminders"
                          element={
                            <ProtectedRoute>
                              <Reminders />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/campaigns/:id"
                          element={
                            <ProtectedRoute>
                              <CampaignDetails />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/bootstrap/admin"
                          element={
                            <ProtectedRoute>
                              <AdminBootstrap />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/bootstrap/role"
                          element={
                            <ProtectedRoute>
                              <RoleBootstrap />
                            </ProtectedRoute>
                          }
                        />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </ErrorBoundary>
                  </main>
                  <BottomNav />
                </div>
              </NotificationProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
