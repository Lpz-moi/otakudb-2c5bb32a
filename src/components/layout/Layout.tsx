import { Outlet } from 'react-router-dom';
import { DiscordSidebar } from './DiscordSidebar';
import { DiscordHeader } from './DiscordHeader';
import { DiscordBottomNav } from './DiscordBottomNav';

/**
 * 🎨 LAYOUT DISCORD-STYLE
 * 
 * Structure:
 * - Header: mobile only, with burger menu
 * - Main container: flex row
 *   - Sidebar: hidden on mobile, visible on desktop
 *   - Content: flex-1, scrollable
 * - BottomNav: mobile only
 */
export const Layout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop only */}
      <DiscordSidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Mobile only */}
        <DiscordHeader />
        
        {/* Content area - Takes remaining space, with bottom padding for mobile nav */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
      
      {/* Bottom nav - Mobile only */}
      <DiscordBottomNav />
    </div>
  );
};
