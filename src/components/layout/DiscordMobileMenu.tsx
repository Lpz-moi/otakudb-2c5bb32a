import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  X, 
  Home, 
  Compass, 
  List, 
  Search, 
  Users, 
  BarChart3, 
  User, 
  LogOut,
  Share2,
  Tv
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface DiscordMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/discover', icon: Compass, label: 'Découvrir' },
  { path: '/search', icon: Search, label: 'Rechercher' },
  { path: '/lists', icon: List, label: 'Mes Listes' },
];

const socialNavItems = [
  { path: '/friends', icon: Users, label: 'Amis' },
  { path: '/stats', icon: BarChart3, label: 'Statistiques' },
  { path: '/share', icon: Share2, label: 'Partager' },
];

export const DiscordMobileMenu = ({ isOpen, onClose }: DiscordMobileMenuProps) => {
  const location = useLocation();
  const { profile, isAuthenticated, signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div 
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-card border-r border-border overflow-hidden transition-transform duration-300 ease-out",
          isAnimating ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Tv className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-display font-bold">
              Otaku<span className="text-primary">DB</span>
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        {isAuthenticated && profile && (
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/50">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-primary/30">
                  {profile.discord_avatar ? (
                    <img 
                      src={profile.discord_avatar} 
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold truncate">
                  {profile.display_name}
                </p>
                {profile.discord_username && (
                  <p className="text-sm text-muted-foreground truncate">
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
                  onClick={onClose}
                  className={cn(
                    "discord-nav-item group",
                    isActive(path) && "discord-nav-item-active"
                  )}
                >
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-200",
                    isActive(path) ? "h-5 bg-primary" : "h-0"
                  )} />
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive(path) ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    isActive(path) ? "text-foreground" : "text-muted-foreground"
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
                    onClick={onClose}
                    className={cn(
                      "discord-nav-item group",
                      isActive(path) && "discord-nav-item-active"
                    )}
                  >
                    <div className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-200",
                      isActive(path) ? "h-5 bg-primary" : "h-0"
                    )} />
                    <Icon className={cn(
                      "w-5 h-5",
                      isActive(path) ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      isActive(path) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Account */}
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Compte
            </p>
            <div className="space-y-1">
              <Link
                to="/profile"
                onClick={onClose}
                className={cn(
                  "discord-nav-item group",
                  isActive('/profile') && "discord-nav-item-active"
                )}
              >
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-200",
                  isActive('/profile') ? "h-5 bg-primary" : "h-0"
                )} />
                <User className={cn(
                  "w-5 h-5",
                  isActive('/profile') ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isActive('/profile') ? "text-foreground" : "text-muted-foreground"
                )}>
                  Profil
                </span>
              </Link>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="discord-nav-item w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Déconnexion</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};
