import { useState } from 'react';
import { List, Play, Check, Clock, Heart, Filter } from 'lucide-react';
import { useAnimeListStore, type ListStatus } from '@/stores/animeListStore';
import { AnimeCard } from '@/components/anime/AnimeCard';

const tabs: { status: ListStatus; label: string; icon: React.ElementType }[] = [
  { status: 'watching', label: 'En cours', icon: Play },
  { status: 'planned', label: 'À voir', icon: Clock },
  { status: 'completed', label: 'Terminés', icon: Check },
  { status: 'favorites', label: 'Favoris', icon: Heart },
];

const ListsPage = () => {
  const [activeTab, setActiveTab] = useState<ListStatus>('watching');
  const { getItemsByStatus, getStats } = useAnimeListStore();
  const stats = getStats();
  const items = getItemsByStatus(activeTab);

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <List className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Mes Listes</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {stats.total} anime{stats.total > 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {tabs.map(({ status, label, icon: Icon }) => {
          const count = status === 'watching' ? stats.watching
            : status === 'completed' ? stats.completed
            : status === 'planned' ? stats.planned
            : stats.favorites;
          
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`tab-item flex items-center gap-2 whitespace-nowrap ${
                activeTab === status ? 'active' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className="text-xs opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* List Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            {activeTab === 'watching' && <Play className="w-8 h-8 text-muted-foreground" />}
            {activeTab === 'completed' && <Check className="w-8 h-8 text-muted-foreground" />}
            {activeTab === 'planned' && <Clock className="w-8 h-8 text-muted-foreground" />}
            {activeTab === 'favorites' && <Heart className="w-8 h-8 text-muted-foreground" />}
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Liste vide</h3>
          <p className="text-muted-foreground max-w-xs">
            {activeTab === 'watching' && "Vous ne regardez aucun anime actuellement."}
            {activeTab === 'completed' && "Vous n'avez terminé aucun anime."}
            {activeTab === 'planned' && "Votre liste à regarder est vide."}
            {activeTab === 'favorites' && "Vous n'avez pas encore de favoris."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item, i) => (
            <div 
              key={item.anime.mal_id} 
              className="animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <AnimeCard anime={item.anime} showQuickAdd={false} />
              {/* Progress for watching */}
              {activeTab === 'watching' && item.anime.episodes && (
                <div className="px-3 pb-3 -mt-1">
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${(item.progress / item.anime.episodes) * 100}%` }} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.progress}/{item.anime.episodes} épisodes
                  </p>
                </div>
              )}
              {/* Rating for completed */}
              {activeTab === 'completed' && item.rating && (
                <div className="px-3 pb-3 -mt-1">
                  <div className="flex items-center gap-1 text-rating-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-xs ${i < item.rating! ? '' : 'opacity-30'}`}>★</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListsPage;
