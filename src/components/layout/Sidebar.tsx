import { Link, useLocation } from 'react-router-dom';
import { Home, List, Search, BarChart3, User, Tv, Compass } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const baseNavItems = [
  { path: '/', icon: Home, label: 'Accueil', emoji: '🏠' },
  { path: '/discover', icon: Compass, label: 'Découvrir', emoji: '🔍' },
  { path: '/lists', icon: List, label: 'Mes listes', emoji: '📚' },
  { path: '/search', icon: Search, label: 'Recherche', emoji: '🔎' },
  { path: '/stats', icon: BarChart3, label: 'Stats', emoji: '📊' },
  { path: '/profile', icon: User, label: 'Profil', emoji: '👤' },
];

const authNavItems = [
  { path: '/', icon: Home, label: 'Accueil', emoji: '🏠' },
  { path: '/discover', icon: Compass, label: 'Découvrir', emoji: '🔍' },
  { path: '/lists', icon: List, label: 'Mes listes', emoji: '📚' },
  { path: '/stats', icon: BarChart3, label: 'Stats', emoji: '📊' },
  { path: '/profile', icon: User, label: 'Profil', emoji: '👤' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const navItems = isAuthenticated ? authNavItems : baseNavItems;

  return (
    <aside className="hidden md:flex md:w-64 md:flex-shrink-0 bg-card border-r border-border flex-col sticky top-0 max-h-screen overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Tv className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">
            Otaku<span className="text-primary">DB</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Données via Jikan API
        </p>
      </div>
    </aside>
  );
};
