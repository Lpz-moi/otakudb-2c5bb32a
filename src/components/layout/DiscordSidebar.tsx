import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  List, 
  Search, 
  Users, 
  BarChart3, 
  User, 
  Settings,
  LogOut,
  Tv,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/discover', icon: Compass, label: 'Découvrir' },
  { path: '/search', icon: Search, label: 'Rechercher' },
  { path: '/lists', icon: List, label: 'Mes Listes' },
  { path: '/how-it-works', icon: HelpCircle, label: 'Comment ça marche' },
];

const socialNavItems = [
  { path: '/stats', icon: BarChart3, label: 'Statistiques' },
];

const userNavItems = [
  { path: '/profile', icon: User, label: 'Profil' },
];

export const DiscordSidebar = () => {
  const location = useLocation();
  const { profile, isAuthenticated, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Tv className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-display font-bold text-sidebar-foreground">
            Otaku<span className="text-primary">DB</span>
          </span>
          <span className="text-xs text-muted-foreground">Anime Tracker</span>
        </div>
      </div>

      {/* User Profile Section */}
      {isAuthenticated && profile && (
        <div className="px-3 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-primary/50 transition-all duration-200">
                {profile.discord_avatar ? (
                  <img 
                    src={profile.discord_avatar} 
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.display_name}
              </p>
              {profile.discord_username && (
                <p className="text-xs text-muted-foreground truncate">
                  @{profile.discord_username}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto discord-scrollbar px-3 py-4">
        {/* Main Navigation */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </p>
          <div className="space-y-1">
            {mainNavItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "discord-nav-item group",
                  isActive(path) && "discord-nav-item-active"
                )}
              >
                {/* Active indicator bar */}
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-200",
                  isActive(path) 
                    ? "h-5 bg-primary" 
                    : "h-0 bg-primary group-hover:h-3"
                )} />
                <Icon className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  isActive(path) ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isActive(path) ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Social Navigation */}
        {isAuthenticated && (
          <div className="mb-6">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Social
            </p>
            <div className="space-y-1">
              {socialNavItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "discord-nav-item group",
                    isActive(path) && "discord-nav-item-active"
                  )}
                >
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-200",
                    isActive(path) 
                      ? "h-5 bg-primary" 
                      : "h-0 bg-primary group-hover:h-3"
                  )} />
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive(path) ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    isActive(path) ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
                  )}>
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* User Section */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Compte
          </p>
          <div className="space-y-1">
            {userNavItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "discord-nav-item group",
                  isActive(path) && "discord-nav-item-active"
                )}
              >
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-200",
                  isActive(path) 
                    ? "h-5 bg-primary" 
                    : "h-0 bg-primary group-hover:h-3"
                )} />
                <Icon className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  isActive(path) ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isActive(path) ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer Actions */}
      {isAuthenticated && (
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={signOut}
            className="discord-nav-item group w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      )}
    </aside>
  );
};
