import { Link } from 'react-router-dom';
import { Star, Play, Plus, Check, Heart } from 'lucide-react';
import type { Anime } from '@/services/jikanApi';
import { useAnimeListStore } from '@/stores/animeListStore';

interface AnimeCardProps {
  anime: Anime;
  showQuickAdd?: boolean;
  className?: string;
}

export const AnimeCard = ({ anime, showQuickAdd = true, className = '' }: AnimeCardProps) => {
  const { isInList, isFavorite, addToList, toggleFavorite, getItemById } = useAnimeListStore();
  const inList = isInList(anime.mal_id);
  const favorite = isFavorite(anime.mal_id);
  const listItem = getItemById(anime.mal_id);

  const getScoreClass = (score: number | null) => {
    if (!score) return '';
    if (score >= 8) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inList) {
      addToList(anime, 'planned');
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(anime);
  };

  return (
    <Link
      to={`/anime/${anime.mal_id}`}
      className={`anime-card group block ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={anime.images.webp?.large_image_url || anime.images.jpg?.large_image_url}
          alt={anime.title}
          className="anime-card-image transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Score Badge */}
        {anime.score && (
          <div className={`absolute top-2 left-2 score-badge ${getScoreClass(anime.score)}`}>
            <Star className="w-3 h-3 fill-current" />
            <span>{anime.score.toFixed(1)}</span>
          </div>
        )}

        {/* Status Badge */}
        {listItem && (
          <div className={`absolute top-2 right-2 status-badge status-${listItem.status}`}>
            {listItem.status === 'watching' && <Play className="w-3 h-3" />}
            {listItem.status === 'completed' && <Check className="w-3 h-3" />}
            {listItem.status === 'favorites' && <Heart className="w-3 h-3 fill-current" />}
            {listItem.status === 'planned' && <Plus className="w-3 h-3" />}
          </div>
        )}

        {/* Quick Actions */}
        {showQuickAdd && (
          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <button
              onClick={handleToggleFavorite}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                favorite
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-black/60 backdrop-blur-sm text-white hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
            </button>
            {!inList && (
              <button
                onClick={handleQuickAdd}
                className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Episodes */}
        {anime.episodes && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
            {anime.episodes} éps
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {anime.title_english || anime.title}
        </h3>
        {anime.genres && anime.genres.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {anime.genres.slice(0, 2).map(g => g.name).join(' • ')}
          </p>
        )}
      </div>
    </Link>
  );
};
