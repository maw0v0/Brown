import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"; // تمت إضافة useLocation
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Browse from "./pages/Browse";
import Search from "./pages/Search";
import ManhwaDetail from "./pages/ManhwaDetail";
import ChapterReader from "./pages/ChapterReader";
import Genres from "./pages/Genres";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Library from "./pages/Library";
import CoinsPage from "./pages/CoinsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminManhwa from "./pages/admin/AdminManhwa";
import AdminChapters from "./pages/admin/AdminChapters";
import AdminGenres from "./pages/admin/AdminGenres";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminComments from "./pages/admin/AdminComments";
import AdminCoins from "./pages/admin/AdminCoins";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReports from "./pages/admin/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// مكون رفع الشاشة للأعلى التلقائي
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const SiteConfigurator = () => {
  useEffect(() => {
    supabase.from('site_settings').select('key, value').in('key', ['favicon_url', 'color_primary', 'color_background'])
      .then(({ data }) => {
        if (!data) return;
        
        const settings = data.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, string>);

        // Favicon
        if (settings.favicon_url) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settings.favicon_url;
        }

        // Colors
        const hexToHslValues = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          if (!result) return null;
          let r = parseInt(result[1], 16) / 255;
          let g = parseInt(result[2], 16) / 255;
          let b = parseInt(result[3], 16) / 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          let h = 0, s = 0, l = (max + min) / 2;
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
          }
          return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
        };

        if (settings.color_primary) {
          const hsl = hexToHslValues(settings.color_primary);
          if (hsl) {
            const hslString = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
            const root = document.documentElement.style;
            root.setProperty('--primary', hslString);
            root.setProperty('--ring', hslString);
            root.setProperty('--sidebar-primary', hslString);
            root.setProperty('--sidebar-ring', hslString);
            root.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${hslString}), hsl(${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - 15)}%))`);
            root.setProperty('--shadow-glow', `0 0 30px hsl(${hslString} / 0.2)`);
            root.setProperty('--shadow-glow-strong', `0 0 50px hsl(${hslString} / 0.35)`);
          }
        }

        if (settings.color_background) {
          const hsl = hexToHslValues(settings.color_background);
          if (hsl) {
            const root = document.documentElement.style;
            const isDark = hsl.l < 50;
            const step = isDark ? 1 : -1;
            
            const bg = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
            const card = `${hsl.h} ${hsl.s}% ${Math.max(0, Math.min(100, hsl.l + (3 * step)))}%`;
            const secondary = `${hsl.h} ${Math.max(0, hsl.s - 5)}% ${Math.max(0, Math.min(100, hsl.l + (8 * step)))}%`;
            const muted = `${hsl.h} ${Math.max(0, hsl.s - 5)}% ${Math.max(0, Math.min(100, hsl.l + (10 * step)))}%`;
            const accent = `${hsl.h} ${Math.max(0, hsl.s - 5)}% ${Math.max(0, Math.min(100, hsl.l + (14 * step)))}%`;

            root.setProperty('--background', bg);
            root.setProperty('--card', card);
            root.setProperty('--popover', card);
            root.setProperty('--secondary', secondary);
            root.setProperty('--muted', muted);
            root.setProperty('--border', muted);
            root.setProperty('--input', muted);
            root.setProperty('--accent', accent);
            root.setProperty('--sidebar-background', bg);
            root.setProperty('--sidebar-accent', secondary);
            root.setProperty('--sidebar-border', muted);
            
            const textBg = isDark ? '260 10% 95%' : '260 20% 10%';
            const textMuted = isDark ? '260 10% 55%' : '260 15% 45%';
            root.setProperty('--foreground', textBg);
            root.setProperty('--card-foreground', textBg);
            root.setProperty('--popover-foreground', textBg);
            root.setProperty('--secondary-foreground', textBg);
            root.setProperty('--accent-foreground', textBg);
            root.setProperty('--muted-foreground', textMuted);
          }
        }
      });
  }, []);
  return null;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/search" element={<Search />} />
      <Route path="/manhwa/:slug" element={<ManhwaDetail />} />
      <Route path="/manhwa/:slug/chapter/:chapterNum" element={<ChapterReader />} />
      <Route path="/genres" element={<Genres />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/teams/:teamId" element={<TeamDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/library" element={<Library />} />
      <Route path="/coins" element={<CoinsPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/admin" element={<AdminDashboard />}>
        <Route path="manhwa" element={<AdminManhwa />} />
        <Route path="manhwa/:manhwaId/chapters" element={<AdminChapters />} />
        <Route path="genres" element={<AdminGenres />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="comments" element={<AdminComments />} />
        <Route path="coins" element={<AdminCoins />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Footer />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop /> {/* تمت إضافة المكون هنا */}
            <SiteConfigurator />
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
