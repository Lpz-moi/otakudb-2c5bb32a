import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

interface AnimeListCardProps {
  animeId: number;
  title: string;
  image: string | null;
  status?: string;
  progress?: number;
  totalEpisodes?: number;
  rating?: number | null;
}

/**
 * Simplified anime card for list displays
 * Uses data from anime_lists table (no API call needed)
 */
export const AnimeListCard = ({ 
  animeId, 
  title, 
  image, 
  status,
  progress,
  totalEpisodes,
  rating 
}: AnimeListCardProps) => {
  const progressPercent = totalEpisodes && totalEpisodes > 0 
    ? (progress || 0) / totalEpisodes * 100 
    : 0;

  return (
    <Link
      to={`/anime/${animeId}`}
      className="anime-card group block active:scale-[0.98] transition-transform"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Rating Badge */}
        {rating && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-semibold">
            {rating}/10
          </div>
        )}

        {/* Progress indicator */}
        {status === 'watching' && totalEpisodes && totalEpisodes > 0 && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center justify-between text-[10px] text-white/80 mb-1">
              <span>Ép. {progress || 0}/{totalEpisodes}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-2.5 sm:p-3 space-y-1">
        <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  );
};
