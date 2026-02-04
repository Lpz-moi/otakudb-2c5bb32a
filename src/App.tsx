import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ListsPage from "./pages/ListsPage";
import AnimeDetailPage from "./pages/AnimeDetailPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoverPage from "./pages/DiscoverPage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import SharedListPage from "./pages/SharedListPage";
import SetupPage from "./pages/SetupPage";
import NotFound from "./pages/NotFound";
import { useRealtimeAnimeList } from "./hooks/useRealtimeAnimeList";
import HowItWorksPage from "./pages/HowItWorksPage";

const queryClient = new QueryClient();

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  return url && 
         key && 
         !url.includes('placeholder') && 
         !key.includes('placeholder') &&
         url.startsWith('https://');
};

// Register service worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registered');
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
};

const App = () => {
  const [configChecked, setConfigChecked] = useState(false);
  const [hasProperConfig, setHasProperConfig] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    const configured = isSupabaseConfigured();
    setHasProperConfig(configured);
    setConfigChecked(true);

    if (!configured) {
      console.warn('⚠️  Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local');
    }

    // If there's an access_token or error in the hash, navigate to auth callback
    const hash = window.location.hash.substring(1);
    const pathname = window.location.pathname;
    
    if (hash && (hash.includes('access_token=') || hash.includes('error=')) && !pathname.includes('/auth/callback')) {
      // Replace current location with /auth/callback while preserving the hash
      window.location.replace('/auth/callback' + window.location.hash);
    }
  }, []);

  if (!configChecked) {
    return <div className="w-full h-screen bg-slate-900" />;
  }

  // Show setup page if not configured
  if (!hasProperConfig) {
    return <SetupPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

/**
 * 🎯 AppContent - Composant interne qui utilise les hooks
 * Doit être dans AuthProvider pour accéder à user
 */
function AppContent() {
  // 📡 Activer real-time sync
  useRealtimeAnimeList();

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes (no layout) */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/share/:userId/:listType" element={<SharedListPage />} />
        
        {/* Main app routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/anime/:id" element={<AnimeDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
