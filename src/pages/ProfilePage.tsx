import { User, Settings, Moon, LogOut, Info } from 'lucide-react';
import { useAnimeListStore } from '@/stores/animeListStore';

const ProfilePage = () => {
  const { getStats } = useAnimeListStore();
  const stats = getStats();

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold">Profil</h1>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Otaku</h2>
            <p className="text-muted-foreground">Membre depuis janvier 2025</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Animes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.totalEpisodes}</p>
            <p className="text-sm text-muted-foreground">Épisodes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.averageRating || '-'}</p>
            <p className="text-sm text-muted-foreground">Note moy.</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        <button className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card-hover transition-colors">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">Paramètres</p>
            <p className="text-sm text-muted-foreground">Notifications, données</p>
          </div>
        </button>

        <button className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card-hover transition-colors">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Info className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">À propos</p>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Données fournies par Jikan API (MyAnimeList non-officiel)
        </p>
        <p className="text-xs text-muted-foreground">
          Les données sont stockées localement sur votre appareil.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
