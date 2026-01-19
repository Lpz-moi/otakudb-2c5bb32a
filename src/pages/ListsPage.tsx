import { useState } from 'react';
import { List, Play, Check, Clock, Heart } from 'lucide-react';
import { useAnimeListStore, type ListStatus } from '@/stores/animeListStore';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const renderRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-rating-gold fill-rating-gold'
                : 'text-muted-foreground/20'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <List className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Mes Listes</h1>
            <p className="text-sm text-muted-foreground">
              {stats.total} anime{stats.total > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
      </div>

      {/* Tabs - Better spacing */}
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
              className={`tab-item flex items-center gap-2.5 whitespace-nowrap ${
                activeTab === status ? 'active' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === status 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
            {activeTab === 'watching' && <Play className="w-10 h-10 text-muted-foreground" />}
            {activeTab === 'completed' && <Check className="w-10 h-10 text-muted-foreground" />}
            {activeTab === 'planned' && <Clock className="w-10 h-10 text-muted-foreground" />}
            {activeTab === 'favorites' && <Heart className="w-10 h-10 text-muted-foreground" />}
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Liste vide</h3>
          <p className="text-muted-foreground max-w-xs mb-6">
            {activeTab === 'watching' && "Vous ne regardez aucun anime actuellement."}
            {activeTab === 'completed' && "Vous n'avez terminé aucun anime."}
            {activeTab === 'planned' && "Votre liste à regarder est vide."}
            {activeTab === 'favorites' && "Vous n'avez pas encore de favoris."}
          </p>
          <Link to="/search" className="btn-primary">
            Explorer les animes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {items.map((item, i) => (
            <div 
              key={item.anime.mal_id} 
              className="animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <AnimeCard 
                anime={item.anime} 
                showQuickAdd={false} 
                showProgress={activeTab === 'watching'}
              />
              
              {/* Rating stars for completed - Separate and clear */}
              {activeTab === 'completed' && item.rating && (
                <div className="mt-3 px-2 flex items-center justify-center gap-2">
                  {renderRatingStars(item.rating)}
                  <span className="text-xs text-muted-foreground">
                    {item.rating}/5
                  </span>
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
