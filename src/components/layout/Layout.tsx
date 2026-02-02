import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

/**
 * 🎨 LAYOUT PROFESSIONNEL
 * 
 * Structure:
 * - Header: full-width, sticky top
 * - Main container: flex row
 *   - Sidebar: hidden on mobile, side-by-side on desktop
 *   - Content: flex-1, scrollable
 * - BottomNav: mobile only
 */
export const Layout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header - Fixed top, full width */}
      <Header />
      
      {/* Main container - Header height handled by header itself */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile (md:flex shows it on desktop) */}
        <Sidebar />
        
        {/* Content area - Takes remaining space, with bottom padding for mobile nav */}
        <main className="flex-1 flex flex-col overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
      
      {/* Bottom nav - Mobile only */}
      <BottomNav />
    </div>
  );
};
