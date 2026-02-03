import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, List, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/discover', icon: Compass, label: 'Découvrir' },
  { path: '/lists', icon: List, label: 'Listes' },
  { path: '/search', icon: Search, label: 'Chercher' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export const DiscordBottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden discord-bottom-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "discord-bottom-nav-item touch-target",
                active && "discord-bottom-nav-item-active"
              )}
              aria-label={label}
            >
              {/* Active indicator - top pill */}
              <div className={cn(
                "absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all duration-200",
                active ? "w-6 bg-primary" : "w-0"
              )} />
              
              <Icon 
                className={cn(
                  "w-6 h-6 transition-all duration-200",
                  active 
                    ? "text-primary scale-110" 
                    : "text-muted-foreground"
                )} 
                strokeWidth={active ? 2.5 : 2}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
