import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import { useEffect } from "react";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ListsPage from "./pages/ListsPage";
import AnimeDetailPage from "./pages/AnimeDetailPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoverPage from "./pages/DiscoverPage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import FriendsPage from "./pages/FriendsPage";
import SharePage from "./pages/SharePage";
import SharedListPage from "./pages/SharedListPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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

const shouldUseServiceWorker = () => {
  // Prevent SW issues on preview/dev environments where assets are not hashed
  if (!import.meta.env.PROD) return false;
  const host = window.location.hostname;
  if (host.includes('lovableproject.com')) return false;
  if (host.includes('id-preview')) return false;
  return true;
};

const unregisterAllServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
};

const App = () => {
  useEffect(() => {
    if (shouldUseServiceWorker()) {
      registerServiceWorker();
    } else {
      // If a SW was registered previously on preview, remove it to avoid stale bundles.
      unregisterAllServiceWorkers().catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth routes (no layout) */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/share/:code" element={<SharedListPage />} />
              
              {/* Main app routes */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/lists" element={<ListsPage />} />
                <Route path="/anime/:id" element={<AnimeDetailPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/share" element={<SharePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
